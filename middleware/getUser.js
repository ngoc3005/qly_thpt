const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const User = require("../models/User");

const getUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(401)
      .send({ error: "Vui lòng đăng nhập bằng token hợp lệ" });
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    const user = await User.findById(data.user).select("-password");
    if (!user) {
      return res.status(401).send({ error: "Người dùng không tồn tại" });
    }
    req.userInfo = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ error: "Vui lòng đăng nhập bằng token hợp lệ" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.userInfo || req.userInfo.role !== "admin") {
    return res.status(403).json({ error: "Chỉ quản trị viên mới được phép" });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (
    !req.userInfo ||
    !["admin", "giaovien"].includes(req.userInfo.role)
  ) {
    return res.status(403).json({ error: "Không có quyền truy cập" });
  }
  next();
};

module.exports = { getUser, requireAdmin, requireStaff };
