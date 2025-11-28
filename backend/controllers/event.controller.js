// controllers/event.controller.js
import { pool } from "../db.js";
import { ensureUserRole } from "../utils/userRoleHelper.js";

/**
 * Public: GET /api/events
 *  - HomePage, EventSearchFilter sử dụng
 */
export async function getPublicEvents(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        e.Event_Id          AS event_id,
        e.Event_Name        AS event_name,
        e.Event_Category    AS event_category,
        e.Primary_Language  AS primary_language,
        e.Privacy_Level     AS privacy_level,
        e.Event_Description AS event_description,
        e.Poster_Image      AS poster_image,
        MIN(s.Start_Date)   AS first_start_date,
        MIN(dp.Price)       AS min_price
      FROM Event e
      LEFT JOIN Event_Session s   ON s.Event_Id   = e.Event_Id
      LEFT JOIN Define_Pricing dp ON dp.Session_Id = s.Session_Id
      GROUP BY 
        e.Event_Id,
        e.Event_Name,
        e.Event_Category,
        e.Primary_Language,
        e.Privacy_Level,
        e.Event_Description,
        e.Poster_Image
      ORDER BY 
        first_start_date IS NULL, 
        first_start_date ASC;
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/events error:", err);
    res.status(500).json({ message: "Lỗi khi tải danh sách sự kiện" });
  }
}

/**
 * Public: GET /api/events/:id
 *  - EventDetailPage dùng
 *  - SỬA lại cho đúng schema: dùng Pricing_Tier + Define_Pricing
 */
export async function getEventDetail(req, res) {
  const { id } = req.params; // /api/events/:id

  try {
    // 1) Thông tin event + min_price
    const [eventRows] = await pool.query(
      `
      SELECT
        e.Event_Id          AS event_id,
        e.Event_Name        AS event_name,
        e.Event_Category    AS event_category,
        e.Event_Description AS event_description,
        e.Primary_Language  AS primary_language,
        e.Poster_Image      AS poster_image,
        MIN(dp.Price)       AS min_price
      FROM Event e
      LEFT JOIN Event_Session s   ON s.Event_Id = e.Event_Id
      LEFT JOIN Define_Pricing dp ON dp.Session_Id = s.Session_Id
      WHERE e.Event_Id = ?
      GROUP BY
        e.Event_Id,
        e.Event_Name,
        e.Event_Category,
        e.Event_Description,
        e.Primary_Language,
        e.Poster_Image;
      `,
      [id]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2) Danh sách session + venue
    const [sessionRows] = await pool.query(
      `
      SELECT
        s.Session_Id            AS session_id,
        s.Event_Id              AS event_id,
        s.Venue_Id              AS venue_id,
        s.Start_Date,
        s.End_Date,
        s.Open_Date,
        s.Close_Date,
        s.Available_Seats_Count,
        s.Session_Status,
        v.Venue_Name            AS venue_name,
        v.Venue_Address         AS venue_address
      FROM Event_Session s
      JOIN Venue v ON v.Venue_Id = s.Venue_Id
      WHERE s.Event_Id = ?
      ORDER BY s.Start_Date ASC;
      `,
      [id]
    );

    // 3) Hạng vé theo từng session
    const [tierRows] = await pool.query(
      `
      SELECT
        s.Session_Id                     AS session_id,
        t.Tier_Id                        AS tier_id,
        t.Tier_Name                      AS tier_name,
        COALESCE(dp.Price, t.Base_Price) AS price
      FROM Pricing_Tier t
      JOIN Define_Pricing dp ON dp.Tier_Id = t.Tier_Id
      JOIN Event_Session s   ON s.Session_Id = dp.Session_Id
      WHERE s.Event_Id = ?;
      `,
      [id]
    );

    return res.json({
      event: eventRows[0],
      sessions: sessionRows,
      pricing_tiers: tierRows,
    });
  } catch (err) {
    console.error("getEventDetail error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Server error" });
  }
}

/**
 * Organizer: GET /api/my/events?organizerId=...
 *  - MyEventsPage dùng
 */
