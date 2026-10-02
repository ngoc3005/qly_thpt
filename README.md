# Quản lý học sinh THPT

Hệ thống quản lý học sinh trung học phổ thông (MERN).

## Tính năng

- **Portal phụ huynh** (`/`): tra cứu điểm theo mã học sinh, không cần đăng nhập
- **Đăng nhập cán bộ**: Admin / Giáo viên
- Quản lý: lớp học, học sinh, môn học, giáo viên, điểm số

## Chạy dự án

```bash
# Backend
cp .env.example .env   # chỉnh DB_URI, JWT_SECRET
npm install
npm run seed           # tạo dữ liệu mẫu
npm start              # http://localhost:5000

# Frontend (dev)
cd frontend
cp .env.example .env
npm install
npm start              # http://localhost:3000
```

## Tài khoản mẫu (sau seed)

| Vai trò    | Email                 | Mật khẩu     |
|-----------|------------------------|--------------|
| Admin     | admin@thpt.local       | admin123     |
| Giáo viên | giaovien@thpt.local    | giaovien123  |

Tra cứu thử: mã học sinh `HS10001`
