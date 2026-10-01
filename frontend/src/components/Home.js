import React from 'react';
import { Link } from 'react-router-dom';
import LopNoiBat from './LopNoiBat';

export const Home = () => {
    return (
        <div>
            <div className="bg-primary text-white">
                <div className="container py-5">
                    <p className="text-warning mb-2">Trung học phổ thông</p>
                    <h1 className="display-5 fw-bold">Quản lý học sinh THPT</h1>
                    <p className="lead col-lg-8">Theo dõi lớp, sĩ số, học sinh đang học, môn học và kết quả từng học kỳ trên cùng một sổ.</p>
                    <Link className="btn btn-warning text-dark" to='/hocsinh'>Xem học sinh đang học</Link>
                    <Link className="btn btn-outline-light ms-2" to='/taolop'>Thêm lớp</Link>
                </div>
            </div>
            <LopNoiBat />
        </div>
    );
};
