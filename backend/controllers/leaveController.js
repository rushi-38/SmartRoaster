const mongoose = require("mongoose");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

// Populate employee details in leave records
const populateLeave = (query) => {
  return query.populate("employee", "name employeeCode email");
};

// GET all leave requests
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await populateLeave(
      Leave.find().sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET a single leave request
exports.getLeaveById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID.",
      });
    }

    const leave = await populateLeave(
      Leave.findById(req.params.id)
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    res.status(200).json({
      success: true,
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE a leave request
exports.createLeave = async (req, res) => {
  try {
    const {
      employee,
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    if (!employee || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Employee, leave type, start date and end date are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    const validTypes = ["Annual", "Sick", "Casual", "Unpaid", "CompOff"];

    if (!validTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type.",
      });
    }

    const employeeExists = await Employee.findById(employee);

    if (!employeeExists || employeeExists.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Employee not found or inactive.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid leave dates.",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    const leave = await Leave.create({
      employee,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
    });

    const populatedLeave = await populateLeave(
      Leave.findById(leave._id)
    );

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      leave: populatedLeave,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE leave status
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID.",
      });
    }

    const validStatuses = ["Pending", "Approved", "Rejected", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status.",
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    leave.status = status;

    if (status === "Approved" || status === "Rejected") {
      // Reviewer tracking can be added when authentication is implemented.
      leave.reviewedAt = new Date();
    } else {
      leave.reviewedAt = null;
      leave.reviewedBy = null;
    }

    await leave.save();

    const updatedLeave = await populateLeave(
      Leave.findById(leave._id)
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave: updatedLeave,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE a leave request
exports.deleteLeave = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID.",
      });
    }

    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave request deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};