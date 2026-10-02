import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getStoredUser } from "../api";

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const user = getStoredUser();

  useEffect(() => {
    api("/api/dashboard/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const cards = [
    { label: "Lớp học", value: stats?.lop, to: "/quanly/lop" },
    { label: "Học sinh", value: stats?.hocSinh, to: "/quanly/hocsinh" },
    { label: "Đang học", value: stats?.dangHoc, to: "/quanly/hocsinh" },
    { label: "Môn học", value: stats?.monHoc, to: "/quanly/monhoc" },
    { label: "Giáo viên", value: stats?.giaoVien, to: "/quanly/giaovien" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tổng quan</h1>
          <p>
            Xin chào {user?.name}. Quản lý lớp, học sinh, môn học, giáo viên và
            điểm số tại đây.
          </p>
        </div>
        <Link to="/quanly/diem" className="btn btn-accent">
          Nhập / xem điểm
        </Link>
      </div>
      <div className="stats-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card text-decoration-none">
            <div className="label">{c.label}</div>
            <div className="value">{c.value ?? "—"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
