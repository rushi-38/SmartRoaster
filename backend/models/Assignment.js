const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    process: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Process",
      required: true,
    },

    pod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pod",
      required: true,
    },

    assignedDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

assignmentSchema.index(
  { employee: 1, brand: 1, process: 1 },
  { unique: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);