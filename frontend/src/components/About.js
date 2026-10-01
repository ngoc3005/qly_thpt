import React from 'react';
import logo from '../images/logo.png';

export const About = () => {
    return (
        <div className="clearfix container mt-5 mb-5">
            <img src={logo} className="col-md-4 float-md-end img-fluid" alt="Logo" width={120} />

            <p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4">Quản lý học sinh THPT</p>

            <p>
                Module này dùng để theo dõi lớp học, học sinh, môn học và kết quả học kỳ của trường trung học phổ thông. Giáo viên đăng nhập, tạo lớp, thêm học sinh, khai báo môn và nhập điểm trung bình từng học kỳ.
            </p>

            <p>
                Dữ liệu được lưu trên MongoDB theo cùng cách gọi như hệ thống gốc: schema Mongoose, <code>find</code>, <code>create</code>, <code>populate</code> và <code>save</code>. Khi một học kỳ kết thúc, trạng thái học sinh được mở lại để nhập học kỳ tiếp theo. Phiếu kết quả có thể tải về dạng PDF.
            </p>
        </div>
    )
}
