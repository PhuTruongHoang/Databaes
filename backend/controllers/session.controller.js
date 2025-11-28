// controllers/session.controller.js
import { pool } from "../db.js";

/**
 * Admin: GET /api/admin/sessions
 *  - Hiển thị danh sách session (liên quan Event_Session ở câu 2.1)
 *  - Có thể filter theo Event_Id
 */
export async function adminListSessions(req, res) {
  try {
    const { eventId } = req.query;

    let sql = `
      SELECT 
        es.Session_Id            AS session_id,
        es.Event_Id              AS event_id,
        es.Venue_Id              AS venue_id,
        v.Venue_name             AS venue_name,
        es.Start_Date            AS start_date,
        es.End_Date              AS end_date,
        es.Open_Date             AS open_date,
        es.Close_Date            AS close_date,
        es.Available_Seats_Count AS available_seats_count,
        es.Session_Status        AS session_status
      FROM Event_Session es
      JOIN Venue v ON es.Venue_Id = v.Venue_Id
      WHERE 1 = 1
    `;
    const params = [];

    if (eventId) {
      sql += ` AND es.Event_Id = ?`;
      params.push(eventId);
    }

    sql += ` ORDER BY es.Start_Date ASC`;

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("adminListSessions error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * Admin: POST /api/admin/sessions
 *  - Gọi sp_InsertEventSession (câu 2.1)
 */
export async function adminCreateSession(req, res) {
  try {
    const {
      event_id,
      venue_id,
      start_datetime,
      end_datetime,
      open_date,
      close_date,
      available_seats_count,
      session_status,
    } = req.body;

    if (!event_id || !venue_id || !start_datetime || !end_datetime || !session_status) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Gọi procedure
    const [rows] = await pool.query(
      `
      CALL sp_InsertEventSession(
        ?, ?, ?, ?, ?, ?, ?, ?, @p_new_session_id
      );
      `,
      [
        event_id,
        venue_id,
        start_datetime,
        end_datetime,
        open_date || null,
        close_date || null,
        available_seats_count || 0,
        session_status,
      ]
    );

    // Lấy OUT param
    const [outRows] = await pool.query(
      `SELECT @p_new_session_id AS new_session_id;`
    );

    return res.status(201).json({
      message: "Thêm buổi diễn thành công (sp_InsertEventSession)",
      new_session_id: outRows[0].new_session_id,
      raw_result: rows,
    });
  } catch (err) {
    console.error("adminCreateSession error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic hoặc dữ liệu" });
  }
}

/**
 * Admin: PUT /api/admin/sessions/:id
 *  - Gọi sp_UpdateEventSession
 */
export async function adminUpdateSession(req, res) {
  try {
    const { id } = req.params;
    const {
      event_id,
      venue_id,
      start_datetime,
      end_datetime,
      open_date,
      close_date,
      available_seats_count,
      session_status,
    } = req.body;

    if (!event_id || !venue_id || !start_datetime || !end_datetime || !session_status) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    await pool.query(
      `
      CALL sp_UpdateEventSession(
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      );
      `,
      [
        id,
        event_id,
        venue_id,
        start_datetime,
        end_datetime,
        open_date || null,
        close_date || null,
        available_seats_count || 0,
        session_status,
      ]
    );

    return res.json({
      message: "Cập nhật buổi diễn thành công (sp_UpdateEventSession)",
    });
  } catch (err) {
    console.error("adminUpdateSession error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic hoặc dữ liệu" });
  }
}

/**
 * Admin: DELETE /api/admin/sessions/:id
 *  - Gọi sp_DeleteEventSession
 */
export async function adminDeleteSession(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `
      CALL sp_DeleteEventSession(?);
      `,
      [id]
    );

    return res.json({
      message: "Xóa buổi diễn thành công (sp_DeleteEventSession)",
    });
  } catch (err) {
    console.error("adminDeleteSession error:", err);
    return res
      .status(400)
      .json({ message: err.sqlMessage || err.message || "Lỗi logic hoặc dữ liệu" });
  }
}
