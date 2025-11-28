// routes/event.routes.js
import { Router } from "express";
import {
  getPublicEvents,
  getEventDetail,
  getMyEvents,
  adminListEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
} from "../controllers/event.controller.js";

const router = Router();

// Public
router.get("/events", getPublicEvents);
router.get("/events/:id", getEventDetail);

// Organizer
router.get("/my/events", getMyEvents);

// Admin
router.get("/admin/events", adminListEvents);
router.post("/admin/events", adminCreateEvent);
router.put("/admin/events/:id", adminUpdateEvent);
router.delete("/admin/events/:id", adminDeleteEvent);

export default router;
