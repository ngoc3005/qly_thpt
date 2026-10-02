const mongoose = require("mongoose");
const { Schema } = mongoose;

const MonHocSchema = new Schema({
  maMon: {
    type: String,
    required: true,
    unique: true,
  },
  tenMon: {
    type: String,
    required: true,
  },
  soTiet: {
    type: Number,
    default: 0,
  },
  heSo: {
    type: Number,
    default: 1,
  },
  moTa: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("monhoc", MonHocSchema);
