// src/pages/HomePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchEvents } from "../services/api.js";
import EventCard from "../components/EventCard.jsx";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL"); // ALL | UPCOMING | PAST
  const [sortBy, setSortBy] = useState("DATE_ASC"); // DATE_ASC | DATE_DESC | PRICE_ASC | PRICE_DESC

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchEvents()
      .then((res) => {
        console.log("Events from API:", res.data); // <<< thêm dòng này
        setEvents(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // đóng panel khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // list category duy nhất
  const categories = useMemo(() => {
    const set = new Set();
    events.forEach((ev) => {
      if (ev.event_category) set.add(ev.event_category);
    });
    return Array.from(set);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let list = [...events];

    // filter theo category
    if (category !== "ALL") {
      list = list.filter((ev) => ev.event_category === category);
    }

    // filter theo trạng thái
    if (status !== "ALL") {
      list = list.filter((ev) => {
        if (!ev.first_start_date) return false;
        const d = new Date(ev.first_start_date);
        if (status === "UPCOMING") return d >= now;
        if (status === "PAST") return d < now;
        return true;
      });
    }

    // sort
    list.sort((a, b) => {
      const priceA = a.min_price ?? 0;
      const priceB = b.min_price ?? 0;
      const dateA = a.first_start_date ? new Date(a.first_start_date) : null;
      const dateB = b.first_start_date ? new Date(b.first_start_date) : null;

      switch (sortBy) {
        case "PRICE_ASC":
          return priceA - priceB;
        case "PRICE_DESC":
          return priceB - priceA;
        case "DATE_DESC":
          if (!dateA || !dateB) return 0;
          return dateB - dateA;
        case "DATE_ASC":
        default:
          if (!dateA || !dateB) return 0;
          return dateA - dateB;
      }
    });

    return list;
  }, [events, category, status, sortBy]);

  if (loading) return <p>Đang tải sự kiện...</p>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Sự kiện nổi bật</h1>

        {/* NÚT FILTER + PANEL */}
        <div className="filter-container" ref={panelRef}>
          <button
            type="button"
            className="btn btn-secondary filter-button"
            onClick={() => setIsFilterOpen((o) => !o)}
          >
            🔍 Bộ lọc
          </button>

          {isFilterOpen && (
            <div className="filter-panel">
              {/* Category */}
              <div className="filter-panel-section">
                <label>Thể loại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ALL">Tất cả</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="filter-panel-section">
                <label>Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="UPCOMING">Sắp diễn ra</option>
                  <option value="PAST">Đã diễn ra</option>
                </select>
              </div>

              {/* Sort */}
              <div className="filter-panel-section">
                <label>Sắp xếp</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="DATE_ASC">Ngày gần nhất</option>
                  <option value="DATE_DESC">Ngày xa nhất</option>
                  <option value="PRICE_ASC">Giá tăng dần</option>
                  <option value="PRICE_DESC">Giá giảm dần</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIST CARD */}
      <div className="home-events">
        {filteredEvents.map((ev) => (
          <EventCard key={ev.event_id} event={ev} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <p className="muted mt-2">Không có sự kiện nào phù hợp bộ lọc.</p>
      )}
    </div>
  );
}
