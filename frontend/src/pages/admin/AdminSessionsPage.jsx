// src/pages/admin/AdminSessionsPage.jsx
import { useEffect, useState } from "react";
import {
  adminGetSessions,
  adminCreateSession,
  adminUpdateSession,
  adminDeleteSession,
  adminGetEvents,
} from "../../services/api.js";

const EMPTY_FORM = {
  event_id: "",
  venue_id: "",
  start_datetime: "",
  end_datetime: "",
  open_datetime: "",
  close_datetime: "",
  session_status: "SCHEDULED",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      // backend nên trả:
      // - /admin/sessions: list session + event_name + venue_name
      // - /admin/events: list event
      // - /admin/venues: list venue
      const [sesRes, evRes, venRes] = await Promise.all([
        adminGetSessions(),
        adminGetEvents(),
        // endpoint venues bạn tự hiện thực ở backend, hoặc đổi tên nếu khác
        // giả sử là /api/admin/venues
        // nếu chưa có hàm thì tạm để [] để không lỗi
        Promise.resolve({ data: [] }).then(() => venResMock()),
      ]);

      setSessions(sesRes.data || []);
      setEvents(evRes.data || []);
      setVenues(venRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // Mock nếu chưa có API venue – bạn nhớ thay bằng gọi thật
  const venResMock = () => ({ data: venues });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (s) => {
    setEditingId(s.session_id);
    setForm({
      event_id: s.event_id,
      venue_id: s.venue_id,
      start_datetime:
        s.start_datetime?.slice(0, 16) ||
        s.Start_Date?.slice(0, 16) ||
        "",
      end_datetime:
        s.end_datetime?.slice(0, 16) ||
        s.End_Date?.slice(0, 16) ||
        "",
      open_datetime:
        s.open_datetime?.slice(0, 16) ||
        s.Open_Date?.slice(0, 16) ||
        "",
      close_datetime:
        s.close_datetime?.slice(0, 16) ||
        s.Close_Date?.slice(0, 16) ||
        "",
      session_status: s.session_status || s.Session_Status || "SCHEDULED",
    });
    setError("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.event_id || !form.venue_id) {
      return setError("Vui lòng chọn sự kiện và địa điểm.");
    }

    try {
      if (editingId) {
        await adminUpdateSession(editingId, form);
      } else {
        await adminCreateSession(form);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Lỗi khi lưu lịch diễn (kiểm tra ràng buộc thời gian / trùng giờ / sức chứa...)."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá lịch diễn này?")) return;
    try {
      await adminDeleteSession(id);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Không thể xoá (có thể đã bán vé hoặc phiên đã diễn ra)."
      );
    }
  };

  if (loading) return <p>Đang tải lịch diễn...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Quản lý lịch diễn (Event_Session)
      </h1>

      {/* FORM TẠO / SỬA */}
      <div className="card mb-4">
        <h2 className="text-lg font-semibold mb-2">
          {editingId ? "Chỉnh sửa lịch diễn" : "Thêm lịch diễn mới"}
        </h2>

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-2"
        >
          <div>
            <label className="text-xs muted">Sự kiện</label>
            <select
              name="event_id"
              value={form.event_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn sự kiện --</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.event_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs muted">Địa điểm</label>
            <select
              name="venue_id"
              value={form.venue_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn venue --</option>
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs muted">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              name="start_datetime"
              value={form.start_datetime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs muted">Thời gian kết thúc</label>
            <input
              type="datetime-local"
              name="end_datetime"
              value={form.end_datetime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs muted">Mở bán từ</label>
            <input
              type="datetime-local"
              name="open_datetime"
              value={form.open_datetime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs muted">Đóng bán lúc</label>
            <input
              type="datetime-local"
              name="close_datetime"
              value={form.close_datetime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs muted">Trạng thái</label>
            <select
              name="session_status"
              value={form.session_status}
              onChange={handleChange}
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button className="btn btn-primary" type="submit">
              {editingId ? "Lưu thay đổi" : "Thêm lịch diễn"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DANH SÁCH LỊCH DIỄN – KHÔNG hiển thị PII */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sự kiện</th>
              <th>Venue</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Trạng thái</th>
              <th>Ghế trống</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.session_id}>
                <td>{s.session_id}</td>
                <td>{s.event_name}</td>
                <td>{s.venue_name}</td>
                <td>{s.start_datetime}</td>
                <td>{s.end_datetime}</td>
                <td>{s.session_status}</td>
                <td>{s.available_seats_count}</td>
                <td className="text-center">
                  <button
                    className="btn btn-secondary mr-2"
                    onClick={() => handleEdit(s)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn"
                    style={{
                      background: "var(--danger)",
                      color: "#fff",
                    }}
                    onClick={() => handleDelete(s.session_id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center muted py-4">
                  Chưa có lịch diễn nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