export async function getMyEvents(req, res) {
  try {
    const { organizerId } = req.query;
    if (!organizerId) {
      return res.status(400).json({ message: "Thiếu organizerId" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        e.Event_Id         AS event_id,
        e.Event_name       AS event_name,
        e.Event_category   AS event_category,
        e.Primary_language AS primary_language,
        e.Poster_Image     AS poster_image,
        e.Privacy_Level    AS privacy_level,
        MIN(s.Start_Date)  AS first_session_date,
        COALESCE(DATE_FORMAT(MIN(s.Start_Date), '%d/%m/%Y'), 'Đang cập nhật') AS formatted_date,
        COALESCE(MIN(dp.Price), 0) AS min_price
      FROM Event e
      LEFT JOIN Event_Session s ON s.Event_Id = e.Event_Id
      LEFT JOIN Define_Pricing dp ON dp.Session_Id = s.Session_Id
      WHERE e.User_Id = ?
      GROUP BY e.Event_Id, e.Event_name, e.Event_category, e.Primary_language, e.Poster_Image, e.Privacy_Level
      ORDER BY e.Event_Id DESC
      `,
      [organizerId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyEvents error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * Admin: GET /api/admin/events
 *  - AdminEventListPage, EventSearchFilter dùng
 */
// controllers/event.controller.js
export async function adminListEvents(req, res) {
  try {
    const { keyword, category } = req.query;

    let sql = `
      SELECT 
        e.Event_Id           AS event_id,
        e.Event_name         AS event_name,
        e.Event_category     AS event_category,
        e.Primary_language   AS primary_language,
        e.Privacy_level      AS privacy_level,
        e.Event_Description  AS event_description,
        e.Poster_Image       AS poster_image,
        e.Event_duration     AS event_duration
      FROM Event e
      WHERE 1 = 1
    `;
    const params = [];

    if (keyword) {
      sql += ` AND (e.Event_name LIKE ? OR e.Event_Description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      sql += ` AND e.Event_category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY e.Event_Id DESC`;

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("adminListEvents error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}


/**
 * Admin: POST /api/admin/events
 *  - AdminEventFormPage: tạo event cơ bản + sessions + pricing
 */
export async function adminCreateEvent(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      user_id,
      event_name,
      event_description,
      event_category,
      event_duration,
      primary_language,
      privacy_level,
      is_online_event,
      poster_image,
      sessions,
      ticket_types,
    } = req.body;

    await conn.beginTransaction();

    // Đảm bảo user có role ORGANIZER (tự động upgrade nếu cần)
    await ensureUserRole(conn, user_id, 'ORGANIZER');

    // 1. Tạo Event
    const [result] = await conn.query(
      `
      INSERT INTO Event (
        User_Id,
        Event_name,
        Event_description,
        Event_category,
        Event_duration,
        Poster_image,
        Primary_language,
        Privacy_level,
        Is_online_event
      )
      VALUES (?,?,?,?,?,?,?,?,?)
      `,
      [
        user_id,
        event_name,
        event_description,
        event_category,
        event_duration,
        poster_image || null,
        primary_language,
        privacy_level,
        is_online_event ? 1 : 0,
      ]
    );

    const eventId = result.insertId;

    // 2. Tạo Pricing_Tier cho các loại vé
    const tierIdMap = {}; // Map tên loại vé -> tier_id
    if (ticket_types && ticket_types.length > 0) {
      for (const ticket of ticket_types) {
        if (!ticket.name || !ticket.price) continue;

        const [tierResult] = await conn.query(
          `INSERT INTO Pricing_Tier (Tier_Name, Base_Price) VALUES (?, ?)`,
          [ticket.name, parseFloat(ticket.price)]
        );
        tierIdMap[ticket.name] = tierResult.insertId;
      }
    }

    // 3. Tạo Event_Session
    if (sessions && sessions.length > 0) {
      // Lấy venue_id mặc định (giả sử venue_id = 1, hoặc tạo venue mặc định)
      const defaultVenueId = 1; // Bạn có thể sửa lại logic này

      for (const session of sessions) {
        if (!session.date || !session.start_time || !session.end_time) continue;

        const startDatetime = `${session.date} ${session.start_time}:00`;
        const endDatetime = `${session.date} ${session.end_time}:00`;

        const [sessionResult] = await conn.query(
          `
          INSERT INTO Event_Session (
            Event_Id,
            Venue_Id,
            Start_Date,
            End_Date,
            Available_Seats_Count,
            Session_Status
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            eventId,
            defaultVenueId,
            startDatetime,
            endDatetime,
            100, // Default 100 seats, có thể điều chỉnh
            'SCHEDULED'
          ]
        );

        const sessionId = sessionResult.insertId;

        // 4. Tạo Define_Pricing cho session này với các tier đã tạo
        for (const tierId of Object.values(tierIdMap)) {
          // Lấy giá của tier
          const [tierInfo] = await conn.query(
            `SELECT Base_Price FROM Pricing_Tier WHERE Tier_Id = ?`,
            [tierId]
          );

          if (tierInfo.length > 0) {
            await conn.query(
              `
              INSERT INTO Define_Pricing (Session_Id, Tier_Id, Price)
              VALUES (?, ?, ?)
              `,
              [sessionId, tierId, tierInfo[0].Base_Price]
            );
          }
        }
      }
    }

    await conn.commit();

    return res.status(201).json({
      message: "Tạo sự kiện thành công",
      event_id: eventId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("adminCreateEvent error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  } finally {
    conn.release();
  }
}

/**
 * Admin: PUT /api/admin/events/:id
 */
export async function adminUpdateEvent(req, res) {
  try {
    const { id } = req.params;
    const {
      event_name,
      event_description,
      event_category,
      event_duration,
      primary_language,
      privacy_level,
      is_online_event,
      poster_image,
    } = req.body;

    const [exists] = await pool.query(
      `SELECT Event_Id FROM Event WHERE Event_Id = ?`,
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: "Event không tồn tại" });
    }

    await pool.query(
      `
      UPDATE Event
      SET
        Event_name        = ?,
        Event_description = ?,
        Event_category    = ?,
        Event_duration    = ?,
        Poster_image      = ?,
        Primary_language  = ?,
        Privacy_level     = ?,
        Is_online_event   = ?
      WHERE Event_Id = ?
      `,
      [
        event_name,
        event_description,
        event_category,
        event_duration,
        poster_image || null,
        primary_language,
        privacy_level,
        is_online_event ? 1 : 0,
        id,
      ]
    );

    return res.json({ message: "Cập nhật sự kiện thành công" });
  } catch (err) {
    console.error("adminUpdateEvent error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * Admin: DELETE /api/admin/events/:id
 */
export async function adminDeleteEvent(req, res) {
  try {
    const { id } = req.params;

    const [exists] = await pool.query(
      `SELECT Event_Id FROM Event WHERE Event_Id = ?`,
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: "Event không tồn tại" });
    }

    await pool.query(`DELETE FROM Event WHERE Event_Id = ?`, [id]);

    return res.json({ message: "Xóa sự kiện thành công" });
  } catch (err) {
    console.error("adminDeleteEvent error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}
