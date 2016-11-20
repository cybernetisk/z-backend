# Z-rapporter i CYB

Dette repoet genererer oppgjørsrapport i PDF med data som sendes fra
et Google Spreadsheet CYB bruker. PDF-filene genereres ved at det først
opprettes et LaTeX-dokument som så konverteres til PDF.

Dataene lagres også i `reports.json` for senere bruk til importering
til regnskapssystemet.

Systemet er laget av Henrik Steen som var kasserer i 2014 og 2015.

## Docker-oppsett

### Bygge container

```bash
docker build -t cyb/z-backend .
```

### Kjøre container

Se `run.sh`
