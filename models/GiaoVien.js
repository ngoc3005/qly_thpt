const mongoose = require("mongoose");
const { Schema } = mongoose;

const GiaoVienSchema = new Schema({
  maGV: {
    type: String,
    required: true,
    unique: true,
  },
  hoTen: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  soDienThoai: {
    type: String,
    default: "",
  },
  monDay: [
    {
      type: Schema.Types.ObjectId,
      ref: "monhoc",
    },
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    default: null,
  },
  ngaySinh: {
    type: Date,
  },
  gioiTinh: {
    type: String,
    enum: ["Nam", "Nữ", ""],
    default: "",
  },
  diaChi: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("giaovien", GiaoVienSchema);
