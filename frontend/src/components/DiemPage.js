import React, { useEffect, useState } from "react";
import { api } from "../api";

const empty = {
  hocSinh: "",
  monHoc: "",
  namHoc: "2025-2026",
  hocKy: 1,
  diemMieng: "",
  diem15p: "",
  diem1Tiet: "",
  diemThi: "",
  ghiChu: "",
};

export const DiemPage = ({ showAlert }) => {
  const [list, setList] = useState([]);
  const [hocSinhs, setHocSinhs] = useState([]);
  const [mons, setMons] = useState([]);
  const [lops, setLops] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({
    lop: "",
    namHoc: "2025-2026",
    hocKy: "1",
  });

  const loadMeta = async () => {
    const [hs, mon, lop] = await Promise.all([
      api("/api/hocsinh"),
      api("/api/monhoc"),
      api("/api/lop"),
    ]);
    setHocSinhs(hs);
    setMons(mon);
    setLops(lop);
  };

  const loadScores = async () => {
    const q = new URLSearchParams();
    if (filters.lop) q.set("lop", filters.lop);
    if (filters.namHoc) q.set("namHoc", filters.namHoc);
    if (filters.hocKy) q.set("hocKy", filters.hocKy);
    setList(await api("/api/ketqua?" + q.toString()));
  };

  useEffect(() => {
    loadMeta().catch((e) => showAlert("danger", e.message));
  }, []);

  useEffect(() => {
    loadScores().catch((e) => showAlert("danger", e.message));
  }, [filters.lop, filters.namHoc, filters.hocKy]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm(empty);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api(`/api/ketqua/${editId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        showAlert("success", "Đã cập nhật điểm");
      } else {
        await api("/api/ketqua", {
          method: "POST",
          body: JSON.stringify({ ...form, hocKy: Number(form.hocKy) }),
        });
        showAlert("success", "Đã lưu điểm");
      }
      reset();
      await loadScores();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const startEdit = (kq) => {
    setEditId(kq._id);
    setForm({
      hocSinh: kq.hocSinh?._id || "",
      monHoc: kq.monHoc?._id || "",
      namHoc: kq.namHoc,
      hocKy: kq.hocKy,
      diemMieng: kq.diemMieng ?? "",
      diem15p: kq.diem15p ?? "",
      diem1Tiet: kq.diem1Tiet ?? "",
      diemThi: kq.diemThi ?? "",
      ghiChu: kq.ghiChu || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa bản ghi điểm này?")) return;
    try {
      await api(`/api/ketqua/${id}`, { method: "DELETE" });
      showAlert("success", "Đã xóa điểm");
      await loadScores();
    } catch (err) {
      showAlert("danger", err.message);
    }
  };

  const filteredHS = filters.lop
    ? hocSinhs.filter((h) => (h.lop?._id || h.lop) === filters.lop)
    : hocSinhs;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quản lý điểm</h1>
          <p>
            Nhập điểm miệng, 15 phút, 1 tiết, thi. TB = (M + 15p + 1 tiết×2 +
            Thi×3) / 7.
          </p>
        </div>
      </div>

      <div className="panel mb-3">
        <div className="form-grid">
          <select
            className="form-select"
            value={filters.lop}
            onChange={(e) => setFilters({ ...filters, lop: e.target.value })}
          >
            <option value="">Tất cả lớp</option>
            {lops.map((l) => (
              <option key={l._id} value={l._id}>
                {l.tenLop}
              </option>
            ))}
          </select>
          <input
            className="form-control"
            value={filters.namHoc}
            onChange={(e) => setFilters({ ...filters, namHoc: e.target.value })}
            placeholder="Năm học"
          />
          <select
            className="form-select"
            value={filters.hocKy}
            onChange={(e) => setFilters({ ...filters, hocKy: e.target.value })}
          >
            <option value="">Tất cả học kỳ</option>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </select>
        </div>
      </div>

      <div className="panel mb-4">
        <h5 className="mb-3">{editId ? "Sửa điểm" : "Nhập điểm"}</h5>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <select
              className="form-select"
              name="hocSinh"
              value={form.hocSinh}
              onChange={onChange}
              required
              disabled={!!editId}
            >
              <option value="">Học sinh *</option>
              {filteredHS.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.maHS} — {h.hoTen}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              name="monHoc"
              value={form.monHoc}
              onChange={onChange}
              required
              disabled={!!editId}
            >
              <option value="">Môn học *</option>
              {mons.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.tenMon}
                </option>
              ))}
            </select>
            <input
              className="form-control"
              name="namHoc"
              value={form.namHoc}
              onChange={onChange}
              required
            />
            <select
              className="form-select"
              name="hocKy"
              value={form.hocKy}
              onChange={onChange}
            >
              <option value={1}>HK1</option>
              <option value={2}>HK2</option>
            </select>
            <input
              className="form-control"
              type="number"
              min="0"
              max="10"
              step="0.1"
              name="diemMieng"
              placeholder="Miệng"
              value={form.diemMieng}
              onChange={onChange}
            />
            <input
              className="form-control"
              type="number"
              min="0"
              max="10"
              step="0.1"
              name="diem15p"
              placeholder="15 phút"
              value={form.diem15p}
              onChange={onChange}
            />
            <input
              className="form-control"
              type="number"
              min="0"
              max="10"
              step="0.1"
              name="diem1Tiet"
              placeholder="1 tiết"
              value={form.diem1Tiet}
              onChange={onChange}
            />
            <input
              className="form-control"
              type="number"
              min="0"
              max="10"
              step="0.1"
              name="diemThi"
              placeholder="Thi"
              value={form.diemThi}
              onChange={onChange}
            />
            <input
              className="form-control"
              name="ghiChu"
              placeholder="Ghi chú"
              value={form.ghiChu}
              onChange={onChange}
            />
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-leaf" type="submit">
              {editId ? "Cập nhật" : "Lưu điểm"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={reset}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Học sinh</th>
                <th>Lớp</th>
                <th>Môn</th>
                <th>HK</th>
                <th>Miệng</th>
                <th>15p</th>
                <th>1 tiết</th>
                <th>Thi</th>
                <th>TB</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((kq) => (
                <tr key={kq._id}>
                  <td>
                    {kq.hocSinh?.maHS} — {kq.hocSinh?.hoTen}
                  </td>
                  <td>{kq.hocSinh?.lop?.tenLop || "—"}</td>
                  <td>{kq.monHoc?.tenMon}</td>
                  <td>{kq.hocKy}</td>
                  <td>{kq.diemMieng ?? "—"}</td>
                  <td>{kq.diem15p ?? "—"}</td>
                  <td>{kq.diem1Tiet ?? "—"}</td>
                  <td>{kq.diemThi ?? "—"}</td>
                  <td>
                    <strong>{kq.diemTB ?? "—"}</strong>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => startEdit(kq)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(kq._id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
