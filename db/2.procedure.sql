USE ticketboxdb;
-- ===================================================================
-- BÀI TẬP LỚN 2 - PHẦN 2.1: THỦ TỤC HOÀN CHỈNH (ĐÃ SỬA LỖI DELIMITER)
-- ===================================================================

-- ===================================================================
-- 1. THỦ TỤC INSERT (PHIÊN BẢN TỰ TÍNH ID)
-- ===================================================================
DELIMITER //

DROP PROCEDURE IF EXISTS sp_InsertEventSession//

CREATE PROCEDURE sp_InsertEventSession(
    IN p_Event_Id BIGINT,
    IN p_Venue_Id BIGINT,
    IN p_Start_Date DATETIME,
    IN p_End_Date DATETIME,
    IN p_Open_Date DATETIME,
    IN p_Close_Date DATETIME,
    IN p_Available_Seats_Count BIGINT,
    IN p_Session_Status VARCHAR(20),
    OUT p_New_Session_Id BIGINT 
)
BEGIN
    DECLARE v_event_exists INT;
    DECLARE v_venue_exists INT;
    DECLARE v_venue_capacity INT;
    DECLARE v_overlapping_sessions INT;
    DECLARE v_next_id BIGINT;
    
    -- 1. KIỂM TRA KHÓA NGOẠI
    SELECT COUNT(*) INTO v_event_exists FROM Event WHERE Event_Id = p_Event_Id;
    IF v_event_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Event_Id does not exist in the system';
    END IF;
    
    SELECT COUNT(*), COALESCE(MAX(Total_Capacity), 0) 
    INTO v_venue_exists, v_venue_capacity
    FROM Venue WHERE Venue_Id = p_Venue_Id;
    
    IF v_venue_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Venue_Id does not exist in the system';
    END IF;
    
    -- 2. KIỂM TRA LOGIC THỜI GIAN
    IF p_Start_Date >= p_End_Date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Start time must be before end time';
    END IF;
    
    IF p_Open_Date IS NOT NULL AND p_Close_Date IS NOT NULL THEN
        IF p_Open_Date >= p_Close_Date THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Ticket sales opening time must be before ticket sales closing time';
        END IF;
        IF p_Close_Date > p_Start_Date THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Ticket sales close time must be before or equal to the event start time';
        END IF;
    END IF;

    IF p_Start_Date < NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot create a show with a time in the past';
    END IF;
    
    -- 3. KIỂM TRA TRÙNG LỊCH
    SELECT COUNT(*) INTO v_overlapping_sessions
    FROM Event_Session
    WHERE Venue_Id = p_Venue_Id
      AND Session_Status NOT IN ('CANCELLED', 'COMPLETED')
      AND (
          (p_Start_Date >= Start_Date AND p_Start_Date < End_Date) OR
          (p_End_Date > Start_Date AND p_End_Date <= End_Date) OR
          (p_Start_Date <= Start_Date AND p_End_Date >= End_Date)
      );
    
    IF v_overlapping_sessions > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This location already has another event happening during this time slot';
    END IF;
    
    -- 4. KIỂM TRA TRẠNG THÁI
    IF p_Session_Status NOT IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid state';
    END IF;
    
    -- 5. TÍNH TOÁN ID MỚI (Tự động tăng +1 từ MAX ID)
    SELECT COALESCE(MAX(Session_Id), 999) + 1 INTO v_next_id FROM Event_Session;
    
    -- 6. THỰC HIỆN INSERT
    INSERT INTO Event_Session (
        Session_Id, Event_Id, Venue_Id, Start_Date, End_Date, 
        Open_Date, Close_Date, Available_Seats_Count, Session_Status
    ) VALUES (
        v_next_id, p_Event_Id, p_Venue_Id, p_Start_Date, p_End_Date, 
        p_Open_Date, p_Close_Date, v_venue_capacity, p_Session_Status
    );
    
    SET p_New_Session_Id = v_next_id;
    
    SELECT 'Insert show success!' AS Message, p_New_Session_Id AS New_Session_Id;
END//

DELIMITER ;

-- ===================================================================
-- 2. THỦ TỤC UPDATE (SỬA BUỔI DIỄN)
-- ===================================================================
DELIMITER //  

DROP PROCEDURE IF EXISTS sp_UpdateEventSession//

