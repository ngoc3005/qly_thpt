# Quản lý THPT + MongoDB (Azure)

## Tài khoản demo

| Vai trò | Username | Password |
|---------|----------|----------|
| Quản trị | `admin` | `admin123` |
| Giáo viên | `gv01` | `gv123` |
| Phụ huynh | `phuhuynh01` | `ph123` |

## Azure — bắt buộc cấu hình MongoDB

1. Tạo cluster miễn phí tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (hoặc dùng Azure Cosmos DB API for MongoDB).
2. Lấy connection string dạng:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

3. Azure Portal → App Service → **Configuration → Application settings** thêm:

| Name | Value |
|------|--------|
| `MONGODB_URI` | connection string MongoDB |
| `MONGODB_DB` | `quanlythpt` (tuỳ chọn) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |

4. **Startup Command**:

```bash
antenv/bin/gunicorn --bind=0.0.0.0:8000 --workers=1 --threads=4 --timeout 600 app:app
```

5. Save → Restart.

Trong Atlas: Network Access → Allow `0.0.0.0/0` (hoặc IP Azure) để App Service kết nối được.

## Chạy local

Cần MongoDB local hoặc Atlas:

```powershell
$env:MONGODB_URI="mongodb://127.0.0.1:27017"
# hoặc
$env:MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/"

py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mở http://127.0.0.1:8000
