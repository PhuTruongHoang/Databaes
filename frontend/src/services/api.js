// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

//
// ========= PUBLIC (HomePage, EventDetail) =========
//

export const fetchEvents = () => api.get("/events");

export const fetchEventDetail = (id) => api.get(`/events/${id}`);

export const createOrder = (payload) => api.post("/orders", payload);

//
// ========= AUTH =========
//

export const loginApi = (email, password) =>
  api.post("/auth/login", { email, password });

//
// ========= USER (MyAccount, MyTickets, MyEvents) =========
//

export const getMyTickets = (userId) =>
  api.get("/my/tickets", { params: { customerId: userId } });

export const getMyEvents = (userId) =>
  api.get("/my/events", { params: { organizerId: userId } });

export const getUserProfile = (userId) => api.get(`/users/${userId}`);

export const updateUserProfile = (userId, data) =>
  api.put(`/users/${userId}`, data);

//
// ========= ADMIN EVENT CRUD (phục vụ AdminEventForm + AdminEventList) =========
//

export const adminCreateEvent = (data) =>
  api.post("/admin/events", data);

export const adminUpdateEvent = (id, data) =>
  api.put(`/admin/events/${id}`, data);

export const adminDeleteEvent = (id) =>
  api.delete(`/admin/events/${id}`);

export const adminSearchEvents = (filter) =>
  api.get("/admin/events", { params: filter });

export const adminGetEvents = () =>
  api.get("/admin/events");

//
// ========= EVENT SESSION CRUD (PHẦN 3.1 – gọi thủ tục 2.1) =========
//

// Lấy danh sách buổi diễn của 1 event (bắt buộc truyền eventId)
export const adminGetSessions = (eventId) =>
  api.get("/admin/sessions", { params: { eventId } });

// Tạo session → gọi sp_InsertEventSession
export const adminCreateSession = (data) =>
  api.post("/admin/sessions", data);

// Sửa session → gọi sp_UpdateEventSession
export const adminUpdateSession = (id, data) =>
  api.put(`/admin/sessions/${id}`, data);

// Xóa session → gọi sp_DeleteEventSession
export const adminDeleteSession = (id) =>
  api.delete(`/admin/sessions/${id}`);

//
// ========= REPORT (PHẦN 3.2 – gọi thủ tục 2.3) =========
//

// Thủ tục sp_GetOpenSessions
export const adminGetOpenSessions = (eventId) =>
  api.get("/admin/reports/open-sessions", { params: { eventId } });

// Thủ tục cal_revenue(event_id, min_revenue)
export const adminGetEventRevenue = (eventId, minRevenue) =>
  api.get("/admin/reports/event-revenue", {
    params: { eventId, minRevenue },
  });

// (Giữ lại hàm cũ nếu FE còn dùng)
export const fetchRevenueStats = (year) =>
  api.get("/admin/stats/revenue", { params: { year } });

//
// ========= FUNCTION CALLS (PHẦN 3.3 – gọi hàm 2.4) =========
//

// Hàm calculate_organizer_revenue
export const callOrganizerRevenueFn = ({ organizerId, startDate, endDate }) =>
  api.get("/admin/functions/organizer-revenue", {
    params: { organizerId, start: startDate, end: endDate },
  });

// Hàm count_customer_tickets
export const callCustomerTicketCountFn = ({ customerId, startDate, endDate }) =>
  api.get("/admin/functions/customer-ticket-count", {
    params: { customerId, start: startDate, end: endDate },
  });

export default api;
