const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["Annual", "Sick", "Casual", "Unpaid", "CompOff"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure end date is not before start date.
leaveSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before start date.");
  }
});

module.exports = mongoose.model("Leave", leaveSchema);