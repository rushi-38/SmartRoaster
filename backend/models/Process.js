const mongoose = require("mongoose");

const processSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Customer Service", "Sales", "Operations"],
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

processSchema.index({ name: 1, brand: 1 }, { unique: true });
processSchema.index({ code: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model("Process", processSchema);