// frontend/src/components/TicketSelector.jsx
export default function TicketSelector({
  pricing,
  selectedTickets,
  onChange,
}) {
  if (!pricing || pricing.length === 0) {
    return <p>Hiện chưa có loại vé nào.</p>;
  }

  const handleChange = (tierId, qty) => {
    if (qty < 0) qty = 0;
    onChange({
      ...selectedTickets,
      [tierId]: qty,
    });
  };

  const total = pricing.reduce((sum, tier) => {
    const qty = selectedTickets[tier.tier_id] || 0;
    return sum + qty * tier.base_price;
  }, 0);

  return (
    <div>
      <h2 className="font-semibold mb-3">Chọn loại vé</h2>
      <div className="space-y-3 mb-4">
        {pricing.map((tier) => (
          <div
            key={tier.tier_id}
            className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-3 py-2 rounded"
          >
            <div>
              <div className="font-medium">{tier.tier_name}</div>
              <div className="text-sm text-slate-400">
                {tier.base_price.toLocaleString("vi-VN")}₫
              </div>
            </div>
            <input
              type="number"
              min="0"
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right"
              value={selectedTickets[tier.tier_id] || 0}
              onChange={(e) =>
                handleChange(tier.tier_id, Number(e.target.value))
              }
            />
          </div>
        ))}
      </div>

      <div className="text-right font-semibold">
        Tổng tạm tính: {total.toLocaleString("vi-VN")}₫
      </div>
    </div>
  );
}
