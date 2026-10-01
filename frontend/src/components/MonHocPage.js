import React, { useEffect, useState } from 'react';

export const MonHocPage = ({ showAlert }) => {
  const [danhSach, setDanhSach] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', heSo: '' });

  const fetchMon = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/monhoc/monhoc');
      const data = await response.json();
      setDanhSach(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMon();
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/monhoc/createMonHoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, heSo: Number(form.heSo) })
      });
      if (!response.ok) {
        showAlert('danger', 'Không thêm được môn học');
        return;
      }
      showAlert('success', 'Đã thêm môn học');
      setForm({ name: '', description: '', heSo: '' });
      fetchMon();
    } catch (error) {
      console.error(error);
      showAlert('danger', 'Lỗi máy chủ');
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h1 className="text-center text-primary">Môn học</h1>
      <form className="row g-3 mt-2" onSubmit={handleSubmit}>
        <div className="col-md-3">
          <input className="form-control" name="name" placeholder="Tên môn" value={form.name} onChange={onChange} required />
        </div>
        <div className="col-md-5">
          <input className="form-control" name="description" placeholder="Mô tả" value={form.description} onChange={onChange} />
        </div>
        <div className="col-md-2">
          <input className="form-control" name="heSo" type="number" step="0.1" placeholder="Hệ số" value={form.heSo} onChange={onChange} required />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">Thêm môn</button>
        </div>
      </form>
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Môn</th>
            <th>Mô tả</th>
            <th>Hệ số</th>
          </tr>
        </thead>
        <tbody>
          {danhSach.map((mon) => (
            <tr key={mon._id}>
              <td>{mon.name}</td>
              <td>{mon.description}</td>
              <td>{mon.heSo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonHocPage;
