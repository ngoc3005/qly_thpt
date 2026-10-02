import React, { useEffect, useState } from "react";
import { api, isAdmin } from "../api";

const empty = {
  maHS: "",
  hoTen: "",
  ngaySinh: "",
  gioiTinh: "Nam",
  lop: "",
  diaChi: "",
  tenPhuHuynh: "",
  soDienThoaiPH: "",
  emailPH: "",
  trangThai: "dang_hoc",
};

export const HocSinhPage = ({ showAlert }) => {
  const [list, setList] = useState([]);
  const [lops, setLops] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filterLop, setFilterLop] = useState("");
  const [q, setQ] = useState("");
  const admin = isAdmin();

  const load = async () => {
    const query = new URLSearchParams();
    if (filterLop) query.set("lop", filterLop);
    if (q) query.set("q", q);
    const [hs, lopList] = await Promise.all([
      api("/api/hocsinh?" + query.toString()),
      api("/api/lop"),
    ]);
    setList(hs);
    setLops(lopList);
  };

  useEffect(() => {
    load().catch((e) => showAlert("danger", e.message));
  }, [filterLop]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm(empty);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api(`/api/hocsinh/${editId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        showAlert("success", "Đã cập nhật học sinh");
      } else {
        await api("/api/hocsinh", {
          method: "POST",
          body: JSON.stringify(form),
        });
        showAlert("success", "Đã thêm học sinh");
      }
      reset();
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const startEdit = (hs) => {
    setEditId(hs._id);
    setForm({
      maHS: hs.maHS,
      hoTen: hs.hoTen,
      ngaySinh: hs.ngaySinh ? hs.ngaySinh.slice(0, 10) : "",
      gioiTinh: hs.gioiTinh,
      lop: hs.lop?._id || hs.lop,
      diaChi: hs.diaChi || "",
      tenPhuHuynh: hs.tenPhuHuynh || "",
      soDienThoaiPH: hs.soDienThoaiPH || "",
      emailPH: hs.emailPH || "",
      trangThai: hs.trangThai,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa học sinh này?")) return;
    try {
      await api(`/api/hocsinh/${id}`, { method: "DELETE" });
      showAlert("success", "Đã xóa học sinh");
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quản lý học sinh</h1>
          <p>Hồ sơ học sinh theo lớp, phụ huynh và trạng thái học tập.</p>
        </div>
      </div>

      <div className="panel mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Lọc theo lớp</label>
            <select className="form-select" value={filterLop} onChange={(e) => setFilterLop(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {lops.map((l) => (
                <option key={l._id} value={l._id}>{l.tenLop}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label">Tìm mã / họ tên</label>
            <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="HS10001 hoặc tên..." />
          </div>
          <div className="col-md-3">
            <button className="btn btn-outline-dark w-100" onClick={() => load().catch((e) => showAlert("danger", e.message))}>
              Tìm
            </button>
          </div>
        </div>
      </div>

      {admin && (
        <div className="panel mb-4">
          <h5 className="mb-3">{editId ? "Sửa học sinh" : "Thêm học sinh"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="form-control" name="maHS" placeholder="Mã HS *" value={form.maHS} onChange={onChange} required />
              <input className="form-control" name="hoTen" placeholder="Họ tên *" value={form.hoTen} onChange={onChange} required />
              <input className="form-control" type="date" name="ngaySinh" value={form.ngaySinh} onChange={onChange} required />
              <select className="form-select" name="gioiTinh" value={form.gioiTinh} onChange={onChange}>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
              <select className="form-select" name="lop" value={form.lop} onChange={onChange} required>
                <option value="">Chọn lớp *</option>
                {lops.map((l) => (
                  <option key={l._id} value={l._id}>{l.tenLop}</option>
                ))}
              </select>
              <select className="form-select" name="trangThai" value={form.trangThai} onChange={onChange}>
                <option value="dang_hoc">Đang học</option>
                <option value="nghi_hoc">Nghỉ học</option>
                <option value="tot_nghiep">Tốt nghiệp</option>
              </select>
              <input className="form-control" name="tenPhuHuynh" placeholder="Tên phụ huynh" value={form.tenPhuHuynh} onChange={onChange} />
              <input className="form-control" name="soDienThoaiPH" placeholder="SĐT phụ huynh" value={form.soDienThoaiPH} onChange={onChange} />
              <input className="form-control" name="emailPH" placeholder="Email phụ huynh" value={form.emailPH} onChange={onChange} />
              <input className="form-control" name="diaChi" placeholder="Địa chỉ" value={form.diaChi} onChange={onChange} />
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-leaf" type="submit">{editId ? "Cập nhật" : "Thêm"}</button>
              {editId && <button type="button" className="btn btn-outline-secondary" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã HS</th>
                <th>Họ tên</th>
                <th>Lớp</th>
                <th>Giới tính</th>
                <th>Phụ huynh</th>
                <th>Trạng thái</th>
                {admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((hs) => (
                <tr key={hs._id}>
                  <td><strong>{hs.maHS}</strong></td>
                  <td>{hs.hoTen}</td>
                  <td>{hs.lop?.tenLop || "—"}</td>
                  <td>{hs.gioiTinh}</td>
                  <td>{hs.tenPhuHuynh || "—"}</td>
                  <td>{hs.trangThai}</td>
                  {admin && (
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(hs)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(hs._id)}>Xóa</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
