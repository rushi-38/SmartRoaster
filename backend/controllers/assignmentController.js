const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const Employee = require("../models/Employee");
const Brand = require("../models/Brand");
const Process = require("../models/Process");
const Pod = require("../models/Pod");

// Common population fields
const populateAssignment = (query) =>
  query
    .populate("employee", "name employeeCode email pod")
    .populate("brand", "name code")
    .populate("process", "name code category")
    .populate("pod", "name code");

// Validate employee, brand, process and pod relationships
const validateAssignment = async (employeeId, brandId, processId, podId) => {
  const ids = [employeeId, brandId, processId, podId];

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    return { valid: false, message: "Invalid selection provided" };
  }

  const [employee, brand, process, pod] = await Promise.all([
    Employee.findById(employeeId),
    Brand.findById(brandId),
    Process.findById(processId),
    Pod.findById(podId),
  ]);

  if (!employee) {
    return { valid: false, message: "Employee not found" };
  }

  if (!brand) {
    return { valid: false, message: "Brand not found" };
  }

  if (!process) {
    return { valid: false, message: "Process not found" };
  }

  if (!pod) {
    return { valid: false, message: "Pod not found" };
  }

  if (employee.status !== "Active") {
    return { valid: false, message: "Employee must be active" };
  }

  if (brand.status !== "Active") {
    return { valid: false, message: "Brand must be active" };
  }

  if (process.status !== "Active") {
    return { valid: false, message: "Process must be active" };
  }

  if (pod.status !== "Active") {
    return { valid: false, message: "Pod must be active" };
  }

  if (process.brand.toString() !== brandId.toString()) {
    return {
      valid: false,
      message: "Selected process does not belong to the selected brand",
    };
  }

  if (!employee.pod || employee.pod.toString() !== podId.toString()) {
    return {
      valid: false,
      message: "Selected pod does not match the employee's assigned pod",
    };
  }

  return { valid: true };
};

// GET all assignments
const getAssignments = async (req, res) => {
  try {
    const assignments = await populateAssignment(
      Assignment.find().sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET single assignment
const getAssignmentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await populateAssignment(
      Assignment.findById(req.params.id)
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE assignment
const createAssignment = async (req, res) => {
  try {
    const { employee, brand, process, pod, assignedDate, status } = req.body;

    if (!employee || !brand || !process || !pod) {
      return res.status(400).json({
        success: false,
        message: "Employee, brand, process and pod are required",
      });
    }

    const validation = await validateAssignment(
      employee,
      brand,
      process,
      pod
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const existing = await Assignment.findOne({
      employee,
      brand,
      process,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This employee is already assigned to this brand and process",
      });
    }

    const assignment = await Assignment.create({
      employee,
      brand,
      process,
      pod,
      assignedDate: assignedDate || Date.now(),
      status: status || "Active",
    });

    const populatedAssignment = await populateAssignment(
      Assignment.findById(assignment._id)
    );

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE assignment
const updateAssignment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const employee = req.body.employee ?? assignment.employee;
    const brand = req.body.brand ?? assignment.brand;
    const process = req.body.process ?? assignment.process;
    const pod = req.body.pod ?? assignment.pod;

    const validation = await validateAssignment(
      employee,
      brand,
      process,
      pod
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const duplicate = await Assignment.findOne({
      _id: { $ne: assignment._id },
      employee,
      brand,
      process,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This employee is already assigned to this brand and process",
      });
    }

    assignment.employee = employee;
    assignment.brand = brand;
    assignment.process = process;
    assignment.pod = pod;

    if (req.body.assignedDate !== undefined) {
      assignment.assignedDate = req.body.assignedDate;
    }

    if (req.body.status !== undefined) {
      assignment.status = req.body.status;
    }

    await assignment.save();

    const updatedAssignment = await populateAssignment(
      Assignment.findById(assignment._id)
    );

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE assignment
const deleteAssignment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};