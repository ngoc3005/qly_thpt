import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const LopNoiBat = () => {
    const [danhSach, setDanhSach] = useState([]);

    useEffect(() => {
        fetchLop();
    }, []);

    const fetchLop = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/lop/popular');
            const data = await response.json();
            setDanhSach(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <h1 className="text-center text-primary mt-3">Lớp có sĩ số cao</h1>
            {danhSach.length === 0 ? (
                <p className="text-center text-muted mt-4">Chưa có lớp nào đã thêm học sinh. Hãy tạo lớp và nhập học sinh.</p>
            ) : (
                <div className="row mt-5 gy-4">
                    {danhSach.map((lop) => (
                        <div key={lop._id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{lop.name}</h5>
                                    <p className="card-text text-muted">{lop.description || 'Chưa có năm học.'}</p>
                                    <p className="mb-1"><strong>Phòng học: </strong> {lop.address}</p>
                                    <p className="mb-1"><strong>GVCN: </strong> {lop.contact}</p>
                                    <p className="mb-3"><strong>Sĩ số: </strong> {lop.siSo || 0}</p>
                                    <Link to={`/lop/${lop._id}`} className="btn btn-primary mt-auto">Xem học sinh</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default LopNoiBat;
