const express = require("express");

const router = express.Router();

const {
  getNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");

router.get("/", getNotifications);

router.patch("/read-all", markAllAsRead);

module.exports = router;