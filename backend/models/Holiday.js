const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);