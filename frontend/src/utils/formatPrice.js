// src/utils/formatPrice.js

/**
 * Format giá tiền theo chuẩn Việt Nam, bỏ phần thập phân .00
 * @param {number} price - Giá tiền cần format
 * @returns {string} - Giá đã format (ví dụ: "500.000" thay vì "500.000,00")
 */
export function formatPrice(price) {
  if (!price || price === 0) return "0";

  return Math.floor(price).toLocaleString("vi-VN");
}

/**
 * Format giá tiền với đơn vị đồng
 * @param {number} price - Giá tiền cần format
 * @returns {string} - Giá đã format với đơn vị (ví dụ: "500.000đ")
 */
export function formatPriceWithCurrency(price) {
  if (!price || price === 0) return "0đ";

  return `${Math.floor(price).toLocaleString("vi-VN")}đ`;
}
