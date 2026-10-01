const mongoose = require('mongoose');
const hocSinhSchema = new mongoose.Schema({
    lop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lop'
    },
    maHS: {
        type: String,
        required: true
    },
    hoTen: {
        type: String,
        required: true,
    },
    ghiChu: String,
    namSinh: {
        type: Number,
        required: true,
    },
    dangHoc: {
        type: Boolean,
        default: true,
    }
});

const HocSinh = mongoose.model('hocsinh', hocSinhSchema);
module.exports = HocSinh;
