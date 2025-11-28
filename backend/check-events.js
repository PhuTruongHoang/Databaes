// Script kiểm tra dữ liệu sự kiện
import { pool } from "./db.js";

async function checkEvents() {
  try {
    console.log("=== KIỂM TRA DỮ LIỆU SỰ KIỆN ===\n");

    // Lấy tất cả events
    const [events] = await pool.query(`
      SELECT
        e.Event_Id,
        e.Event_Name,
        e.Event_Category,
        e.Primary_Language,
        e.Poster_Image,
        e.Privacy_Level,
        e.User_Id
      FROM Event e
      ORDER BY e.Event_Id DESC
    `);

    if (events.length === 0) {
      console.log("❌ Không có sự kiện nào trong database");
      process.exit(0);
    }

    console.log(`✓ Tìm thấy ${events.length} sự kiện\n`);

    // Kiểm tra chi tiết từng event
    for (const event of events) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 Event ID: ${event.Event_Id}`);
      console.log(`   Tên: ${event.Event_Name}`);
      console.log(`   Danh mục: ${event.Event_Category || "❌ Chưa có"}`);
      console.log(`   Ngôn ngữ: ${event.Primary_Language || "❌ Chưa có"}`);
      console.log(`   Poster: ${event.Poster_Image ? "✓ Có" : "❌ Chưa có"}`);
      console.log(`   Privacy: ${event.Privacy_Level}`);
      console.log(`   Organizer ID: ${event.User_Id}`);

      // Kiểm tra sessions
      const [sessions] = await pool.query(
        `SELECT
          Session_Id,
          Start_Date,
          End_Date,
          Venue_Id,
          Available_Seats_Count,
          Session_Status
        FROM Event_Session
        WHERE Event_Id = ?
        ORDER BY Start_Date`,
        [event.Event_Id]
      );

      if (sessions.length === 0) {
        console.log(`   Sessions: ❌ Chưa có session nào`);
      } else {
        console.log(`   Sessions: ✓ ${sessions.length} session(s)`);
        sessions.forEach((s, idx) => {
          console.log(`     ${idx + 1}. Session ${s.Session_Id}: ${s.Start_Date} | Status: ${s.Session_Status}`);
        });
      }

      // Kiểm tra pricing
      const [pricing] = await pool.query(
        `SELECT
          dp.Pricing_Id,
          dp.Session_Id,
          dp.Tier_Id,
          dp.Price,
          t.Tier_Name
        FROM Define_Pricing dp
        JOIN Pricing_Tier t ON t.Tier_Id = dp.Tier_Id
        JOIN Event_Session s ON s.Session_Id = dp.Session_Id
        WHERE s.Event_Id = ?
        ORDER BY dp.Price`,
        [event.Event_Id]
      );

      if (pricing.length === 0) {
        console.log(`   Pricing: ❌ Chưa có giá nào\n`);
      } else {
        console.log(`   Pricing: ✓ ${pricing.length} giá`);
        const minPrice = Math.min(...pricing.map(p => p.Price));
        const maxPrice = Math.max(...pricing.map(p => p.Price));
        console.log(`     Giá từ: ${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`);
        pricing.forEach((p, idx) => {
          console.log(`     ${idx + 1}. ${p.Tier_Name}: ${p.Price.toLocaleString("vi-VN")}đ (Session ${p.Session_Id})`);
        });
        console.log();
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✓ Hoàn tất kiểm tra!");

  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}

checkEvents();
