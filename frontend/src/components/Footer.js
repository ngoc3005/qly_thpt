import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/logo.png';

const Footer = () => {
    return (
        <footer className="bg-primary text-white text-center text-lg-start">
            <div className="container p-4">
                <div className="row">
                    <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
                        <div className="d-flex">
                            <img src={logo} alt="QLTHPT" height="50" />
                            <h5 className="ms-2 my-auto">QLTHPT</h5>
                        </div>
                        <p className="mt-3">
                            Sổ quản lý học sinh trung học phổ thông: lớp, sĩ số, môn học và kết quả học kỳ.
                        </p>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
                        <h5 className="text-uppercase">Mục lục</h5>
                        <ul className="list-unstyled">
                            <li>
                                <Link className="text-white text-decoration-none" to="/">Trang chủ</Link>
                            </li>
                            <li>
                                <Link className="text-white text-decoration-none" to="/hocsinh">Học sinh</Link>
                            </li>
                            <li>
                                <Link className="text-white text-decoration-none" to="/lop">Lớp học</Link>
                            </li>
                            <li>
                                <Link className="text-white text-decoration-none" to="/gioithieu">Giới thiệu</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
                        <h5 className="text-uppercase">Liên hệ nhà trường</h5>
                        <ul className="list-unstyled">
                            <li>vanphong@thpt.edu.vn</li>
                            <li>024 0000 0000</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              &copy; {new Date().getFullYear()} QLTHPT. Quản lý học sinh trung học phổ thông.
            </div>
        </footer>
    );
};

export default Footer;
