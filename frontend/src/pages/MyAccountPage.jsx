// src/pages/MyAccountPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUserProfile,
  updateUserProfile,
} from "../services/api.js";

export default function MyAccountPage() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    getUserProfile(currentUser.user_id)
      .then((res) => setForm(res.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || "Lỗi khi tải thông tin tài khoản.");
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await updateUserProfile(currentUser.user_id, {
        full_name: form.full_name,
        phone_number: form.phone_number,
        gender: form.gender,
        birthday: form.birthday,
      });
      setMessage("Đã lưu thông tin tài khoản.");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Lỗi khi cập nhật tài khoản."
      );
    }
  };

  if (loading) return <p>Đang tải tài khoản...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="card max-w-lg">
      <h1 className="text-xl font-semibold mb-3">
        Tài khoản của tôi
      </h1>

      {message && <p className="text-sm mb-2">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs muted">Họ và tên</label>
          <input
            name="full_name"
            value={form.full_name || ""}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-xs muted">Email (không đổi)</label>
          <input
            value={form.email || ""}
            disabled
          />
        </div>
        <div>
          <label className="text-xs muted">Số điện thoại</label>
          <input
            name="phone_number"
            value={form.phone_number || ""}
            onChange={handleChange}
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}
