const express = require("express");
const router = express.Router();
const Lop = require("../models/Lop");
const HocSinh = require("../models/HocSinh");
const { getUser, requireStaff, requireAdmin } = require("../middleware/getUser");

// GET /api/lop — danh sách lớp
router.get("/", getUser, requireStaff, async (req, res) => {
  try {
    const lops = await Lop.find()
      .populate("gvcn", "hoTen maGV email")
      .sort({ khoi: 1, tenLop: 1 });
    res.json(lops);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// GET /api/lop/:id
router.get("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const lop = await Lop.findById(req.params.id).populate(
      "gvcn",
      "hoTen maGV email soDienThoai"
    );
    if (!lop) return res.status(404).json({ error: "Không tìm thấy lớp" });
    res.json(lop);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// POST /api/lop
router.post("/", getUser, requireAdmin, async (req, res) => {
  try {
    const { tenLop, khoi, namHoc, gvcn, phongHoc, moTa } = req.body;
    if (!tenLop || !khoi || !namHoc) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }
    const exists = await Lop.findOne({ tenLop });
    if (exists) {
      return res.status(400).json({ error: "Tên lớp đã tồn tại" });
    }
    const lop = await Lop.create({
      tenLop,
      khoi,
      namHoc,
      gvcn: gvcn || null,
      phongHoc: phongHoc || "",
      moTa: moTa || "",
    });
    res.json({ success: true, lop });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// PUT /api/lop/:id
router.put("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update._id;
    delete update.siSo;
    const lop = await Lop.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).populate("gvcn", "hoTen maGV");
    if (!lop) return res.status(404).json({ error: "Không tìm thấy lớp" });
    res.json({ success: true, lop });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// DELETE /api/lop/:id
router.delete("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const hsCount = await HocSinh.countDocuments({ lop: req.params.id });
    if (hsCount > 0) {
      return res
        .status(400)
        .json({ error: `Lớp còn ${hsCount} học sinh, không thể xóa` });
    }
    const lop = await Lop.findByIdAndDelete(req.params.id);
    if (!lop) return res.status(404).json({ error: "Không tìm thấy lớp" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
