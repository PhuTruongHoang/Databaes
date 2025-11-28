// frontend/src/components/SessionSelector.jsx
export default function SessionSelector({
  sessions,
  selectedSession,
  onSelect,
}) {
  if (!sessions || sessions.length === 0) {
    return <p>Chưa có suất diễn nào cho sự kiện này.</p>;
  }

  return (
    <div>
      <h2 className="font-semibold mb-3">Chọn suất diễn</h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s)}
            className={
              "w-full text-left px-3 py-2 rounded border " +
              (selectedSession?.session_id === s.session_id
                ? "border-emerald-400 bg-slate-900"
                : "border-slate-700 bg-slate-900/40")
            }
          >
            <div className="text-sm font-medium">
              {new Date(s.start_datetime).toLocaleString("vi-VN")} –{" "}
              {new Date(s.end_datetime).toLocaleTimeString("vi-VN")}
            </div>
            <div className="text-xs text-slate-400">
              {s.venue_name} • Còn lại: {s.available_seats_count} chỗ
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
