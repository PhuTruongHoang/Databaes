// src/pages/MyTicketsPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyTickets, callCustomerTicketCountFn } from "../services/api.js";
import { formatPriceWithCurrency } from "../utils/formatPrice.js";
import TicketQRCode from "../components/TicketQRCode.jsx";

export default function MyTicketsPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho thống kê
  const [selectedPeriod, setSelectedPeriod] = useState("3"); // "3", "6", "12"
  const [ticketCount, setTicketCount] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");

  // State cho QR code modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getMyTickets(currentUser.user_id)
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Tính toán khoảng thời gian dựa trên selectedPeriod
  const getDateRange = (months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return {
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16),
    };
  };

  // Load thống kê khi thay đổi period
  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError("");

      try {
        const { startDate, endDate } = getDateRange(parseInt(selectedPeriod));
        const res = await callCustomerTicketCountFn({
          customerId: currentUser.user_id,
          startDate,
          endDate,
        });

        const data = res.data;
        const count = data?.ticket_count ?? data?.total_tickets ?? data?.value ?? data?.count ?? 0;
        setTicketCount(count);
      } catch (err) {
        console.error(err);
        setStatsError(err?.response?.data?.message || "Không thể tải thống kê");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [currentUser, selectedPeriod]);

  // Lọc vé theo khoảng thời gian và tính tổng tiền
  const { filteredTickets, totalAmount } = useMemo(() => {
    const { startDate, endDate } = getDateRange(parseInt(selectedPeriod));
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = tickets.filter((ticket) => {
      // Parse order_datetime từ ticket (thay vì start_date)
      const orderDate = new Date(ticket.order_datetime);
      return orderDate >= start && orderDate <= end;
    });

    const total = filtered.reduce((sum, ticket) => {
      // Chỉ tính vé PAID hoặc CHECKED_IN
      if (ticket.ticket_status === "PAID" || ticket.ticket_status === "CHECKED_IN") {
        return sum + parseFloat(ticket.ticket_price || 0);
      }
      return sum;
    }, 0);

    return { filteredTickets: filtered, totalAmount: total };
  }, [tickets, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải vé của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vé của tôi</h1>
        <p className="text-gray-600">
          Quản lý và theo dõi lịch sử mua vé của bạn
        </p>
      </div>

      {/* Tab chọn khoảng thời gian và Thống kê */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPeriod("3")}
              className={`select-none px-5 py-2.5 rounded-lg font-medium transition-colors ${
                selectedPeriod === "3"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              3 tháng
            </button>
            <button
              onClick={() => setSelectedPeriod("6")}
              className={`select-none px-5 py-2.5 rounded-lg font-medium transition-colors ${
                selectedPeriod === "6"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              6 tháng
            </button>
            <button
              onClick={() => setSelectedPeriod("12")}
              className={`select-none px-5 py-2.5 rounded-lg font-medium transition-colors ${
                selectedPeriod === "12"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              12 tháng
            </button>
          </div>
        </div>

        {/* Thống kê */}
        {loadingStats ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : statsError ? (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
            {statsError}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Số vé đã mua */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Số vé đã mua</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketCount !== null ? ticketCount.toLocaleString("vi-VN") : "0"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedPeriod} tháng qua
              </p>
            </div>

            {/* Tổng tiền đã chi */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPriceWithCurrency(totalAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedPeriod} tháng qua
              </p>
            </div>

            {/* Giá trung bình */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Giá trung bình</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPriceWithCurrency(filteredTickets.length > 0 ? totalAmount / filteredTickets.length : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Mỗi vé
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách vé đã lọc */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách vé
          </h2>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">
              Không có vé nào trong khoảng thời gian này.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Thử chọn khoảng thời gian khác hoặc mua vé mới!
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sự kiện
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày mua
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày diễn ra
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá vé
                    </th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.ticket_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{t.event_name}</div>
                        <div className="text-sm text-gray-500">
                          {t.ticket_type || "Standard"}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {t.order_date}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {t.session_date}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-medium text-gray-900">
                        {formatPriceWithCurrency(t.ticket_price)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                            t.ticket_status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : t.ticket_status === "CHECKED_IN"
                              ? "bg-blue-100 text-blue-800"
                              : t.ticket_status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {t.ticket_status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(t.ticket_status === "PAID" || t.ticket_status === "CHECKED_IN") && (
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowQRModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Xem QR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <TicketQRCode
          ticket={selectedTicket}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}
