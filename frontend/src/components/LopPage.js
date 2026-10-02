import React, { useEffect, useState } from "react";
import { api, isAdmin } from "../api";

const empty = {
  tenLop: "",
  khoi: 10,
  namHoc: "2025-2026",
  gvcn: "",
  phongHoc: "",
  moTa: "",
};

export const LopPage = ({ showAlert }) => {
  const [list, setList] = useState([]);
  const [gvs, setGvs] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const admin = isAdmin();

  const load = async () => {
    const [lops, giaoViens] = await Promise.all([
      api("/api/lop"),
      api("/api/giaovien"),
    ]);
    setList(lops);
    setGvs(giaoViens);
  };

  useEffect(() => {
    load().catch((e) => showAlert("danger", e.message));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm(empty);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, khoi: Number(form.khoi), gvcn: form.gvcn || null };
      if (editId) {
        await api(`/api/lop/${editId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        showAlert("success", "Đã cập nhật lớp");
      } else {
        await api("/api/lop", { method: "POST", body: JSON.stringify(body) });
        showAlert("success", "Đã thêm lớp");
      }
      reset();
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const startEdit = (lop) => {
    setEditId(lop._id);
    setForm({
      tenLop: lop.tenLop,
      khoi: lop.khoi,
      namHoc: lop.namHoc,
      gvcn: lop.gvcn?._id || "",
      phongHoc: lop.phongHoc || "",
      moTa: lop.moTa || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lớp này?")) return;
    try {
      await api(`/api/lop/${id}`, { method: "DELETE" });
      showAlert("success", "Đã xóa lớp");
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quản lý lớp học</h1>
          <p>Khối 10–12, năm học và giáo viên chủ nhiệm.</p>
        </div>
      </div>

      {admin && (
        <div className="panel mb-4">
          <h5 className="mb-3">{editId ? "Sửa lớp" : "Thêm lớp"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="form-control" name="tenLop" placeholder="Tên lớp *" value={form.tenLop} onChange={onChange} required />
              <select className="form-select" name="khoi" value={form.khoi} onChange={onChange}>
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
              <input className="form-control" name="namHoc" placeholder="Năm học *" value={form.namHoc} onChange={onChange} required />
              <select className="form-select" name="gvcn" value={form.gvcn} onChange={onChange}>
                <option value="">GVCN (tuỳ chọn)</option>
                {gvs.map((g) => (
                  <option key={g._id} value={g._id}>{g.hoTen}</option>
                ))}
              </select>
              <input className="form-control" name="phongHoc" placeholder="Phòng học" value={form.phongHoc} onChange={onChange} />
              <input className="form-control" name="moTa" placeholder="Mô tả" value={form.moTa} onChange={onChange} />
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
                <th>Lớp</th>
                <th>Khối</th>
                <th>Năm học</th>
                <th>GVCN</th>
                <th>Phòng</th>
                <th>Sĩ số</th>
                {admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((lop) => (
                <tr key={lop._id}>
                  <td><strong>{lop.tenLop}</strong></td>
                  <td>{lop.khoi}</td>
                  <td>{lop.namHoc}</td>
                  <td>{lop.gvcn?.hoTen || "—"}</td>
                  <td>{lop.phongHoc || "—"}</td>
                  <td>{lop.siSo}</td>
                  {admin && (
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(lop)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(lop._id)}>Xóa</button>
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
