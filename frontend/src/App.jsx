// src/App.jsx
import { useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.jsx";

import AdminEventFormPage from "./pages/admin/AdminEventFormPage.jsx"; // dùng cho "Tạo sự kiện"
import AdminStatsPage from "./pages/admin/AdminStatsPage.jsx"; // nếu muốn xem thống kê
import AdminSessionManagerPage from "./pages/admin/AdminSessionManagerPage.jsx"; // quản lý lịch diễn (phần 3.1)

import LoginPage from "./pages/LoginPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";
import MyEventsPage from "./pages/MyEventsPage.jsx";
import MyAccountPage from "./pages/MyAccountPage.jsx";

function Header() {
  const { currentUser, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpenMenu(false);
    navigate("/login");
  };

  const handleCreateEventClick = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate("/create-event");
  };

  const handleMyTicketClick = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate("/my-tickets");
  };
  return (
    <header className="tb-header">
      <div className="tb-header-inner">
        {/* Logo bên trái */}
        <Link to="/" className="tb-logo-wrap">
          <img className="tb-logo" src="/logo.png" alt="logo" />
        </Link>

        {/* Menu bên phải */}
        <nav className="tb-nav">
          <button
            onClick={handleCreateEventClick}
            className="tb-nav-link"
          >
            Tạo sự kiện
          </button>
        
          <button
            onClick={handleMyTicketClick}
            className="tb-nav-link"
          >
            Vé của tôi
          </button>

          {/* Nếu chưa login -> nút Đăng nhập */}
          {!currentUser && (
            <button
              className="tb-login-btn"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>
          )}

          {/* Nếu đã login -> menu tài khoản */}
          {currentUser && (
            <div className="tb-account-wrap">
              <button
                className="tb-account-btn"
                onClick={() => setOpenMenu((o) => !o)}
              >
                {"Tài khoản"}
              </button>

              {openMenu && (
                <div
                  className="tb-account-menu"
                  onMouseLeave={() => setOpenMenu(false)}
                >
                  <button
                    onClick={handleMyTicketClick}
                  >
                    Vé của tôi
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      navigate("/my-events");
                    }}
                  >
                    Sự kiện của tôi
                  </button>
                  {(currentUser.user_type === "ORGANIZER" || currentUser.user_type === "BOTH") && (
                    <button
                      onClick={() => {
                        setOpenMenu(false);
                        navigate("/admin/sessions");
                      }}
                    >
                      Quản lý lịch diễn
                    </button>
                  )}
                  {(currentUser.user_type === "ORGANIZER" || currentUser.user_type === "BOTH") && (
                    <button
                      onClick={() => {
                        setOpenMenu(false);
                        navigate("/stats");
                      }}
                    >
                      Thống kê & báo cáo
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      navigate("/my-account");
                    }}
                  >
                    Tài khoản của tôi
                  </button>
                  <button
                    className="logout"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}


export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="px-6 py-6 max-w-5xl mx-auto">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Checkout requires login */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          {/* Payment flow */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            }
          />

          {/* User account */}
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-events"
            element={
              <ProtectedRoute requireRole={["ORGANIZER", "BOTH"]}>
                <MyEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-account"
            element={
              <ProtectedRoute>
                <MyAccountPage />
              </ProtectedRoute>
            }
          />

          {/* Tạo sự kiện (Organizer/BOTH) */}
          <Route
            path="/create-event"
            element={
              <ProtectedRoute requireRole={["ORGANIZER", "BOTH"]}>
                <AdminEventFormPage />
              </ProtectedRoute>
            }
          />

          {/* Nếu vẫn muốn trang thống kê cho organizer */}
          <Route
            path="/stats"
            element={
              <ProtectedRoute requireRole={["ORGANIZER", "BOTH"]}>
                <AdminStatsPage />
              </ProtectedRoute>
            }
          />

          {/* Quản lý lịch diễn (Event Sessions) - PHẦN 3.1 BTL2 */}
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute requireRole={["ORGANIZER", "BOTH"]}>
                <AdminSessionManagerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
