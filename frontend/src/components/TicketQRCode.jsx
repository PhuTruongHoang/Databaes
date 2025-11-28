// src/components/TicketQRCode.jsx
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function TicketQRCode({ ticket, onClose }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticket || !canvasRef.current) return;

    // Tạo QR code data với thông tin vé
    const qrData = JSON.stringify({
      ticket_id: ticket.ticket_id,
      order_id: ticket.order_id,
      event_name: ticket.event_name,
      session_date: ticket.session_date,
      ticket_type: ticket.ticket_type,
      status: ticket.ticket_status,
    });

    // Generate QR code
    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err) => {
        if (err) {
          console.error("QR Code generation error:", err);
          setError("Không thể tạo mã QR");
        }
      }
    );
  }, [ticket]);

  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Mã QR Check-in</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <canvas ref={canvasRef} />
              </div>

              {/* Ticket Info */}
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sự kiện:</span>
                  <span className="font-medium text-gray-900">{ticket.event_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loại vé:</span>
                  <span className="font-medium text-gray-900">{ticket.ticket_type || "Standard"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày diễn:</span>
                  <span className="font-medium text-gray-900">{ticket.session_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã vé:</span>
                  <span className="font-mono text-xs text-gray-900">#{ticket.ticket_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.ticket_status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : ticket.ticket_status === "CHECKED_IN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.ticket_status}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <p className="font-medium mb-1">Hướng dẫn sử dụng:</p>
                <p>Xuất trình mã QR này tại cổng check-in của sự kiện để được vào cửa.</p>
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