CREATE PROCEDURE sp_UpdateEventSession(
    IN p_Session_Id BIGINT,
    IN p_Event_Id BIGINT,
    IN p_Venue_Id BIGINT,
    IN p_Start_Date DATETIME,
    IN p_End_Date DATETIME,
    IN p_Open_Date DATETIME,
    IN p_Close_Date DATETIME,
    IN p_Available_Seats_Count BIGINT,
    IN p_Session_Status VARCHAR(20)
)
BEGIN
    DECLARE v_session_exists INT;
    DECLARE v_event_exists INT;
    DECLARE v_venue_exists INT;
    DECLARE v_overlapping_sessions INT;
    DECLARE v_tickets_sold INT;
    DECLARE v_current_status VARCHAR(20);
    
    -- 1. KIỂM TRA TỒN TẠI
    SELECT COUNT(*), COALESCE(MAX(Session_Status), '') 
    INTO v_session_exists, v_current_status
    FROM Event_Session WHERE Session_Id = p_Session_Id;
    
    IF v_session_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Session_Id does not exist';
    END IF;
    
    -- 2. LOGIC NGHIỆP VỤ
    IF v_current_status IN ('COMPLETED', 'CANCELLED') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Unable to update a show that has ended or been canceled';
    END IF;
    
    SELECT COUNT(*) INTO v_event_exists FROM Event WHERE Event_Id = p_Event_Id;
    IF v_event_exists = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Event_Id does not exist'; END IF;
    
    SELECT COUNT(*) INTO v_venue_exists FROM Venue WHERE Venue_Id = p_Venue_Id;
    IF v_venue_exists = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Venue_Id does not exist'; END IF;
    
    -- Kiểm tra vé đã bán
    SELECT COUNT(*) INTO v_tickets_sold FROM Ticket WHERE Session_Id = p_Session_Id;
    IF v_tickets_sold > 0 AND (p_Venue_Id != (SELECT Venue_Id FROM Event_Session WHERE Session_Id = p_Session_Id)) THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT ='Error: Tickets already sold, cannot change Location.';
    END IF;

    -- 3. KIỂM TRA THỜI GIAN & TRÙNG LỊCH
    IF p_Start_Date >= p_End_Date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Start time must be before end time';
    END IF;

    SELECT COUNT(*) INTO v_overlapping_sessions
    FROM Event_Session
    WHERE Venue_Id = p_Venue_Id
      AND Session_Id != p_Session_Id
      AND Session_Status NOT IN ('CANCELLED', 'COMPLETED')
      AND (
          (p_Start_Date >= Start_Date AND p_Start_Date < End_Date) OR
          (p_End_Date > Start_Date AND p_End_Date <= End_Date) OR
          (p_Start_Date <= Start_Date AND p_End_Date >= End_Date)
      );
      
    IF v_overlapping_sessions > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Scheduled with another event at this location';
    END IF;
    
    -- 4. UPDATE
    UPDATE Event_Session
    SET Event_Id = p_Event_Id,
        Venue_Id = p_Venue_Id,
        Start_Date = p_Start_Date,
        End_Date = p_End_Date,
        Open_Date = p_Open_Date,
        Close_Date = p_Close_Date,
        Session_Status = p_Session_Status
    WHERE Session_Id = p_Session_Id;
    
    SELECT 'Update successful!' AS Message;
END//

DELIMITER ;

-- ===================================================================
-- 3. THỦ TỤC DELETE (XÓA BUỔI DIỄN)
-- ===================================================================
DELIMITER //  

DROP PROCEDURE IF EXISTS sp_DeleteEventSession//

CREATE PROCEDURE sp_DeleteEventSession(
    IN p_Session_Id BIGINT
)
BEGIN
    DECLARE v_session_exists INT;
    DECLARE v_paid_tickets INT;
    DECLARE v_start_date DATETIME;
    
    SELECT COUNT(*), COALESCE(MAX(Start_Date), NOW())
    INTO v_session_exists, v_start_date
    FROM Event_Session WHERE Session_Id = p_Session_Id;
    
    IF v_session_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Session_Id does not exist';
    END IF;
    
    SELECT COUNT(*) INTO v_paid_tickets
    FROM Ticket
    WHERE Session_Id = p_Session_Id AND Ticket_Status IN ('PAID', 'CHECKED_IN');
    
    IF v_paid_tickets > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot delete a show that already has a paid ticket.';
    END IF;
    
    IF v_start_date <= NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot delete an event that has already started/ended.';
    END IF;
    
    DELETE FROM Ticket WHERE Session_Id = p_Session_Id;
    DELETE FROM Define_Pricing WHERE Session_Id = p_Session_Id;
    DELETE FROM Event_Session WHERE Session_Id = p_Session_Id;
    
    SELECT 'Xóa thành công!' AS Message;
