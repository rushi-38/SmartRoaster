const Brand = require("../models/Brand");
const Employee = require("../models/Employee");

// GET: Fetch all brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find()
      .populate("manager", "name employeeCode email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Fetch a single brand
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate("manager", "name employeeCode email");

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST: Create a new brand
const createBrand = async (req, res) => {
  try {
    const { name, industry, manager, description, status } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        success: false,
        message: "Brand name and industry are required",
      });
    }

    // Check duplicate brand name
    const existingBrand = await Brand.findOne({
      name: name.trim(),
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "A brand with this name already exists",
      });
    }

    // Validate account manager
    if (manager) {
      const employee = await Employee.findById(manager);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Selected account manager not found",
        });
      }

      if (employee.status !== "Active") {
        return res.status(400).json({
          success: false,
          message: "Account manager must be an active employee",
        });
      }
    }

    // Generate brand code
    const lastBrand = await Brand.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastBrand && lastBrand.code) {
      const lastNumber = parseInt(
        lastBrand.code.replace("BR-", ""),
        10
      );

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const code = `BR-${String(nextNumber).padStart(3, "0")}`;

    // Create brand
    const brand = await Brand.create({
      name: name.trim(),
      code,
      industry,
      manager: manager || null,
      description,
      status: status || "Active",
    });

    const populatedBrand = await Brand.findById(brand._id)
      .populate("manager", "name employeeCode email");

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand: populatedBrand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT: Update a brand
const updateBrand = async (req, res) => {
  try {
    const { name, industry, manager, description, status } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Check duplicate name
    if (name) {
      const existingBrand = await Brand.findOne({
        name: name.trim(),
        _id: { $ne: brand._id },
      });

      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Another brand already uses this name",
        });
      }

      brand.name = name.trim();
    }

    // Validate account manager
    if (manager !== undefined) {
      if (manager) {
        const employee = await Employee.findById(manager);

        if (!employee) {
          return res.status(404).json({
            success: false,
            message: "Selected account manager not found",
          });
        }

        if (employee.status !== "Active") {
          return res.status(400).json({
            success: false,
            message: "Account manager must be an active employee",
          });
        }

        brand.manager = manager;
      } else {
        brand.manager = null;
      }
    }

    if (industry !== undefined) brand.industry = industry;
    if (description !== undefined) brand.description = description;
    if (status !== undefined) brand.status = status;

    await brand.save();

    const updatedBrand = await Brand.findById(brand._id)
      .populate("manager", "name employeeCode email");

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand: updatedBrand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE: Delete a brand
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};