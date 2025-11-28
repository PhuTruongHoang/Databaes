// frontend/src/pages/CheckoutPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { createOrder } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!state) {
    return <p>Không có dữ liệu đặt vé. Vui lòng chọn sự kiện lại.</p>;
  }

  const { event, selectedSession, tiers = [] } = state;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // =========================
  // STATE SỐ LƯỢNG: key = tierId-index (rowKey)
  // =========================
  const [quantities, setQuantities] = useState(() => {
    const init = {};
    tiers.forEach((t, index) => {
      const tierId = t.tier_id || t.Tier_Id;
      const rowKey = `${tierId}-${index}`;
      init[rowKey] = 0;
    });
    return init;
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleQtyChange = (tierRowKey, delta) => {
    setQuantities((prev) => {
      const current = prev[tierRowKey] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [tierRowKey]: next };
    });
  };

  // Danh sách vé đã chọn cho UI (theo từng dòng)
  const selectedTicketList = useMemo(() => {
    return tiers
      .map((t, index) => {
        const tierId = t.tier_id || t.Tier_Id;
        const rowKey = `${tierId}-${index}`;
        const qty = quantities[rowKey] || 0;
        if (qty <= 0) return null;

        const price = t.price ?? t.base_price ?? 0;
        return {
          rowKey,
          tierId,
          name: t.tier_name || t.Tier_Name,
          qty,
          price,
          subtotal: price * qty,
        };
      })
      .filter(Boolean);
  }, [tiers, quantities]);

  // Payload gửi backend: gộp theo tierId { tierId: totalQty }
  const selectedTicketsForPayload = useMemo(() => {
    const result = {};
    tiers.forEach((t, index) => {
      const tierId = t.tier_id || t.Tier_Id;
      const rowKey = `${tierId}-${index}`;
      const qty = quantities[rowKey] || 0;
      if (qty > 0) {
        result[tierId] = (result[tierId] || 0) + qty;
      }
    });
    return result;
  }, [tiers, quantities]);

  const totalPrice = useMemo(
    () =>
      selectedTicketList.reduce(
        (sum, item) => sum + item.subtotal,
        0
      ),
    [selectedTicketList]
  );

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(selectedTicketsForPayload).length === 0) {
      alert("Vui lòng chọn ít nhất 1 vé.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: currentUser?.user_id, // Thêm customer_id từ currentUser
        customer: form,
        event_id: event.event_id || event.Event_Id,
        session_id:
          selectedSession.session_id || selectedSession.Session_Id,
        tickets: selectedTicketsForPayload, // { tier_id: quantity (đã gộp) }
      };
      const response = await createOrder(payload);

      // Tạo orderId (có thể lấy từ response hoặc generate)
      const orderId = response.data?.order_id || Date.now();

      // Chuyển sang trang thanh toán với thông tin đơn hàng
      navigate("/payment", {
        state: {
          orderData: {
            orderId: orderId,
            eventName: event.event_name || event.Event_Name,
            sessionDate: new Date(
              selectedSession.Start_Date || selectedSession.start_datetime
            ).toLocaleString("vi-VN"),
            tickets: selectedTicketList,
            totalAmount: totalPrice,
            customer: form,
          },
        },
      });
    } catch (err) {
      console.error("Error creating order:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi không xác định";
      alert(`Đặt vé thất bại: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date(
    selectedSession.Start_Date || selectedSession.start_datetime
  );

  return (
    <div>
      {/* nút quay lại */}
      <button
        type="button"
        className="back-button mb-3"
        onClick={() => navigate(-1)}
      >
        ← Quay lại trang trước
      </button>

      <div className="checkout-layout">
        {/* LEFT – chỉ chọn vé */}
        <div className="checkout-left">
          <div className="card mb-3">
            <h2 className="section-title mb-2">Chọn vé</h2>
            {tiers.length === 0 && (
              <p className="muted text-xs">
                Hiện chưa cấu hình hạng vé cho suất này.
              </p>
            )}
            <div className="ticket-select-list">
              {tiers.map((t, index) => {
                const tierId = t.tier_id || t.Tier_Id;
                const rowKey = `${tierId}-${index}`;
                const qty = quantities[rowKey] || 0;
                const price = t.price ?? t.base_price ?? 0;

                return (
                  <div key={rowKey} className="ticket-select-item">
                    <div>
                      <div className="ticket-select-name">
                        {(t.tier_name || t.Tier_Name || "").toUpperCase()}
                      </div>
                    </div>
                    <div className="ticket-select-right">
                      <div className="ticket-select-price">
                        {formatPriceWithCurrency(price)}
                      </div>
                      <div className="qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            handleQtyChange(rowKey, -1)
                          }
                        >
                          -
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            handleQtyChange(rowKey, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT – thông tin người mua + tóm tắt đơn hàng */}
        <div className="checkout-right">
          {/* Tóm tắt đơn hàng */}
          <div className="card">
            <h2 className="section-title mb-1">
              Tóm tắt đơn hàng
            </h2>
            <div className="text-sm mb-1">
              {event.event_name || event.Event_Name}
            </div>
            <div className="muted text-xs mb-3">
              Suất: {startDate.toLocaleString("vi-VN")}
            </div>

            <div className="summary-ticket-list">
              {selectedTicketList.length === 0 && (
                <p className="muted text-xs">
                  Chưa chọn vé nào.
                </p>
              )}

              {selectedTicketList.map((item) => (
                <div
                  key={item.rowKey}
                  className="summary-ticket-item"
                >
                  <div>
                    <div className="summary-ticket-name">
                      {item.name.toUpperCase()}
                    </div>
                    <div className="summary-ticket-qty">
                      x{item.qty}
                    </div>
                  </div>
                  <div className="summary-ticket-price">
                    {formatPriceWithCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-total-row">
              <span>Tổng tiền</span>
              <span className="summary-total-value">
                {formatPriceWithCurrency(totalPrice)}
              </span>
            </div>
          </div>
          {/* Thông tin người mua */}
          <form onSubmit={handleSubmit} className="card space-y-3">
            <h2 className="section-title mb-1">
              Thông tin người mua
            </h2>

            <div>
              <label className="text-xs muted">Họ tên</label>
              <input
                required
                name="full_name"
                placeholder="Nguyễn Văn A"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-xs muted">Email</label>
              <input
                required
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-xs muted">
                Số điện thoại
              </label>
              <input
                required
                name="phone"
                placeholder="090..."
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <button
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đặt vé"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
