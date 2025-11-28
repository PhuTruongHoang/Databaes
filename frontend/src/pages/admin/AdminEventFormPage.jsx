import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminCreateEvent } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STEP = {
  GENERAL: 1,
  SCHEDULE_TICKETS: 2,
  SETTINGS: 3,
  PAYMENT: 4,
};

export default function AdminEventFormPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [step, setStep] = useState(STEP.GENERAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ====== STATE CHO CÁC BƯỚC ======

  // B1: thông tin chung
  const [generalInfo, setGeneralInfo] = useState({
    poster_url: "",
    event_name: "",
    is_online: true,
    venue_address: "",
    category: "",
    description: "",
    organizer_name: currentUser?.full_name || "",
  });

  // B2: thời gian & loại vé
  const [sessions, setSessions] = useState([
    { date: "", start_time: "", end_time: "" },
  ]);

  const [ticketTypes, setTicketTypes] = useState([
    { name: "", price: "" },
  ]);

  // B3: cài đặt
  const [settings, setSettings] = useState({
    primary_language: "Tiếng Việt",
    privacy_level: "Public",
    min_age: "",
    max_tickets_per_order: "6",
  });

  // B4: thông tin thanh toán
  const [paymentInfo, setPaymentInfo] = useState({
    payment_methods: {
      bank_transfer: true,
      momo: false,
      zalopay: false,
      credit_card: false,
      cash: false,
    },
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    momo_phone: "",
    zalopay_phone: "",
    contact_email: currentUser?.email || "",
  });

  // ====== HANDLER CHUNG ======

  const handleChangeGeneral = (e) =>
    setGeneralInfo({ ...generalInfo, [e.target.name]: e.target.value });

  const handleChangeSettings = (e) =>
    setSettings({ ...settings, [e.target.name]: e.target.value });

  const handleChangePayment = (e) =>
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });

  const handlePaymentMethodToggle = (method) => {
    setPaymentInfo({
      ...paymentInfo,
      payment_methods: {
        ...paymentInfo.payment_methods,
        [method]: !paymentInfo.payment_methods[method],
      },
    });
  };

  const handleSessionChange = (index, field, value) => {
    const copy = [...sessions];
    copy[index][field] = value;
    setSessions(copy);
  };

  const handleTicketTypeChange = (index, field, value) => {
    const copy = [...ticketTypes];
    copy[index][field] = value;
    setTicketTypes(copy);
  };

  const addSession = () =>
    setSessions([...sessions, { date: "", start_time: "", end_time: "" }]);

  const removeSession = (idx) =>
    setSessions(sessions.filter((_, i) => i !== idx));

  const addTicketType = () =>
    setTicketTypes([...ticketTypes, { name: "", price: "" }]);

  const removeTicketType = (idx) =>
    setTicketTypes(ticketTypes.filter((_, i) => i !== idx));

  // ====== VALIDATE TỪNG BƯỚC ======

  const validateStep = () => {
    setError("");
    if (step === STEP.GENERAL) {
      if (!generalInfo.event_name.trim()) {
        setError("Vui lòng nhập tên sự kiện.");
        return false;
      }
      if (!generalInfo.category.trim()) {
        setError("Vui lòng chọn thể loại sự kiện.");
        return false;
      }
      if (!generalInfo.description.trim()) {
        setError("Vui lòng nhập mô tả.");
        return false;
      }
      if (
        !generalInfo.is_online &&
        !generalInfo.venue_address.trim()
      ) {
        setError("Vui lòng nhập địa chỉ khi sự kiện offline.");
        return false;
      }
      return true;
    }

    if (step === STEP.SCHEDULE_TICKETS) {
      if (
        sessions.length === 0 ||
        !sessions[0].date ||
        !sessions[0].start_time ||
        !sessions[0].end_time
      ) {
        setError(
          "Vui lòng nhập ít nhất một lịch diễn (ngày, giờ bắt đầu, giờ kết thúc)."
        );
        return false;
      }
      if (
        ticketTypes.length === 0 ||
        !ticketTypes[0].name ||
        !ticketTypes[0].price
      ) {
        setError(
          "Vui lòng tạo ít nhất một loại vé với tên và giá."
        );
        return false;
      }
      return true;
    }

    if (step === STEP.SETTINGS) {
      // không bắt buộc gì đặc biệt, có thể bỏ qua
      return true;
    }

    if (step === STEP.PAYMENT) {
      const hasAnyMethod = Object.values(paymentInfo.payment_methods).some(v => v);
      if (!hasAnyMethod) {
        setError("Vui lòng chọn ít nhất một phương thức thanh toán.");
        return false;
      }

      if (paymentInfo.payment_methods.bank_transfer) {
        if (!paymentInfo.bank_name || !paymentInfo.bank_account_name.trim() || !paymentInfo.bank_account_number.trim()) {
          setError("Vui lòng nhập đủ thông tin ngân hàng (tên ngân hàng, chủ tài khoản, số tài khoản).");
          return false;
        }
      }

      if (paymentInfo.payment_methods.momo && !paymentInfo.momo_phone.trim()) {
        setError("Vui lòng nhập số điện thoại ví MoMo.");
        return false;
      }

      if (paymentInfo.payment_methods.zalopay && !paymentInfo.zalopay_phone.trim()) {
        setError("Vui lòng nhập số điện thoại ZaloPay.");
        return false;
      }

      return true;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(STEP.PAYMENT, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(STEP.GENERAL, s - 1));
  };

  // ====== SUBMIT CUỐI CÙNG ======

  const handleSubmitFinal = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError("");

    try {
      // payload tối thiểu mà backend đang dùng (bạn có thể mở rộng sau)
      const payload = {
        user_id: currentUser.user_id,
        event_name: generalInfo.event_name,
        event_category: generalInfo.category,
        event_description: generalInfo.description,
        primary_language: settings.primary_language,
        privacy_level: settings.privacy_level,
        is_online_event: generalInfo.is_online,
        poster_image: generalInfo.poster_url,
        event_duration: null,
        // Thêm các info khác để sau có thể dùng tới:
        venue_address: generalInfo.venue_address,
        organizer_name: generalInfo.organizer_name,
        sessions,
        ticket_types: ticketTypes,
        settings,
        paymentInfo,
      };

      await adminCreateEvent(payload);

      alert("Tạo sự kiện thành công!");
      navigate("/my-events");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Lỗi khi tạo sự kiện."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ====== RENDER ======

  const stepsMeta = [
    { id: STEP.GENERAL, label: "Thông tin chung" },
    { id: STEP.SCHEDULE_TICKETS, label: "Thời gian & loại vé" },
    { id: STEP.SETTINGS, label: "Cài đặt" },
    { id: STEP.PAYMENT, label: "Thanh toán" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">
        Tạo sự kiện mới
      </h1>

      {/* STEP INDICATOR */}
      <div className="stepper mb-4">
        {stepsMeta.map((s, idx) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="stepper-item-wrapper">
              {idx > 0 && (
                <div
                  className={`stepper-line ${
                    step > s.id ? "completed" : ""
                  }`}
                />
              )}
              <div
                className={`stepper-item ${
                  isActive
                    ? "active"
                    : isCompleted
                    ? "completed"
                    : ""
                }`}
              >
                <div className="stepper-number">
                  {idx + 1}
                </div>
                <div className="stepper-label">
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}

      {/* BODY TỪNG BƯỚC */}
      {step === STEP.GENERAL && (
        <StepGeneralInfo
          data={generalInfo}
          onChange={handleChangeGeneral}
        />
      )}

      {step === STEP.SCHEDULE_TICKETS && (
        <StepScheduleTickets
          sessions={sessions}
          ticketTypes={ticketTypes}
          onSessionChange={handleSessionChange}
          onTicketTypeChange={handleTicketTypeChange}
          addSession={addSession}
          removeSession={removeSession}
          addTicketType={addTicketType}
          removeTicketType={removeTicketType}
        />
      )}

      {step === STEP.SETTINGS && (
        <StepSettings
          data={settings}
          onChange={handleChangeSettings}
        />
      )}

      {step === STEP.PAYMENT && (
        <StepPayment
          data={paymentInfo}
          onChange={handleChangePayment}
          onPaymentMethodToggle={handlePaymentMethodToggle}
        />
      )}

      {/* ACTIONS */}
      <div className="wizard-actions">
        {step > STEP.GENERAL && (
          <button
            className="btn btn-secondary"
            onClick={goBack}
            disabled={submitting}
          >
            ← Quay lại
          </button>
        )}

        {step < STEP.PAYMENT && (
          <button
            className="btn btn-primary"
            onClick={goNext}
            disabled={submitting}
          >
            Tiếp tục →
          </button>
        )}

        {step === STEP.PAYMENT && (
          <button
            className="btn btn-primary"
            onClick={handleSubmitFinal}
            disabled={submitting}
          >
            {submitting ? "Đang tạo..." : "Hoàn tất tạo sự kiện"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ========= COMPONENT CHI TIẾT CÁC BƯỚC ========= */

// Bước 1: Poster + name, online/offline, category, description, organizer
function StepGeneralInfo({ data, onChange }) {
  return (
    <div className="step-grid">
      {/* Poster + tên sự kiện */}
      <div className="card">
        <h2 className="section-title mb-2">
          Poster & tên sự kiện
        </h2>
        <div className="mb-2">
          <label className="text-xs muted">
            Link ảnh poster (URL)
          </label>
          <input
            name="poster_url"
            value={data.poster_url}
            onChange={onChange}
            placeholder="https://..."
          />
        </div>
        {data.poster_url && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <img
              src={data.poster_url}
              alt="Poster preview"
              style={{
                width: "100%",
                maxHeight: "240px",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <div className="mt-3">
          <label className="text-xs muted">
            Tên sự kiện
          </label>
          <input
            name="event_name"
            value={data.event_name}
            onChange={onChange}
            placeholder='Ví dụ: "Art Workshop - Uji Matcha Cheesecake"'
          />
        </div>
      </div>

      {/* Online / offline + địa chỉ */}
      <div className="card">
        <h2 className="section-title mb-2">
          Hình thức tổ chức
        </h2>
        <div className="flex-row mb-2">
          <label className="flex-row">
            <input
              type="radio"
              name="is_online_radio"
              checked={data.is_online}
              onChange={() =>
                onChange({
                  target: {
                    name: "is_online",
                    value: true,
                  },
                })
              }
            />
            <span>Online</span>
          </label>
          <label className="flex-row">
            <input
              type="radio"
              name="is_online_radio"
              checked={!data.is_online}
              onChange={() =>
                onChange({
                  target: {
                    name: "is_online",
                    value: false,
                  },
                })
              }
            />
            <span>Offline (tại địa điểm)</span>
          </label>
        </div>

        {!data.is_online && (
          <div>
            <label className="text-xs muted">
              Địa chỉ tổ chức
            </label>
            <textarea
              name="venue_address"
              value={data.venue_address}
              onChange={onChange}
              rows={3}
              placeholder="Số nhà, đường, phường, quận, thành phố..."
            />
          </div>
        )}
      </div>

      {/* Thể loại */}
      <div className="card">
        <h2 className="section-title mb-2">Thể loại</h2>
        <label className="text-xs muted">
          Chọn thể loại sự kiện
        </label>
        <select
          name="category"
          value={data.category}
          onChange={onChange}
        >
          <option value="">-- Chọn thể loại --</option>
          <option value="Workshop">Workshop</option>
          <option value="Âm nhạc / Concert">Âm nhạc / Concert</option>
          <option value="Hội thảo">Hội thảo</option>
          <option value="Triển lãm">Triển lãm</option>
          <option value="Khóa học">Khóa học</option>
          <option value="Khác">Khác</option>
        </select>
      </div>

      {/* Mô tả */}
      <div className="card">
        <h2 className="section-title mb-2">Mô tả</h2>
        <label className="text-xs muted">
          Nội dung giới thiệu sự kiện
        </label>
        <textarea
          name="description"
          value={data.description}
          onChange={onChange}
          rows={5}
          placeholder="Giới thiệu ngắn gọn về nội dung, đối tượng tham gia, trải nghiệm người tham gia..."
        />
      </div>

      {/* Ban tổ chức */}
      <div className="card">
        <h2 className="section-title mb-2">Ban tổ chức</h2>
        <label className="text-xs muted">
          Tên thương hiệu / đơn vị tổ chức
        </label>
        <input
          name="organizer_name"
          value={data.organizer_name}
          onChange={onChange}
          placeholder="Ví dụ: Garden Art, Databae Studio..."
        />
      </div>
    </div>
  );
}

// Bước 2: thời gian & loại vé
function StepScheduleTickets({
  sessions,
  ticketTypes,
  onSessionChange,
  onTicketTypeChange,
  addSession,
  removeSession,
  addTicketType,
  removeTicketType,
}) {
  return (
    <div className="step-grid-two">
      {/* Lịch diễn */}
      <div className="card">
        <h2 className="section-title mb-2">Lịch diễn</h2>
        <p className="muted mb-2">
          Thêm một hoặc nhiều buổi diễn cho sự kiện.
        </p>
        {sessions.map((s, idx) => (
          <div
            key={idx}
            className="session-line"
          >
            <div>
              <label className="text-xs muted">Ngày</label>
              <input
                type="date"
                value={s.date}
                onChange={(e) =>
                  onSessionChange(
                    idx,
                    "date",
                    e.target.value
                  )
                }
              />
            </div>
            <div>
              <label className="text-xs muted">
                Bắt đầu
              </label>
              <input
                type="time"
                value={s.start_time}
                onChange={(e) =>
                  onSessionChange(
                    idx,
                    "start_time",
                    e.target.value
                  )
                }
              />
            </div>
            <div>
              <label className="text-xs muted">
                Kết thúc
              </label>
              <input
                type="time"
                value={s.end_time}
                onChange={(e) =>
                  onSessionChange(
                    idx,
                    "end_time",
                    e.target.value
                  )
                }
              />
            </div>
            {sessions.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeSession(idx)}
              >
                X
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mt-2"
          onClick={addSession}
        >
          + Thêm lịch diễn
        </button>
      </div>

      {/* Loại vé */}
      <div className="card">
        <h2 className="section-title mb-2">Loại vé</h2>
        <p className="muted mb-2">
          Thiết lập các hạng vé và giá bán.
        </p>

        {ticketTypes.map((t, idx) => (
          <div
            key={idx}
            className="session-line"
          >
            <div>
              <label className="text-xs muted">
                Tên loại vé
              </label>
              <input
                value={t.name}
                onChange={(e) =>
                  onTicketTypeChange(
                    idx,
                    "name",
                    e.target.value
                  )
                }
                placeholder="Standard, VIP..."
              />
            </div>
            <div>
              <label className="text-xs muted">
                Giá (VND)
              </label>
              <input
                type="number"
                min="0"
                value={t.price}
                onChange={(e) =>
                  onTicketTypeChange(
                    idx,
                    "price",
                    e.target.value
                  )
                }
              />
            </div>
            {ticketTypes.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeTicketType(idx)}
              >
                X
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary mt-2"
          onClick={addTicketType}
        >
          + Thêm loại vé
        </button>
      </div>
    </div>
  );
}

// Bước 3: Cài đặt
function StepSettings({ data, onChange }) {
  return (
    <div className="step-grid">
      <div className="card">
        <h2 className="section-title mb-2">
          Ngôn ngữ & độ tuổi
        </h2>
        <div className="mb-2">
          <label className="text-xs muted">
            Ngôn ngữ chính
          </label>
          <select
            name="primary_language"
            value={data.primary_language}
            onChange={onChange}
          >
            <option>Tiếng Việt</option>
            <option>Tiếng Anh</option>
            <option>Song ngữ Việt - Anh</option>
          </select>
        </div>
        <div>
          <label className="text-xs muted">
            Độ tuổi tối thiểu (tuỳ chọn)
          </label>
          <input
            name="min_age"
            type="number"
            min="0"
            value={data.min_age}
            onChange={onChange}
            placeholder="Ví dụ: 16"
          />
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-2">Riêng tư & đặt chỗ</h2>
        <div className="mb-2">
          <label className="text-xs muted">
            Mức độ hiển thị
          </label>
          <select
            name="privacy_level"
            value={data.privacy_level}
            onChange={onChange}
          >
            <option value="Public">
              Công khai trên Databae Ticket
            </option>
            <option value="Unlisted">
              Không liệt kê (chỉ ai có link)
            </option>
          </select>
        </div>

        <div>
          <label className="text-xs muted">
            Số vé tối đa mỗi đơn (tham khảo)
          </label>
          <input
            name="max_tickets_per_order"
            type="number"
            min="1"
            value={data.max_tickets_per_order}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}

// Bước 4: Thông tin thanh toán
function StepPayment({ data, onChange, onPaymentMethodToggle }) {
  const BANKS = [
    "Vietcombank",
    "VietinBank",
    "BIDV",
    "Agribank",
    "Techcombank",
    "MB Bank",
    "ACB",
    "VPBank",
    "TPBank",
    "Sacombank",
    "VIB",
    "SHB",
    "HDBank",
    "OCB",
    "MSB",
    "Nam A Bank",
    "SeABank",
    "VietCapital Bank",
    "Bac A Bank",
    "PVcomBank",
  ];

  return (
    <div className="step-grid">
      {/* Phương thức thanh toán */}
      <div className="card">
        <h2 className="section-title mb-2">
          Phương thức thanh toán
        </h2>
        <p className="muted mb-3 text-xs">
          Chọn các phương thức thanh toán mà bạn chấp nhận
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Chuyển khoản ngân hàng */}
          <label style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            border: data.payment_methods.bank_transfer ? "2px solid #3B82F6" : "1px solid #374151",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: data.payment_methods.bank_transfer ? "rgba(59, 130, 246, 0.1)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={data.payment_methods.bank_transfer}
              onChange={() => onPaymentMethodToggle("bank_transfer")}
              style={{ marginRight: "10px", width: "18px", height: "18px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>Chuyển khoản ngân hàng</div>
              <div className="muted" style={{ fontSize: "12px" }}>VietQR - Quét mã QR</div>
            </div>
          </label>

          {/* MoMo */}
          <label style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            border: data.payment_methods.momo ? "2px solid #A50064" : "1px solid #374151",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: data.payment_methods.momo ? "rgba(165, 0, 100, 0.1)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={data.payment_methods.momo}
              onChange={() => onPaymentMethodToggle("momo")}
              style={{ marginRight: "10px", width: "18px", height: "18px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>Ví MoMo</div>
              <div className="muted" style={{ fontSize: "12px" }}>Thanh toán qua ví điện tử MoMo</div>
            </div>
          </label>

          {/* ZaloPay */}
          <label style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            border: data.payment_methods.zalopay ? "2px solid #0068FF" : "1px solid #374151",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: data.payment_methods.zalopay ? "rgba(0, 104, 255, 0.1)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={data.payment_methods.zalopay}
              onChange={() => onPaymentMethodToggle("zalopay")}
              style={{ marginRight: "10px", width: "18px", height: "18px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>ZaloPay</div>
              <div className="muted" style={{ fontSize: "12px" }}>Thanh toán qua ví điện tử ZaloPay</div>
            </div>
          </label>

          {/* Thẻ tín dụng */}
          <label style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            border: data.payment_methods.credit_card ? "2px solid #10B981" : "1px solid #374151",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: data.payment_methods.credit_card ? "rgba(16, 185, 129, 0.1)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={data.payment_methods.credit_card}
              onChange={() => onPaymentMethodToggle("credit_card")}
              style={{ marginRight: "10px", width: "18px", height: "18px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>Thẻ tín dụng/Ghi nợ</div>
              <div className="muted" style={{ fontSize: "12px" }}>Visa, Mastercard, JCB</div>
            </div>
          </label>

          {/* Thanh toán tại quầy */}
          <label style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            border: data.payment_methods.cash ? "2px solid #F59E0B" : "1px solid #374151",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: data.payment_methods.cash ? "rgba(245, 158, 11, 0.1)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={data.payment_methods.cash}
              onChange={() => onPaymentMethodToggle("cash")}
              style={{ marginRight: "10px", width: "18px", height: "18px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>Thanh toán tại quầy</div>
              <div className="muted" style={{ fontSize: "12px" }}>Tiền mặt khi nhận vé</div>
            </div>
          </label>
        </div>
      </div>

      {/* Thông tin ngân hàng - Chỉ hiện khi chọn chuyển khoản */}
      {data.payment_methods.bank_transfer && (
        <div className="card">
          <h2 className="section-title mb-2">
            Thông tin ngân hàng
          </h2>
          <div className="mb-2">
            <label className="text-xs muted">
              Tên ngân hàng *
            </label>
            <select
              name="bank_name"
              value={data.bank_name}
              onChange={onChange}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #374151",
                backgroundColor: "#1e293b",
                color: "white",
              }}
            >
              <option value="">-- Chọn ngân hàng --</option>
              {BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-xs muted">
              Chủ tài khoản *
            </label>
            <input
              name="bank_account_name"
              value={data.bank_account_name}
              onChange={onChange}
              placeholder="Tên chủ tài khoản"
            />
          </div>
          <div>
            <label className="text-xs muted">
              Số tài khoản *
            </label>
            <input
              name="bank_account_number"
              value={data.bank_account_number}
              onChange={onChange}
              placeholder="Ví dụ: 0123456789"
            />
          </div>
        </div>
      )}

      {/* Thông tin MoMo - Chỉ hiện khi chọn MoMo */}
      {data.payment_methods.momo && (
        <div className="card">
          <h2 className="section-title mb-2">
            Thông tin ví MoMo
          </h2>
          <div>
            <label className="text-xs muted">
              Số điện thoại MoMo *
            </label>
            <input
              name="momo_phone"
              value={data.momo_phone}
              onChange={onChange}
              placeholder="Ví dụ: 0901234567"
            />
            <p className="muted mt-1 text-xs">
              Số điện thoại đăng ký ví MoMo để nhận thanh toán
            </p>
          </div>
        </div>
      )}

      {/* Thông tin ZaloPay - Chỉ hiện khi chọn ZaloPay */}
      {data.payment_methods.zalopay && (
        <div className="card">
          <h2 className="section-title mb-2">
            Thông tin ZaloPay
          </h2>
          <div>
            <label className="text-xs muted">
              Số điện thoại ZaloPay *
            </label>
            <input
              name="zalopay_phone"
              value={data.zalopay_phone}
              onChange={onChange}
              placeholder="Ví dụ: 0901234567"
            />
            <p className="muted mt-1 text-xs">
              Số điện thoại đăng ký ZaloPay để nhận thanh toán
            </p>
          </div>
        </div>
      )}

      {/* Liên hệ hỗ trợ */}
      <div className="card">
        <h2 className="section-title mb-2">
          Liên hệ hỗ trợ
        </h2>
        <label className="text-xs muted">
          Email nhận thông báo đơn hàng
        </label>
        <input
          name="contact_email"
          value={data.contact_email}
          onChange={onChange}
          placeholder="organizer@example.com"
        />
        <p className="muted mt-2 text-xs">
          Databae Ticket có thể gửi thông tin đơn hàng / câu hỏi của
          khách về địa chỉ email này.
        </p>
      </div>
    </div>
  );
}
