const mongoose = require('mongoose');

const MonHocSchema = new mongoose.Schema({
    name: String,
    description: String,
    heSo: Number,
  });

  const MonHoc = mongoose.model('monhoc', MonHocSchema);

  module.exports = MonHoc;
