// routes/order.routes.js
import { Router } from "express";
import { createOrder, checkInTicket } from "../controllers/order.controller.js";

const router = Router();

// CheckoutPage
router.post("/orders", createOrder);

// Check-in ticket by QR code
router.post("/tickets/check-in", checkInTicket);

export default router;
