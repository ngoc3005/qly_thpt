const express = require("express");
const router = express.Router();
const Lop = require("../models/Lop");
const HocSinh = require("../models/HocSinh");
const MonHoc = require("../models/MonHoc");
const GiaoVien = require("../models/GiaoVien");
const { getUser, requireStaff } = require("../middleware/getUser");

router.get("/stats", getUser, requireStaff, async (req, res) => {
  try {
    const [lop, hocSinh, monHoc, giaoVien, dangHoc] = await Promise.all([
      Lop.countDocuments(),
      HocSinh.countDocuments(),
      MonHoc.countDocuments(),
      GiaoVien.countDocuments(),
      HocSinh.countDocuments({ trangThai: "dang_hoc" }),
    ]);
    res.json({ lop, hocSinh, monHoc, giaoVien, dangHoc });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
