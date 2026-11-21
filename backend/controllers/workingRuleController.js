const mongoose = require("mongoose");

const WorkingRule = require("../models/WorkingRule");
const Brand = require("../models/Brand");
const Process = require("../models/Process");

const populateRule = (query) => {
  return query
    .populate("brand", "name code")
    .populate("process", "name code category");
};

// Get all working rules
exports.getWorkingRules = async (req, res) => {
  try {
    const rules = await populateRule(
      WorkingRule.find().sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get one working rule
exports.getWorkingRuleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid working rule ID.",
      });
    }

    const rule = await populateRule(
      WorkingRule.findById(req.params.id)
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Working rule not found.",
      });
    }

    res.status(200).json({
      success: true,
      rule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Validate brand and process relationship
const validateRule = async (brandId, processId) => {
  if (
    !mongoose.isValidObjectId(brandId) ||
    !mongoose.isValidObjectId(processId)
  ) {
    throw new Error("Please select a valid brand and process.");
  }

  const [brand, process] = await Promise.all([
    Brand.findById(brandId),
    Process.findById(processId),
  ]);

  if (!brand || brand.status !== "Active") {
    throw new Error("Selected brand does not exist or is inactive.");
  }

  if (!process || process.status !== "Active") {
    throw new Error("Selected process does not exist or is inactive.");
  }

  if (process.brand.toString() !== brandId.toString()) {
    throw new Error("Selected process does not belong to this brand.");
  }
};

// Create working rule
exports.createWorkingRule = async (req, res) => {
  try {
    const {
      brand,
      process,
      workingDays,
      minimumStaff,
      publicHolidaysOff,
    } = req.body;

    if (
      !brand ||
      !process ||
      !Array.isArray(workingDays) ||
      workingDays.length === 0 ||
      minimumStaff === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required working rule details.",
      });
    }

    await validateRule(brand, process);

    const existingRule = await WorkingRule.findOne({
      brand,
      process,
    });

    if (existingRule) {
      return res.status(409).json({
        success: false,
        message: "A working rule already exists for this brand and process.",
      });
    }

    const rule = await WorkingRule.create({
      brand,
      process,
      workingDays,
      minimumStaff,
      publicHolidaysOff:
        publicHolidaysOff === undefined ? true : publicHolidaysOff,
    });

    const populatedRule = await populateRule(
      WorkingRule.findById(rule._id)
    );

    res.status(201).json({
      success: true,
      message: "Working rule created successfully.",
      rule: populatedRule,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000
          ? "A working rule already exists for this brand and process."
          : error.message,
    });
  }
};

// Update working rule
exports.updateWorkingRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid working rule ID.",
      });
    }

    const rule = await WorkingRule.findById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Working rule not found.",
      });
    }

    const brand = req.body.brand ?? rule.brand;
    const process = req.body.process ?? rule.process;

    const workingDays = req.body.workingDays ?? rule.workingDays;
    const minimumStaff = req.body.minimumStaff ?? rule.minimumStaff;

    const publicHolidaysOff =
      req.body.publicHolidaysOff ?? rule.publicHolidaysOff;

    await validateRule(brand, process);

    const duplicate = await WorkingRule.findOne({
      _id: { $ne: id },
      brand,
      process,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A working rule already exists for this brand and process.",
      });
    }

    rule.brand = brand;
    rule.process = process;
    rule.workingDays = workingDays;
    rule.minimumStaff = minimumStaff;
    rule.publicHolidaysOff = publicHolidaysOff;

    if (req.body.status !== undefined) {
      rule.status = req.body.status;
    }

    await rule.save();

    const populatedRule = await populateRule(
      WorkingRule.findById(rule._id)
    );

    res.status(200).json({
      success: true,
      message: "Working rule updated successfully.",
      rule: populatedRule,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000
          ? "A working rule already exists for this brand and process."
          : error.message,
    });
  }
};

// Delete working rule
exports.deleteWorkingRule = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid working rule ID.",
      });
    }

    const rule = await WorkingRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Working rule not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Working rule deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};