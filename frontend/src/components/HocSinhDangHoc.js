import React, { useState, useEffect } from 'react';
import NhapKetQua from './NhapKetQua';

export function HocSinhDangHoc(props) {
  const [hocSinh, setHocSinh] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [denNam, setDenNam] = useState('');

  useEffect(() => {
    fetchHocSinh();
  }, []);

  const fetchHocSinh = async (query) => {
    try {
      const path = query
        ? `/api/hocsinh/search?${query}`
        : "/api/hocsinh/getAllHocSinh";
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + path);
      const data = await response.json();
      setHocSinh(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tuKhoa) params.set('tuKhoa', tuKhoa);
    if (denNam) params.set('denNam', denNam);
    fetchHocSinh(params.toString());
  };

  const handleNhap = (hs) => {
    setSelected(hs);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    fetchHocSinh();
  };

  return (
    <div className="container mb-5">
      <h1 className="text-center text-primary mt-3">Học sinh đang học</h1>
      <form className="row g-2 mt-3" onSubmit={handleSearch}>
        <div className="col-md-5">
          <input className="form-control" placeholder="Tìm theo họ tên" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} />
        </div>
        <div className="col-md-3">
          <input className="form-control" type="number" placeholder="Sinh từ năm ... trở về trước" value={denNam} onChange={(e) => setDenNam(e.target.value)} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">Tìm</button>
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-secondary w-100" type="button" onClick={() => { setTuKhoa(''); setDenNam(''); fetchHocSinh(); }}>Tất cả</button>
        </div>
      </form>

      <div className="table-responsive mt-4">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Phòng</th>
              <th>Năm sinh</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hocSinh.map((hs) => (
              <tr key={hs._id}>
                <td>{hs.maHS}</td>
                <td>{hs.hoTen}</td>
                <td>{hs.lop?.name}</td>
                <td>{hs.lop?.address}</td>
                <td>{hs.namSinh}</td>
                <td>
                  <button
                    onClick={() => handleNhap(hs)}
                    className={`btn btn-primary btn-sm ${!hs.dangHoc && 'disabled'}`}
                    disabled={!hs.dangHoc}
                  >
                    Nhập kết quả
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hocSinh.length === 0 && <p>Không có học sinh đang học.</p>}
      </div>

      {showModal && selected && selected.lop && (
        <NhapKetQua
          lopId={selected.lop._id}
          lopName={selected.lop.name}
          maHS={selected.maHS}
          hoTen={selected.hoTen}
          hocSinhId={selected._id}
          onConfirm={handleConfirm}
          showModal={showModal}
          setShowModal={setShowModal}
          showAlert={props.showAlert}
        />
      )}
    </div>
  );
};

export default HocSinhDangHoc;
