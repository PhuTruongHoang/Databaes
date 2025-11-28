// controllers/order.controller.js
import { pool } from "../db.js";
import { ensureUserRole } from "../utils/userRoleHelper.js";

/**
 * POST /api/orders
 * Body format từ CheckoutPage:
 *  - customer: { full_name, email, phone } (thông tin người mua)
 *  - event_id (optional)
 *  - session_id
 *  - tickets: { tier_id: quantity } (ví dụ: { "1": 2, "2": 1 })
 */
export async function createOrder(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      customer_id,
      customer,
      event_id,
      session_id,
      items,
      tickets,
      buyer_fullname,
      buyer_email,
      buyer_phone,
    } = req.body;

    console.log("=== CREATE ORDER DEBUG ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // Lấy thông tin customer (support cả 2 format)
    const actualCustomerId = customer_id;
    const fullName = customer?.full_name || buyer_fullname || "Guest";
    const email = customer?.email || buyer_email || "";
    const phone = customer?.phone || buyer_phone || "";

    if (!session_id) {
      console.log("Missing session_id");
      return res.status(400).json({ message: "Thiếu session_id" });
    }

    console.log("Session ID:", session_id);
    console.log("Tickets:", tickets);

    // Chuyển đổi tickets format { tier_id: quantity } sang items array
    let orderItems = [];

    if (tickets && typeof tickets === 'object' && !Array.isArray(tickets)) {
      // Format mới từ CheckoutPage: { "1": 2, "2": 1 }
      console.log("Using tickets format (new)");

      for (const [tierId, quantity] of Object.entries(tickets)) {
        const qty = parseInt(quantity);
        console.log(`Processing tier ${tierId}, quantity ${qty}`);

        if (qty > 0) {
          // Lấy giá từ bảng Pricing_Tier
          try {
            const [tierRows] = await conn.query(
              `SELECT Base_Price AS base_price, Tier_Name AS tier_name
               FROM Pricing_Tier
               WHERE Tier_Id = ?`,
              [tierId]
            );

            console.log(`Tier ${tierId} query result:`, tierRows);

            if (tierRows.length > 0) {
              orderItems.push({
                tier_id: tierId,
                ticket_type: tierRows[0].tier_name || `Tier ${tierId}`,
                quantity: qty,
                unit_price: tierRows[0].base_price || 0,
              });
            } else {
              console.log(`Warning: No pricing found for tier ${tierId}`);
              // Không tìm thấy tier, bỏ qua
              throw new Error(`Không tìm thấy thông tin giá cho hạng vé ${tierId}`);
            }
          } catch (queryErr) {
            console.error(`Error querying Pricing_Tier for tier ${tierId}:`, queryErr);
            throw queryErr;
          }
        }
      }
    } else if (Array.isArray(items)) {
      // Format cũ: [{ ticket_type, quantity, unit_price }]
      console.log("Using items format (old)");
      orderItems = items;
    }

    console.log("Order items:", orderItems);

    if (orderItems.length === 0) {
      console.log("No order items after processing");
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 vé" });
    }

    await conn.beginTransaction();

    // Đảm bảo user có role CUSTOMER (tự động upgrade nếu cần)
    if (actualCustomerId) {
      await ensureUserRole(conn, actualCustomerId, 'CUSTOMER');
    }

    // Tính tổng tiền
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    console.log("Total amount:", totalAmount);

    // Đảm bảo totalAmount >= 0 và có giá trị hợp lệ
    const validTotalAmount = Math.max(totalAmount, 0);

    if (validTotalAmount === 0) {
      console.warn("Warning: Total amount is 0 - Pricing_Tier may not have data");
    }

    // Tạo Order - chỉ dùng các cột cơ bản có trong bảng Order
    const [orderResult] = await conn.query(
      `
      INSERT INTO \`Order\` (
        Customer_Id,
        Order_Datetime,
        Total_Amount,
        Order_Status
      )
      VALUES (?, NOW(), ?, 'PENDING')
      `,
      [
        actualCustomerId,
        validTotalAmount,
      ]
    );

    const orderId = orderResult.insertId;
    console.log("Order created with ID:", orderId);

    // Tạo Ticket tương ứng
    for (const item of orderItems) {
      const { ticket_type, quantity, unit_price } = item;
      for (let i = 0; i < quantity; i++) {
        // Tạo mã QR duy nhất
        const uniqueQR = `QR-${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await conn.query(
          `
          INSERT INTO Ticket (
            Session_Id,
            Order_Id,
            Section_Id,
            Seat_Number,
            Ticket_type,
            Ticket_Price,
            Ticket_Status,
            Unique_QR
          )
          VALUES (?, ?, NULL, NULL, ?, ?, 'UNPAID', ?)
          `,
          [session_id, orderId, ticket_type, unit_price, uniqueQR]
        );
      }
    }

    console.log("Tickets created successfully");

    await conn.commit();
    console.log("=== ORDER CREATED SUCCESSFULLY ===");

    return res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order_id: orderId,
      total_amount: totalAmount,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    console.error("=== CREATE ORDER ERROR ===");
    console.error("Error:", err);
    console.error("SQL Message:", err.sqlMessage);
    console.error("SQL:", err.sql);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  } finally {
    conn.release();
  }
}

/**
 * POST /api/tickets/check-in
 * Body: { ticket_id, order_id } (từ QR code data)
 * Verify và check-in vé
 */
export async function checkInTicket(req, res) {
  const conn = await pool.getConnection();
  try {
    const { ticket_id, order_id } = req.body;

    if (!ticket_id) {
      return res.status(400).json({ message: "Thiếu ticket_id" });
    }

    await conn.beginTransaction();

    // Lấy thông tin vé
    const [ticketRows] = await conn.query(
      `
      SELECT t.*, o.Order_Status, o.Total_Amount, es.Start_Date
      FROM Ticket t
      INNER JOIN \`Order\` o ON t.Order_Id = o.Order_Id
      INNER JOIN Event_Session es ON t.Session_Id = es.Session_Id
      WHERE t.Ticket_Id = ?
      `,
      [ticket_id]
    );

    if (ticketRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Vé không tồn tại" });
    }

    const ticket = ticketRows[0];

    // Kiểm tra order_id khớp (nếu có)
    if (order_id && ticket.Order_Id !== order_id) {
      await conn.rollback();
      return res.status(400).json({ message: "Mã vé không hợp lệ" });
    }

    // Kiểm tra order đã thanh toán chưa
    if (ticket.Order_Status !== 'PAID') {
      await conn.rollback();
      return res.status(400).json({
        message: "Vé chưa được thanh toán",
        current_status: ticket.Order_Status
      });
    }

    // Kiểm tra trạng thái vé
    if (ticket.Ticket_Status === 'CHECKED_IN') {
      await conn.rollback();
      return res.status(400).json({ message: "Vé đã được check-in rồi" });
    }

    if (ticket.Ticket_Status === 'CANCELLED') {
      await conn.rollback();
      return res.status(400).json({ message: "Vé đã bị hủy" });
    }

    // Update trạng thái vé thành CHECKED_IN
    await conn.query(
      `
      UPDATE Ticket
      SET Ticket_Status = 'CHECKED_IN'
      WHERE Ticket_Id = ?
      `,
      [ticket_id]
    );

    await conn.commit();

    return res.json({
      message: "Check-in thành công",
      ticket: {
        ticket_id: ticket.Ticket_Id,
        ticket_type: ticket.Ticket_type,
        session_date: ticket.Start_Date,
        price: ticket.Ticket_Price,
      },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    console.error("Check-in error:", err);
    return res
      .status(500)
      .json({ message: err.sqlMessage || err.message || "Lỗi server" });
  } finally {
    conn.release();
  }
}
