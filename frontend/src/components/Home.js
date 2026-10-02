import React, { useState } from "react";

const API = process.env.REACT_APP_API_ADDRESS || "";

export const Home = ({ showAlert }) => {
  const [form, setForm] = useState({
    maHS: "",
    namHoc: "2025-2026",
    hocKy: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(API + "/api/ketqua/tracuu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maHS: form.maHS.trim().toUpperCase(),
          namHoc: form.namHoc || undefined,
          hocKy: form.hocKy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert("danger", data.error || "Không tra cứu được");
        return;
      }
      setResult(data);
    } catch {
      showAlert("danger", "Không kết nối được máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "";

  return (
    <section className="portal-hero">
      <div>
        <p className="text-white-50 mb-2" style={{ letterSpacing: "0.08em" }}>
          CỔNG THÔNG TIN NHÀ TRƯỜNG
        </p>
        <h1 className="brand-mark">THPT Portal</h1>
        <p className="hero-lead">
          Phụ huynh tra cứu kết quả học tập của học sinh theo mã học sinh —
          nhanh, minh bạch, không cần đăng nhập.
        </p>
      </div>

      <div className="lookup-card">
        <h2>Tra cứu điểm</h2>
        <p>Nhập mã học sinh do nhà trường cấp (ví dụ: HS10001).</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Mã học sinh</label>
            <input
              className="form-control"
              name="maHS"
              value={form.maHS}
              onChange={onChange}
              placeholder="HS10001"
              required
            />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-7">
              <label className="form-label">Năm học</label>
              <input
                className="form-control"
                name="namHoc"
                value={form.namHoc}
                onChange={onChange}
                placeholder="2025-2026"
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Học kỳ</label>
              <select
                className="form-select"
                name="hocKy"
                value={form.hocKy}
                onChange={onChange}
              >
                <option value="">Tất cả</option>
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
              </select>
            </div>
          </div>
          <button className="btn btn-leaf w-100" disabled={loading}>
            {loading ? "Đang tra cứu..." : "Xem kết quả"}
          </button>
        </form>

        {result && (
          <div className="score-panel">
            <div className="score-meta">
              <strong>{result.hocSinh.hoTen}</strong>
              <span>
                Mã HS: {result.hocSinh.maHS} · Lớp:{" "}
                {result.hocSinh.lop?.tenLop || "—"}
              </span>
              <span>
                Ngày sinh: {formatDate(result.hocSinh.ngaySinh)} · Giới tính:{" "}
                {result.hocSinh.gioiTinh}
              </span>
            </div>
            {result.ketQua.length === 0 ? (
              <div className="alert alert-warning mb-0">
                Chưa có điểm cho điều kiện đã chọn.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Môn</th>
                      <th>HK</th>
                      <th>Miệng</th>
                      <th>15p</th>
                      <th>1 tiết</th>
                      <th>Thi</th>
                      <th>TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ketQua.map((kq) => (
                      <tr key={kq._id}>
                        <td>{kq.monHoc?.tenMon}</td>
                        <td>{kq.hocKy}</td>
                        <td>{kq.diemMieng ?? "—"}</td>
                        <td>{kq.diem15p ?? "—"}</td>
                        <td>{kq.diem1Tiet ?? "—"}</td>
                        <td>{kq.diemThi ?? "—"}</td>
                        <td>
                          <strong>{kq.diemTB ?? "—"}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
