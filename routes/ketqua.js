const express = require("express");
const router = express.Router();
const KetQua = require("../models/KetQua");
const HocSinh = require("../models/HocSinh");
const { getUser, requireStaff } = require("../middleware/getUser");

function calcTB(doc) {
  const { diemMieng, diem15p, diem1Tiet, diemThi } = doc;
  if (
    diemMieng != null &&
    diem15p != null &&
    diem1Tiet != null &&
    diemThi != null
  ) {
    return Number(
      ((diemMieng + diem15p + diem1Tiet * 2 + diemThi * 3) / 7).toFixed(2)
    );
  }
  const scores = [diemMieng, diem15p, diem1Tiet, diemThi].filter(
    (d) => d !== null && d !== undefined && d !== ""
  );
  if (!scores.length) return null;
  return Number(
    (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(2)
  );
}

// Public: tra cứu điểm phụ huynh — POST /api/ketqua/tracuu
router.post("/tracuu", async (req, res) => {
  try {
    const { maHS, namHoc, hocKy } = req.body;
    if (!maHS) {
      return res.status(400).json({ error: "Vui lòng nhập mã học sinh" });
    }
    const escaped = maHS.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hs = await HocSinh.findOne({
      maHS: { $regex: new RegExp(`^${escaped}$`, "i") },
    })
      .populate("lop", "tenLop khoi namHoc")
      .select("-emailPH");
    if (!hs) {
      return res.status(404).json({ error: "Không tìm thấy học sinh" });
    }
    const filter = { hocSinh: hs._id };
    if (namHoc) filter.namHoc = namHoc;
    if (hocKy) filter.hocKy = Number(hocKy);

    const ketQua = await KetQua.find(filter)
      .populate("monHoc", "tenMon maMon heSo")
      .sort({ hocKy: 1 });

    res.json({
      success: true,
      hocSinh: {
        maHS: hs.maHS,
        hoTen: hs.hoTen,
        ngaySinh: hs.ngaySinh,
        gioiTinh: hs.gioiTinh,
        lop: hs.lop,
        trangThai: hs.trangThai,
      },
      ketQua,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// GET /api/ketqua?hocSinh=&lop=&monHoc=&namHoc=&hocKy=
router.get("/", getUser, requireStaff, async (req, res) => {
  try {
    const filter = {};
    if (req.query.hocSinh) filter.hocSinh = req.query.hocSinh;
    if (req.query.monHoc) filter.monHoc = req.query.monHoc;
    if (req.query.namHoc) filter.namHoc = req.query.namHoc;
    if (req.query.hocKy) filter.hocKy = Number(req.query.hocKy);

    if (req.query.lop) {
      const students = await HocSinh.find({ lop: req.query.lop }).select("_id");
      filter.hocSinh = { $in: students.map((s) => s._id) };
    }

    const list = await KetQua.find(filter)
      .populate("hocSinh", "maHS hoTen lop")
      .populate({
        path: "hocSinh",
        populate: { path: "lop", select: "tenLop" },
      })
      .populate("monHoc", "tenMon maMon")
      .sort({ namHoc: -1, hocKy: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// POST /api/ketqua — tạo hoặc cập nhật điểm
router.post("/", getUser, requireStaff, async (req, res) => {
  try {
    const {
      hocSinh,
      monHoc,
      namHoc,
      hocKy,
      diemMieng,
      diem15p,
      diem1Tiet,
      diemThi,
      ghiChu,
    } = req.body;
    if (!hocSinh || !monHoc || !namHoc || !hocKy) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const payload = {
      diemMieng: diemMieng === "" || diemMieng == null ? null : Number(diemMieng),
      diem15p: diem15p === "" || diem15p == null ? null : Number(diem15p),
      diem1Tiet: diem1Tiet === "" || diem1Tiet == null ? null : Number(diem1Tiet),
      diemThi: diemThi === "" || diemThi == null ? null : Number(diemThi),
      ghiChu: ghiChu || "",
    };
    payload.diemTB = calcTB(payload);

    let ketQua = await KetQua.findOneAndUpdate(
      { hocSinh, monHoc, namHoc, hocKy: Number(hocKy) },
      { $set: payload, $setOnInsert: { hocSinh, monHoc, namHoc, hocKy: Number(hocKy) } },
      { new: true, upsert: true, runValidators: true }
    )
      .populate("hocSinh", "maHS hoTen")
      .populate("monHoc", "tenMon maMon");

    res.json({ success: true, ketQua });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Bản ghi điểm đã tồn tại" });
    }
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// PUT /api/ketqua/:id
router.put("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const fields = ["diemMieng", "diem15p", "diem1Tiet", "diemThi", "ghiChu", "namHoc", "hocKy"];
    const update = {};
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (["diemMieng", "diem15p", "diem1Tiet", "diemThi"].includes(f)) {
          update[f] =
            req.body[f] === "" || req.body[f] == null
              ? null
              : Number(req.body[f]);
        } else {
          update[f] = req.body[f];
        }
      }
    });

    const current = await KetQua.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Không tìm thấy kết quả" });

    const merged = { ...current.toObject(), ...update };
    update.diemTB = calcTB(merged);

    const ketQua = await KetQua.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("hocSinh", "maHS hoTen")
      .populate("monHoc", "tenMon maMon");

    res.json({ success: true, ketQua });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi máy chủ" });
  }
});

// DELETE /api/ketqua/:id
router.delete("/:id", getUser, requireStaff, async (req, res) => {
  try {
    const ketQua = await KetQua.findByIdAndDelete(req.params.id);
    if (!ketQua) return res.status(404).json({ error: "Không tìm thấy kết quả" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
