const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const {
  getEvent,
  findEventById,
  eventsByUser,
  createEvent,
} = require("../controllers/event");
const { findUserById } = require("../controllers/user");

const router = express.Router();
router.get("/event/:eventId", getEvent);
router.get("/events/by/:userId", requireSignIn, eventsByUser);

router.post("/event/new/:userId", requireSignIn, createEvent);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById);
// check if event exist when any route uses :eventId in para
router.param("eventId", findEventById);
module.exports = router;
