const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.development" });

// const envPath = `../env/.env.development`;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}...`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw new Error("Database connection error");
  }
};

module.exports = connectDB;
