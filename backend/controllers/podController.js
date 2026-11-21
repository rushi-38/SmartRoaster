const Pod = require("../models/Pod");

// Get all pods
const getPods = async (req, res) => {
  try {
    const pods = await Pod.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pods.length,
      pods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single pod
const getPodById = async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: "Pod not found",
      });
    }

    res.status(200).json({
      success: true,
      pod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create pod
const createPod = async (req, res) => {
  try {
    const { name, lead, members, description } = req.body;

    if (!name || !lead || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pod name, lead and team members are required.",
      });
    }

    if (!members.includes(lead)) {
      return res.status(400).json({
        success: false,
        message: "Pod lead must be included in team members.",
      });
    }

    const existingPod = await Pod.findOne({ name });

    if (existingPod) {
      return res.status(400).json({
        success: false,
        message: "A pod with this name already exists.",
      });
    }

    const lastPod = await Pod.findOne().sort({ createdAt: -1 });

    const nextNumber = lastPod
      ? Number(lastPod.code.split("-")[1]) + 1
      : 1;

    const code = `POD-${String(nextNumber).padStart(3, "0")}`;

    const pod = await Pod.create({
      name,
      code,
      lead,
      members,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Pod created successfully.",
      pod,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update pod
const updatePod = async (req, res) => {
  try {
    const { name, lead, members, description } = req.body;

    if (
      !name ||
      !lead ||
      !Array.isArray(members) ||
      members.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Pod name, lead and team members are required.",
      });
    }

    if (!members.includes(lead)) {
      return res.status(400).json({
        success: false,
        message: "Pod lead must be included in team members.",
      });
    }

    const duplicate = await Pod.findOne({
      name,
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Another pod already uses this name.",
      });
    }

    const pod = await Pod.findByIdAndUpdate(
      req.params.id,
      { name, lead, members, description },
      { new: true, runValidators: true }
    );

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: "Pod not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pod updated successfully.",
      pod,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Deactivate pod
const deletePod = async (req, res) => {
  try {
    const pod = await Pod.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true }
    );

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: "Pod not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pod deactivated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPods,
  getPodById,
  createPod,
  updatePod,
  deletePod,
};