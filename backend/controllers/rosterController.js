const mongoose = require("mongoose");

const Roster = require("../models/Roster");
const Employee = require("../models/Employee");
const Assignment = require("../models/Assignment");
const WorkingRule = require("../models/WorkingRule");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// GET ALL ROSTERS
exports.getRosters = async (req, res) => {
  try {
    const rosters = await Roster.find()
      .populate("days.allocations.employee", "name employeeCode")
      .populate("days.allocations.brand", "name code")
      .populate("days.allocations.process", "name code")
      .populate("conflicts.brand", "name code")
      .populate("conflicts.process", "name code")
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: rosters.length,
      rosters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ROSTER BY MONTH AND YEAR
exports.getRosterByMonth = async (req, res) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (!Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(year)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year.",
      });
    }

    const roster = await Roster.findOne({ month, year })
      .populate("days.allocations.employee", "name employeeCode")
      .populate("days.allocations.brand", "name code")
      .populate("days.allocations.process", "name code")
      .populate("conflicts.brand", "name code")
      .populate("conflicts.process", "name code");

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found for this month.",
      });
    }

    res.status(200).json({
      success: true,
      roster,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GENERATE AND SAVE MONTHLY ROSTER
exports.generateRoster = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid month and year.",
      });
    }

    // Fetch database records
    const [
      employees,
      assignments,
      processRules,
      approvedLeaves,
      holidays,
    ] = await Promise.all([
      Employee.find({ status: "Active" }),

      Assignment.find({ status: "Active" }),

      WorkingRule.find({ status: "Active" }),

      Leave.find({
        status: "Approved",
        startDate: {
          $lte: new Date(year, month, 0, 23, 59, 59),
        },
        endDate: {
          $gte: new Date(year, month - 1, 1),
        },
      }),

      Holiday.find({
        date: {
          $gte: `${year}-${String(month).padStart(2, "0")}-01`,
          $lte: `${year}-${String(month).padStart(2, "0")}-${new Date(
            year,
            month,
            0
          ).getDate()}`,
        },
      }),
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();

    const rosterDays = [];
    const conflicts = [];

    const holidayDates = new Set(
      holidays.map((holiday) => holiday.date)
    );

    // Generate each day
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const weekday = new Date(year, month - 1, day).getDay();
      const weekdayName = weekdays[weekday];

      const dailyAllocations = [];
      const assignedEmployees = new Set();

      // Process each working rule
      for (const rule of processRules) {
        if (!rule.workingDays.includes(weekdayName)) {
          continue;
        }

        if (holidayDates.has(date)) {
          continue;
        }

        // Find assignments for this brand and process
        const eligibleAssignments = assignments.filter(
          (assignment) =>
            assignment.brand.toString() === rule.brand.toString() &&
            assignment.process.toString() === rule.process.toString()
        );

        const availableEmployees = [];

        for (const assignment of eligibleAssignments) {
          const employee = employees.find(
            (emp) =>
              emp._id.toString() === assignment.employee.toString()
          );

          if (!employee) continue;

          // Check weekly off
          if (employee.weeklyOff === weekdayName) {
            continue;
          }

          // Check approved leave date range
          const isOnLeave = approvedLeaves.some((leave) => {
            return (
              leave.employee.toString() === employee._id.toString() &&
              new Date(leave.startDate) <= new Date(`${date}T23:59:59`) &&
              new Date(leave.endDate) >= new Date(`${date}T00:00:00`)
            );
          });

          if (isOnLeave) continue;

          // Employee cannot work in two processes on the same day
          if (assignedEmployees.has(employee._id.toString())) {
            continue;
          }

          availableEmployees.push(employee);
        }

        const allocatedEmployees = availableEmployees.slice(
          0,
          rule.minimumStaff
        );

        for (const employee of allocatedEmployees) {
          assignedEmployees.add(employee._id.toString());

          dailyAllocations.push({
            employee: employee._id,
            brand: rule.brand,
            process: rule.process,
            status: "Working",
            isManuallyEdited: false,
          });
        }

        // Detect staffing shortage
        if (allocatedEmployees.length < rule.minimumStaff) {
          conflicts.push({
            date,
            brand: rule.brand,
            process: rule.process,
            type: "STAFF_SHORTAGE",
            required: rule.minimumStaff,
            available: allocatedEmployees.length,
            message: `Required ${rule.minimumStaff} employee(s), but only ${allocatedEmployees.length} could be allocated.`,
          });
        }
      }

      rosterDays.push({
        date,
        allocations: dailyAllocations,
      });
    }

    // Save roster.
    // If a roster already exists for this month, replace its generated data.
    const savedRoster = await Roster.findOneAndUpdate(
      { month, year },
      {
        $set: {
          month,
          year,
          status: "Generated",
          days: rosterDays,
          conflicts,
          generatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .populate("days.allocations.employee", "name employeeCode")
      .populate("days.allocations.brand", "name code")
      .populate("days.allocations.process", "name code")
      .populate("conflicts.brand", "name code")
      .populate("conflicts.process", "name code");

    res.status(200).json({
      success: true,
      message: "Monthly roster generated and saved successfully.",
      totalDays: daysInMonth,
      totalAllocations: rosterDays.reduce(
        (total, day) => total + day.allocations.length,
        0
      ),
      totalConflicts: conflicts.length,
      roster: savedRoster,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE ROSTER
exports.deleteRoster = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID.",
      });
    }

    const roster = await Roster.findByIdAndDelete(req.params.id);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Roster deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};