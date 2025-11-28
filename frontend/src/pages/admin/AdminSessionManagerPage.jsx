// frontend/src/pages/admin/AdminSessionManagerPage.jsx
import { useEffect, useState } from "react";
import {
  getMyEvents,
  adminGetSessions,
  adminGetOpenSessions,
  adminCreateSession,
  adminUpdateSession,
  adminDeleteSession,
} from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminSessionManagerPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Chế độ hiển thị: "all" hoặc "open_only"
  const [viewMode, setViewMode] = useState("all");

  // Filter
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    venue_id: "",
    available_seats_count: "",
    session_status: "SCHEDULED",
  });

  const [editingSession, setEditingSession] = useState(null); // null = đang tạo mới
  const [showModal, setShowModal] = useState(false); // Điều khiển hiển thị modal
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ====== LOAD DANH SÁCH SỰ KIỆN CỦA ORGANIZER HIỆN TẠI ======
  useEffect(() => {
    if (!currentUser) return;

    // Chỉ lấy sự kiện của organizer hiện tại
    getMyEvents(currentUser.user_id)
      .then((res) => {
        setEvents(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Không tải được danh sách sự kiện của bạn.");
      });
  }, [currentUser]);

  // ====== LOAD SESSIONS KHI CHỌN EVENT ======
  const loadSessions = () => {
    if (!selectedEventId) return;
    setLoadingSessions(true);
    setError("");

    // Gọi thủ tục tương ứng với viewMode
    const apiCall = viewMode === "open_only"
      ? adminGetOpenSessions(selectedEventId)  // Gọi sp_GetOpenSessions (2.3)
      : adminGetSessions(selectedEventId);     // Gọi query thông thường

    apiCall
      .then((res) => {
        setSessions(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err.response?.data?.message || "Không tải được danh sách buổi diễn."
        );
      })
      .finally(() => setLoadingSessions(false));
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, viewMode]);

  // ====== FILTER SESSIONS THEO STATUS ======
  const filteredSessions = sessions.filter((s) => {
    // Filter theo status
    if (filterStatus) {
      const status = s.session_status || s.Session_Status || "";
      if (status !== filterStatus) {
        return false;
      }
    }

    return true;
  });

  // ====== HANDLER FORM ======
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      date: "",
      start_time: "",
      end_time: "",
      venue_id: "",
      available_seats_count: "",
      session_status: "SCHEDULED",
    });
    setEditingSession(null);
    setShowModal(false);
    setError("");
    setMessage("");
  };

  const startEditSession = (s) => {
    // s có thể trả về dạng cột khác nhau (Start_Date / start_date / start_datetime / Thoi_Gian_Bat_Dau...)
    const start = new Date(s.Start_Date || s.start_date || s.start_datetime || s.Thoi_Gian_Bat_Dau);
    const end = new Date(s.End_Date || s.end_date || s.end_datetime || s.Thoi_Gian_Ket_Thuc);

    const toDateInput = (d) =>
      d.toISOString().slice(0, 10); // yyyy-mm-dd
    const toTimeInput = (d) =>
      d.toTimeString().slice(0, 5); // hh:mm

    // Lưu session với session_id chuẩn hóa
    const normalizedSession = {
      ...s,
      session_id: s.session_id || s.Session_Id || s.Ma_Suat_Dien,
      venue_id: s.venue_id || s.Venue_Id,
    };

    setEditingSession(normalizedSession);
    setForm({
      date: toDateInput(start),
      start_time: toTimeInput(start),
      end_time: toTimeInput(end),
      venue_id: s.venue_id || s.Venue_Id || "",
      available_seats_count:
        s.available_seats_count ?? s.Available_Seats_Count ?? s.So_Ghe_Trong ?? "",
      session_status: s.session_status || s.Session_Status || "SCHEDULED",
    });
    setShowModal(true); // Hiển thị modal khi bấm sửa
    setError("");
    setMessage("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ====== VALIDATE FORM ======
  const validateForm = () => {
    if (!selectedEventId) {
      setError("Vui lòng chọn sự kiện trước khi tạo / sửa buổi diễn.");
      return false;
    }
    if (!form.date || !form.start_time || !form.end_time) {
      setError("Vui lòng nhập đầy đủ ngày, giờ bắt đầu và giờ kết thúc.");
      return false;
    }
    if (!form.venue_id) {
      setError("Vui lòng nhập Venue ID (theo dtb).");
      return false;
    }
    if (!form.available_seats_count) {
      setError("Vui lòng nhập số ghế khả dụng.");
      return false;
    }
    if (Number(form.available_seats_count) <= 0) {
      setError("Số ghế khả dụng phải > 0.");
      return false;
    }
    return true;
  };

  // Helper convert date + time -> datetime string (backend / SP dùng)
  const buildDateTime = (date, time) => {
    // yyyy-mm-ddTHH:MM -> yyyy-mm-dd HH:MM:00
    return `${date} ${time}:00`;
  };

  // ====== SUBMIT: CREATE / UPDATE ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateForm()) return;

    const payload = {
      event_id: Number(selectedEventId),
      venue_id: Number(form.venue_id),
      start_datetime: buildDateTime(form.date, form.start_time),
      end_datetime: buildDateTime(form.date, form.end_time),
      available_seats_count: Number(form.available_seats_count),
      session_status: form.session_status,
    };

    try {
      if (!editingSession) {
        // CREATE → gọi thủ tục InsertEventSession qua backend
        await adminCreateSession(payload);
        setMessage("Đã tạo buổi diễn mới.");
      } else {
        // UPDATE → gọi thủ tục UpdateEventSession
        const sessionId = editingSession.session_id || editingSession.Session_Id;
        await adminUpdateSession(sessionId, payload);
        setMessage("Đã cập nhật buổi diễn.");
      }
      resetForm();
      loadSessions();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu buổi diễn (có thể do trigger / procedure)."
      );
    }
  };

  // ====== DELETE ======
  const handleDeleteSession = async (s) => {
    const id = s.session_id || s.Session_Id;
    if (!id) return;

    if (
      !confirm(
        `Bạn có chắc muốn xóa buổi diễn #${id}? Hành động này sẽ gọi thủ tục xóa session.`
      )
    )
      return;

    setError("");
    setMessage("");

    try {
      await adminDeleteSession(id);
      setMessage("Đã xóa buổi diễn.");
      loadSessions();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không xóa được buổi diễn (có thể do ràng buộc dữ liệu)."
      );
    }
  };

  // ====== RENDER ======
  return (
    <div>
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">
        Quản lý lịch diễn (Event Sessions)
      </h1>

      <p className="muted mb-4 text-sm">
        <b>PHẦN 3.1 & 3.2 BTL2:</b> Trang này minh họa đầy đủ yêu cầu:
        <br />
        • <b>3.1:</b> Thêm/sửa/xóa Event_Session (gọi stored procedures 2.1)
        <br />
        • <b>3.2:</b> Hiển thị danh sách từ thủ tục <code>sp_GetOpenSessions</code> (2.3),
        có search, filter, sắp xếp, cập nhật/xóa từ danh sách
      </p>

      {/* CHỌN SỰ KIỆN */}
      <div className="card mb-4">
        <h2 className="section-title mb-2">Chọn sự kiện của bạn</h2>
        <p className="muted text-sm mb-2">
          Chọn từ danh sách sự kiện mà bạn đã tạo để quản lý lịch diễn.
          {events.length === 0 && " (Bạn chưa tạo sự kiện nào)"}
        </p>

        {events.length > 0 ? (
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              resetForm();
            }}
          >
            <option value="">-- Chọn sự kiện --</option>
            {events.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                #{ev.event_id} - {ev.event_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-center py-4">
            <p className="muted mb-3">
              Bạn chưa có sự kiện nào. Hãy tạo sự kiện trước khi quản lý lịch diễn.
            </p>
            <a href="/create-event" className="btn btn-primary">
              + Tạo sự kiện đầu tiên
            </a>
          </div>
        )}
      </div>

      {/* DANH SÁCH SESSIONS */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h2 className="section-title">
            Danh sách buổi diễn
            {viewMode === "open_only" && " (Chỉ buổi mở bán - sp_GetOpenSessions)"}
          </h2>
          {selectedEventId && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              + Tạo buổi diễn mới
            </button>
          )}
        </div>

        {/* FILTER CONTROLS (PHẦN 3.2) */}
        <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Toggle chế độ xem */}
            <div>
              <label className="text-xs muted mb-1 block">Chế độ xem</label>
              <select
                className="input w-full"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="all">Tất cả sessions</option>
                <option value="open_only">Chỉ sessions đang mở bán (sp_GetOpenSessions)</option>
              </select>
            </div>

            {/* Filter theo status */}
            <div>
              <label className="text-xs muted mb-1 block">Lọc theo trạng thái</label>
              <select
                className="input w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Reset filters */}
            <div className="flex items-end">
              <button
                className="btn btn-secondary w-full"
                onClick={() => {
                  setFilterStatus("");
                }}
              >
                Reset filter
              </button>
            </div>
          </div>

          <p className="text-xs muted mt-2">
            Đang hiển thị {filteredSessions.length} / {sessions.length} buổi diễn
          </p>
        </div>

        {loadingSessions ? (
          <p className="muted">Đang tải buổi diễn.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Venue</th>
                  <th>Số ghế còn</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => {
                  // Xử lý cả 2 trường hợp: query thông thường và sp_GetOpenSessions
                  const sid = s.session_id || s.Session_Id || s.Ma_Suat_Dien;
                  const start = new Date(
                    s.Start_Date || s.start_date || s.start_datetime || s.Thoi_Gian_Bat_Dau
                  );
                  const end = new Date(
                    s.End_Date || s.end_date || s.end_datetime || s.Thoi_Gian_Ket_Thuc
                  );

                  const dateStr = start.toLocaleDateString("vi-VN");
                  const timeStr = `${start.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${end.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;

                  const venueName =
                    s.Venue_Name || s.venue_name || s.Dia_Diem || `#${s.venue_id || s.Venue_Id}`;
                  const available =
                    s.available_seats_count ?? s.Available_Seats_Count ?? s.So_Ghe_Trong;
                  const status = s.session_status || s.Session_Status || "Open";

                  return (
                    <tr key={sid}>
                      <td>{dateStr}</td>
                      <td>{timeStr}</td>
                      <td>{venueName}</td>
                      <td>{available}</td>
                      <td>{status}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: 8 }}
                          onClick={() => startEditSession(s)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn"
                          style={{
                            background: "var(--danger)",
                            color: "#fff",
                          }}
                          onClick={() => handleDeleteSession(s)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSessions.length === 0 && sessions.length > 0 && (
                  <tr>
                    <td colSpan="6" className="text-center muted py-4">
                      Không tìm thấy buổi diễn phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center muted py-4">
                      Chưa có buổi diễn nào cho sự kiện này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* THÔNG BÁO LỖI / THÀNH CÔNG */}
      {error && <p className="text-red-400 text-sm mt-4 mb-2">{error}</p>}
      {message && <p className="text-sm mt-4 mb-2">{message}</p>}

      {/* FORM SỬA SESSION (Hiển thị dưới danh sách khi đang sửa) */}
      {showModal && editingSession && (
        <div className="card mt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="section-title">Sửa buổi diễn</h2>
            <button
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Hủy
            </button>
          </div>

          {/* Hiển thị thông tin ban đầu */}
          <div className="mb-4 p-3 bg-slate-700 rounded">
            <h3 className="text-sm font-semibold mb-2">Thông tin hiện tại:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="muted">Ngày: </span>
                <span>{new Date(editingSession.Start_Date || editingSession.start_date).toLocaleDateString("vi-VN")}</span>
              </div>
              <div>
                <span className="muted">Giờ: </span>
                <span>
                  {new Date(editingSession.Start_Date || editingSession.start_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(editingSession.End_Date || editingSession.end_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span className="muted">Venue: </span>
                <span>{editingSession.Venue_Name || editingSession.venue_name || `#${editingSession.venue_id || editingSession.Venue_Id}`}</span>
              </div>
              <div>
                <span className="muted">Số ghế: </span>
                <span>{editingSession.available_seats_count ?? editingSession.Available_Seats_Count}</span>
              </div>
              <div>
                <span className="muted">Trạng thái: </span>
                <span>{editingSession.session_status || editingSession.Session_Status}</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div>
              <label className="text-xs muted">Ngày diễn (mm/dd/yyyy)</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChangeForm}
                style={{
                  color: form.date !== new Date(editingSession.Start_Date || editingSession.start_date).toISOString().slice(0, 10) ? '#fbbf24' : 'inherit'
                }}
              />
            </div>

            <div>
              <label className="text-xs muted">Giờ bắt đầu</label>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChangeForm}
                style={{
                  color: form.start_time !== new Date(editingSession.Start_Date || editingSession.start_date).toTimeString().slice(0, 5) ? '#fbbf24' : 'inherit'
                }}
              />
            </div>

            <div>
              <label className="text-xs muted">Giờ kết thúc</label>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChangeForm}
                style={{
                  color: form.end_time !== new Date(editingSession.End_Date || editingSession.end_date).toTimeString().slice(0, 5) ? '#fbbf24' : 'inherit'
                }}
              />
            </div>

            <div>
              <label className="text-xs muted">Số ghế khả dụng</label>
              <input
                type="number"
                name="available_seats_count"
                value={form.available_seats_count}
                onChange={handleChangeForm}
                min="1"
                style={{
                  color: form.available_seats_count != (editingSession.available_seats_count ?? editingSession.Available_Seats_Count) ? '#fbbf24' : 'inherit'
                }}
              />
            </div>

            <div>
              <label className="text-xs muted">Trạng thái buổi diễn</label>
              <select
                name="session_status"
                value={form.session_status}
                onChange={handleChangeForm}
                style={{
                  color: form.session_status !== (editingSession.session_status || editingSession.Session_Status) ? '#fbbf24' : 'inherit'
                }}
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <input type="hidden" name="venue_id" value={form.venue_id} />

            <div className="md:col-span-2 mt-2 flex gap-2">
              <button className="btn btn-primary" type="submit">
                Lưu thay đổi
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TẠO MỚI (giữ nguyên popup) */}
      {showModal && !editingSession && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">
                {editingSession
                  ? "Sửa buổi diễn"
                  : "Tạo buổi diễn mới"}
              </h2>
              <button
                className="text-2xl font-bold hover:text-red-500"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div>
                <label className="text-xs muted">Ngày diễn</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChangeForm}
                />
              </div>

              <div>
                <label className="text-xs muted">Giờ bắt đầu</label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChangeForm}
                />
              </div>

              <div>
                <label className="text-xs muted">Giờ kết thúc</label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChangeForm}
                />
              </div>

              <div>
                <label className="text-xs muted">Venue ID (theo dtb)</label>
                <input
                  type="number"
                  name="venue_id"
                  value={form.venue_id}
                  onChange={handleChangeForm}
                  placeholder="VD: 1, 2, 3"
                />
              </div>

              <div>
                <label className="text-xs muted">
                  Số ghế khả dụng ban đầu (Available_Seats_Count)
                </label>
                <input
                  type="number"
                  name="available_seats_count"
                  value={form.available_seats_count}
                  onChange={handleChangeForm}
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs muted">Trạng thái buổi diễn</label>
                <select
                  name="session_status"
                  value={form.session_status}
                  onChange={handleChangeForm}
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-2 flex gap-2">
                <button className="btn btn-primary" type="submit">
                  {editingSession ? "Lưu thay đổi" : "Tạo buổi diễn"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
