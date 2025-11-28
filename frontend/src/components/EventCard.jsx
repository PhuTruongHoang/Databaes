// src/components/EventCard.jsx
import { useNavigate } from "react-router-dom";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";

export default function EventCard({ event }) {
  const navigate = useNavigate();

  const minPrice = event.min_price || 0;
  const hasDate = !!event.first_start_date;
  const dateObj = hasDate ? new Date(event.first_start_date) : null;

  const formattedPrice = minPrice > 0
    ? formatPriceWithCurrency(minPrice)
    : "Đang cập nhật";

  const formattedDate = hasDate
    ? dateObj.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Chưa có lịch";

  const handleClick = () => {
    navigate(`/events/${event.event_id}`);
  };

  return (
    <div
      className="card event-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {/* Hình poster */}
      <div className="card-header-image">
        {event.poster_image && (
          <img
            src={event.poster_image}
            alt={event.event_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "12px 12px 0 0",
            }}
          />
        )}
      </div>

      <div className="card-body">
        {/* Tiêu đề */}
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {event.event_name}
        </h2>

        {/* Giá bắt đầu */}
        <p
          style={{
            marginTop: 4,
            marginBottom: 4,
            fontWeight: 500,
            color: "#22c55e",
            fontSize: 16,
          }}
        >
          Từ {formattedPrice}
        </p>

        {/* Ngày */}
        <p
          style={{
            marginTop: 4,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: 6 }}>📅</span>
          <span>{formattedDate}</span>
        </p>
      </div>
    </div>
  );
}
