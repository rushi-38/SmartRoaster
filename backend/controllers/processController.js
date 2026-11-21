const Process = require("../models/Process");
const Brand = require("../models/Brand");

// GET all processes
const getProcesses = async (req, res) => {
  try {
    const processes = await Process.find()
      .populate("brand", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: processes.length,
      processes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET single process
const getProcessById = async (req, res) => {
  try {
    const process = await Process.findById(req.params.id)
      .populate("brand", "name code");

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Process not found",
      });
    }

    res.status(200).json({
      success: true,
      process,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE process
const createProcess = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      brand,
      description,
      status,
    } = req.body;

    if (!name || !code || !category || !brand) {
      return res.status(400).json({
        success: false,
        message: "Name, code, category and brand are required",
      });
    }

    const existingBrand = await Brand.findById(brand);

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Selected brand not found",
      });
    }

    if (existingBrand.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot create a process for an inactive brand",
      });
    }

    const existingProcess = await Process.findOne({
      name: name.trim(),
      brand,
    });

    if (existingProcess) {
      return res.status(400).json({
        success: false,
        message: "This process already exists for the selected brand",
      });
    }

    const process = await Process.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      brand,
      description,
      status: status || "Active",
    });

    const populatedProcess = await Process.findById(process._id)
      .populate("brand", "name code");

    res.status(201).json({
      success: true,
      message: "Process created successfully",
      process: populatedProcess,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE process
const updateProcess = async (req, res) => {
  try {
    const process = await Process.findById(req.params.id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Process not found",
      });
    }

    const {
      name,
      code,
      category,
      brand,
      description,
      status,
    } = req.body;

    const targetBrand = brand || process.brand.toString();

    if (brand !== undefined) {
      const existingBrand = await Brand.findById(brand);

      if (!existingBrand) {
        return res.status(404).json({
          success: false,
          message: "Selected brand not found",
        });
      }

      if (existingBrand.status !== "Active") {
        return res.status(400).json({
          success: false,
          message: "Cannot assign a process to an inactive brand",
        });
      }

      process.brand = brand;
    }

    if (name !== undefined) process.name = name.trim();
    if (code !== undefined) process.code = code.trim().toUpperCase();
    if (category !== undefined) process.category = category;
    if (description !== undefined) process.description = description;
    if (status !== undefined) process.status = status;

    const duplicate = await Process.findOne({
      _id: { $ne: process._id },
      brand: targetBrand,
      $or: [
        { name: process.name },
        { code: process.code },
      ],
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A process with this name or code already exists for this brand",
      });
    }

    await process.save();

    const updatedProcess = await Process.findById(process._id)
      .populate("brand", "name code");

    res.status(200).json({
      success: true,
      message: "Process updated successfully",
      process: updatedProcess,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE process
const deleteProcess = async (req, res) => {
  try {
    const process = await Process.findByIdAndDelete(req.params.id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Process not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Process deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
};