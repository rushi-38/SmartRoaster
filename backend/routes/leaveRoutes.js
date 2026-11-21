const express = require("express");
const router = express.Router();

const {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
} = require("../controllers/leaveController");

router.get("/", getLeaves);
router.get("/:id", getLeaveById);
router.post("/", createLeave);
router.patch("/:id/status", updateLeaveStatus);
router.delete("/:id", deleteLeave);

module.exports = router;