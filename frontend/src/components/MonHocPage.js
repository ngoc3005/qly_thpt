import React, { useEffect, useState } from "react";
import { api, isAdmin } from "../api";

const empty = { maMon: "", tenMon: "", soTiet: 0, heSo: 1, moTa: "" };

export const MonHocPage = ({ showAlert }) => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const admin = isAdmin();

  const load = async () => setList(await api("/api/monhoc"));

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
      const body = {
        ...form,
        soTiet: Number(form.soTiet),
        heSo: Number(form.heSo),
      };
      if (editId) {
        await api(`/api/monhoc/${editId}`, { method: "PUT", body: JSON.stringify(body) });
        showAlert("success", "Đã cập nhật môn học");
      } else {
        await api("/api/monhoc", { method: "POST", body: JSON.stringify(body) });
        showAlert("success", "Đã thêm môn học");
      }
      reset();
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const startEdit = (m) => {
    setEditId(m._id);
    setForm({
      maMon: m.maMon,
      tenMon: m.tenMon,
      soTiet: m.soTiet,
      heSo: m.heSo,
      moTa: m.moTa || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa môn học này?")) return;
    try {
      await api(`/api/monhoc/${id}`, { method: "DELETE" });
      showAlert("success", "Đã xóa môn học");
      await load();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quản lý môn học</h1>
          <p>Danh mục môn, số tiết và hệ số.</p>
        </div>
      </div>

      {admin && (
        <div className="panel mb-4">
          <h5 className="mb-3">{editId ? "Sửa môn" : "Thêm môn"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="form-control" name="maMon" placeholder="Mã môn *" value={form.maMon} onChange={onChange} required />
              <input className="form-control" name="tenMon" placeholder="Tên môn *" value={form.tenMon} onChange={onChange} required />
              <input className="form-control" type="number" name="soTiet" placeholder="Số tiết" value={form.soTiet} onChange={onChange} />
              <input className="form-control" type="number" step="0.5" name="heSo" placeholder="Hệ số" value={form.heSo} onChange={onChange} />
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
                <th>Mã</th>
                <th>Tên môn</th>
                <th>Số tiết</th>
                <th>Hệ số</th>
                <th>Mô tả</th>
                {admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m._id}>
                  <td><strong>{m.maMon}</strong></td>
                  <td>{m.tenMon}</td>
                  <td>{m.soTiet}</td>
                  <td>{m.heSo}</td>
                  <td>{m.moTa || "—"}</td>
                  {admin && (
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(m)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m._id)}>Xóa</button>
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
