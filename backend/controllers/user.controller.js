// controllers/user.controller.js
import { pool } from "../db.js";

/**
 * POST /api/auth/login
 *  - Demo: check email + password plain text (BTL, chưa cần JWT)
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        u.User_Id   AS user_id,
        u.Full_Name AS full_name,
        u.Email     AS email,
        u.User_type AS user_type
      FROM \`User\` u
      WHERE u.Email = ? AND u.PasswordHash = ?
      `,
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // BTL không cần JWT, trả về user basic
    return res.json({
      message: "Đăng nhập thành công",
      user: rows[0],
    });
  } catch (err) {
    console.error("login error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * GET /api/users/:id
 *  - MyAccountPage: lấy profile
 */
export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        u.User_Id   AS user_id,
        u.Full_Name AS full_name,
        u.Email     AS email,
        u.Phone_Number AS phone_number,
        u.Gender    AS gender,
        u.Birth_Date AS birthday,
        u.User_type AS user_type
      FROM \`User\` u
      WHERE u.User_Id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getUserProfile error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * PUT /api/users/:id
 *  - Update một số field cơ bản, không update password ở đây
 */
export async function updateUserProfile(req, res) {
  try {
    const { id } = req.params;
    const { full_name, phone_number, gender, birthday } = req.body;

    const [exists] = await pool.query(
      `SELECT User_Id FROM \`User\` WHERE User_Id = ?`,
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    await pool.query(
      `
      UPDATE \`User\`
      SET
        Full_Name     = ?,
        Phone_Number  = ?,
        Gender        = ?,
        Birth_Date    = ?
      WHERE User_Id = ?
      `,
      [full_name, phone_number, gender, birthday, id]
    );

    return res.json({ message: "Cập nhật hồ sơ thành công" });
  } catch (err) {
    console.error("updateUserProfile error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}

/**
 * GET /api/my/tickets?customerId=
 *  - MyTicketsPage dùng
 */
export async function getMyTickets(req, res) {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: "Thiếu customerId" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        t.Ticket_Id            AS ticket_id,
        t.Ticket_type          AS ticket_type,
        t.Ticket_Price         AS ticket_price,
        t.Ticket_Status        AS ticket_status,
        es.Session_Id          AS session_id,
        es.Start_Date          AS start_date,
        DATE_FORMAT(es.Start_Date, '%d/%m/%Y %H:%i') AS session_date,
        e.Event_Id             AS event_id,
        e.Event_name           AS event_name,
        o.Order_Datetime       AS order_datetime,
        DATE_FORMAT(o.Order_Datetime, '%d/%m/%Y %H:%i') AS order_date
      FROM Ticket t
      JOIN \`Order\` o ON t.Order_Id = o.Order_Id
      JOIN Event_Session es ON t.Session_Id = es.Session_Id
      JOIN Event e ON es.Event_Id = e.Event_Id
      WHERE o.Customer_Id = ?
      ORDER BY o.Order_Datetime DESC
      `,
      [customerId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyTickets error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  }
}
