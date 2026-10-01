import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const NhapKetQua = ({ lopName, lopId, maHS, hoTen, hocSinhId, onConfirm, showModal, setShowModal, showAlert }) => {
    const [ngayBatDau, setNgayBatDau] = useState('');
    const [ngayKetThuc, setNgayKetThuc] = useState('');
    const [monHoc, setMonHoc] = useState([]);
    const [diemTB, setDiemTB] = useState('');
    const navigate = useNavigate();
    const [minNgayKetThuc, setMinNgayKetThuc] = useState('');

    useEffect(() => {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        setMinNgayKetThuc(currentDate.toISOString().split('T')[0]);
    }, []);

    const handleNgayBatDau = (e) => {
        setNgayBatDau(e.target.value);
        const minDate = new Date(e.target.value);
        minDate.setDate(minDate.getDate() + 1);
        setMinNgayKetThuc(minDate.toISOString().split('T')[0]);
        if (ngayKetThuc < minDate.toISOString().split('T')[0]) {
            setNgayKetThuc(minDate.toISOString().split('T')[0]);
        }
    };

    useEffect(() => {
        fetchMonHoc();
    }, []);

    const fetchMonHoc = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + "/api/monhoc/monhoc");
            const data = await response.json();
            const withChecked = (Array.isArray(data) ? data : []).map((mon) => ({
                ...mon,
                isChecked: false,
            }));
            setMonHoc(withChecked);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleMonChange = (e) => {
        const tenMon = e.target.name;
        const isChecked = e.target.checked;
        setMonHoc((prev) =>
            prev.map((mon) =>
                mon.name === tenMon ? { ...mon, isChecked } : mon
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            showAlert("danger", "Cần đăng nhập trước khi nhập kết quả");
            navigate('/login');
            return;
        }
        try {
            const selected = monHoc.filter((mon) => mon.isChecked).map((mon) => mon.name);
            const chiTiet = {
                lopId: lopId,
                hocSinhId: hocSinhId,
                ngayBatDau: ngayBatDau,
                ngayKetThuc: ngayKetThuc,
                monHoc: selected,
                diemTB: Number(diemTB)
            };

            const response = await fetch(process.env.REACT_APP_API_ADDRESS + "/api/ketqua/createKetQua", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "auth-token": authToken
                },
                body: JSON.stringify(chiTiet),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }
            const moi = await response.json();
            onConfirm(moi);
            showAlert("success", "Đã lưu kết quả học kỳ");
            setShowModal(false);
        } catch (error) {
            console.error('Error creating grade:', error);
            showAlert("danger", error.message || "Không lưu được kết quả");
        }
    };

    return (
        <div className="container mt-5">
            {showModal && (
                <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Kết quả {hoTen} ({maHS}) — lớp {lopName}</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="ngayBatDau" className="form-label">Ngày bắt đầu học kỳ</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="ngayBatDau"
                                            value={ngayBatDau}
                                            onChange={handleNgayBatDau}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="ngayKetThuc" className="form-label">Ngày kết thúc học kỳ</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="ngayKetThuc"
                                            min={minNgayKetThuc}
                                            value={ngayKetThuc}
                                            onChange={(e) => setNgayKetThuc(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="diemTB" className="form-label">Điểm trung bình (0–10)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="diemTB"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={diemTB}
                                            onChange={(e) => setDiemTB(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {monHoc.length > 0 && (
                                        <div className="mb-3">
                                            <p>Môn học trong học kỳ:</p>
                                            {monHoc.map((mon, index) => (
                                                <div key={index} className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={mon.name}
                                                        name={mon.name}
                                                        onChange={handleMonChange}
                                                    />
                                                    <label className="form-check-label" htmlFor={mon.name}>
                                                        {mon.name}
                                                    </label>
                                                    <p className="text-muted mb-1">{mon.description} — hệ số {mon.heSo}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary">Lưu kết quả</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NhapKetQua;