END//

DELIMITER ;


-- ===================================================================
-- TEST CASES
-- ===================================================================

-- Test 1: Thêm session mới
-- SET @new_id = 0;
-- CALL sp_InsertEventSession(201, 101, '2026-01-15 19:00:00', '2026-01-15 22:00:00', '2025-12-01 00:00:00', '2026-01-15 18:00:00', 5000, 'SCHEDULED', @new_id);
-- SELECT @new_id AS 'Session vừa tạo';

-- Xem kết quả
-- SELECT * FROM Event_Session WHERE Session_Id = @new_id;

-- Test 2: Update session CHƯA có vé (được phép thay đổi tất cả)
-- CALL sp_UpdateEventSession(305, 202, 102, '2026-02-20 19:00:00', '2026-02-20 22:00:00', NULL, NULL,1000, 'SCHEDULED');

-- Test 3: Update session ĐÃ có vé (chỉ được đổi status)
-- Giả sử session 5001 đã có vé bán (từ sample data)
-- CALL sp_UpdateEventSession(309, 208, 108, '2025-12-31 18:00:00', '2025-12-31 21:00:00', '2025-11-01 00:00:00', '2025-12-29 17:00:00', 9900,'CANCELLED');
-- → Sẽ thành công vì chỉ đổi status từ SCHEDULED → ONGOING

-- Test 4: Thử đổi Venue của session có vé (sẽ LỖI)
-- CALL sp_UpdateEventSession(5001, 4001, 2002, '2025-12-05 19:30:00', '2025-12-05 22:30:00', '2025-11-20 00:00:00', '2025-12-05 18:00:00', 'SCHEDULED');
-- → Sẽ báo lỗi vì cố thay đổi Venue

-- Test 5: Xóa session (comment lại nếu muốn giữ data)
-- CALL sp_DeleteEventSession(316);








-- ===================================================================
-- BÀI TẬP LỚN 2 - PHẦN 2.2: 
-- ===================================================================

-- ============================================================
-- TRIGGER 1 — Session Overlap (INSERT)
--   Kiểm tra session trùng giờ tại cùng Venue
-- ============================================================ 
DROP TRIGGER IF EXISTS ticketboxdb.tr_Session_NoOverlap_Insert;

DELIMITER $$

CREATE TRIGGER tr_Session_NoOverlap_Insert
BEFORE INSERT ON Event_Session
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Event_Session s
        WHERE s.Venue_Id = NEW.Venue_Id
        AND NOT (
            NEW.End_Date   <= s.Start_Date
            OR NEW.Start_Date >= s.End_Date
        )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Two sessions at same venue cannot overlap (INSERT)';
    END IF;
END$$

DELIMITER ;


-- ============================================================
--   TRIGGER 2 — Session Overlap (UPDATE)
-- ============================================================

DROP TRIGGER IF EXISTS ticketboxdb.tr_Session_NoOverlap_Update;

DELIMITER $$

CREATE TRIGGER tr_Session_NoOverlap_Update
BEFORE UPDATE ON Event_Session
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Event_Session s
        WHERE s.Venue_Id = NEW.Venue_Id
          AND s.Session_Id <> OLD.Session_Id
          AND NOT (
              NEW.End_Date <= s.Start_Date
              OR NEW.Start_Date >= s.End_Date
          )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Two sessions at same venue cannot overlap (UPDATE)';
    END IF;
END$$

DELIMITER ;


-- ============================================================
--   TRIGGER 3 — Available Seats (AFTER INSERT)
--   Derived attribute: Available_Seats_Count -= 1
-- ============================================================ 

DROP TRIGGER IF EXISTS ticketboxdb.tr_Update_AvailableSeats_Insert;
DELIMITER $$

