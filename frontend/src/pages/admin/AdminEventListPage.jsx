// src/pages/admin/AdminEventListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminSearchEvents,
  adminDeleteEvent,
} from "../../services/api.js";

export default function AdminEventListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState({
    keyword: "",
    category: "",
  });
  const [error, setError] = useState("");

  const loadData = () => {
    adminSearchEvents(filter)
      .then((res) => setEvents(res.data))
      .catch((e) =>
        setError(e.response?.data?.message || "Không tải được dữ liệu")
      );
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa sự kiện này?")) return;

    try {
      await adminDeleteEvent(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa không thành công");
    }
  };

  const handleChangeFilter = (e) =>
    setFilter({ ...filter, [e.target.name]: e.target.value });

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý sự kiện</h1>

        <button
          onClick={() => navigate("/admin/events/new")}
          className="btn btn-primary"
        >
          + Tạo sự kiện
        </button>
      </div>

      {/* FILTER FORM */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 mb-4 items-end"
      >
        <div>
          <label className="text-xs muted">Từ khóa</label>
          <input
            name="keyword"
            value={filter.keyword}
            onChange={handleChangeFilter}
            placeholder="Tên sự kiện..."
          />
        </div>

        <div>
          <label className="text-xs muted">Thể loại</label>
          <input
            name="category"
            value={filter.category}
            onChange={handleChangeFilter}
            placeholder="VD: Concert"
          />
        </div>

        <button className="btn btn-secondary">Tìm kiếm</button>
      </form>

      {/* ERROR MESSAGE */}
      {error && <p className="text-red-400 mb-3 text-sm">{error}</p>}

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên sự kiện</th>
              <th>Thể loại</th>
              <th>Ngôn ngữ</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {events.map((ev) => (
              <tr key={ev.event_id}>
                <td>{ev.event_id}</td>
                <td>{ev.event_name}</td>
                <td>{ev.event_category}</td>
                <td>{ev.primary_language}</td>

                <td className="text-center">
                  <button
                    onClick={() =>
                      navigate(`/admin/events/${ev.event_id}/edit`)
                    }
                    className="btn btn-secondary"
                    style={{ marginRight: "8px" }}
                  >
                    Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(ev.event_id)}
                    className="btn"
                    style={{
                      background: "var(--danger)",
                      color: "#fff",
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center muted py-4">
                  Không có sự kiện nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
