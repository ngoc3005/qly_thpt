import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NhapKetQua from './NhapKetQua';

export function HocSinhLop(props) {
    const { lopId } = useParams();
    const [hocSinh, setHocSinh] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ maHS: '', hoTen: '', ghiChu: '', namSinh: '', dangHoc: true });

    const fetchHocSinh = useCallback(async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + `/api/hocsinh/getHocSinh/${lopId}`);
            const data = await response.json();
            setHocSinh(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [lopId]);

    useEffect(() => {
        fetchHocSinh();
    }, [fetchHocSinh]);

    const handleNhap = (hs) => {
        setSelected(hs);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        setShowModal(false);
        fetchHocSinh();
    };

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleThem = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + `/api/hocsinh/createHocSinh/${lopId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, namSinh: Number(form.namSinh) })
            });
            const json = await response.json();
            if (!response.ok) {
                props.showAlert('danger', json.error || 'Không thêm được học sinh');
                return;
            }
            props.showAlert('success', 'Đã thêm học sinh');
            setForm({ maHS: '', hoTen: '', ghiChu: '', namSinh: '', dangHoc: true });
            fetchHocSinh();
        } catch (error) {
            console.error(error);
            props.showAlert('danger', 'Lỗi máy chủ khi thêm học sinh');
        }
    };

    return (
        <div className="container mb-5">
            {hocSinh.length > 0 && hocSinh[0].lop && (
                <h1 className="text-center text-primary mt-3">Học sinh lớp {hocSinh[0].lop.name}</h1>
            )}
            {hocSinh.length === 0 && (
                <h1 className="text-center text-primary mt-3">Học sinh của lớp</h1>
            )}

            <div className="card shadow-sm mt-4">
                <div className="card-body">
                    <h5>Thêm học sinh</h5>
                    <form className="row g-3" onSubmit={handleThem}>
                        <div className="col-md-3">
                            <input className="form-control" name="maHS" placeholder="Mã học sinh" value={form.maHS} onChange={onChange} required />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control" name="hoTen" placeholder="Họ và tên" value={form.hoTen} onChange={onChange} required />
                        </div>
                        <div className="col-md-2">
                            <input className="form-control" name="namSinh" type="number" placeholder="Năm sinh" value={form.namSinh} onChange={onChange} required />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control" name="ghiChu" placeholder="Ghi chú" value={form.ghiChu} onChange={onChange} />
                        </div>
                        <div className="col-md-1">
                            <button className="btn btn-primary w-100" type="submit">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="table-responsive mt-4">
                <table className="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Mã HS</th>
                            <th>Họ tên</th>
                            <th>Năm sinh</th>
                            <th>Ghi chú</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {hocSinh.map((hs) => (
                            <tr key={hs._id}>
                                <td>{hs.maHS}</td>
                                <td>{hs.hoTen}</td>
                                <td>{hs.namSinh}</td>
                                <td>{hs.ghiChu}</td>
                                <td>{hs.dangHoc ? 'Đang học' : 'Đã chốt học kỳ'}</td>
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
            </div>

            {showModal && selected && (
                <NhapKetQua
                    lopId={selected.lop._id || lopId}
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

export default HocSinhLop;
