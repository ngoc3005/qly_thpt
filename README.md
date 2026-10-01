# Quản lý THPT + MongoDB (Azure)

## Tài khoản demo

| Vai trò | Username | Password |
|---------|----------|----------|
| Quản trị | `admin` | `admin123` |
| Giáo viên | `gv01` | `gv123` |
| Phụ huynh | `phuhuynh01` | `ph123` |

## Sửa lỗi SSL / không kết nối được MongoDB từ Azure

### 1) MongoDB Atlas → Network Access (quan trọng nhất)

1. Vào [MongoDB Atlas](https://cloud.mongodb.com/)
2. **Security → Network Access → Add IP Address**
3. Chọn **Allow Access from Anywhere** → `0.0.0.0/0`
4. Confirm → đợi ~1 phút

Lỗi `TLSV1_ALERT_INTERNAL_ERROR` từ Azure thường là do Atlas **chưa mở IP** của App Service.

### 2) Azure Application settings

| Name | Value |
|------|--------|
| `MONGODB_URI` | `mongodb+srv://USER:PASSWORD@cluster0.eqitwke.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB` | `quanlythpt` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |
| `MONGODB_TLS_INSECURE` | `true` *(chỉ nếu vẫn lỗi SSL)* |

### 3) Startup Command

```bash
export SSL_CERT_FILE=$(antenv/bin/python -c "import certifi; print(certifi.where())") && antenv/bin/gunicorn --bind=0.0.0.0:8000 --workers=1 --threads=4 --timeout 600 app:app
```

Save → Restart.
