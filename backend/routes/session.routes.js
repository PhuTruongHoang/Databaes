// routes/session.routes.js
import { Router } from "express";
import {
  adminListSessions,
  adminCreateSession,
  adminUpdateSession,
  adminDeleteSession,
} from "../controllers/session.controller.js";

const router = Router();

// /api/admin/sessions...
router.get("/admin/sessions", adminListSessions);
router.post("/admin/sessions", adminCreateSession);
router.put("/admin/sessions/:id", adminUpdateSession);
router.delete("/admin/sessions/:id", adminDeleteSession);

export default router;
