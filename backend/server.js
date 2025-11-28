// server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import express from "express";
import cors from "cors";

import eventRouter from "./routes/event.routes.js";
import sessionRouter from "./routes/session.routes.js";
import orderRouter from "./routes/order.routes.js";
import reportRouter from "./routes/report.routes.js";
import userRouter from "./routes/user.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import { pool } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount tất cả routers dưới prefix /api
app.use("/api", eventRouter);
app.use("/api", sessionRouter);
app.use("/api", orderRouter);
app.use("/api", reportRouter);
app.use("/api", userRouter);
app.use("/api", paymentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend chạy tại http://localhost:${PORT}`);
});

// =============== 6. ADMIN SESSIONS (BTL2 – 3.1 & 3.2) =============

// 6.1 – Lấy danh sách session đang mở (dùng sp_GetOpenSessions ở 2.3)
app.get("/api/admin/sessions/open", async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ message: "Thiếu eventId" });
  }

  try {
    // sp_GetOpenSessions(IN p_Event_Id INT)
    const [resultSets] = await pool.query("CALL sp_GetOpenSessions(?);", [
      eventId,
    ]);

    // MySQL khi CALL thường trả về mảng 2D, kết quả chính nằm ở resultSets[0]
    const rows = Array.isArray(resultSets) ? resultSets : [];
    res.json(rows);
  } catch (err) {
    console.error("GET /api/admin/sessions/open error:", err);
    res.status(500).json({ message: "Lỗi khi tải sessions (sp_GetOpenSessions)" });
  }
});

// 6.2 – Tạo session mới bằng sp_InsertEventSession (2.1)
app.post("/api/admin/sessions", async (req, res) => {
  const { event_id, venue_id, start_datetime, end_datetime, session_status } =
    req.body;

  if (!event_id || !venue_id || !start_datetime || !end_datetime) {
    return res.status(400).json({
      message:
        "Thiếu event_id, venue_id, start_datetime hoặc end_datetime",
    });
  }

  try {
    // ⚠️ Điều chỉnh lại thứ tự/tham số cho khớp đúng với 2.1.sql của bạn
    const [resultSets] = await pool.query(
      "CALL sp_InsertEventSession(?,?,?,?,?);",
      [
        event_id,
        venue_id,
        start_datetime,
        end_datetime,
        session_status || "Draft",
      ]
    );

    // giả sử thủ tục trả về dòng session mới trong resultSets[0][0]
    const inserted =
      Array.isArray(resultSets) && resultSets.length > 0
        ? resultSets[0][0]
        : null;

    res.status(201).json({
      message: "Tạo session thành công (sp_InsertEventSession)",
      session: inserted,
    });
  } catch (err) {
    console.error("POST /api/admin/sessions error:", err);
    res.status(500).json({ message: "Lỗi khi tạo session" });
  }
});

// 6.3 – Cập nhật session bằng sp_UpdateEventSession (2.1)
app.put("/api/admin/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const { venue_id, start_datetime, end_datetime, session_status } = req.body;

  if (!venue_id || !start_datetime || !end_datetime) {
    return res.status(400).json({
      message:
        "Thiếu venue_id, start_datetime hoặc end_datetime",
    });
  }

  try {
    // ⚠️ Điều chỉnh thứ tự params cho đúng với 2.1.sql:
    // ví dụ: (IN p_Session_Id, IN p_Venue_Id, IN p_Start, IN p_End, IN p_Status)
    await pool.query("CALL sp_UpdateEventSession(?,?,?,?,?);", [
      id,
      venue_id,
      start_datetime,
      end_datetime,
      session_status || "Open",
    ]);

    res.json({ message: "Cập nhật session thành công (sp_UpdateEventSession)" });
  } catch (err) {
    console.error("PUT /api/admin/sessions/:id error:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật session" });
  }
});

// 6.4 – Xoá session bằng sp_DeleteEventSession (2.1)
app.delete("/api/admin/sessions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("CALL sp_DeleteEventSession(?);", [id]);

    res.json({ message: "Xoá session thành công (sp_DeleteEventSession)" });
  } catch (err) {
    console.error("DELETE /api/admin/sessions/:id error:", err);
    res.status(500).json({ message: "Lỗi khi xoá session" });
  }
});

// =============== 7. ADMIN STATS (BTL2 – 3.2 & 3.3) =============

// 7.1 – Thống kê doanh thu theo năm (dùng procedure cal_revenue ở 2.3)
// FE hiện tại đã có fetchRevenueStats(year) call vào /admin/stats/revenue :contentReference[oaicite:1]{index=1}
app.get("/api/admin/stats/revenue", async (req, res) => {
  const { year } = req.query;
  if (!year) {
    return res.status(400).json({ message: "Thiếu year" });
  }

  try {
    // cal_revenue(IN p_year INT)
    const [resultSets] = await pool.query("CALL cal_revenue(?);", [year]);

    const rows = Array.isArray(resultSets) ? resultSets : [];
    res.json(rows);
  } catch (err) {
    console.error("GET /api/admin/stats/revenue error:", err);
    res.status(500).json({ message: "Lỗi khi gọi cal_revenue" });
  }
});

// 7.2 – Function calculate_organizer_revenue (2.4_calculate_organizer_revenue.sql)
//
// CREATE FUNCTION calculate_organizer_revenue(p_organizer_id BIGINT,
//                                             p_start_date DATE,
//                                             p_end_date   DATE) RETURNS DECIMAL(18,2)
app.get("/api/admin/stats/organizer-revenue", async (req, res) => {
  const { organizerId, from, to } = req.query;
  if (!organizerId || !from || !to) {
    return res.status(400).json({
      message: "Thiếu organizerId, from hoặc to",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT calculate_organizer_revenue(?, ?, ?) AS total_revenue;
      `,
      [organizerId, from, to]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/admin/stats/organizer-revenue error:", err);
    res.status(500).json({ message: "Lỗi khi gọi calculate_organizer_revenue" });
  }
});

// 7.3 – Function count_customer_tickets (2.4_count_customer_tickets.sql)
//
// CREATE FUNCTION count_customer_tickets(p_customer_id BIGINT,
//                                        p_start_date DATE,
//                                        p_end_date   DATE) RETURNS INT
app.get("/api/admin/stats/customer-ticket-count", async (req, res) => {
  const { customerId, from, to } = req.query;
  if (!customerId || !from || !to) {
    return res.status(400).json({
      message: "Thiếu customerId, from hoặc to",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT count_customer_tickets(?, ?, ?) AS ticket_count;
      `,
      [customerId, from, to]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(
      "GET /api/admin/stats/customer-ticket-count error:",
      err
    );
    res.status(500).json({ message: "Lỗi khi gọi count_customer_tickets" });
  }
});
