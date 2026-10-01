# Quản lý THPT (Flask + Frontend)

Ứng dụng quản lý trường trung học phổ thông, chạy trên Azure.

## Tài khoản demo

| Vai trò | Username | Password |
|---------|----------|----------|
| Quản trị | `admin` | `admin123` |
| Giáo viên | `gv01` | `gv123` |
| Phụ huynh | `phuhuynh01` | `ph123` |

## Tính năng

- Quản lý giáo viên, học sinh, lớp học, môn học
- Học kỳ / năm học
- Nhập điểm (miệng, 15p, 1 tiết, thi HK) + điểm trung bình
- Chuyển lớp + lịch sử
- Quản lý tài khoản (admin / giáo viên / phụ huynh)
- Phụ huynh đăng nhập để tra cứu điểm con

## Chạy local (Python 3.11)

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mở http://127.0.0.1:8000

## Azure Startup Command

```bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app
```

Runtime: **Python 3.11**
