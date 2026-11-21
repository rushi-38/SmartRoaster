const express = require("express");
const router = express.Router();

const {
  getWorkingRules,
  getWorkingRuleById,
  createWorkingRule,
  updateWorkingRule,
  deleteWorkingRule,
} = require("../controllers/workingRuleController");

router.get("/", getWorkingRules);
router.get("/:id", getWorkingRuleById);
router.post("/", createWorkingRule);
router.put("/:id", updateWorkingRule);
router.delete("/:id", deleteWorkingRule);

module.exports = router;