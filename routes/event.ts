import express, { Router } from "express";

import { requireSignIn, hasAuthorization } from "../controllers/auth";
import {
  getEvent,
  findEventById,
  eventsByUser,
  createEvent,
  isOwner,
  updateEvent,
  deleteEvent,
} from "../controllers/event";
import { findUserById } from "../controllers/user";

const router: Router = express.Router();

router.get("/event/:eventId", requireSignIn, getEvent);
router.get("/events/by/:userId", requireSignIn, eventsByUser);

router.post("/event/new/:userId", requireSignIn, createEvent);
router.put("/event/:eventId", requireSignIn, isOwner, updateEvent);
router.delete("/event/:eventId", requireSignIn, isOwner, deleteEvent);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById);
// check if event exist when any route uses :eventId in para
router.param("eventId", findEventById);

export default router;