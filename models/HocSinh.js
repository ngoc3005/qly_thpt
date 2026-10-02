const mongoose = require("mongoose");
const { Schema } = mongoose;

const HocSinhSchema = new Schema({
  maHS: {
    type: String,
    required: true,
    unique: true,
  },
  hoTen: {
    type: String,
    required: true,
  },
  ngaySinh: {
    type: Date,
    required: true,
  },
  gioiTinh: {
    type: String,
    enum: ["Nam", "Nữ"],
    required: true,
  },
  lop: {
    type: Schema.Types.ObjectId,
    ref: "lop",
    required: true,
  },
  diaChi: {
    type: String,
    default: "",
  },
  soDienThoaiPH: {
    type: String,
    default: "",
  },
  tenPhuHuynh: {
    type: String,
    default: "",
  },
  emailPH: {
    type: String,
    default: "",
  },
  trangThai: {
    type: String,
    enum: ["dang_hoc", "nghi_hoc", "tot_nghiep"],
    default: "dang_hoc",
  },
});

module.exports = mongoose.model("hocsinh", HocSinhSchema);
