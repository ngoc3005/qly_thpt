const mongoose = require('mongoose');

const KetQuaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  hocSinh: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'hocsinh',
  },
  lop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'lop',
    required: true
  },
  monHoc: [String],
  diemTB: {
    type: Number,
    required: true
  },
  ngayBatDau: {
    type: Date,
    required: true
  },
  ngayKetThuc: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const KetQua = mongoose.model('ketqua', KetQuaSchema);
module.exports = KetQua;
