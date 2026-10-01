const express = require("express");
const router = express.Router();
const Lop = require("../models/Lop");
const { body, validationResult } = require('express-validator');

// Tạo lớp POST "/api/lop/createLop"
router.post('/createLop', [
  body('name', 'Tên lớp là bắt buộc').notEmpty(),
  body('email', 'Nhập email giáo viên chủ nhiệm hợp lệ').isEmail(),
  body('address', 'Phòng học là bắt buộc').notEmpty(),
  body('contact', 'Số điện thoại là bắt buộc').notEmpty()
], async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array()[0].msg });
  }
  try {
    let lop = await Lop.findOne({ email: req.body.email });
    if (lop) {
      return res.status(400).json({ success, error: "Đã có lớp dùng email giáo viên chủ nhiệm này" });
    }
    lop = await Lop.create({
      name: req.body.name,
      description: req.body.description,
      email: req.body.email,
      address: req.body.address,
      contact: req.body.contact,
      image: req.body.image || ''
    });
    res.json({ success: true, lop, message: "Đã thêm lớp" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Danh sách lớp GET "/api/lop/getLops"
router.get('/getLops', async (req, res) => {
  try {
    const lops = await Lop.find();
    res.send(lops);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lớp có sĩ số cao nhất
router.get('/popular', async (req, res) => {
  try {
    const lopDong = await Lop.find({ siSo: { $gt: 0 } }).sort({ siSo: -1 });
    res.json(lopDong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
