# Hello World trên Azure

Ứng dụng Flask tối giản để kiểm tra deploy Azure (tránh HTTP 502).

## Chạy local

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mở http://127.0.0.1:8000 → thấy **Hello World**.

## Azure — bắt buộc đặt Startup Command

Azure Portal → App Service `quanlythpt` → **Configuration** → **General settings** → **Startup Command**:

```bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app
```

Runtime stack: **Python 3.11**.

Sau đó **Save** → Restart app → đợi 1–2 phút → mở lại domain.
