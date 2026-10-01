import React, { useState } from 'react';

export const TaoLop = ({ showAlert }) => {
  const [lop, setLop] = useState({
    name: '',
    description: '',
    email: '',
    address: '',
    contact: '',
    image: ''
  });

  const onChange = (e) => {
    setLop({ ...lop, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/lop/createLop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lop)
      });
      const json = await response.json();
      if (response.ok) {
        showAlert('success', 'Đã tạo lớp');
        setLop({ name: '', description: '', email: '', address: '', contact: '', image: '' });
      } else {
        showAlert('danger', json.error || json.errors || 'Không tạo được lớp');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      showAlert('danger', 'Lỗi máy chủ khi tạo lớp');
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Thêm lớp học</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên lớp</label>
                  <input type="text" className="form-control" id="name" name="name" value={lop.name} onChange={onChange} placeholder="Ví dụ: 10A1" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Năm học</label>
                  <textarea className="form-control" id="description" name="description" rows="3" value={lop.description} onChange={onChange} placeholder="2025-2026" />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email giáo viên chủ nhiệm</label>
                  <input type="email" className="form-control" id="email" name="email" value={lop.email} onChange={onChange} required />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="address" className="form-label">Phòng học</label>
                    <input type="text" className="form-control" id="address" name="address" value={lop.address} onChange={onChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact" className="form-label">Số điện thoại GVCN</label>
                    <input type="text" className="form-control" id="contact" name="contact" value={lop.contact} onChange={onChange} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">Lưu lớp</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaoLop;
