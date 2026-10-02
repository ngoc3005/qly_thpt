import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, isLoggedIn } from "../api";

export const Navbar = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-thpt sticky-top">
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand" to="/">
          THPT Portal
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Tra cứu điểm
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                Giới thiệu
              </NavLink>
            </li>
            {loggedIn && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">
                    Tổng quan
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/quanly/diem">
                    Điểm số
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/quanly/lop">
                    Lớp học
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/quanly/hocsinh">
                    Học sinh
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/quanly/monhoc">
                    Môn học
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/quanly/giaovien">
                    Giáo viên
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {loggedIn ? (
              <>
                <span className="badge-role">
                  {user?.name} · {user?.role === "admin" ? "Admin" : "Giáo viên"}
                </span>
                <button className="btn btn-sm btn-outline-dark" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link className="btn btn-sm btn-leaf" to="/login">
                Đăng nhập cán bộ
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
