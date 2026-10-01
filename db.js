const mongoose = require("mongoose");
require('dotenv').config();

const uri = process.env.DB_URI;
console.log(uri);


async function connectToMongo() {
    await mongoose.connect(uri)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error.message);
    });
}

module.exports = connectToMongo;