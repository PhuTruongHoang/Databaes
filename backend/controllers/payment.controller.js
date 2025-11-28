// controllers/payment.controller.js
import { pool } from "../db.js";
import crypto from "crypto";

/**
 * GET /api/payment/qr/:orderId
 * Tạo URL VietQR cho thanh toán đơn hàng
 */
export async function getPaymentQR(req, res) {
  try {
    const { orderId } = req.params;
    const { method = "BANK_TRANSFER" } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    // Lấy thông tin đơn hàng
    const [orderRows] = await pool.query(
      `SELECT Order_Id, Total_Amount, Order_Status
       FROM \`Order\`
       WHERE Order_Id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const order = orderRows[0];
    const amount = Math.round(order.Total_Amount);
    const transferContent = `TICKETBOX ${orderId}`;

    let qrUrl = "";
    let bankInfo = {};

    console.log("=== Payment QR Debug ===");
    console.log("Order ID:", orderId);
    console.log("Payment Method:", method);
    console.log("Amount:", amount);

    switch (method) {
      case "BANK_TRANSFER":
        // Thông tin ngân hàng
        const bankConfig = {
          bankId: "970407", // Mã ngân hàng Techcombank
          accountNo: "131220056969",
          accountName: "TRINH GIA HIEP",
        };

        qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-print.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

        bankInfo = {
          bank_name: "Techcombank",
          account_no: bankConfig.accountNo,
          account_name: bankConfig.accountName,
          transfer_content: transferContent,
        };
        break;

      case "MOMO":
        // MoMo Payment Integration
        // Cấu hình MoMo (thay thế bằng thông tin thực tế từ MoMo Developer)
        const momoConfig = {
          partnerCode: "MOMO", // Thay bằng Partner Code thực tế
          accessKey: "F8BBA842ECF85", // Thay bằng Access Key thực tế
          secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz", // Thay bằng Secret Key thực tế
          redirectUrl: "http://localhost:3000/payment-success",
          ipnUrl: "http://localhost:5000/api/payment/momo/callback",
          requestType: "captureWallet",
          orderInfo: transferContent,
          amount: amount.toString(),
          orderId: `MOMO${orderId}`,
          requestId: `MOMO${orderId}${Date.now()}`,
        };

        // Tạo chữ ký (signature) cho MoMo
        const momoRawSignature =
          `accessKey=${momoConfig.accessKey}&amount=${momoConfig.amount}&extraData=&ipnUrl=${momoConfig.ipnUrl}&orderId=${momoConfig.orderId}&orderInfo=${momoConfig.orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${momoConfig.requestId}&requestType=${momoConfig.requestType}`;

        const momoSignature = crypto
          .createHmac("sha256", momoConfig.secretKey)
          .update(momoRawSignature)
          .digest("hex");

        // Gọi MoMo API để tạo link thanh toán
        try {
          const momoResponse = await fetch("https://test-payment.momo.vn/v2/gateway/api/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              partnerCode: momoConfig.partnerCode,
              accessKey: momoConfig.accessKey,
              requestId: momoConfig.requestId,
              amount: momoConfig.amount,
              orderId: momoConfig.orderId,
              orderInfo: momoConfig.orderInfo,
              redirectUrl: momoConfig.redirectUrl,
              ipnUrl: momoConfig.ipnUrl,
              requestType: momoConfig.requestType,
              extraData: "",
              lang: "vi",
              signature: momoSignature,
            }),
          });

          const momoData = await momoResponse.json();
          console.log("MoMo API Response:", momoData);

          if (momoData.resultCode === 0) {
            // Thành công - sử dụng QR code từ MoMo
            qrUrl = momoData.qrCodeUrl || momoData.payUrl;
          } else {
            // Lỗi từ MoMo - fallback về VietQR
            console.error("MoMo API Error:", momoData.message);
            // Sử dụng VietQR format cho MoMo thay thế
            qrUrl = `https://img.vietqr.io/image/970422-0987654321-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent("TRINH GIA HIEP")}`;
          }
        } catch (error) {
          console.error("MoMo API Call Error:", error);
          // Fallback về VietQR nếu không gọi được MoMo API
          qrUrl = `https://img.vietqr.io/image/970422-0987654321-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent("TRINH GIA HIEP")}`;
        }

        bankInfo = {
          bank_name: "MoMo",
          account_name: "TRINH GIA HIEP",
          transfer_content: transferContent,
        };
        break;

      case "ZALOPAY":
        // ZaloPay Payment Integration
        // Cấu hình ZaloPay (thay thế bằng thông tin thực tế từ ZaloPay Developer)
        const zaloConfig = {
          app_id: "2553", // Thay bằng App ID thực tế từ ZaloPay
          key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL", // Thay bằng Key1 thực tế
          key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz", // Thay bằng Key2 thực tế
          endpoint: "https://sb-openapi.zalopay.vn/v2/create", // Sandbox endpoint
        };

        const embed_data = {
          redirecturl: "http://localhost:3000/payment-success",
        };

        const items = [{
          itemid: orderId.toString(),
          itemname: transferContent,
          itemprice: amount,
          itemquantity: 1,
        }];

        const transID = `${Date.now()}`;
        const zaloOrder = {
          app_id: zaloConfig.app_id,
          app_trans_id: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}_${transID}`,
          app_user: "user123",
          app_time: Date.now(),
          item: JSON.stringify(items),
          embed_data: JSON.stringify(embed_data),
          amount: amount,
          description: transferContent,
          bank_code: "",
          callback_url: "http://localhost:5000/api/payment/zalopay/callback",
        };

        // Tạo chữ ký cho ZaloPay
        const zaloData =
          zaloConfig.app_id +
          "|" +
          zaloOrder.app_trans_id +
          "|" +
          zaloOrder.app_user +
          "|" +
          zaloOrder.amount +
          "|" +
          zaloOrder.app_time +
          "|" +
          zaloOrder.embed_data +
          "|" +
          zaloOrder.item;

        zaloOrder.mac = crypto
          .createHmac("sha256", zaloConfig.key1)
          .update(zaloData)
          .digest("hex");

        // Gọi ZaloPay API để tạo đơn hàng
        try {
          const zaloResponse = await fetch(zaloConfig.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(zaloOrder).toString(),
          });

          const zaloResponseData = await zaloResponse.json();
          console.log("ZaloPay API Response:", zaloResponseData);

          if (zaloResponseData.return_code === 1) {
            // Thành công - sử dụng order URL từ ZaloPay
            qrUrl = zaloResponseData.order_url;
          } else {
            // Lỗi từ ZaloPay - fallback về VietQR
            console.error("ZaloPay API Error:", zaloResponseData.return_message);
            // Sử dụng VietQR format cho ZaloPay thay thế (mã ngân hàng VietinBank - hỗ trợ ZaloPay)
            qrUrl = `https://img.vietqr.io/image/970415-0987654321-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent("TRINH GIA HIEP")}`;
          }
        } catch (error) {
          console.error("ZaloPay API Call Error:", error);
          // Fallback về VietQR nếu không gọi được ZaloPay API
          qrUrl = `https://img.vietqr.io/image/970415-0987654321-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent("TRINH GIA HIEP")}`;
        }

        bankInfo = {
          bank_name: "ZaloPay",
          account_name: "TRINH GIA HIEP",
          transfer_content: transferContent,
        };
        break;

      default:
        return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    console.log("QR URL:", qrUrl);

    return res.json({
      success: true,
      order_id: orderId,
      total_amount: order.Total_Amount,
      payment_method: method,
      qr_url: qrUrl,
      bank_info: bankInfo,
    });
  } catch (err) {
    console.error("GET /api/payment/qr/:orderId error:", err);
    return res.status(500).json({
      message: err.message || "Lỗi khi tạo mã QR thanh toán",
    });
  }
}

