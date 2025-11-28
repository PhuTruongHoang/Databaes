// routes/report.routes.js
import { Router } from "express";
import {
  getOpenSessionsReport,
  getEventRevenueReport,
  callOrganizerRevenueFn,
  callCustomerTicketCountFn,
  getRevenueStats,
} from "../controllers/report.controller.js";

const router = Router();

// 2.3 - thủ tục
router.get("/admin/reports/open-sessions", getOpenSessionsReport);
router.get("/admin/reports/event-revenue", getEventRevenueReport);

// 2.4 - hàm
router.get("/admin/functions/organizer-revenue", callOrganizerRevenueFn);
router.get("/admin/functions/customer-ticket-count", callCustomerTicketCountFn);

// Stats cho dashboard
router.get("/admin/stats/revenue", getRevenueStats);

export default router;
