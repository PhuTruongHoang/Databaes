// frontend/src/pages/PaymentSuccessPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";

export default function PaymentSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state || !state.orderId) {
      navigate("/");
    }
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h1 className="success-title">Đặt vé thành công!</h1>
        <p className="success-message">
          Cảm ơn bạn đã đặt vé. Vé của bạn đã được gửi về email.
        </p>

        <div className="success-info">
          <div className="info-row">
            <span className="info-label">Mã đơn hàng:</span>
            <span className="info-value">#{state.orderId}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tổng tiền:</span>
            <span className="info-value">
              {formatPriceWithCurrency(state.totalAmount || 0)}
            </span>
          </div>
        </div>

        <div className="success-actions">
          <button
            onClick={() => navigate("/my-tickets")}
            className="btn btn-primary"
          >
            Xem vé của tôi
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn btn-secondary"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
