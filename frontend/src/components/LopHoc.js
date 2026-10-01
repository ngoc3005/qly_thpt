import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function LopHoc() {
    const [lops, setLops] = useState([]);
    useEffect(() => {
        fetchLops();
    }, []);
    const fetchLops = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + "/api/lop/getLops");
            const data = await response.json();
            setLops(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };
    return (
        <div>
            <h1 className="text-center text-primary mt-3">Danh sách lớp</h1>
            <div className="container mt-4 text-end">
                <Link to="/taolop" className="btn btn-primary">Thêm lớp</Link>
            </div>
            <div className="container mt-4 mb-5">
                <div className="row gy-4">
                    {lops.map((lop) => (
                        <div key={lop._id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{lop.name}</h5>
                                    <p className="card-text text-muted">{lop.description || 'Chưa ghi năm học.'}</p>
                                    <p className="mb-1"><strong>Phòng:</strong> {lop.address}</p>
                                    <p className="mb-1"><strong>Email GVCN:</strong> {lop.email}</p>
                                    <p className="mb-3"><strong>Điện thoại:</strong> {lop.contact}</p>
                                    <p className="mb-3"><strong>Sĩ số:</strong> {lop.siSo || 0}</p>
                                    <Link to={`/lop/${lop._id}`} className="btn btn-primary mt-auto">Học sinh của lớp</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default LopHoc;
