const mongoose = require("mongoose");
require("dotenv").config();

async function startMemoryMongo() {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("quanly_thpt");
  global.__MONGOD__ = mongod;
  console.log("Đang dùng MongoDB trong bộ nhớ (demo):", uri);
  return uri;
}

async function connectToMongo() {
  let uri = process.env.MONGODB_URI || process.env.DB_URI;
  const useMemory =
    process.env.USE_MEMORY_DB === "1" ||
    process.env.USE_MEMORY_DB === "true";

  try {
    if (useMemory) {
      uri = await startMemoryMongo();
    }
    if (!uri) {
      throw new Error("Thiếu MONGODB_URI hoặc DB_URI trong file .env");
    }
    console.log("Đang kết nối MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);

    // Tự chuyển sang memory DB nếu kết nối thất bại (tiện chạy local/demo)
    if (!useMemory) {
      console.log("→ Thử MongoDB bộ nhớ tạm để chạy demo...");
      try {
        uri = await startMemoryMongo();
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log("Connected to MongoDB (memory)");
        process.env.__SEEDED_MEMORY__ = "1";
        return true;
      } catch (memErr) {
        console.error("Không khởi tạo được MongoDB memory:", memErr.message);
        return false;
      }
    }
    return false;
  }
}

module.exports = connectToMongo;
