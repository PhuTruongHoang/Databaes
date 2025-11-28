// routes/payment.routes.js
import express from "express";
import { getPaymentQR, confirmPayment } from "../controllers/payment.controller.js";

const router = express.Router();

// GET /api/payment/qr/:orderId - Lấy mã QR thanh toán
router.get("/payment/qr/:orderId", getPaymentQR);

// POST /api/payment/confirm/:orderId - Xác nhận thanh toán
router.post("/payment/confirm/:orderId", confirmPayment);

export default router;
