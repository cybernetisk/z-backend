import os

VAT_CODES = {
    0: 0,
    3: 25,
    31: 15,
    5: 0,
    6: 0
}

if 'ARCHIVE_URL' not in os.environ:
    raise Exception('ARCHIVE_URL environment variable not set')

ARCHIVE_URL = os.environ['ARCHIVE_URL']
