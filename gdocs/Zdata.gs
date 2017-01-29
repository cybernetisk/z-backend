/**
 * @OnlyCurrentDoc
 * (makes the "app auth" only give access to this document, not the whole Google Disk)
 */

var settings = {
  "debug": false,
  "destaddr": "https://in.cyb.no/z-backend/generate",
  "statssheet": "1oH-Dy2OKcwxcGDD_QDuG4hGxpZPN_7SPIjFKsHHoF1g",
  "maindrawername": "Escape-kassa",
  "templatesheet": "MAL"
};

function cleanDoc() {
  var s = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = getZSheetList()
  for (var i in sheets) {
    var sheet = sheets[i];
    s.deleteSheet(sheet);
  }
}

function onOpen() {
  var s = SpreadsheetApp.getActiveSpreadsheet();

  // add menu entries
  var entries = [
    {
      name: "Opprett neste normale Z (for " + settings.maindrawername + ")",
      functionName: "newNormalZ"
    },
    {
      name: "Opprett manuell Z (f.eks. medlemssalg)",
      functionName: "newZ"
    },
    {
      name: "Sett korrekt navn på arket",
      functionName: "setName"
    },
    {
      name: "Søk etter Z-nr",
      functionName: "findZ"
    }
  ]

  if (settings.statssheet !== '') {
    entries.push({
      name: "Statistikk",
      functionName: "showStats"
    });
  }

  entries.push({
    name: "Lag PDF for utskrift",
    functionName: "exportData"
  })

  s.addMenu("Z-rapport", entries);
}

/**
 * Avoid changes to template
 */
function onEdit(e) {
  if (e.range.getSheet().getName() == settings.templatesheet && e.range.getValue() != "") {
    Browser.msgBox("Ikke endre malen! Bruk Z-rapport-menyen!");
  }
}

function getId() {
  Logger.log(SpreadsheetApp.getActiveSpreadsheet().getId());
}


/**
 * Open stats sheet
 */
function showStats() {
  var href = SpreadsheetApp.openById(settings.statssheet).getUrl();

  var app = UiApp.createApplication().setHeight(50).setWidth(350);
  app.setTitle("Vis statistikk");
  var link = app.createAnchor(href, href).setId("link");
  app.add(link);
  var doc = SpreadsheetApp.getActive();
  doc.show(app);
}


/**
 * Create new sheet from template and set name. Ask for details first
 */
function newZ() {
  var html = HtmlService.createHtmlOutputFromFile("NewManualZ").setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(html, "Ny manuell Z-rapport");
}

function handleNewZForm(znr, date) {
  createNewZFromTemplate(znr, date);
  return true;
}


/**
 * Create next normal Z
 */
function newNormalZ() {
  createNewZFromTemplate(nextZNum(), new Date());
}


function createNewZFromTemplate(znr, date) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(settings.templatesheet).copyTo(ss);
  s.activate();
  ss.moveActiveSheet(2); // place after template

  getRange("Znr").setValue(znr);
  getRange("Zdato").setValue(date);
  setName();
  getRange("Ansvarlig").activate();
}


/**
 * Try to find next Z number
 */
function nextZNum() {
  var n;
  var max = 0;
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets().slice(0, 5);
  for (var x in sheets) {
    n = sheets[x].getName();
    if (n.substring(0, 1) == "Z" && n.substring(1) == parseInt(n.substring(1))) {
      if (n.substring(1) >= max) {
        max = parseInt(n.substring(1)) + 1;
      }
    }
  }
  return max;
}


/**
 * Automatically set name on the sheet
 */
function setName() {
  if (SpreadsheetApp.getActiveSheet().getName() == settings.templatesheet) {
    Browser.msgBox("Du må kopiere malen først!");
    return;
  }

  if (SpreadsheetApp.getActiveSheet().getName().substring(2) == "X:") {
    Browser.msgBox("Arket har fått satt manuelt navn og nytt navn må settes manuelt!");
    return;
  }

  var nr = getRange('Znr').getValue();
  var newname = "";

  var getDate = function () {
    var dato = getRange('Zdato').getValue();
    if (typeof dato != 'object') {
      Browser.msgBox("Dato er ikke datotype!");
      return;
    }
    return Utilities.formatDate(dato, "Europe/Oslo", "yyyy-MM-dd");
  }

  // integers = Z from 'kassesystemet'
  if (nr % 1 === 0) {
    newname = "Z" + nr;
  }

  // 'medlemssalg' needs it's own identifier
  else if (nr == "MEDLEM") {
    dato = getDate();
    if (!dato) return;
    newname = "MEDLEM-" + dato;
  }

  else if (nr.length > 0) {
    dato = getDate();
    if (!dato) return;
    newname = nr + "-" + dato;
  }

  if (newname == "") {
    Browser.msgBox("Mangler inndata for å avgjøre navn!");
    return;
  }

  if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(newname)) {
    Browser.msgBox("Det finnes allerede en lik Z-rapport!");
    return;
  }

  SpreadsheetApp.getActiveSheet().setName(newname);
}

