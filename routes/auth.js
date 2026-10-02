const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const { getUser, requireAdmin } = require("../middleware/getUser");

// Tạo tài khoản (chỉ admin) — POST /api/auth/createuser
router.post(
  "/createuser",
  getUser,
  requireAdmin,
  [
    body("email", "Email không hợp lệ").isEmail(),
    body("password", "Mật khẩu tối thiểu 6 ký tự").isLength({ min: 6 }),
    body("name", "Họ tên không được trống").notEmpty(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array()[0].msg });
    }
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success, error: "Email này đã được sử dụng" });
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
        role: req.body.role === "admin" ? "admin" : "giaovien",
        phone: req.body.phone || "",
      });
      success = true;
      res.json({
        success,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Lỗi máy chủ" });
    }
  }
);

// Đăng nhập — POST /api/auth/login
router.post(
  "/login",
  [
    body("email", "Email không hợp lệ").isEmail(),
    body("password", "Mật khẩu không được trống").exists(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array()[0].msg });
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success, error: "Email hoặc mật khẩu không đúng" });
      }
      const passCompare = await bcrypt.compare(password, user.password);
      if (!passCompare) {
        return res
          .status(400)
          .json({ success, error: "Email hoặc mật khẩu không đúng" });
      }
      const data = { user: user._id };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({
        success,
        authtoken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Lỗi máy chủ" });
    }
  }
);

// Lấy thông tin user hiện tại — POST /api/auth/getuser
router.post("/getuser", getUser, async (req, res) => {
  try {
    res.json(req.userInfo);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router;
