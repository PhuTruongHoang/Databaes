// src/pages/admin/AdminFunctionsPage.jsx
import { useState } from "react";
import {
  callOrganizerRevenueFn,
  callCustomerTicketCountFn,
} from "../../services/api.js";

export default function AdminFunctionsPage() {
  const [orgParams, setOrgParams] = useState({
    organizer_id: "",
    start_date: "",
    end_date: "",
  });
  const [orgResult, setOrgResult] = useState(null);

  const [custParams, setCustParams] = useState({
    customer_id: "",
    start_date: "",
    end_date: "",
  });
  const [custResult, setCustResult] = useState(null);

  const [error, setError] = useState("");

  const handleChangeOrg = (e) =>
    setOrgParams({ ...orgParams, [e.target.name]: e.target.value });

  const handleChangeCust = (e) =>
    setCustParams({ ...custParams, [e.target.name]: e.target.value });

  const handleCalcOrganizerRevenue = async (e) => {
    e.preventDefault();
    setError("");
    setOrgResult(null);

    try {
      const res = await callOrganizerRevenueFn(orgParams);
      // backend nên trả { total_revenue: number }
      setOrgResult(res.data.total_revenue ?? 0);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Lỗi khi tính doanh thu organizer."
      );
    }
  };

  const handleCountCustomerTickets = async (e) => {
    e.preventDefault();
    setError("");
    setCustResult(null);

    try {
      const res = await callCustomerTicketCountFn(custParams);
      // backend nên trả { ticket_count: number }
      setCustResult(res.data.ticket_count ?? 0);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Lỗi khi đếm số vé của khách hàng."
      );
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Giao diện gọi hàm trong CSDL (phần 2.4)
      </h1>

      {error && <p className="text-red-400 mb-3 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {/* HÀM 1: calculate_organizer_revenue */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">
            1. Tổng doanh thu của Organizer
          </h2>
          <form
            onSubmit={handleCalcOrganizerRevenue}
            className="space-y-2"
          >
            <div>
              <label className="text-xs muted">Organizer ID</label>
              <input
                name="organizer_id"
                value={orgParams.organizer_id}
                onChange={handleChangeOrg}
                type="number"
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-xs muted">Từ ngày</label>
              <input
                type="date"
                name="start_date"
                value={orgParams.start_date}
                onChange={handleChangeOrg}
                required
              />
            </div>
            <div>
              <label className="text-xs muted">Đến ngày</label>
              <input
                type="date"
                name="end_date"
                value={orgParams.end_date}
                onChange={handleChangeOrg}
                required
              />
            </div>

            <button className="btn btn-primary">Tính doanh thu</button>
          </form>

          {orgResult !== null && (
            <p className="mt-3 text-sm">
              Doanh thu:{" "}
              <strong>
                {Number(orgResult || 0).toLocaleString("vi-VN")} đ
              </strong>
            </p>
          )}
        </div>

        {/* HÀM 2: count_customer_tickets */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">
            2. Số vé khách hàng đã mua
          </h2>
          <form
            onSubmit={handleCountCustomerTickets}
            className="space-y-2"
          >
            <div>
              <label className="text-xs muted">Customer ID</label>
              <input
                name="customer_id"
                value={custParams.customer_id}
                onChange={handleChangeCust}
                type="number"
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-xs muted">Từ ngày</label>
              <input
                type="date"
                name="start_date"
                value={custParams.start_date}
                onChange={handleChangeCust}
                required
              />
            </div>
            <div>
              <label className="text-xs muted">Đến ngày</label>
              <input
                type="date"
                name="end_date"
                value={custParams.end_date}
                onChange={handleChangeCust}
                required
              />
            </div>

            <button className="btn btn-secondary">
              Đếm số vé
            </button>
          </form>

          {custResult !== null && (
            <p className="mt-3 text-sm">
              Số vé trong khoảng thời gian này:{" "}
              <strong>{custResult}</strong>
            </p>
          )}
        </div>
      </div>

      <p className="muted text-xs mt-4">
        * Giao diện chỉ hiển thị kết quả tổng hợp (tổng tiền, số vé),
        không hiển thị chi tiết từng đơn hàng/khách để đảm bảo privacy.
      </p>
    </div>
  );
}
