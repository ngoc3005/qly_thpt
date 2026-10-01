const express = require('express');
const connectToMongo = require('./db');
const cors = require('cors');
const app = express();
const path = require("path");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const capNhatHocKyTask = require('./capNhatHocKy');
const port = process.env.PORT || 5000;
connectToMongo();
capNhatHocKyTask();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/lop", require("./routes/lop"));
app.use("/api/hocsinh", require("./routes/hocsinh"));
app.use("/api/ketqua", require("./routes/ketqua"));
app.use("/api/monhoc", require("./routes/monhoc"));

app.use(express.static("./frontend/build"));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"))
});

app.listen(port, () => {
    console.log(`App is listening at ${port}`);
})
