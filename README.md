# Quản lý THPT + MongoDB (Azure)

## Tài khoản demo

| Vai trò | Username | Password |
|---------|----------|----------|
| Quản trị | `admin` | `admin123` |
| Giáo viên | `gv01` | `gv123` |
| Phụ huynh | `phuhuynh01` | `ph123` |

## Azure — Application settings (bắt buộc)

Vào Azure Portal → App Service → **Configuration** → **Application settings** → thêm:

| Name | Value |
|------|--------|
| `MONGODB_URI` | `mongodb+srv://USER:PASSWORD@cluster0.eqitwke.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB` | `quanlythpt` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |

Hoặc tách riêng: `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_DB`.

**Startup Command:**

```bash
antenv/bin/gunicorn --bind=0.0.0.0:8000 --workers=1 --threads=4 --timeout 600 app:app
```

Save → Restart.

Trong MongoDB Atlas: **Network Access** phải Allow `0.0.0.0/0`.

## Local

File `.env` (đã gitignore) chứa thông tin Mongo. Chạy:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
