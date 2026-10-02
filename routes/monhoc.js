const express = require("express");
const router = express.Router();
const MonHoc = require("../models/MonHoc");
const { getUser, requireStaff, requireAdmin } = require("../middleware/getUser");

// GET /api/monhoc
router.get("/", getUser, requireStaff, async (req, res) => {
  try {
    const list = await MonHoc.find().sort({ tenMon: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// GET /api/monhoc/:id
router.get("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const mon = await MonHoc.findById(req.params.id);
    if (!mon) return res.status(404).json({ error: "Không tìm thấy môn học" });
    res.json(mon);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// POST /api/monhoc
router.post("/", getUser, requireAdmin, async (req, res) => {
  try {
    const { maMon, tenMon, soTiet, heSo, moTa } = req.body;
    if (!maMon || !tenMon) {
      return res.status(400).json({ error: "Thiếu mã môn hoặc tên môn" });
    }
    const exists = await MonHoc.findOne({ maMon });
    if (exists) return res.status(400).json({ error: "Mã môn đã tồn tại" });
    const mon = await MonHoc.create({
      maMon,
      tenMon,
      soTiet: soTiet || 0,
      heSo: heSo || 1,
      moTa: moTa || "",
    });
    res.json({ success: true, monHoc: mon });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// PUT /api/monhoc/:id
router.put("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update._id;
    const mon = await MonHoc.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!mon) return res.status(404).json({ error: "Không tìm thấy môn học" });
    res.json({ success: true, monHoc: mon });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// DELETE /api/monhoc/:id
router.delete("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const mon = await MonHoc.findByIdAndDelete(req.params.id);
    if (!mon) return res.status(404).json({ error: "Không tìm thấy môn học" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
