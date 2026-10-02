import React from "react";

export const About = () => {
  return (
    <div className="page">
      <div className="panel" style={{ maxWidth: 720 }}>
        <h1 className="h3">Giới thiệu</h1>
        <p>
          <strong>THPT Portal</strong> là hệ thống quản lý học sinh trung học
          phổ thông: phụ huynh tra cứu điểm công khai theo mã học sinh; cán bộ
          và giáo viên đăng nhập để quản lý lớp, học sinh, môn học, giáo viên
          và kết quả học tập.
        </p>
        <ul>
          <li>Portal phụ huynh: tra cứu điểm không cần tài khoản</li>
          <li>Vai trò Admin: toàn quyền quản trị danh mục</li>
          <li>Vai trò Giáo viên: xem danh mục và nhập/sửa điểm</li>
        </ul>
      </div>
    </div>
  );
};