CREATE TRIGGER tr_Update_AvailableSeats_Insert
BEFORE INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE v_remaining INT;
    DECLARE v_status    VARCHAR(20);

    SELECT Available_Seats_Count, Session_Status
    INTO v_remaining, v_status
    FROM Event_Session
    WHERE Session_Id = NEW.Session_Id
    FOR UPDATE;

    IF v_remaining IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Session not found for this ticket.';
    END IF;

    -- Chỉ kiểm tra & trừ ghế nếu chưa COMPLETED/CANCELLED
    IF v_status NOT IN ('COMPLETED', 'CANCELLED') THEN
        IF v_remaining <= 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sold out: not enough seats available.';
        END IF;

        UPDATE Event_Session
        SET Available_Seats_Count = v_remaining - 1
        WHERE Session_Id = NEW.Session_Id;
    END IF;
END$$
DELIMITER ;


-- ============================================================
--   TRIGGER 4 — Available Seats (AFTER DELETE)
--   Derived attribute: Available_Seats_Count += 1
-- ============================================================ 
DROP TRIGGER IF EXISTS ticketboxdb.tr_Update_AvailableSeats_Delete;
DELIMITER $$

CREATE TRIGGER tr_Update_AvailableSeats_Delete
AFTER DELETE ON Ticket
FOR EACH ROW
BEGIN
    UPDATE Event_Session
    SET Available_Seats_Count = Available_Seats_Count + 1
    WHERE Session_Id = OLD.Session_Id;
END$$

DELIMITER ;









-- ===================================================================
-- BÀI TẬP LỚN 2 - PHẦN 2.3 
-- ===================================================================

USE TicketBoxDB;
drop procedure if exists cal_revenue;
drop procedure if exists sp_GetOpenSessions;
DELIMITER //
CREATE PROCEDURE cal_revenue ( 
    IN p_event_id BIGINT,
    IN p_min_revenue DECIMAL(15, 2)
)
BEGIN
    SELECT 
        T.Ticket_type AS Loai_Ve,
        COUNT(T.Ticket_id) AS So_Ve_Ban_Duoc, -- Đếm số lượng
        T.Ticket_Price AS Gia_Ve,             -- Đơn giá
        T.Session_id,
        -- TRẢ LẠI ĐÚNG LOGIC CỦA BẠN: ĐƠN GIÁ * SỐ LƯỢNG
        (T.Ticket_Price * COUNT(T.Ticket_id)) AS Doanh_Thu 
    FROM 
        TICKET T
    JOIN 
        `ORDER` O ON O.Order_Id = T.Order_Id
    JOIN 
        PAYMENT P ON P.Order_Id = O.Order_Id
    JOIN
        EVENT_SESSION ES ON T.Session_id = ES.Session_id
    WHERE 
        P.payment_status = 'SUCCESS'
        AND ES.Event_id = p_event_id
    GROUP BY 
        T.Session_id,    
        T.Ticket_Price,  
        T.Ticket_type    
    HAVING 
        Doanh_Thu >= p_min_revenue -- Lọc trên cột Doanh_Thu vừa tính ở trên
    ORDER BY 
        T.Session_id ASC,
        Doanh_Thu DESC; 
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_GetOpenSessions (
    IN p_event_id BIGINT -- Người dùng chọn xem sự kiện nào
)
BEGIN
    SELECT 
        E.Event_name AS Ten_Su_Kien,
        ES.Session_id AS Ma_Suat_Dien,
        V.Venue_name AS Dia_Diem,
        V.Venue_address AS Dia_Chi,
        ES.Start_date AS Thoi_Gian_Bat_Dau,
        ES.End_date AS Thoi_Gian_Ket_Thuc,
        ES.Available_seats_count AS So_Ghe_Trong
    FROM 
        EVENT_SESSION ES
    JOIN 
        VENUE V ON ES.Venue_id = V.Venue_id     -- Liên kết bảng 1: Lấy tên địa điểm
    JOIN 
        EVENT E ON ES.Event_id = E.Event_id     -- Liên kết bảng 2: Lấy tên sự kiện
    WHERE 
        ES.Event_id = p_event_id                -- Điều kiện 1: Đúng sự kiện khách chọn
        AND ES.Session_status = 'SCHEDULED'     -- Điều kiện 2: Chỉ lấy suất đang mở bán
        AND ES.Start_date > NOW()               -- Điều kiện 3: Chỉ lấy suất chưa diễn ra (Tương lai)
    ORDER BY 
        ES.Start_date ASC;                      -- Sắp xếp: Suất diễn gần nhất hiện lên đầu
