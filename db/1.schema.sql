-- 01_schema_mysql.sql - Converted for MySQL
CREATE DATABASE IF NOT EXISTS TicketBoxDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TicketBoxDB;

/*===========================================================
  DROP TABLES (Xóa bảng cũ nếu tồn tại - theo thứ tự ngược khóa ngoại)
===========================================================*/
SET FOREIGN_KEY_CHECKS = 0; -- Tắt kiểm tra khóa ngoại tạm thời để drop dễ dàng
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Ticket;
DROP TABLE IF EXISTS Ticket_List;
DROP TABLE IF EXISTS Event_List;
DROP TABLE IF EXISTS `Order`; -- Order là từ khóa, cần bọc trong dấu huyền
DROP TABLE IF EXISTS Define_Pricing;
DROP TABLE IF EXISTS Seat;
DROP TABLE IF EXISTS Seat_Section;
DROP TABLE IF EXISTS Event_Subtitles;
DROP TABLE IF EXISTS Event_Session;
DROP TABLE IF EXISTS Pricing_Tier;
DROP TABLE IF EXISTS Event;
DROP TABLE IF EXISTS Venue;
DROP TABLE IF EXISTS Ticket;
DROP TABLE IF EXISTS Organizer;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS User;
SET FOREIGN_KEY_CHECKS = 1; -- Bật lại kiểm tra khóa ngoại

/*===========================================================
  USER
===========================================================*/
CREATE TABLE User (
  User_Id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  Username      VARCHAR(50)  NOT NULL UNIQUE,        -- UNIQUE cho Username
  PasswordHash  VARCHAR(200) NOT NULL,               
  Email         VARCHAR(255) NOT NULL UNIQUE,        -- 255 theo chuẩn email
  Phone_Number  VARCHAR(15)  NOT NULL UNIQUE,        -- 15 ký tự đủ cho số quốc tế
  Full_Name     VARCHAR(100),
  Gender        VARCHAR(10) NOT NULL CHECK (Gender IN ('MALE', 'FEMALE', 'OTHER')),
  Birth_Date    DATE,                                 
  User_Type     VARCHAR(15)  NOT NULL CHECK (User_Type IN ('CUSTOMER', 'ORGANIZER', 'BOTH'))
);

/*===========================================================
  CUSTOMER & ORGANIZER (subtype của USER)
===========================================================*/
CREATE TABLE Customer (
  User_Id BIGINT PRIMARY KEY,
  CONSTRAINT FK_Customer_User 
    FOREIGN KEY (User_Id) 
    REFERENCES User(User_Id) 
    ON DELETE CASCADE
);

CREATE TABLE Organizer (
  User_Id BIGINT PRIMARY KEY,
  CONSTRAINT FK_Organizer_User 
    FOREIGN KEY (User_Id) 
    REFERENCES User(User_Id) 
    ON DELETE CASCADE
);

/*===========================================================
  VENUE
===========================================================*/
CREATE TABLE Venue (
  Venue_Id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  Parent_Venue_Id BIGINT NULL,  
  Venue_Address   VARCHAR(200),
  Total_Capacity  INT NOT NULL CHECK (Total_Capacity >= 0),
  Venue_Name      VARCHAR(100) NOT NULL,
  Venue_Type      VARCHAR(20)  NOT NULL CHECK (Venue_Type IN ('INDOOR', 'OUTDOOR', 'ONLINE')),
  -- Venue ONLINE không cần address, các loại khác BẮT BUỘC có address
  CONSTRAINT CK_Venue_Address CHECK (
    (Venue_Type = 'ONLINE')
    OR (Venue_Type IN ('INDOOR', 'OUTDOOR') AND Venue_Address IS NOT NULL)
  ),
  CONSTRAINT FK_Venue_Parent 
    FOREIGN KEY (Parent_Venue_Id) 
    REFERENCES Venue(Venue_Id) 
    ON DELETE SET NULL
);

/*===========================================================
  EVENT
===========================================================*/
CREATE TABLE Event (
  Event_Id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  User_Id           BIGINT NOT NULL,    
  Event_Name        VARCHAR(150) NOT NULL,
  Event_Description TEXT,    
  Event_Category    VARCHAR(50),
  Privacy_Level     VARCHAR(20)  NOT NULL 
	CHECK (Privacy_Level IN ('PUBLIC', 'RESTRICTED')),
  Primary_Language  VARCHAR(20),
  Is_Online_Event   BOOLEAN NOT NULL DEFAULT 0,           
  Poster_Image      VARCHAR(255),                      
  Event_Duration    DECIMAL(4,1) CHECK (Event_Duration > 0),  
  CONSTRAINT FK_Event_Organizer 
    FOREIGN KEY (User_Id) 
    REFERENCES Organizer(User_Id) 
    ON DELETE CASCADE
);

