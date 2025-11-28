// frontend/src/pages/PaymentPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [bankInfo, setBankInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút = 600 giây
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER"); // Phương thức thanh toán mặc định

  useEffect(() => {
    if (!state || !state.orderData) {
      navigate("/");
      return;
    }

    // Lấy mã QR từ backend khi chọn phương thức chuyển khoản
    const fetchPaymentQR = async () => {
      if (paymentMethod !== "BANK_TRANSFER" && paymentMethod !== "MOMO" && paymentMethod !== "ZALOPAY") {
        setLoading(false);
        return;
      }

      try {
        const { orderData } = state;
        const response = await fetch(`http://localhost:5000/api/payment/qr/${orderData.orderId}?method=${paymentMethod}`);

        if (!response.ok) {
          throw new Error('Không thể tạo mã QR thanh toán');
        }

        const data = await response.json();

        // Lưu URL mã QR và thông tin ngân hàng
        setQrCodeUrl(data.qr_url);
        setBankInfo(data.bank_info);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching payment QR:", error);
        setLoading(false);
      }
    };

    fetchPaymentQR();
  }, [state, navigate, paymentMethod]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!state || !state.orderData) {
    return null;
  }

  const { orderData } = state;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleConfirmPayment = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/payment/confirm/${orderData.orderId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_method: paymentMethod,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Xác nhận thanh toán thất bại');
      }

      // Chuyển sang trang success
      navigate("/payment-success", {
        state: {
          orderId: orderData.orderId,
          totalAmount: orderData.totalAmount,
          paymentMethod: paymentMethod,
        },
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert('Có lỗi xảy ra khi xác nhận thanh toán');
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="payment-title">Thanh toán đơn hàng</h1>

        {/* Countdown timer */}
        <div className="payment-timer">
          <div className="timer-icon">⏰</div>
          <div>
            <div className="timer-label">Thời gian còn lại</div>
            <div className="timer-value">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="payment-content">
          {/* Left: Payment Method Selection & QR Code */}
          <div className="payment-left">
            {/* Payment Method Selection */}
            <div className="payment-method-section" style={{ marginBottom: "24px" }}>
              <h2 className="qr-title" style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
                Chọn phương thức thanh toán
              </h2>
              <div className="payment-methods" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label className="payment-method-option" style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  border: paymentMethod === "BANK_TRANSFER" ? "3px solid #3B82F6" : "2px solid #D1D5DB",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: paymentMethod === "BANK_TRANSFER" ? "0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)" : "none"
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      marginRight: "14px",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#3B82F6"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "16px", color: "#111827", marginBottom: "4px" }}>
                      Chuyển khoản ngân hàng
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>Quét mã QR VietQR - Nhanh chóng, an toàn</div>
                  </div>
                </label>

                <label className="payment-method-option" style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  border: paymentMethod === "MOMO" ? "3px solid #A50064" : "2px solid #D1D5DB",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: paymentMethod === "MOMO" ? "0 4px 6px -1px rgba(165, 0, 100, 0.2), 0 2px 4px -1px rgba(165, 0, 100, 0.1)" : "none"
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOMO"
                    checked={paymentMethod === "MOMO"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      marginRight: "14px",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#A50064"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "16px", color: "#111827", marginBottom: "4px" }}>
                      Ví MoMo
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>Thanh toán qua ví điện tử MoMo</div>
                  </div>
                </label>

                <label className="payment-method-option" style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  border: paymentMethod === "ZALOPAY" ? "3px solid #0068FF" : "2px solid #D1D5DB",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: paymentMethod === "ZALOPAY" ? "0 4px 6px -1px rgba(0, 104, 255, 0.2), 0 2px 4px -1px rgba(0, 104, 255, 0.1)" : "none"
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ZALOPAY"
                    checked={paymentMethod === "ZALOPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      marginRight: "14px",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#0068FF"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "16px", color: "#111827", marginBottom: "4px" }}>
                      ZaloPay
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>Thanh toán qua ví điện tử ZaloPay</div>
                  </div>
                </label>

                <label className="payment-method-option" style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  border: paymentMethod === "CREDIT_CARD" ? "3px solid #10B981" : "2px solid #D1D5DB",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: paymentMethod === "CREDIT_CARD" ? "0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)" : "none"
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CREDIT_CARD"
                    checked={paymentMethod === "CREDIT_CARD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      marginRight: "14px",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#10B981"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "16px", color: "#111827", marginBottom: "4px" }}>
                      Thẻ tín dụng/Ghi nợ
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>Visa, Mastercard, JCB</div>
                  </div>
                </label>

                <label className="payment-method-option" style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  border: paymentMethod === "CASH" ? "3px solid #F59E0B" : "2px solid #D1D5DB",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: paymentMethod === "CASH" ? "0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1)" : "none"
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === "CASH"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      marginRight: "14px",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "#F59E0B"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "16px", color: "#111827", marginBottom: "4px" }}>
                      Thanh toán tại quầy
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>Thanh toán bằng tiền mặt khi nhận vé</div>
                  </div>
                </label>
              </div>
            </div>

            {/* QR Code Section - Only show for QR-based methods */}
            {(paymentMethod === "BANK_TRANSFER" || paymentMethod === "MOMO" || paymentMethod === "ZALOPAY") && (
              <div className="qr-section">
                <h2 className="qr-title">
                  {paymentMethod === "BANK_TRANSFER" ? "Quét mã QR để thanh toán" : "Thanh toán"}
                </h2>
                {loading ? (
                  <div className="qr-loading">Đang tạo mã thanh toán...</div>
                ) : qrCodeUrl ? (
                  <div className="qr-code-wrapper">
                    {/* Kiểm tra xem có phải là URL image hay payment URL */}
                    {qrCodeUrl.includes('.jpg') || qrCodeUrl.includes('.png') || qrCodeUrl.includes('vietqr.io') ? (
                      <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <p style={{ marginBottom: "16px", fontSize: "14px", color: "#6B7280" }}>
                          Nhấn nút bên dưới để mở app {paymentMethod === "MOMO" ? "MoMo" : "ZaloPay"}
                        </p>
                        <a
                          href={qrCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "12px 24px",
                            backgroundColor: paymentMethod === "MOMO" ? "#A50064" : "#0068FF",
                            color: "white",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "600",
                            fontSize: "16px"
                          }}
                        >
                          Mở {paymentMethod === "MOMO" ? "MoMo" : "ZaloPay"}
                        </a>
                        <div style={{ marginTop: "16px" }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}`}
                            alt="QR Code"
                            style={{ maxWidth: "250px", border: "2px solid #E5E7EB", borderRadius: "8px" }}
                          />
                          <p style={{ marginTop: "8px", fontSize: "12px", color: "#9CA3AF" }}>
                            Hoặc quét mã QR bằng app {paymentMethod === "MOMO" ? "MoMo" : "ZaloPay"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="qr-loading">Không thể tạo mã thanh toán</div>
                )}
                <div className="qr-instructions">
                  <p className="qr-step">
                    1. {paymentMethod === "BANK_TRANSFER"
                      ? "Mở app Ngân hàng"
                      : `Nhấn nút hoặc quét mã QR bằng app ${paymentMethod === "MOMO" ? "MoMo" : "ZaloPay"}`}
                  </p>
                  <p className="qr-step">
                    2. {paymentMethod === "BANK_TRANSFER"
                      ? "Quét mã QR phía trên"
                      : "Xác nhận thông tin giao dịch"}
                  </p>
                  <p className="qr-step">
                    3. {paymentMethod === "BANK_TRANSFER"
                      ? "Kiểm tra thông tin và xác nhận thanh toán"
                      : "Nhập mã PIN và hoàn tất thanh toán"}
                  </p>
                </div>
              </div>
            )}

            {/* Credit Card Form */}
            {paymentMethod === "CREDIT_CARD" && (
              <div className="credit-card-form" style={{
                padding: "24px",
                backgroundColor: "#F9FAFB",
                borderRadius: "12px",
                border: "1px solid #E5E7EB"
              }}>
                <h2 style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: "20px",
                  paddingBottom: "12px",
                  borderBottom: "2px solid #10B981"
                }}>
                  Thông tin thẻ
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>
                      Số thẻ
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: "2px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "15px",
                        backgroundColor: "white",
                        transition: "border 0.2s"
                      }}
                      onFocus={(e) => e.target.style.border = "2px solid #10B981"}
                      onBlur={(e) => e.target.style.border = "2px solid #D1D5DB"}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151"
                      }}>
                        Ngày hết hạn
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          border: "2px solid #D1D5DB",
                          borderRadius: "8px",
                          fontSize: "15px",
                          backgroundColor: "white",
                          transition: "border 0.2s"
                        }}
                        onFocus={(e) => e.target.style.border = "2px solid #10B981"}
                        onBlur={(e) => e.target.style.border = "2px solid #D1D5DB"}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151"
                      }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          border: "2px solid #D1D5DB",
                          borderRadius: "8px",
                          fontSize: "15px",
                          backgroundColor: "white",
                          transition: "border 0.2s"
                        }}
                        onFocus={(e) => e.target.style.border = "2px solid #10B981"}
                        onBlur={(e) => e.target.style.border = "2px solid #D1D5DB"}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>
                      Tên chủ thẻ
                    </label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: "2px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "15px",
                        backgroundColor: "white",
                        transition: "border 0.2s",
                        textTransform: "uppercase"
                      }}
                      onFocus={(e) => e.target.style.border = "2px solid #10B981"}
                      onBlur={(e) => e.target.style.border = "2px solid #D1D5DB"}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Payment Info */}
            {paymentMethod === "CASH" && (
              <div className="cash-payment-info" style={{ padding: "20px", backgroundColor: "#FEF3C7", borderRadius: "8px", border: "1px solid #FCD34D" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#92400E" }}>Lưu ý thanh toán tại quầy</h3>
                <ul style={{ listStyle: "disc", paddingLeft: "20px", color: "#78350F", fontSize: "14px", lineHeight: "1.6" }}>
                  <li>Vui lòng đến quầy vé trước giờ sự kiện ít nhất 30 phút</li>
                  <li>Mang theo mã đơn hàng: <strong>#{orderData.orderId}</strong></li>
                  <li>Xuất trình CMND/CCCD để xác nhận</li>
                  <li>Đơn hàng sẽ bị hủy nếu không thanh toán trước 24h</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="payment-right">
            <div className="order-summary-card">
              <h2 className="summary-title">Thông tin đơn hàng</h2>

              <div className="summary-row">
                <span className="summary-label">Mã đơn hàng:</span>
                <span className="summary-value">#{orderData.orderId}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Sự kiện:</span>
                <span className="summary-value">{orderData.eventName}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Suất diễn:</span>
                <span className="summary-value">{orderData.sessionDate}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-tickets">
                <h3 className="tickets-title">Chi tiết vé</h3>
                {orderData.tickets.map((ticket, idx) => (
                  <div key={idx} className="ticket-row">
                    <div className="ticket-info">
                      <span className="ticket-name">{ticket.name}</span>
                      <span className="ticket-qty">x{ticket.qty}</span>
                    </div>
                    <span className="ticket-price">
                      {formatPriceWithCurrency(ticket.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">Tổng tiền</span>
                <span className="total-value">
                  {formatPriceWithCurrency(orderData.totalAmount)}
                </span>
              </div>

              {/* Only show bank info for bank transfer */}
              {(paymentMethod === "BANK_TRANSFER" || paymentMethod === "MOMO" || paymentMethod === "ZALOPAY") && (
                <div className="payment-info">
                  <h3 className="payment-info-title">
                    {paymentMethod === "MOMO" ? "Thông tin MoMo" :
                     paymentMethod === "ZALOPAY" ? "Thông tin ZaloPay" :
                     "Thông tin chuyển khoản"}
                  </h3>
                  {bankInfo ? (
                    <>
                      <div className="payment-detail">
                        <span className="detail-label">
                          {paymentMethod === "MOMO" || paymentMethod === "ZALOPAY" ? "Ví điện tử:" : "Ngân hàng:"}
                        </span>
                        <span className="detail-value">{bankInfo.bank_name}</span>
                      </div>
                      {bankInfo.account_no && (
                        <div className="payment-detail">
                          <span className="detail-label">Số tài khoản:</span>
                          <span className="detail-value">{bankInfo.account_no}</span>
                        </div>
                      )}
                      <div className="payment-detail">
                        <span className="detail-label">Chủ tài khoản:</span>
                        <span className="detail-value">{bankInfo.account_name}</span>
                      </div>
                      <div className="payment-detail">
                        <span className="detail-label">Nội dung:</span>
                        <span className="detail-value highlight">
                          {bankInfo.transfer_content}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>Đang tải thông tin...</div>
                  )}
                </div>
              )}

              {/* Payment method summary */}
              <div className="payment-info" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E5E7EB" }}>
                <div className="payment-detail">
                  <span className="detail-label">Phương thức:</span>
                  <span className="detail-value" style={{ fontWeight: "600" }}>
                    {paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản ngân hàng" :
                     paymentMethod === "MOMO" ? "Ví MoMo" :
                     paymentMethod === "ZALOPAY" ? "ZaloPay" :
                     paymentMethod === "CREDIT_CARD" ? "Thẻ tín dụng" :
                     "Thanh toán tại quầy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Demo button - xác nhận đã thanh toán */}
            <button
              onClick={handleConfirmPayment}
              className="btn btn-primary w-full"
              style={{ marginTop: "16px" }}
            >
              Tôi đã thanh toán
            </button>

            <button
              onClick={() => navigate("/")}
              className="btn btn-secondary w-full"
              style={{ marginTop: "8px" }}
            >
              Hủy đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