END //

DELIMITER ;

-- CALL cal_revenue(1, 0);

-- CALL sp_GetOpenSessions(1);









-- ===================================================================
-- BÀI TẬP LỚN 2 - PHẦN 2.4
-- ===================================================================
DROP FUNCTION IF EXISTS calculate_organizer_revenue;
DELIMITER $$

CREATE FUNCTION calculate_organizer_revenue(
    p_organizer_id BIGINT,
    p_start_date DATETIME,
    p_end_date DATETIME
) 
RETURNS DECIMAL(14,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_revenue DECIMAL(14,2) DEFAULT 0;
    DECLARE current_order_id BIGINT;
    DECLARE current_amount DECIMAL(14,2);
    DECLARE done INT DEFAULT FALSE;

    -- Cursor để duyệt qua các order của organizer
    DECLARE revenue_cursor CURSOR FOR
        SELECT DISTINCT o.Order_Id, o.Total_Amount
        FROM Event e
        INNER JOIN Event_Session es ON e.Event_Id = es.Event_Id
        INNER JOIN Ticket t ON es.Session_Id = t.Session_Id
        INNER JOIN `Order` o ON t.Order_Id = o.Order_Id
        WHERE e.User_Id = p_organizer_id
          AND o.Order_Status = 'PAID'
          AND (
              (p_start_date IS NULL AND p_end_date IS NULL)
              OR
              (p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND o.Order_Datetime BETWEEN p_start_date AND p_end_date)
          );

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Kiểm tra tham số đầu vào
    IF p_organizer_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Organizer ID không được NULL';
    END IF;

    IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND p_start_date > p_end_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc';
    END IF;

    -- Kiểm tra organizer có tồn tại
    IF NOT EXISTS (SELECT 1 FROM Organizer WHERE User_Id = p_organizer_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Organizer không tồn tại trong hệ thống';
    END IF;

    -- Mở cursor và tính tổng revenue
    OPEN revenue_cursor;

    revenue_loop: LOOP
        FETCH revenue_cursor INTO current_order_id, current_amount;

        IF done THEN
            LEAVE revenue_loop;
        END IF;

        -- Cộng dồn revenue từ mỗi order
        IF current_amount IS NOT NULL THEN
            SET total_revenue = total_revenue + current_amount;
        END IF;
    END LOOP;

    CLOSE revenue_cursor;

    RETURN total_revenue;
END$$

DELIMITER ;





DROP FUNCTION IF EXISTS count_customer_tickets;
DELIMITER $$

CREATE FUNCTION count_customer_tickets(
    p_customer_id BIGINT,
    p_start_date DATETIME,
    p_end_date DATETIME
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE ticket_count INT DEFAULT 0;
    DECLARE current_ticket_id BIGINT;
    DECLARE current_status VARCHAR(20);
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor để duyệt qua các vé của customer
    DECLARE ticket_cursor CURSOR FOR
        SELECT t.Ticket_Id, t.Ticket_Status
        FROM Ticket t
        INNER JOIN `Order` o ON t.Order_Id = o.Order_Id
        WHERE o.Customer_Id = p_customer_id
          AND o.Order_Datetime BETWEEN p_start_date AND p_end_date;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Kiểm tra tham số đầu vào
    IF p_customer_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Customer ID không được NULL';
    END IF;
    
    IF p_start_date > p_end_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc';
    END IF;
    
    -- Kiểm tra customer có tồn tại
    IF NOT EXISTS (SELECT 1 FROM Customer WHERE User_Id = p_customer_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Customer không tồn tại trong hệ thống';
    END IF;
    
    -- Mở cursor và đếm vé
    OPEN ticket_cursor;
    
    count_loop: LOOP
        FETCH ticket_cursor INTO current_ticket_id, current_status;
        
        IF done THEN
            LEAVE count_loop;
        END IF;
        
        -- Chỉ đếm vé đã thanh toán hoặc đã check-in
        IF current_status IN ('PAID', 'CHECKED_IN') THEN
            SET ticket_count = ticket_count + 1;
        END IF;
    END LOOP;
    
    CLOSE ticket_cursor;
    
    RETURN ticket_count;
END$$

DELIMITER ;





