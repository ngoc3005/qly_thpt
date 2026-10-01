# Quản lý THPT — Backend + Frontend (Azure)

Ứng dụng full-stack:

| Phần | Công nghệ | Đường dẫn |
|------|-----------|-----------|
| **Frontend** | HTML/CSS/JS (SPA) | `/` — mở domain là thấy giao diện |
| **Backend** | Flask REST API + SQLAlchemy | `/api/*` |

Python **3.11**.

## Cấu trúc

```
app.py                 # Entry: phục vụ frontend + gắn API
api.py                 # Backend REST API
models.py              # Database models
frontend/
  index.html           # Giao diện chính
  static/css/style.css
  static/js/app.js
requirements.txt
runtime.txt            # python-3.11
startup.txt            # lệnh chạy trên Azure
```

## Chạy local

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mở http://127.0.0.1:8000 — sẽ thấy giao diện ngay.

API mẫu: http://127.0.0.1:8000/api/stats

## Deploy Azure

GitHub Actions (`.github/workflows/main_quanlythpt.yml`) tự build & deploy khi push `main`.

Trên Azure App Service, đặt **Startup Command**:

```bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 2 app:app
```

(hoặc dùng file `startup.txt` đã có sẵn)

Runtime: **Python 3.11**.

Sau khi deploy xong, mở:

`https://<tên-app>.azurewebsites.net/`

→ Frontend tự load, gọi Backend `/api/...` để CRUD.
