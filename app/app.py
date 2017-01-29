from flask import Flask, Response, request, send_from_directory
app = Flask(__name__)

import html
import sys
import simplejson
import settings
from z import ZRetrieve, ZTemplate

@app.errorhandler(404)
def page_not_found(e):
    return Response('See github.com/cybrairai/z-backend for details', mimetype='text/plain', status=404)

@app.route('/generate', methods=['POST'])
def handle_data():
    if 'data' not in request.form:
        raise Exception('Missing data')

    zdata = json.loads(request.form['data'], 'utf-8')
    filename = ZRetrieve.get_report_filename(zdata)
    template = ZTemplate()
    template.generate(zdata, filename)
    ZRetrieve.exportJSON(zdata)

    return Response('%s%s.pdf\n' % (settings.ARCHIVE_URL, filename), mimetype='text/plain')

@app.route('/archive/<path:path>')
def serve_archive(path):
    return send_from_directory('archive', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
