import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = ({ showAlert }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_ADDRESS || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await response.json();
      if (json.success) {
        localStorage.setItem("token", json.authtoken);
        localStorage.setItem("user", JSON.stringify(json.user));
        showAlert("success", "Đăng nhập thành công");
        navigate("/dashboard");
      } else {
        showAlert("danger", json.error || "Thông tin đăng nhập không đúng");
      }
    } catch {
      showAlert("danger", "Không kết nối được máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="h3 mb-1">Đăng nhập cán bộ</h1>
        <p className="text-muted mb-4">
          Dành cho quản trị viên và giáo viên quản lý hệ thống.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
          </div>
          <button className="btn btn-leaf w-100" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="small text-muted mt-3 mb-0">
          Mặc định sau khi seed: admin@thpt.local / admin123
        </p>
      </div>
    </div>
  );
};