/**
 * POST /api/payment/confirm/:orderId
 * Xác nhận thanh toán đơn hàng (sau khi khách chuyển khoản)
 */
export async function confirmPayment(req, res) {
  const conn = await pool.getConnection();

  try {
    const { orderId } = req.params;
    const { payment_method = "BANK_TRANSFER" } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    await conn.beginTransaction();

    // Kiểm tra đơn hàng tồn tại
    const [orderRows] = await conn.query(
      `SELECT Order_Id, Order_Status FROM \`Order\` WHERE Order_Id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trạng thái Order
    await conn.query(
      `UPDATE \`Order\` SET Order_Status = 'PAID' WHERE Order_Id = ?`,
      [orderId]
    );

    // Cập nhật trạng thái Ticket
    await conn.query(
      `UPDATE Ticket SET Ticket_Status = 'PAID' WHERE Order_Id = ?`,
      [orderId]
    );

    // Tạo bản ghi Payment
    await conn.query(
      `INSERT INTO Payment (Order_Id, Payment_Datetime, Payment_Status, Payment_Method)
       VALUES (?, NOW(), 'SUCCESS', ?)`,
      [orderId, payment_method]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: "Xác nhận thanh toán thành công",
      order_id: orderId,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    console.error("POST /api/payment/confirm/:orderId error:", err);
    return res.status(500).json({
      message: err.message || "Lỗi khi xác nhận thanh toán",
    });
  } finally {
    conn.release();
  }
}
