const express = require('express');
const router = express.Router();
const HocSinh = require('../models/HocSinh');
const Lop = require('../models/Lop');
const { validationResult } = require('express-validator');

// Thêm học sinh vào lớp POST "/api/hocsinh/createHocSinh/:lopId"
router.post('/createHocSinh/:lopId', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array()[0].msg });
  }

  try {
    const lopId = req.params.lopId;
    const { maHS, hoTen, ghiChu, namSinh, dangHoc } = req.body;

    const lop = await Lop.findById(lopId);
    if (!lop) {
      return res.status(404).json({ error: 'Không tìm thấy lớp' });
    }

    let hocSinh = await HocSinh.findOne({ maHS, lop: lopId });
    if (hocSinh) {
      return res.status(400).json({ error: 'Mã học sinh này đã có trong lớp' });
    }

    hocSinh = await HocSinh.create({
      lop: lopId,
      maHS,
      hoTen,
      ghiChu,
      namSinh,
      dangHoc
    });

    lop.siSo += 1;
    await lop.save();

    res.json({ message: 'Đã thêm học sinh', hocSinh });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// Học sinh của một lớp
router.get('/getHocSinh/:lopId', async (req, res) => {
  try {
    const lopId = req.params.lopId;
    const hocSinh = await HocSinh.find({ lop: lopId }).populate('lop');
    res.json(hocSinh);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Học sinh đang học GET "/api/hocsinh/getAllHocSinh"
router.get('/getAllHocSinh', async (req, res) => {
  try {
    const hocSinh = await HocSinh.find({ dangHoc: true }).populate('lop');
    res.json(hocSinh);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hocsinh/:id', async (req, res) => {
  try {
    const hocSinhId = req.params.id;
    const hocSinh = await HocSinh.findById(hocSinhId);
    if (!hocSinh) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    res.json(hocSinh);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tìm học sinh đang học theo năm sinh hoặc họ tên
router.get('/search', async (req, res) => {
  try {
    const { tuNam, denNam, tuKhoa } = req.query;

    const searchCriteria = {
      dangHoc: true,
    };

    if (tuKhoa) {
      searchCriteria.hoTen = { $regex: tuKhoa, $options: 'i' };
    }

    if (tuNam) {
      if (!searchCriteria.namSinh) {
        searchCriteria.namSinh = {};
      }
      searchCriteria.namSinh.$gte = parseInt(tuNam);
    }

    if (denNam) {
      if (!searchCriteria.namSinh) {
        searchCriteria.namSinh = {};
      }
      searchCriteria.namSinh.$lte = parseInt(denNam);
    }

    const hocSinh = await HocSinh.find(searchCriteria).populate('lop');

    res.json(hocSinh);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
