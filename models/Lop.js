const mongoose = require("mongoose");
const { Schema } = mongoose;

const LopSchema = new Schema({
  tenLop: {
    type: String,
    required: true,
    unique: true,
  },
  khoi: {
    type: Number,
    required: true,
    enum: [10, 11, 12],
  },
  namHoc: {
    type: String,
    required: true,
  },
  gvcn: {
    type: Schema.Types.ObjectId,
    ref: "giaovien",
    default: null,
  },
  phongHoc: {
    type: String,
    default: "",
  },
  siSo: {
    type: Number,
    default: 0,
  },
  moTa: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("lop", LopSchema);
