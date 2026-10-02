/**
 * Seed dữ liệu mẫu + tài khoản admin mặc định
 * Chạy: node seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Lop = require("./models/Lop");
const HocSinh = require("./models/HocSinh");
const MonHoc = require("./models/MonHoc");
const GiaoVien = require("./models/GiaoVien");
const KetQua = require("./models/KetQua");

async function seed() {
  await mongoose.connect(process.env.DB_URI);
  console.log("Đã kết nối MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Lop.deleteMany({}),
    HocSinh.deleteMany({}),
    MonHoc.deleteMany({}),
    GiaoVien.deleteMany({}),
    KetQua.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash("admin123", salt);
  const gvPass = await bcrypt.hash("giaovien123", salt);

  await User.create([
    {
      name: "Quản trị viên",
      email: "admin@thpt.local",
      password: adminPass,
      role: "admin",
    },
    {
      name: "Nguyễn Văn Giáo",
      email: "giaovien@thpt.local",
      password: gvPass,
      role: "giaovien",
    },
  ]);

  const monHocs = await MonHoc.insertMany([
    { maMon: "TOAN", tenMon: "Toán", soTiet: 4, heSo: 2 },
    { maMon: "VAN", tenMon: "Ngữ văn", soTiet: 4, heSo: 2 },
    { maMon: "ANH", tenMon: "Tiếng Anh", soTiet: 3, heSo: 1 },
    { maMon: "LY", tenMon: "Vật lý", soTiet: 2, heSo: 1 },
    { maMon: "HOA", tenMon: "Hóa học", soTiet: 2, heSo: 1 },
    { maMon: "SINH", tenMon: "Sinh học", soTiet: 2, heSo: 1 },
    { maMon: "SU", tenMon: "Lịch sử", soTiet: 1, heSo: 1 },
    { maMon: "DIA", tenMon: "Địa lý", soTiet: 1, heSo: 1 },
  ]);

  const gvs = await GiaoVien.insertMany([
    {
      maGV: "GV001",
      hoTen: "Trần Thị Lan",
      email: "lan@thpt.local",
      soDienThoai: "0901111111",
      monDay: [monHocs[0]._id],
      gioiTinh: "Nữ",
    },
    {
      maGV: "GV002",
      hoTen: "Lê Văn Hùng",
      email: "hung@thpt.local",
      soDienThoai: "0902222222",
      monDay: [monHocs[1]._id],
      gioiTinh: "Nam",
    },
    {
      maGV: "GV003",
      hoTen: "Phạm Minh Tuấn",
      email: "tuan@thpt.local",
      soDienThoai: "0903333333",
      monDay: [monHocs[2]._id],
      gioiTinh: "Nam",
    },
  ]);

  const namHoc = "2025-2026";
  const lops = await Lop.insertMany([
    {
      tenLop: "10A1",
      khoi: 10,
      namHoc,
      gvcn: gvs[0]._id,
      phongHoc: "P101",
      moTa: "Lớp chuyên Toán",
    },
    {
      tenLop: "10A2",
      khoi: 10,
      namHoc,
      gvcn: gvs[1]._id,
      phongHoc: "P102",
    },
    {
      tenLop: "11A1",
      khoi: 11,
      namHoc,
      gvcn: gvs[2]._id,
      phongHoc: "P201",
    },
    {
      tenLop: "12A1",
      khoi: 12,
      namHoc,
      gvcn: gvs[0]._id,
      phongHoc: "P301",
    },
  ]);

  const students = await HocSinh.insertMany([
    {
      maHS: "HS10001",
      hoTen: "Nguyễn Minh Anh",
      ngaySinh: new Date("2009-03-15"),
      gioiTinh: "Nữ",
      lop: lops[0]._id,
      tenPhuHuynh: "Nguyễn Văn A",
      soDienThoaiPH: "0912345678",
      diaChi: "Hà Nội",
    },
    {
      maHS: "HS10002",
      hoTen: "Trần Quốc Bảo",
      ngaySinh: new Date("2009-07-22"),
      gioiTinh: "Nam",
      lop: lops[0]._id,
      tenPhuHuynh: "Trần Văn B",
      soDienThoaiPH: "0923456789",
      diaChi: "Hà Nội",
    },
    {
      maHS: "HS10003",
      hoTen: "Lê Thu Hà",
      ngaySinh: new Date("2009-01-08"),
      gioiTinh: "Nữ",
      lop: lops[1]._id,
      tenPhuHuynh: "Lê Văn C",
      soDienThoaiPH: "0934567890",
      diaChi: "Hải Phòng",
    },
    {
      maHS: "HS11001",
      hoTen: "Phạm Đức Huy",
      ngaySinh: new Date("2008-11-30"),
      gioiTinh: "Nam",
      lop: lops[2]._id,
      tenPhuHuynh: "Phạm Văn D",
      soDienThoaiPH: "0945678901",
      diaChi: "Nam Định",
    },
    {
      maHS: "HS12001",
      hoTen: "Hoàng Thị Mai",
      ngaySinh: new Date("2007-05-12"),
      gioiTinh: "Nữ",
      lop: lops[3]._id,
      tenPhuHuynh: "Hoàng Văn E",
      soDienThoaiPH: "0956789012",
      diaChi: "Thanh Hóa",
    },
  ]);

  for (const lop of lops) {
    const siSo = students.filter(
      (s) => String(s.lop) === String(lop._id)
    ).length;
    await Lop.findByIdAndUpdate(lop._id, { siSo });
  }

  const sampleScores = [
    { hs: 0, mon: 0, mieng: 8, p15: 9, tiet: 8.5, thi: 9 },
    { hs: 0, mon: 1, mieng: 7, p15: 8, tiet: 7.5, thi: 8 },
    { hs: 0, mon: 2, mieng: 9, p15: 8.5, tiet: 9, thi: 8.5 },
    { hs: 1, mon: 0, mieng: 7.5, p15: 8, tiet: 7, thi: 8 },
    { hs: 1, mon: 1, mieng: 8, p15: 7, tiet: 8, thi: 7.5 },
    { hs: 2, mon: 0, mieng: 9, p15: 9, tiet: 8.5, thi: 9 },
    { hs: 3, mon: 0, mieng: 8, p15: 7.5, tiet: 8, thi: 8.5 },
    { hs: 4, mon: 0, mieng: 9.5, p15: 9, tiet: 9, thi: 9.5 },
  ];

  for (const s of sampleScores) {
    const diemMieng = s.mieng;
    const diem15p = s.p15;
    const diem1Tiet = s.tiet;
    const diemThi = s.thi;
    const diemTB = Number(
      ((diemMieng + diem15p + diem1Tiet * 2 + diemThi * 3) / 7).toFixed(2)
    );
    await KetQua.create({
      hocSinh: students[s.hs]._id,
      monHoc: monHocs[s.mon]._id,
      namHoc,
      hocKy: 1,
      diemMieng,
      diem15p,
      diem1Tiet,
      diemThi,
      diemTB,
    });
  }

  console.log("Seed hoàn tất!");
  console.log("Admin: admin@thpt.local / admin123");
  console.log("Giáo viên: giaovien@thpt.local / giaovien123");
  console.log("Tra cứu thử mã HS: HS10001");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
