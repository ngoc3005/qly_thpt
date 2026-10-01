#!/bin/bash
cd "$(dirname "$0")"
export SSL_CERT_FILE=$(antenv/bin/python -c "import certifi; print(certifi.where())")
PORT="${PORT:-8000}"
if [ -x "antenv/bin/gunicorn" ]; then
  exec antenv/bin/gunicorn --bind=0.0.0.0:${PORT} --workers=1 --threads=4 --timeout 600 --access-logfile - --error-logfile - --capture-output app:app
else
  exec gunicorn --bind=0.0.0.0:${PORT} --workers=1 --threads=4 --timeout 600 --access-logfile - --error-logfile - --capture-output app:app
fi
