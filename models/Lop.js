const mongoose = require('mongoose');

const lopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  siSo: {
    type: Number,
    default: 0,
  },
});

const Lop = mongoose.model('lop', lopSchema);
module.exports = Lop;
