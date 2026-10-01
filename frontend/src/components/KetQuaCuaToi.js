import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KetQuaCuaToi = ({ showAlert }) => {
  const [ketQua, setKetQua] = useState([]);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}-${month}-${year}`;
  };

  const fetchKetQua = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert("danger", "Cần đăng nhập trước");
        navigate('/login');
        return;
      }

      const response = await fetch(process.env.REACT_APP_API_ADDRESS + "/api/ketqua/getallketqua", {
        method: 'GET',
        headers: {
          "auth-token": token
        }
      });
      const data = await response.json();
      setKetQua(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching grades:', error);
      navigate('/login');
    }
  }, [navigate, showAlert]);

  useEffect(() => {
    fetchKetQua();
  }, [fetchKetQua]);

  const handleHuy = async (id) => {
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + `/api/ketqua/ketqua/${id}`, {
        method: 'DELETE',
        headers: {
          "auth-token": localStorage.getItem('token')
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      showAlert("success", "Đã hủy kết quả học kỳ");
      setKetQua((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Error deleting grade:', error);
    }
  };

  const handlePhieu = async (id) => {
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + `/api/ketqua/phieu/${id}`, {
        method: 'GET',
        headers: {
          "auth-token": localStorage.getItem('token')
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phieu-ket-qua.pdf';
      a.click();

      showAlert("success", "Đã tải phiếu kết quả");
    } catch (error) {
      console.error('Error downloading transcript', error);
    }
  };

  return (
    <main>
      <div className='container mb-5'>
        <h1 className='text-center text-primary mt-3'>Kết quả đã nhập</h1>
        {ketQua.length === 0 ? (
          <p>Chưa có kết quả nào.</p>
        ) : (
          <div className="row">
            {ketQua.map((item, index) => (
              <div key={item._id} className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{item.hocSinh?.hoTen}</h5>
                    <p className="card-text mb-1">Mã HS: {item.hocSinh?.maHS}</p>
                    <p className="card-text mb-1">Lớp: {item.lop?.name}</p>
                    <p className="card-text mb-1">Phòng: {item.lop?.address}</p>
                    <p className="card-text mb-1">Môn: {(item.monHoc || []).join(', ') || '—'}</p>
                    <p className="card-text mb-1">Điểm TB: {item.diemTB}</p>
                    <p className="card-text mb-1">Từ: {formatDate(item.ngayBatDau)}</p>
                    <p className="card-text">Đến: {formatDate(item.ngayKetThuc)}</p>
                    <button className="btn btn-outline-danger btn-sm me-2" onClick={() => handleHuy(item._id)}>Hủy phiếu</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handlePhieu(item._id)}>Tải phiếu PDF</button>
                    <span className="position-absolute top-0 start-100 translate-middle badge bg-primary">{index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default KetQuaCuaToi;
