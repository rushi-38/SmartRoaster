const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const podRoutes = require("./routes/podRoutes");
const connectDB = require("./config/db");
const processRoutes = require("./routes/processRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const brandRoutes = require("./routes/brandRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const rosterRoutes = require("./routes/rosterRoutes");
const workingRuleRoutes = require("./routes/workingRuleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
// Import routes
const employeeRoutes = require("./routes/employeeRoutes");

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test API
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Roster Backend Connected Successfully!",
  });
});

// Employee Routes
app.use("/api/auth", authRoutes);

app.use("/api", authMiddleware);

app.use("/api/employees", employeeRoutes);
app.use("/api/pods", podRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/working-rules", workingRuleRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/rosters", rosterRoutes);
app.use("/api/reports", reportRoutes);
// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();