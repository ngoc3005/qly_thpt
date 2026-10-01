# Quản lý THPT (Flask) — chạy trên Microsoft Azure

Ứng dụng web đơn giản thay thế module Odoo `quan_ly_thpt`, gồm:

- Giáo viên, Lớp học, Học sinh
- Môn học, Điểm số
- Thời khóa biểu, Lịch thi

## Yêu cầu

- **Python 3.11** (không dùng 3.12+)

## Chạy local (Windows)

```powershell
cd webapp
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version   # phải hiện Python 3.11.x
pip install -r requirements.txt
python app.py
```

Mở trình duyệt: http://127.0.0.1:8000

## Deploy lên Azure App Service

### Cách 1: Azure Portal (nhanh)

1. Tạo **Web App** (Linux, **Python 3.11**)
2. Trong **Deployment Center**, kết nối GitHub/Local Git và chọn thư mục `webapp` (hoặc đẩy cả repo rồi đặt Startup Command như dưới)
3. **Configuration → General settings → Startup Command**:

```bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app
```

4. (Khuyến nghị) Thêm Application settings:
   - `SECRET_KEY` = chuỗi bí mật bất kỳ
   - `DATABASE_URL` = chuỗi kết nối PostgreSQL (Azure Database for PostgreSQL), ví dụ:

```
postgresql://user:password@host:5432/dbname
```

Nếu không set `DATABASE_URL`, app dùng SQLite file `school.db` (ổn để demo; production nên dùng PostgreSQL).

File `runtime.txt` đã ghim runtime `python-3.11`.

### Cách 2: Azure CLI

```bash
az webapp up --name quan-ly-thpt --runtime "PYTHON:3.11" --sku B1
az webapp config set --name quan-ly-thpt --startup-file "gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app"
```

Chạy lệnh trong thư mục `webapp`.

## Cấu trúc

```
webapp/
  app.py              # routes + khởi tạo app
  models.py           # SQLAlchemy models
  templates/          # giao diện Bootstrap
  static/css/         # CSS
  requirements.txt
  startup.sh
```
