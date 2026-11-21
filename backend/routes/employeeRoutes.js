const express = require("express");

const router = express.Router();

const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

// Get all employees
router.get("/", getEmployees);

// Get one employee
router.get("/:id", getEmployeeById);

// Create employee
router.post("/", createEmployee);

// Update employee
router.put("/:id", updateEmployee);

// Deactivate employee
router.delete("/:id", deleteEmployee);

module.exports = router;