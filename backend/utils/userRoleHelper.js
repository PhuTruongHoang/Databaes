// utils/userRoleHelper.js

/**
 * Đảm bảo user có role phù hợp và tự động upgrade nếu cần
 *
 * @param {Object} conn - MySQL connection (from pool.getConnection())
 * @param {number} userId - User ID
 * @param {string} targetRole - 'ORGANIZER' hoặc 'CUSTOMER'
 * @returns {Promise<string>} - User_Type mới ('CUSTOMER', 'ORGANIZER', hoặc 'BOTH')
 */
export async function ensureUserRole(conn, userId, targetRole) {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!['ORGANIZER', 'CUSTOMER'].includes(targetRole)) {
    throw new Error('targetRole must be "ORGANIZER" or "CUSTOMER"');
  }

  // 1. Lấy current user_type
  const [userRows] = await conn.query(
    `SELECT User_Type FROM User WHERE User_Id = ?`,
    [userId]
  );

  if (userRows.length === 0) {
    throw new Error(`User ${userId} không tồn tại`);
  }

  const currentType = userRows[0].User_Type;
  let newType = currentType;

  // 2. Xử lý logic upgrade role
  if (targetRole === 'ORGANIZER') {
    // Nếu user là CUSTOMER → upgrade thành BOTH
    if (currentType === 'CUSTOMER') {
      newType = 'BOTH';
    }
    // Nếu đã là ORGANIZER hoặc BOTH → giữ nguyên

    // Thêm vào bảng Organizer nếu chưa có
    const [orgCheck] = await conn.query(
      `SELECT User_Id FROM Organizer WHERE User_Id = ?`,
      [userId]
    );

    if (orgCheck.length === 0) {
      await conn.query(
        `INSERT INTO Organizer (User_Id) VALUES (?)`,
        [userId]
      );
      console.log(`✓ Added user ${userId} to Organizer table`);
    }
  }

  if (targetRole === 'CUSTOMER') {
    // Nếu user là ORGANIZER → upgrade thành BOTH
    if (currentType === 'ORGANIZER') {
      newType = 'BOTH';
    }
    // Nếu đã là CUSTOMER hoặc BOTH → giữ nguyên

    // Thêm vào bảng Customer nếu chưa có
    const [custCheck] = await conn.query(
      `SELECT User_Id FROM Customer WHERE User_Id = ?`,
      [userId]
    );

    if (custCheck.length === 0) {
      await conn.query(
        `INSERT INTO Customer (User_Id) VALUES (?)`,
        [userId]
      );
      console.log(`✓ Added user ${userId} to Customer table`);
    }
  }

  // 3. Update User_Type nếu có thay đổi
  if (newType !== currentType) {
    await conn.query(
      `UPDATE User SET User_Type = ? WHERE User_Id = ?`,
      [newType, userId]
    );

    console.log(`✓ User ${userId} role upgraded: ${currentType} → ${newType}`);
  }

  return newType;
}
