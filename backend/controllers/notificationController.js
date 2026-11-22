const Leave = require("../models/Leave");
const Roster = require("../models/Roster");
const Notification = require("../models/Notification");

// GET NOTIFICATIONS
const getNotifications = async (req, res) => {
  try {
    // Fetch pending leave requests
    const pendingLeaves = await Leave.find({
      status: "Pending",
    }).populate("employee", "name employeeCode");

    // Fetch rosters containing unresolved conflicts
    const rosters = await Roster.find({
      "conflicts.resolved": false,
    })
      .populate("conflicts.brand", "name")
      .populate("conflicts.process", "name");

    const activeKeys = [];

    const operations = [];

    // Create notifications for pending leaves
    pendingLeaves.forEach((leave) => {
      const sourceKey = `leave:${leave._id}`;

      activeKeys.push(sourceKey);

      const employeeName = leave.employee?.name || "An employee";

      operations.push({
        updateOne: {
          filter: { sourceKey },
          update: {
            $set: {
              title: "Pending Leave Request",
              message: `${employeeName} has submitted a ${leave.leaveType} leave request.`,
              type: "Leave",
              active: true,
              date: leave.createdAt || new Date(),
            },
            $setOnInsert: {
              read: false,
            },
          },
          upsert: true,
        },
      });
    });

    // Create notifications for roster conflicts
    rosters.forEach((roster) => {
      roster.conflicts.forEach((conflict) => {
        if (conflict.resolved) return;

        const sourceKey = `conflict:${conflict._id}`;

        activeKeys.push(sourceKey);

        const brandName = conflict.brand?.name || "Unknown Brand";
        const processName = conflict.process?.name || "Unknown Process";

        const shortage = Math.max(
          0,
          conflict.required - conflict.available
        );

        const isShortage = shortage > 0;

        const title = isShortage
          ? "Staff Shortage Detected"
          : "Unresolved Roster Conflict";

        const message = isShortage
          ? `${brandName} - ${processName} requires ${shortage} more staff member(s) on ${conflict.date}.`
          : `${brandName} - ${processName} has an unresolved roster conflict on ${conflict.date}.`;

        operations.push({
          updateOne: {
            filter: { sourceKey },
            update: {
              $set: {
                title,
                message,
                type: isShortage ? "Shortage" : "Conflict",
                active: true,
                date: conflict.date
                  ? new Date(`${conflict.date}T00:00:00`)
                  : new Date(),
              },
              $setOnInsert: {
                read: false,
              },
            },
            upsert: true,
          },
        });
      });
    });

    // Save or update notifications
    if (operations.length > 0) {
      await Notification.bulkWrite(operations);
    }

    // Deactivate notifications whose original conditions no longer exist
    if (activeKeys.length > 0) {
      await Notification.updateMany(
        {
          sourceKey: { $nin: activeKeys },
          active: true,
        },
        {
          $set: { active: false },
        }
      );
    } else {
      await Notification.updateMany(
        { active: true },
        { $set: { active: false } }
      );
    }

    // Return active notifications
    const notifications = await Notification.find({
      active: true,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });

  } catch (error) {
    console.error("Notification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
};


// MARK ALL NOTIFICATIONS AS READ
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { active: true, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });

  } catch (error) {
    console.error("Mark notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};


module.exports = {
  getNotifications,
  markAllAsRead,
};