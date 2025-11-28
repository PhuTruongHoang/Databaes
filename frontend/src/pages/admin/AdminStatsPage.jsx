// src/pages/admin/AdminStatsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getMyEvents,
  adminGetEventRevenue,
  callOrganizerRevenueFn,
} from "../../services/api.js";
  
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminStatsPage() {
  // ====== COMMON ======
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  // ====== 3.2 – Báo cáo doanh thu theo sự kiện (cal_revenue) ======
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventRevenueRows, setEventRevenueRows] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState("");
  const [sortKey, setSortKey] = useState("Doanh_Thu");
  const [sortDir, setSortDir] = useState("DESC");

 

  // ====== 3.3 – Hàm calculate_organizer_revenue ======
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [loadingTodayRevenue, setLoadingTodayRevenue] = useState(false);
  const [loadingTotalRevenue, setLoadingTotalRevenue] = useState(false);
  const [todayRevenueError, setTodayRevenueError] = useState("");
  const [totalRevenueError, setTotalRevenueError] = useState("");


  // ========== HELPERS ==========
  const formatCurrency = (v) => {
    const num = Number(v || 0);
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const safeNumber = (val) => {
    const n = Number(val);
    if (Number.isNaN(n)) return 0;
    return n;
  };

  const formatDateDDMMYYYY = (dateValue) => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Invalid Date";
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Date parsing error:", e, dateValue);
      return "Error";
    }
  };

  const mapValueForSort = (row, key) => {
    // Map cả alias tiếng Việt lẫn tên cột gốc
    switch (key) {
      case "Loai_Ve":
        return row.Loai_Ve ?? row.loai_ve ?? row.Ticket_type ?? row.ticket_type ?? "";
      case "So_Ve_Ban_Duoc":
        return safeNumber(row.So_Ve_Ban_Duoc ?? row.so_ve_ban_duoc ?? row.ticket_count);
      case "Gia_Ve":
        return safeNumber(row.Gia_Ve ?? row.gia_ve ?? row.Ticket_Price ?? row.ticket_price ?? row.price);
      case "Session_Id":
        return safeNumber(row.Session_id ?? row.Session_Id ?? row.session_id);
      case "Ngay_Dien":
        return row.Ngay_Dien ?? row.ngay_dien ?? row.Start_Date ?? row.start_date ?? "";
      case "Doanh_Thu":
        return safeNumber(row.Doanh_Thu ?? row.doanh_thu ?? row.revenue ?? row.total_revenue);
      default:
        return row[key];
    }
  };

  const sortedEventRevenueRows = useMemo(() => {
    const rows = [...eventRevenueRows];
    if (!sortKey) return rows;

    return rows.sort((a, b) => {
      const va = mapValueForSort(a, sortKey);
      const vb = mapValueForSort(b, sortKey);

      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (va < vb) return sortDir === "ASC" ? -1 : 1;
      if (va > vb) return sortDir === "ASC" ? 1 : -1;
      return 0;
    });
  }, [eventRevenueRows, sortKey, sortDir]);

  const toggleSort = (key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "ASC" ? "DESC" : "ASC"));
        return prevKey;
      }
      setSortDir("DESC");
      return key;
    });
  };

  const { currentUser } = useAuth();

  // ========== LOAD EVENTS (CHỈ CỦA ORGANIZER HIỆN TẠI) ==========
  useEffect(() => {
    if (!currentUser) return;

    // Lấy danh sách sự kiện của organizer hiện tại
    getMyEvents(currentUser.user_id)
      .then((res) => {
        setEvents(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setEventsError(
          err?.response?.data?.message ||
            "Không tải được danh sách sự kiện của bạn. Kiểm tra lại backend / kết nối DB."
        );
      })
      .finally(() => setLoadingEvents(false));
  }, [currentUser]);

  // ========== TỰ ĐỘNG LOAD BÁO CÁO KHI CHỌN EVENT ==========
  useEffect(() => {
    if (!selectedEventId) {
      setEventRevenueRows([]);
      setRevenueError("");
      return;
    }

    const loadEventRevenue = async () => {
      setLoadingRevenue(true);
      setRevenueError("");

      try {
        const res = await adminGetEventRevenue(selectedEventId, 0);
        console.log("=== Frontend received data ===");
        console.log("First row:", res.data?.[0]);
        setEventRevenueRows(res.data || []);
      } catch (err) {
        console.error(err);
        setRevenueError(
          err?.response?.data?.message ||
            "Không tải được báo cáo doanh thu. Kiểm tra lại thủ tục cal_revenue và API."
        );
      } finally {
        setLoadingRevenue(false);
      }
    };

    loadEventRevenue();
  }, [selectedEventId]);

  // ========== AUTO LOAD REVENUE – Today & All Time ==========
  useEffect(() => {
    if (!currentUser) return;

    // Load doanh thu hôm nay
    const loadTodayRevenue = async () => {
      setLoadingTodayRevenue(true);
      setTodayRevenueError("");

      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const res = await callOrganizerRevenueFn({
          organizerId: currentUser.user_id,
          startDate: startOfDay.toISOString().slice(0, 16),
          endDate: endOfDay.toISOString().slice(0, 16),
        });

        const data = res.data;
        const value =
          data?.total_revenue ??
          data?.revenue ??
          data?.totalRevenue ??
          data?.value ??
          0;

        setTodayRevenue(value);
      } catch (err) {
        console.error(err);
        setTodayRevenueError(
          err?.response?.data?.message || "Không tính được doanh thu hôm nay."
        );
      } finally {
        setLoadingTodayRevenue(false);
      }
    };

    // Load tổng doanh thu tất cả thời gian
    const loadTotalRevenue = async () => {
      setLoadingTotalRevenue(true);
      setTotalRevenueError("");

      try {
        const res = await callOrganizerRevenueFn({
          organizerId: currentUser.user_id,
          startDate: null,
          endDate: null,
        });

        const data = res.data;
        const value =
          data?.total_revenue ??
          data?.revenue ??
          data?.totalRevenue ??
          data?.value ??
          0;

        setTotalRevenue(value);
      } catch (err) {
        console.error(err);
        setTotalRevenueError(
          err?.response?.data?.message || "Không tính được tổng doanh thu."
        );
      } finally {
        setLoadingTotalRevenue(false);
      }
    };

    loadTodayRevenue();
    loadTotalRevenue();
  }, [currentUser]);


  // ========== RENDER ==========
  return (
    <div className="space-y-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">
          Dashboard thống kê & báo cáo
        </h1>
        <p className="muted">
          Màn hình này dùng để minh họa các thủ tục / hàm ở phần 2.3 và 2.4:
          <br />
          • Thủ tục <code>cal_revenue</code> (báo cáo doanh thu theo sự kiện +
          session)
          <br />
          • Hàm <code>calculate_organizer_revenue</code> (doanh thu organizer)
        </p>
      </div>

      {/* ========== 3.2 – CAL_REVENUE REPORT ========== */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="section-title mb-1">
              Báo cáo doanh thu theo sự kiện (cal_revenue)
            </h2>
            <p className="muted text-sm">
              Gọi thủ tục <code>cal_revenue(p_event_id, 0)</code>{" "}
              để lấy doanh thu theo từng hạng vé của từng buổi diễn:
              <br />
              Session ID – Ngày diễn – Loại vé – Số vé bán được – Đơn giá – Doanh thu.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Chọn sự kiện để xem báo cáo doanh thu
          </label>
          {loadingEvents ? (
            <p className="muted text-sm">Đang tải danh sách sự kiện...</p>
          ) : eventsError ? (
            <p className="text-red-600 text-sm">{eventsError}</p>
          ) : (
            <select
              className="input w-full"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Chọn sự kiện --</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id}>
                  #{ev.event_id} – {ev.event_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!selectedEventId && !loadingRevenue && (
          <p className="muted text-sm mb-4">
            Vui lòng chọn sự kiện để xem báo cáo doanh thu.
          </p>
        )}

        {loadingRevenue && (
          <p className="muted text-sm mb-4">Đang tải báo cáo...</p>
        )}

        {revenueError && (
          <div className="text-red-600 text-sm mb-4 whitespace-pre-line">
            {revenueError}
          </div>
        )}

        {selectedEventId && !loadingRevenue && eventRevenueRows.length === 0 && !revenueError && (
          <p className="muted text-sm mb-4">
            Không có dữ liệu doanh thu cho sự kiện này.
          </p>
        )}

        {eventRevenueRows.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("Session_Id")}
                  >
                    Session ID{" "}
                    {sortKey === "Session_Id" && (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("Ngay_Dien")}
                  >
                    Ngày diễn{" "}
                    {sortKey === "Ngay_Dien" && (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("Loai_Ve")}
                  >
                    Loại vé{" "}
                    {sortKey === "Loai_Ve" && (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("So_Ve_Ban_Duoc")}
                  >
                    Số vé bán được{" "}
                    {sortKey === "So_Ve_Ban_Duoc" &&
                      (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("Gia_Ve")}
                  >
                    Đơn giá{" "}
                    {sortKey === "Gia_Ve" && (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => toggleSort("Doanh_Thu")}
                  >
                    Doanh thu{" "}
                    {sortKey === "Doanh_Thu" &&
                      (sortDir === "ASC" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEventRevenueRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.Session_Id ?? row.Session_id ?? row.session_id}</td>
                    <td>
                      {formatDateDDMMYYYY(
                        row.Ngay_Dien || row.ngay_dien || row.Start_Date || row.start_date
                      )}
                    </td>
                    <td>{row.Loai_Ve ?? row.loai_ve ?? row.Ticket_type ?? row.ticket_type}</td>
                    <td>
                      {safeNumber(
                        row.So_Ve_Ban_Duoc ?? row.so_ve_ban_duoc ?? row.ticket_count
                      ).toLocaleString("vi-VN")}
                    </td>
                    <td>{formatCurrency(row.Gia_Ve ?? row.gia_ve ?? row.Ticket_Price ?? row.ticket_price)}</td>
                    <td className="font-medium">
                      {formatCurrency(
                        row.Doanh_Thu ?? row.doanh_thu ?? row.revenue ?? row.total_revenue
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== DOANH THU ORGANIZER ========== */}
      <div className="card">
        <h2 className="section-title mb-4">
          Doanh thu Organizer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doanh thu hôm nay (PnL) */}
          <div className="border border-gray-200 rounded-lg p-5 bg-white">
            <p className="text-sm text-gray-600 mb-2">Doanh thu hôm nay (PnL)</p>
            {loadingTodayRevenue ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : todayRevenueError ? (
              <p className="text-red-600 text-sm">{todayRevenueError}</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(todayRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                </p>
              </>
            )}
          </div>

          {/* Tổng doanh thu tất cả thời gian */}
          <div className="border border-gray-200 rounded-lg p-5 bg-white">
            <p className="text-sm text-gray-600 mb-2">Tổng doanh thu (Tất cả thời gian)</p>
            {loadingTotalRevenue ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : totalRevenueError ? (
              <p className="text-red-600 text-sm">{totalRevenueError}</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  Từ khi bắt đầu
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
