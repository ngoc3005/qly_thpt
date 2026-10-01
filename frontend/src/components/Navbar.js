import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
    const handleLogout = () => {
        localStorage.clear();
    }
    let location = useLocation();

    return (
        <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
            <div className="container-fluid">

                <Link className="navbar-brand" to="/">
                    <span className='text-warning fs-3'>QL</span>THPT</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/" ? "active" : ""}`} aria-current="page" to="/">Trang chủ</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/lop" ? "active" : ""}`} aria-current="page" to="/lop">Lớp học</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/hocsinh" ? "active" : ""}`} aria-current="page" to="/hocsinh">Học sinh</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/monhoc" ? "active" : ""}`} aria-current="page" to="/monhoc">Môn học</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/gioithieu" ? "active" : ""}`} aria-current="page" to="/gioithieu">Giới thiệu</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${location.pathname === "/ketqua" ? "active" : ""}`} aria-current="page" to="/ketqua">Kết quả</Link>
                        </li>
                    </ul>

                    {!localStorage.getItem('token') ? <form className="d-flex mx-5">
                        <Link className="btn btn-outline-light" to='/login'>Đăng nhập</Link>
                        <Link className="btn btn-warning mx-2" to='/signup'>Đăng ký</Link>
                    </form> :
                        <Link className="btn btn-outline-light" to='/login' onClick={handleLogout}>Đăng xuất</Link>
                    }
                </div>
            </div>
        </nav>
    )
}