/*===========================================================
  EVENT_SUBTITLES
===========================================================*/
CREATE TABLE Event_Subtitles (
  Event_Id  BIGINT NOT NULL,
  Subtitle  VARCHAR(50) NOT NULL,  
  PRIMARY KEY (Event_Id, Subtitle),
  CONSTRAINT FK_EventSubtitles_Event 
    FOREIGN KEY (Event_Id) 
    REFERENCES Event(Event_Id) 
    ON DELETE CASCADE
);

/*===========================================================
  EVENT_SESSION
===========================================================*/
CREATE TABLE Event_Session (
  Session_Id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  Event_Id              BIGINT NOT NULL,
  Venue_Id              BIGINT NOT NULL,
  Start_Date            DATETIME NOT NULL,         
  End_Date              DATETIME NOT NULL,         
  Open_Date             DATETIME NULL,             -- thời điểm mở bán
  Close_Date            DATETIME NULL,             -- thời điểm đóng bán
  Available_Seats_Count INT NOT NULL DEFAULT 0 CHECK (Available_Seats_Count >= 0),
  Session_Status        VARCHAR(20) NOT NULL CHECK (Session_Status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT FK_Session_Event 
    FOREIGN KEY (Event_Id) 
    REFERENCES Event(Event_Id) 
    ON DELETE CASCADE,
  CONSTRAINT FK_Session_Venue 
    FOREIGN KEY (Venue_Id) 
    REFERENCES Venue(Venue_Id) 
    ON DELETE RESTRICT,
  -- Thời gian session hợp lệ
  CONSTRAINT CK_Session_Time_Order CHECK (Start_Date < End_Date),
  -- Booking period phải hợp lệ (nếu đủ cả 2 mốc)
  CONSTRAINT CK_Booking_Period CHECK (
    (Open_Date IS NULL OR Close_Date IS NULL)
    OR (Open_Date < Close_Date)
  ),
  -- Không cho mở bán vé sau khi event bắt đầu
  CONSTRAINT CK_Booking_Before_Event CHECK (
    Open_Date IS NULL OR Open_Date <= Start_Date
  )
);

/*===========================================================
  SEAT_SECTION
===========================================================*/
CREATE TABLE Seat_Section (
  Section_Id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  Venue_Id         BIGINT NOT NULL,
  Section_Name     VARCHAR(50) NOT NULL,
  Seats_Per_Row    INT NOT NULL CHECK (Seats_Per_Row > 0),
  Row_Count        INT NOT NULL CHECK (Row_Count > 0),
  -- Cột tính toán: sức chứa của section
  Section_Capacity INT GENERATED ALWAYS AS (Row_Count * Seats_Per_Row) STORED,
  View_Description VARCHAR(200) NULL,
  CONSTRAINT FK_Section_Venue 
    FOREIGN KEY (Venue_Id) 
    REFERENCES Venue(Venue_Id) 
    ON DELETE CASCADE,
  -- Không trùng tên section trong cùng venue
  CONSTRAINT UK_Section_Name_Per_Venue UNIQUE (Venue_Id, Section_Name)
);

/*===========================================================
  SEAT
===========================================================*/
CREATE TABLE Seat (
  Section_Id     BIGINT NOT NULL,
  Seat_Number    INT NOT NULL,
  Row_Identifier VARCHAR(10),
  Seat_Type      VARCHAR(20) NOT NULL CHECK (Seat_Type IN ('STANDING', 'SEATED')),
  PRIMARY KEY (Section_Id, Seat_Number),
  CONSTRAINT FK_Seat_Section
    FOREIGN KEY (Section_Id)
    REFERENCES Seat_Section(Section_Id)
    ON DELETE CASCADE,
  -- Seat_Number phải > 0
  CONSTRAINT CK_Seat_Number_Positive CHECK (Seat_Number > 0)
);

/*===========================================================
  PRICING_TIER
===========================================================*/
CREATE TABLE Pricing_Tier (
  Tier_Id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  Tier_Name  VARCHAR(50) NOT NULL,
  Base_Price INT NOT NULL CHECK (Base_Price >= 0)
);

/*===========================================================
  DEFINE_PRICING
===========================================================*/
CREATE TABLE Define_Pricing (
  Tier_Id    BIGINT NOT NULL,
  Section_Id BIGINT NOT NULL,
  Session_Id BIGINT NOT NULL,
  Price      DECIMAL(12,2) NOT NULL CHECK (Price >= 0), 
  PRIMARY KEY (Tier_Id, Section_Id, Session_Id),
  CONSTRAINT FK_Define_Tier 
    FOREIGN KEY (Tier_Id) 
    REFERENCES Pricing_Tier(Tier_Id) 
    ON DELETE CASCADE,
  CONSTRAINT FK_Define_Section 
    FOREIGN KEY (Section_Id) 
    REFERENCES Seat_Section(Section_Id) 
    ON DELETE CASCADE,
  CONSTRAINT FK_Define_Session 
    FOREIGN KEY (Session_Id) 
    REFERENCES Event_Session(Session_Id) 
    ON DELETE CASCADE
);

/*===========================================================
  ORDER (Order là từ khóa trong SQL, phải dùng dấu ` `)
===========================================================*/
CREATE TABLE `Order` (
  Order_Id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  Customer_Id    BIGINT NOT NULL,
  Order_Datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Order_Status   VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    Order_Status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')
  ),
  Total_Amount   DECIMAL(14,2) NOT NULL CHECK (Total_Amount >= 0),
  CONSTRAINT FK_Order_Customer 
    FOREIGN KEY (Customer_Id) 
    REFERENCES Customer(User_Id) 
    ON DELETE CASCADE
);

