const express = require("express");
const router = express.Router();
const GiaoVien = require("../models/GiaoVien");
const { getUser, requireStaff, requireAdmin } = require("../middleware/getUser");

// GET /api/giaovien
router.get("/", getUser, requireStaff, async (req, res) => {
  try {
    const list = await GiaoVien.find()
      .populate("monDay", "tenMon maMon")
      .sort({ maGV: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// GET /api/giaovien/:id
router.get("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const gv = await GiaoVien.findById(req.params.id).populate(
      "monDay",
      "tenMon maMon"
    );
    if (!gv) return res.status(404).json({ error: "Không tìm thấy giáo viên" });
    res.json(gv);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// POST /api/giaovien
router.post("/", getUser, requireAdmin, async (req, res) => {
  try {
    const {
      maGV,
      hoTen,
      email,
      soDienThoai,
      monDay,
      ngaySinh,
      gioiTinh,
      diaChi,
    } = req.body;
    if (!maGV || !hoTen || !email) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }
    const exists = await GiaoVien.findOne({ $or: [{ maGV }, { email }] });
    if (exists) {
      return res.status(400).json({ error: "Mã GV hoặc email đã tồn tại" });
    }
    const gv = await GiaoVien.create({
      maGV,
      hoTen,
      email,
      soDienThoai: soDienThoai || "",
      monDay: monDay || [],
      ngaySinh: ngaySinh || undefined,
      gioiTinh: gioiTinh || "",
      diaChi: diaChi || "",
    });
    const populated = await GiaoVien.findById(gv._id).populate(
      "monDay",
      "tenMon maMon"
    );
    res.json({ success: true, giaoVien: populated });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// PUT /api/giaovien/:id
router.put("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update._id;
    const gv = await GiaoVien.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).populate("monDay", "tenMon maMon");
    if (!gv) return res.status(404).json({ error: "Không tìm thấy giáo viên" });
    res.json({ success: true, giaoVien: gv });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// DELETE /api/giaovien/:id
router.delete("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const gv = await GiaoVien.findByIdAndDelete(req.params.id);
    if (!gv) return res.status(404).json({ error: "Không tìm thấy giáo viên" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
