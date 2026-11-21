const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["Working", "Absent", "Cancelled"],
      default: "Working",
    },

    isManuallyEdited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const dailyRosterSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },

    allocations: [allocationSchema],
  },
  { _id: false }
);

const conflictSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    process: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Process",
    },

    type: {
      type: String,
      required: true,
    },

    required: {
      type: Number,
      required: true,
    },

    available: {
      type: Number,
      required: true,
    },

    message: {
      type: String,
    },

    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const rosterSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Generated", "Published"],
      default: "Draft",
    },

    days: [dailyRosterSchema],

    conflicts: [conflictSchema],

    generatedAt: {
      type: Date,
    },

    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

rosterSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Roster", rosterSchema);