/**
 * Find Z and set focus to sheet
 */
function findZ() {
  var z = Browser.inputBox("Hvilken Z leter du etter? (skriv kun nr)");
  if (z == "") return;

  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Z"+z);
  if (s) {
    s.activate();
  } else {
    Browser.msgBox("Fant ikke Z"+z);
  }
}

/**
 * Generate data for a specific Z-sheet
 */
function getZData(sheet) {
  var commentrange = getRangeOnSheet(sheet, "Kommentar");
  var isOldLayout = commentrange.getColumn() == 2;

  /**
   * For sales and debet, select the valid columns.
   * The data should be [account-info, description, value]
   */
  function getSalesAndDebetRows(data) {
    var map = {};

    // merge amounts in case there are entries with same accounts and texts
    for (x in data) {
      if (data[x][1] == "" || data[x][4] == "") {
        continue;
      }

      // as of 2014-10-28 the two first columns have switched places
      var accountdetails = isOldLayout ? data[x][0] : data[x][1];
      var text = isOldLayout ? data[x][1] : data[x][0];
      var amount = data[x][4];

      if (!map[accountdetails]) {
        map[accountdetails] = {};
      }
      if (!map[accountdetails][text]) {
        map[accountdetails][text] = 0;
      }
      map[accountdetails][text] += amount;
    }

    var newdata = [];
    for (i in map) {
      for (j in map[i]) {
        newdata.push([i, j, map[i][j]]);
      }
    }

    return newdata;
  }
  function getSales(sheet) {
    return getSalesAndDebetRows(getRangeOnSheet(sheet, "K_G1").getValues());
  }
  function getDebet(sheet) {
    return getSalesAndDebetRows(getRangeOnSheet(sheet, "D_G1").getValues());
  }

  /**
   * Extract first column from a data set
   */
  function getFirstCol(data) {
    var newdata = [];
    for (x in data) {
      newdata.push(data[x][0]);
    }
    return newdata;
  }

  /**
   * Get dayname from daynumber
   */
  function getWeek(val) {
    var day = Utilities.formatDate(val, "Europe/Oslo", "u");
    return ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"][day-1];
  }

  /**
   * Build data to send to generator
   */
  var data = {
    "sheetid": sheet.getSheetId(),
    "z": getRangeOnSheet(sheet, "Znr").getValue(),
    "date": getWeek(getRangeOnSheet(sheet, "Zdato").getValue())+" "+Utilities.formatDate(getRangeOnSheet(sheet, "Zdato").getValue(), "Europe/Oslo", "dd.MM.yyyy"),
    "builddate": Utilities.formatDate(new Date(), "Europe/Oslo", "dd.MM.yyyy HH:mm"),
    "responsible": getRangeOnSheet(sheet, "Ansvarlig").getValue(),
    "type": getRangeOnSheet(sheet, "Arrtype").getValue(),
    "cash": {
      "start": getFirstCol(getRangeOnSheet(sheet, "AntallStart").getValues()),
      "end": getFirstCol(getRangeOnSheet(sheet, "AntallSlutt").getValues())
    },
    "sales": getSales(sheet),
    "debet": getDebet(sheet),
    "comment": commentrange.getValue()
  };

  return data;
}


/**
 * Export data for active sheet to PDF-generator
 */
function exportData() {
  var data = getZData(SpreadsheetApp.getActiveSheet());

  if (!data['z'] || !data['date'] || !data['responsible'] || !data['type']) {
    Browser.msgBox("Du må fylle ut alle de fire gule feltene øverst!");
    return;
  }

  // send data
  var payload = {
    "data": JSON.stringify(data)
  };

  // show payload if debugging - else send to api
  if (settings.debug) {
    Browser.msgBox(payload.data);
  } else {
    var ret = sendData(payload);
    showURL(ret.trim());
  }
}




function sendData(payload) {
  var options = {
    "method" : "post",
    "payload" : payload
  };

  Logger.log(payload);

  var response = UrlFetchApp.fetch(settings.destaddr, options);
  return response.getContentText();
}


function showURL(href){
  var app = UiApp.createApplication().setHeight(100).setWidth(350);
  app.setTitle("Hent ned PDF");
  var link = app.createAnchor(href, href).setId("link");
  app.add(link);
  var doc = SpreadsheetApp.getActive();
  doc.show(app);
}