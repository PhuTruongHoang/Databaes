// src/pages/MyEventsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyEvents } from "../services/api.js";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";

export default function MyEventsPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getMyEvents(currentUser.user_id)
      .then((res) => {
        console.log("My Events data:", res.data);
        setEvents(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) return <p>Đang tải sự kiện...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sự kiện của tôi</h1>
        <Link to="/create-event" className="btn btn-primary">
          + Tạo sự kiện mới
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card text-center" style={{ padding: "48px 24px" }}>
          <p className="muted mb-4" style={{ fontSize: "16px" }}>
            Bạn chưa tạo sự kiện nào.
          </p>
          <Link to="/create-event" className="btn btn-primary">
            Tạo sự kiện đầu tiên
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {events.map((event) => (
            <div
              key={event.event_id}
              className="card"
              style={{
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {/* Poster Image */}
              {event.poster_image ? (
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    backgroundColor: "#1e293b",
                    backgroundImage: `url(${event.poster_image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    marginBottom: "16px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    backgroundColor: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span className="muted" style={{ fontSize: "14px" }}>
                    Chưa có poster
                  </span>
                </div>
              )}

              {/* Event Info */}
              <div style={{ padding: "0 16px 16px 16px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    marginBottom: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.event_name}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>📅</span>
                    <span className="muted" style={{ fontSize: "14px" }}>
                      {event.formatted_date}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>💵</span>
                    <span style={{ fontSize: "14px", color: "#22c55e", fontWeight: "600" }}>
                      {event.min_price > 0
                        ? `Từ ${formatPriceWithCurrency(event.min_price)}`
                        : "Đang cập nhật"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>🎭</span>
                    <span className="muted" style={{ fontSize: "14px" }}>
                      {event.event_category || "Chưa phân loại"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>🌐</span>
                    <span className="muted" style={{ fontSize: "14px" }}>
                      {event.primary_language || "Chưa rõ"}
                    </span>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: event.privacy_level === "PUBLIC" ? "#10b98133" : "#f59e0b33",
                      color: event.privacy_level === "PUBLIC" ? "#10b981" : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {event.privacy_level === "PUBLIC" ? "Công khai" : "Riêng tư"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    to={`/events/${event.event_id}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, textAlign: "center", fontSize: "14px" }}
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
