const express = require("express");
const router = express.Router();
const getUser = require("../middleware/getUser");
const KetQua = require("../models/KetQua");
const HocSinh = require("../models/HocSinh");
const MonHoc = require("../models/MonHoc");
const Lop = require("../models/Lop");
const fs = require('fs');
const PDFDocument = require('pdfkit');

const fontTiengViet = () => {
  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ];
  return candidates.find((p) => fs.existsSync(p));
};

// POST lưu kết quả học kỳ = (api/ketqua/createKetQua)
router.post('/createKetQua', getUser, async (req, res) => {
  const { hocSinhId, ngayBatDau, ngayKetThuc, monHoc, lopId, diemTB } = req.body;
  const userId = req.user;
  let hocSinh;

  try {
    hocSinh = await HocSinh.findById(hocSinhId);
    const lop = await Lop.findById(lopId);
    if (!lop) {
      return res.status(404).json({ error: 'Không tìm thấy lớp' });
    }
    if (!hocSinh) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }

    if (!hocSinh.dangHoc) {
      return res.status(400).json({ error: 'Học sinh đang có học kỳ chưa kết thúc' });
    }

    const diem = Number(diemTB);
    if (Number.isNaN(diem) || diem < 0 || diem > 10) {
      return res.status(400).json({ error: 'Điểm trung bình phải từ 0 đến 10' });
    }

    hocSinh.dangHoc = false;
    await hocSinh.save();

    const ketQua = new KetQua({
      user: userId,
      hocSinh: hocSinhId,
      lop: lopId,
      ngayBatDau,
      ngayKetThuc,
      monHoc: monHoc,
      diemTB: diem,
    });

    await ketQua.save();

    res.json(ketQua);
  } catch (error) {
    console.error(error);
    if (hocSinh) {
      hocSinh.dangHoc = true;
      await hocSinh.save();
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET kết quả do giáo viên đang đăng nhập nhập
router.get("/getallketqua", getUser, async (req, res) => {
  try {
    const userId = req.user;
    const ketQua = await KetQua.find({ user: userId }).populate('lop').populate('hocSinh');
    res.json(ketQua);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/ketqua/:id", getUser, async (req, res) => {
  try {
    const ketQuaId = req.params.id;

    const ketQua = await KetQua.findById(ketQuaId);

    if (!ketQua) {
      return res.status(404).json({ error: 'Không tìm thấy kết quả' });
    }

    res.json(ketQua);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/ketqua/:id', getUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { ngayBatDau, ngayKetThuc, monHoc, diemTB } = req.body;
    const ketQua = await KetQua.findOneAndUpdate(
      { _id: id, user: req.user },
      { ngayBatDau, ngayKetThuc, monHoc, diemTB },
      { new: true }
    );

    if (!ketQua) {
      return res.status(404).json({ error: 'Không tìm thấy kết quả' });
    }

    res.json(ketQua);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/ketqua/:id', getUser, async (req, res) => {
  try {
    const { id } = req.params;

    const ketQua = await KetQua.findOneAndDelete({ _id: id, user: req.user });

    if (!ketQua) {
      return res.status(404).json({ error: 'Không tìm thấy kết quả' });
    }

    const hocSinh = await HocSinh.findById(ketQua.hocSinh);
    if (hocSinh) {
      hocSinh.dangHoc = true;
      await hocSinh.save();
    }

    res.json({ success: true, message: 'Đã hủy kết quả học kỳ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET phiếu kết quả PDF = api/ketqua/phieu/:id
router.get('/phieu/:id', getUser, async (req, res) => {
  try {
    const ketQuaIds = req.params.id.split(',');

    const danhSach = await KetQua.find({ _id: { $in: ketQuaIds } }).populate('user').populate('hocSinh').populate('lop');

    if (danhSach.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy kết quả' });
    }

    const giaoVien = danhSach[0].user.name;
    const formatName = giaoVien.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    const email = danhSach[0].user.email;

    const doc = new PDFDocument();
    const font = fontTiengViet();
    if (font) {
      doc.font(font);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="phieu-ket-qua.pdf"');

    doc.pipe(res);

    const logoPath = './logo.png';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 80 });
    }
    doc.fontSize(22).text('Quản lý học sinh THPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Phiếu kết quả học kỳ', { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(13).text(`Giáo viên nhập: ${formatName}`, { align: 'right' });
    doc.fontSize(13).text(`Email: ${email}`, { align: 'right' });

    doc.moveDown();

    for (const ketQua of danhSach) {
      doc.fontSize(12).text(`Lớp: ${ketQua.lop.name}`);
      doc.fontSize(12).text(`Mã phiếu: ${ketQua._id}`);
      doc.text(`Học sinh: ${ketQua.hocSinh.hoTen} (${ketQua.hocSinh.maHS})`);

      const options = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      };
      const batDau = ketQua.ngayBatDau.toLocaleDateString('vi-VN', options);
      const ketThuc = ketQua.ngayKetThuc.toLocaleDateString('vi-VN', options);
      doc.text(`Bắt đầu: ${batDau}`);
      doc.text(`Kết thúc: ${ketThuc}`);
      doc.text(`Điểm trung bình: ${ketQua.diemTB}`);

      doc.fontSize(12).text('Môn học:');
      for (const tenMon of ketQua.monHoc) {
        const mon = await MonHoc.findOne({ name: tenMon });
        if (mon) {
          doc.text(`${mon.name} (hệ số ${mon.heSo})`);
        } else {
          doc.text(tenMon);
        }
      }

      doc.moveDown(0.5);
    }

    doc.end();
  } catch (error) {
    console.error('Error fetching grade data:', error);
    res.status(500).send('Error generating transcript');
  }
});

module.exports = router;