/*===========================================================
  TICKET
===========================================================*/
CREATE TABLE Ticket (
  Ticket_Id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  Session_Id       BIGINT NOT NULL,
  Order_Id         BIGINT NOT NULL,
  Section_Id       BIGINT NULL,
  Seat_Number      INT NULL,
  Ticket_Type      VARCHAR(30),
  Ticket_Price     DECIMAL(12,2) NOT NULL 
	CHECK (Ticket_Price >= 0),
  Ticket_Status    VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (
    Ticket_Status IN ('UNPAID', 'PENDING', 'PAID', 'CHECKED_IN', 'CANCELLED')
  ),
  Unique_QR        VARCHAR(255) NOT NULL UNIQUE,
  Checkin_Datetime DATETIME,
  CONSTRAINT FK_Ticket_Session
    FOREIGN KEY (Session_Id)
    REFERENCES Event_Session(Session_Id)
    ON DELETE RESTRICT,
  CONSTRAINT FK_Ticket_Order
    FOREIGN KEY (Order_Id)
    REFERENCES `Order`(Order_Id)
    ON DELETE CASCADE,
  CONSTRAINT FK_Ticket_Seat
    FOREIGN KEY (Section_Id, Seat_Number)
    REFERENCES Seat(Section_Id, Seat_Number)
    ON DELETE RESTRICT,
  -- Đảm bảo 1 ghế chỉ bán 1 lần cho 1 session (nhưng có thể bán cho nhiều sessions khác nhau)
  CONSTRAINT UK_Ticket_Session_Seat UNIQUE (Session_Id, Section_Id, Seat_Number),
  -- Seat_Number phải là số dương (đồng bộ với bảng Seat)
  CONSTRAINT CK_Ticket_Seat_Positive CHECK (Seat_Number > 0)
);


/*===========================================================
  PAYMENT
===========================================================*/
CREATE TABLE Payment (
  Payment_Id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  Order_Id         BIGINT NOT NULL UNIQUE,  -- 1 order chỉ có 1 payment
  Payment_Datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Payment_Status   VARCHAR(20) NOT NULL CHECK (
    Payment_Status IN ('SUCCESS', 'FAILED', 'PENDING')
  ),
  Payment_Method   VARCHAR(30) NOT NULL CHECK (
    Payment_Method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY', 'SHOPEEPAY', 'VNPAY')
  ),
  Voucher          VARCHAR(30),
  CONSTRAINT FK_Payment_Order 
    FOREIGN KEY (Order_Id) 
    REFERENCES `Order`(Order_Id) 
    ON DELETE CASCADE
);