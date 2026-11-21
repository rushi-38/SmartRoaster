const mongoose = require("mongoose");

const workingRuleSchema = new mongoose.Schema(
  {
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

    workingDays: {
      type: [String],
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },

    minimumStaff: {
      type: Number,
      required: true,
      min: 1,
    },

    publicHolidaysOff: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

workingRuleSchema.index({ brand: 1, process: 1 }, { unique: true });

module.exports = mongoose.model("WorkingRule", workingRuleSchema);