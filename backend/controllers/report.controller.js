// controllers/report.controller.js
import { pool } from "../db.js";

/**
 * GET /api/admin/reports/open-sessions?eventId=...
 *  - gọi sp_GetOpenSessions (2.3)
 */
export async function getOpenSessionsReport(req, res) {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "Thiếu eventId" });
    }

    const [rows] = await pool.query(
      `
      CALL sp_GetOpenSessions(?);
      `,
      [eventId]
    );

    // Khi CALL, MySQL trả về mảng [resultRows, meta]
    return res.json(rows[0] || rows);
  } catch (err) {
    console.error("getOpenSessionsReport error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic / tham số" });
  }
}

/**
 * GET /api/admin/reports/event-revenue?eventId=...&minRevenue=...
 *  - gọi cal_revenue (2.3)
 */
export async function getEventRevenueReport(req, res) {
  try {
    const { eventId, minRevenue } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "Thiếu eventId" });
    }

    const minRev = minRevenue ? Number(minRevenue) : 0;

    const [rows] = await pool.query(
      `
      CALL cal_revenue(?, ?);
      `,
      [eventId, minRev]
    );

    const result = rows[0] || rows;
    console.log("=== cal_revenue result ===");
    console.log("First row:", JSON.stringify(result[0], null, 2));
    console.log("Total rows:", result.length);

    return res.json(result);
  } catch (err) {
    console.error("getEventRevenueReport error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic / tham số" });
  }
}

/**
 * GET /api/admin/functions/organizer-revenue?organizerId=&start=&end=
 *  - gọi hàm calculate_organizer_revenue (2.4)
 *  - start và end có thể null để lấy tất cả thời gian
 */
export async function callOrganizerRevenueFn(req, res) {
  try {
    const { organizerId, start, end } = req.query;

    if (!organizerId) {
      return res
        .status(400)
        .json({ message: "Thiếu organizerId" });
    }

    // Cho phép start và end là null để lấy tất cả thời gian
    const startDate = start || null;
    const endDate = end || null;

    const [rows] = await pool.query(
      `
      SELECT calculate_organizer_revenue(?, ?, ?) AS total_revenue;
      `,
      [organizerId, startDate, endDate]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error("callOrganizerRevenueFn error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic / tham số" });
  }
}

/**
 * GET /api/admin/functions/customer-ticket-count?customerId=&start=&end=
 *  - gọi hàm count_customer_tickets (2.4)
 */
export async function callCustomerTicketCountFn(req, res) {
  try {
    const { customerId, start, end } = req.query;

    if (!customerId || !start || !end) {
      return res
        .status(400)
        .json({ message: "Thiếu customerId / start / end" });
    }

    const [rows] = await pool.query(
      `
      SELECT count_customer_tickets(?, ?, ?) AS ticket_count;
      `,
      [customerId, start, end]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error("callCustomerTicketCountFn error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic / tham số" });
  }
}

/**
 * GET /api/admin/stats/revenue?eventId=
 *  - demo: tổng revenue overall dùng lại cal_revenue với minRevenue = 0
 */
export async function getRevenueStats(req, res) {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "Thiếu eventId" });
    }

    const [rows] = await pool.query(
      `
      CALL cal_revenue(?, 0);
      `,
      [eventId]
    );

    const data = rows[0] || rows;
    const total = data.reduce((sum, row) => sum + Number(row.Doanh_Thu || 0), 0);

    return res.json({
      total_revenue: total,
      detail: data,
    });
  } catch (err) {
    console.error("getRevenueStats error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic / tham số" });
  }
}
