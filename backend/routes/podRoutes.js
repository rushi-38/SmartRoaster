const express = require("express");

const router = express.Router();

const {
  getPods,
  getPodById,
  createPod,
  updatePod,
  deletePod,
} = require("../controllers/podController");

router.get("/", getPods);
router.get("/:id", getPodById);
router.post("/", createPod);
router.put("/:id", updatePod);
router.delete("/:id", deletePod);

module.exports = router;