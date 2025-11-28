// routes/user.routes.js
import { Router } from "express";
import {
  login,
  getUserProfile,
  updateUserProfile,
  getMyTickets,
} from "../controllers/user.controller.js";

const router = Router();

// Auth
router.post("/auth/login", login);

// Profile
router.get("/users/:id", getUserProfile);
router.put("/users/:id", updateUserProfile);

// My tickets
router.get("/my/tickets", getMyTickets);

export default router;
