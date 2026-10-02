const mongoose = require("mongoose");
const { Schema } = mongoose;

const KetQuaSchema = new Schema({
  hocSinh: {
    type: Schema.Types.ObjectId,
    ref: "hocsinh",
    required: true,
  },
  monHoc: {
    type: Schema.Types.ObjectId,
    ref: "monhoc",
    required: true,
  },
  namHoc: {
    type: String,
    required: true,
  },
  hocKy: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  diemMieng: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  diem15p: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  diem1Tiet: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  diemThi: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  diemTB: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  ghiChu: {
    type: String,
    default: "",
  },
});

KetQuaSchema.index(
  { hocSinh: 1, monHoc: 1, namHoc: 1, hocKy: 1 },
  { unique: true }
);

KetQuaSchema.pre("save", function (next) {
  const { diemMieng, diem15p, diem1Tiet, diemThi } = this;
  const scores = [diemMieng, diem15p, diem1Tiet, diemThi].filter(
    (d) => d !== null && d !== undefined && d !== ""
  );
  if (scores.length === 0) {
    this.diemTB = null;
  } else {
    // TB = (miệng + 15p + 1 tiết*2 + thi*3) / 7 khi đủ điểm; fallback trung bình các điểm có
    if (
      diemMieng != null &&
      diem15p != null &&
      diem1Tiet != null &&
      diemThi != null
    ) {
      this.diemTB = Number(
        ((diemMieng + diem15p + diem1Tiet * 2 + diemThi * 3) / 7).toFixed(2)
      );
    } else {
      const sum = scores.reduce((a, b) => a + Number(b), 0);
      this.diemTB = Number((sum / scores.length).toFixed(2));
    }
  }
  next();
});

module.exports = mongoose.model("ketqua", KetQuaSchema);
