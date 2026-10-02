const express = require("express");
const router = express.Router();
const HocSinh = require("../models/HocSinh");
const Lop = require("../models/Lop");
const { getUser, requireStaff, requireAdmin } = require("../middleware/getUser");

async function refreshSiSo(lopId) {
  if (!lopId) return;
  const count = await HocSinh.countDocuments({
    lop: lopId,
    trangThai: "dang_hoc",
  });
  await Lop.findByIdAndUpdate(lopId, { siSo: count });
}

// GET /api/hocsinh?lop=&q=
router.get("/", getUser, requireStaff, async (req, res) => {
  try {
    const filter = {};
    if (req.query.lop) filter.lop = req.query.lop;
    if (req.query.trangThai) filter.trangThai = req.query.trangThai;
    if (req.query.q) {
      filter.$or = [
        { hoTen: { $regex: req.query.q, $options: "i" } },
        { maHS: { $regex: req.query.q, $options: "i" } },
      ];
    }
    const list = await HocSinh.find(filter)
      .populate("lop", "tenLop khoi namHoc")
      .sort({ maHS: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// GET /api/hocsinh/:id
router.get("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const hs = await HocSinh.findById(req.params.id).populate(
      "lop",
      "tenLop khoi namHoc"
    );
    if (!hs) return res.status(404).json({ error: "Không tìm thấy học sinh" });
    res.json(hs);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// POST /api/hocsinh
router.post("/", getUser, requireAdmin, async (req, res) => {
  try {
    const {
      maHS,
      hoTen,
      ngaySinh,
      gioiTinh,
      lop,
      diaChi,
      soDienThoaiPH,
      tenPhuHuynh,
      emailPH,
      trangThai,
    } = req.body;
    if (!maHS || !hoTen || !ngaySinh || !gioiTinh || !lop) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }
    const exists = await HocSinh.findOne({ maHS });
    if (exists) {
      return res.status(400).json({ error: "Mã học sinh đã tồn tại" });
    }
    const lopDoc = await Lop.findById(lop);
    if (!lopDoc) return res.status(400).json({ error: "Lớp không hợp lệ" });

    const hs = await HocSinh.create({
      maHS,
      hoTen,
      ngaySinh,
      gioiTinh,
      lop,
      diaChi: diaChi || "",
      soDienThoaiPH: soDienThoaiPH || "",
      tenPhuHuynh: tenPhuHuynh || "",
      emailPH: emailPH || "",
      trangThai: trangThai || "dang_hoc",
    });
    await refreshSiSo(lop);
    const populated = await HocSinh.findById(hs._id).populate(
      "lop",
      "tenLop khoi namHoc"
    );
    res.json({ success: true, hocSinh: populated });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// PUT /api/hocsinh/:id
router.put("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const old = await HocSinh.findById(req.params.id);
    if (!old) return res.status(404).json({ error: "Không tìm thấy học sinh" });

    const update = { ...req.body };
    delete update._id;
    if (update.maHS && update.maHS !== old.maHS) {
      const dup = await HocSinh.findOne({ maHS: update.maHS });
      if (dup) return res.status(400).json({ error: "Mã học sinh đã tồn tại" });
    }

    const hs = await HocSinh.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).populate("lop", "tenLop khoi namHoc");

    await refreshSiSo(old.lop);
    if (update.lop && String(update.lop) !== String(old.lop)) {
      await refreshSiSo(update.lop);
    } else {
      await refreshSiSo(hs.lop);
    }
    res.json({ success: true, hocSinh: hs });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// DELETE /api/hocsinh/:id
router.delete("/:id", getUser, requireAdmin, async (req, res) => {
  try {
    const hs = await HocSinh.findByIdAndDelete(req.params.id);
    if (!hs) return res.status(404).json({ error: "Không tìm thấy học sinh" });
    await refreshSiSo(hs.lop);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
