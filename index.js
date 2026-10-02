const express = require("express");
const connectToMongo = require("./db");
const { seedIfEmpty } = require("./seedData");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

app.use("/api/auth", require("./routes/auth"));
app.use("/api/lop", require("./routes/lop"));
app.use("/api/hocsinh", require("./routes/hocsinh"));
app.use("/api/monhoc", require("./routes/monhoc"));
app.use("/api/giaovien", require("./routes/giaovien"));
app.use("/api/ketqua", require("./routes/ketqua"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use(express.static(path.join(__dirname, "frontend", "build")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
});

async function start() {
  const ok = await connectToMongo();
  if (!ok) {
    console.error(
      "Không kết nối được MongoDB. Hãy bật MongoDB local/Docker hoặc đặt DB_URI Atlas trong .env"
    );
    process.exit(1);
  }

  // Auto-seed nếu DB trống (memory hoặc DB mới)
  try {
    await seedIfEmpty();
  } catch (e) {
    console.error("Seed lỗi:", e.message);
  }

  app.listen(port, () => {
    console.log(`Quản lý THPT đang chạy tại http://localhost:${port}`);
  });
}

start();
