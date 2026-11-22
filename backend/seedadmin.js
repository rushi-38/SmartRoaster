require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL;

    if (!mongoURI) {
      throw new Error("MongoDB connection string is missing in .env");
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    }

    await mongoose.connect(mongoURI);

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL.toLowerCase().trim(),
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME || "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "Admin",
    });

    console.log("Admin account created successfully.");

  } catch (error) {
    console.error("Admin creation error:", error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();