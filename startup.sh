#!/bin/bash
export SSL_CERT_FILE=$(antenv/bin/python -c "import certifi; print(certifi.where())")
if [ -x "antenv/bin/gunicorn" ]; then
  antenv/bin/gunicorn --bind=0.0.0.0:8000 --workers=1 --threads=4 --timeout 600 --access-logfile - --error-logfile - --capture-output app:app
else
  gunicorn --bind=0.0.0.0:8000 --workers=1 --threads=4 --timeout 600 --access-logfile - --error-logfile - --capture-output app:app
fi
