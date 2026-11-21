const express = require("express");
const router = express.Router();

const {
  getRosters,
  getRosterByMonth,
  generateRoster,
  deleteRoster,
} = require("../controllers/rosterController");

router.get("/", getRosters);

router.get("/:year/:month", getRosterByMonth);

router.post("/generate", generateRoster);

router.delete("/:id", deleteRoster);

module.exports = router;