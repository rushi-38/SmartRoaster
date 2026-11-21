const express = require("express");

const router = express.Router();

const {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
} = require("../controllers/processController");

router.get("/", getProcesses);
router.get("/:id", getProcessById);
router.post("/", createProcess);
router.put("/:id", updateProcess);
router.delete("/:id", deleteProcess);

module.exports = router;