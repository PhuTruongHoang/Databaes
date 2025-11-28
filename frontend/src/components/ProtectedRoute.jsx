// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * requireRole: mảng role được phép, ví dụ ['ORGANIZER','BOTH']
 * nếu không truyền requireRole -> chỉ cần login
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Đang tải...</p>;
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

//   if (
//     requireRole &&
//     !requireRole.includes(currentUser.user_type)
//   ) {
//     return (
//       <p className="muted">
//         Bạn không có quyền truy cập trang này (chỉ dành cho Organizer).
//       </p>
//     );
//   }

  return children;
}
