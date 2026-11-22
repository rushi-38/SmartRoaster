require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const employees = [
  "Rahul Sharma",
  "Priya Patel",
  "Amit Verma",
  "Sneha Joshi",
  "Karan Mehta",
  "Neha Singh",
  "Arjun Rao",
  "Pooja Shah",
  "Rohit Kumar",
  "Anjali Desai",
  "Vikram Shah",
  "Sahil Mehta",
  "Riya Kapoor",
  "Aditya Nair",
  "Isha Gupta",
  "Manish Yadav",
  "Kavya Reddy",
  "Varun Malhotra",
  "Meera Iyer",
  "Akash Mishra",
  "Tanvi Kulkarni",
  "Nikhil Jain",
  "Simran Kaur",
  "Harsh Agarwal",
  "Divya Menon",
  "Siddharth Rao",
  "Aarav Shah",
  "Ananya Das",
  "Yash Thakur",
  "Shreya Patil"
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected!");

    // Create or update Admin
    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: process.env.ADMIN_NAME || "System Admin",
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD,
        role: "Admin"
      });
    } else {
      admin.name = process.env.ADMIN_NAME || "System Admin";
      admin.password = process.env.ADMIN_PASSWORD;
      admin.role = "Admin";
    }

    await admin.save();
    console.log("Admin account created/updated!");

    // Create or update 30 Employees
    for (let i = 0; i < employees.length; i++) {
      const email = `employee${String(i + 1).padStart(2, "0")}@smartroster.com`;

      let employee = await User.findOne({ email });

      if (!employee) {
        employee = new User({
          name: employees[i],
          email,
          password: "Employee@123",
          role: "Employee"
        });
      } else {
        employee.name = employees[i];
        employee.password = "Employee@123";
        employee.role = "Employee";
      }

      await employee.save();

      console.log(`Employee ${i + 1} created/updated: ${email}`);
    }

    console.log("\nAll accounts created/updated successfully!");
    console.log("Total: 1 Admin + 30 Employees");

  } catch (error) {
    console.error("Seeding error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedUsers();