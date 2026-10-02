import React, { useEffect, useState } from "react";
import { api, isAdmin } from "../api";

const empty = {
  maGV: "",
  hoTen: "",
  email: "",
  soDienThoai: "",
  gioiTinh: "",
  diaChi: "",
  monDay: [],
};

export const GiaoVienPage = ({ showAlert }) => {
  const [list, setList] = useState([]);
  const [mons, setMons] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const admin = isAdmin();

  const load = async () => {
    const [gvs, monList] = await Promise.all([
      api("/api/giaovien"),
      api("/api/monhoc"),
    ]);
    setList(gvs);
    setMons(monList);
  };

  useEffect(() => {
    load().catch((e) => showAlert("danger", e.message));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleMon = (id) => {
    setForm((prev) => ({
      ...prev,
      monDay: prev.monDay.includes(id)
        ? prev.monDay.filter((x) => x !== id)
        : [...prev.monDay, id],
    }));
  };

  const reset = () => {
    setForm(empty);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api(`/api/giaovien/${editId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        showAlert("success", "Đã cập nhật giáo viên");
      } else {
        await api("/api/giaovien", {
          method: "POST",
          body: JSON.stringify(form),
        });
        showAlert("success", "Đã thêm giáo viên");
      }
      reset();
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const startEdit = (gv) => {
    setEditId(gv._id);
    setForm({
      maGV: gv.maGV,
      hoTen: gv.hoTen,
      email: gv.email,
      soDienThoai: gv.soDienThoai || "",
      gioiTinh: gv.gioiTinh || "",
      diaChi: gv.diaChi || "",
      monDay: (gv.monDay || []).map((m) => m._id || m),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa giáo viên này?")) return;
    try {
      await api(`/api/giaovien/${id}`, { method: "DELETE" });
      showAlert("success", "Đã xóa giáo viên");
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quản lý giáo viên</h1>
          <p>Thông tin giáo viên và môn giảng dạy.</p>
        </div>
      </div>

      {admin && (
        <div className="panel mb-4">
          <h5 className="mb-3">{editId ? "Sửa giáo viên" : "Thêm giáo viên"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="form-control" name="maGV" placeholder="Mã GV *" value={form.maGV} onChange={onChange} required />
              <input className="form-control" name="hoTen" placeholder="Họ tên *" value={form.hoTen} onChange={onChange} required />
              <input className="form-control" type="email" name="email" placeholder="Email *" value={form.email} onChange={onChange} required />
              <input className="form-control" name="soDienThoai" placeholder="SĐT" value={form.soDienThoai} onChange={onChange} />
              <select className="form-select" name="gioiTinh" value={form.gioiTinh} onChange={onChange}>
                <option value="">Giới tính</option>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
              <input className="form-control" name="diaChi" placeholder="Địa chỉ" value={form.diaChi} onChange={onChange} />
            </div>
            <div className="mt-3">
              <label className="form-label">Môn dạy</label>
              <div className="d-flex flex-wrap gap-2">
                {mons.map((m) => (
                  <label key={m._id} className="btn btn-sm btn-outline-success">
                    <input
                      type="checkbox"
                      className="form-check-input me-1"
                      checked={form.monDay.includes(m._id)}
                      onChange={() => toggleMon(m._id)}
                    />
                    {m.tenMon}
                  </label>
                ))}
              </div>
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
                <th>Mã GV</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Môn dạy</th>
                {admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((gv) => (
                <tr key={gv._id}>
                  <td><strong>{gv.maGV}</strong></td>
                  <td>{gv.hoTen}</td>
                  <td>{gv.email}</td>
                  <td>{gv.soDienThoai || "—"}</td>
                  <td>{(gv.monDay || []).map((m) => m.tenMon).join(", ") || "—"}</td>
                  {admin && (
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(gv)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(gv._id)}>Xóa</button>
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
