const Roster = require("../models/Roster");

// Get MongoDB ID
const getId = (value) => {
  if (!value) return null;

  return value._id
    ? value._id.toString()
    : value.toString();
};

// Get document name
const getName = (value) => {
  if (!value) return "Unknown";

  return value.name || value.title || "Unknown";
};

const getReport = async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    // Validate month and year
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid month and year.",
      });
    }

    // Fetch roster and populate Brand and Process names
    const roster = await Roster.findOne({ month, year })
      .populate("days.allocations.brand", "name")
      .populate("days.allocations.process", "name")
      .populate("conflicts.brand", "name")
      .populate("conflicts.process", "name")
      .lean();

    // No roster found
    if (!roster) {
      return res.status(200).json({
        success: true,
        rosterGenerated: false,
        message: "No generated roster found for this month.",
        report: {
          month,
          year,
          totalScheduled: 0,
          totalShortage: 0,
          totalRequired: 0,
          coveragePercentage: 0,
          totalConflicts: 0,
          brandReport: [],
          processReport: [],
          conflicts: [],
        },
      });
    }

    const brandMap = new Map();
    const processMap = new Map();

    let totalScheduled = 0;

    // Process daily allocations
    const days = roster.days || [];

    days.forEach((day) => {
      const allocations = day.allocations || [];

      allocations.forEach((allocation) => {

        // Ignore absent or cancelled allocations
        if (
          allocation.status === "Absent" ||
          allocation.status === "Cancelled"
        ) {
          return;
        }

        const brandId = getId(allocation.brand);
        const processId = getId(allocation.process);

        const brandName = getName(allocation.brand);
        const processName = getName(allocation.process);

        // Each allocation represents one employee
        totalScheduled += 1;

        // Brand-wise report
        const brandKey = brandId || brandName;

        if (!brandMap.has(brandKey)) {
          brandMap.set(brandKey, {
            brand: brandName,
            scheduledStaff: 0,
          });
        }

        brandMap.get(brandKey).scheduledStaff += 1;

        // Process-wise report
        const processKey = `${brandId || brandName}-${processId || processName}`;

        if (!processMap.has(processKey)) {
          processMap.set(processKey, {
            process: processName,
            brand: brandName,
            scheduledStaff: 0,
          });
        }

        processMap.get(processKey).scheduledStaff += 1;
      });
    });

    // Process conflicts
    const conflicts = (roster.conflicts || []).map((conflict) => {
      const required = Number(conflict.required || 0);
      const available = Number(conflict.available || 0);

      return {
        date: conflict.date,
        brand: getName(conflict.brand),
        process: getName(conflict.process),
        type: conflict.type,
        required,
        available,
        shortage: Math.max(0, required - available),
        message: conflict.message || "Staff shortage",
        resolved: conflict.resolved || false,
      };
    });

    // Calculate total shortage
    const totalShortage = conflicts.reduce(
      (total, conflict) => total + conflict.shortage,
      0
    );

    // Calculate total required staff
    const totalRequired = totalScheduled + totalShortage;

    // Calculate coverage percentage
    const coveragePercentage =
      totalRequired > 0
        ? Number(
            ((totalScheduled / totalRequired) * 100).toFixed(2)
          )
        : 0;

    // Final report
    const report = {
      month,
      year,
      totalScheduled,
      totalShortage,
      totalRequired,
      coveragePercentage,
      totalConflicts: conflicts.length,
      brandReport: Array.from(brandMap.values()),
      processReport: Array.from(processMap.values()),
      conflicts,
    };

    return res.status(200).json({
      success: true,
      rosterGenerated: true,
      message: "Report generated successfully.",
      report,
    });

  } catch (error) {
    console.error("Report generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate report.",
      error: error.message,
    });
  }
};

module.exports = { getReport };