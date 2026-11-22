const Employee = require("../models/Employee");
const Pod = require("../models/Pod");
const Brand = require("../models/Brand");
const Process = require("../models/Process");
const Assignment = require("../models/Assignment");

const globalSearch = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Enter at least 2 characters to search.",
      });
    }

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "i");

    const [
      employees,
      pods,
      brands,
      processes,
      assignments,
    ] = await Promise.all([
      Employee.find({
        $or: [
          { name: regex },
          { email: regex },
          { employeeCode: regex },
        ],
      }).limit(5).lean(),

      Pod.find({
        $or: [
          { name: regex },
          { code: regex },
        ],
      }).limit(5).lean(),

      Brand.find({
        $or: [
          { name: regex },
          { code: regex },
        ],
      }).limit(5).lean(),

      Process.find({
        $or: [
          { name: regex },
          { code: regex },
        ],
      }).limit(5).lean(),

      Assignment.find()
        .populate("employee", "name employeeCode")
        .populate("brand", "name")
        .populate("process", "name")
        .lean(),
    ]);

    const results = [
      ...employees.map((item) => ({
        id: item._id,
        name: item.name,
        type: "Employee",
        path: "/employees",
      })),

      ...pods.map((item) => ({
        id: item._id,
        name: item.name,
        type: "Pod",
        path: "/pods",
      })),

      ...brands.map((item) => ({
        id: item._id,
        name: item.name,
        type: "Brand",
        path: "/brands",
      })),

      ...processes.map((item) => ({
        id: item._id,
        name: item.name,
        type: "Process",
        path: "/processes",
      })),

      ...assignments
        .filter((item) => {
          const employeeName = item.employee?.name || "";
          const brandName = item.brand?.name || "";
          const processName = item.process?.name || "";

          return (
            regex.test(employeeName) ||
            regex.test(brandName) ||
            regex.test(processName)
          );
        })
        .slice(0, 5)
        .map((item) => ({
          id: item._id,
          name: `${item.employee?.name || "Employee"} - ${
            item.brand?.name || "Brand"
          } / ${item.process?.name || "Process"}`,
          type: "Assignment",
          path: "/assignments",
        })),
    ].slice(0, 25);

    res.status(200).json({
      success: true,
      results,
    });

  } catch (error) {
    console.error("Global search error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to perform search.",
    });
  }
};

module.exports = { globalSearch };