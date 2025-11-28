USE TicketBoxDB;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Ticket;
TRUNCATE TABLE Payment;
TRUNCATE TABLE `Order`;
TRUNCATE TABLE Define_Pricing;
TRUNCATE TABLE Seat;
TRUNCATE TABLE Seat_Section;
TRUNCATE TABLE Event_Session;
TRUNCATE TABLE Event_Subtitles;
TRUNCATE TABLE Event;
TRUNCATE TABLE Pricing_Tier;
TRUNCATE TABLE Venue;
TRUNCATE TABLE Organizer;
TRUNCATE TABLE Customer;
TRUNCATE TABLE User;
SET FOREIGN_KEY_CHECKS = 1;
-- =========================================================
-- 1. USER
-- =========================================================
INSERT INTO User (User_Id, Username, PasswordHash, Email, Phone_Number, Full_Name, Gender, Birth_Date, User_Type) VALUES
(1,  'alice_cust',   'hash1',  'alice@example.com',    '+84901111111', 'Alice Nguyen',      'FEMALE', '1998-05-10', 'CUSTOMER'),
(2,  'bob_cust',     'hash2',  'bob@example.com',      '+84902222222', 'Bob Tran',         'MALE',   '1995-03-21', 'CUSTOMER'),
(3,  'charlie_org',  'hash3',  'charlie@org.com',      '+84903333333', 'Charlie Pham',     'MALE',   '1990-07-15', 'ORGANIZER'),
(4,  'diana_org',    'hash4',  'diana@org.com',        '+84904444444', 'Diana Le',         'FEMALE', '1988-11-02', 'ORGANIZER'),
(5,  'eric_both',    'hash5',  'eric@both.com',        '+84905555555', 'Eric Vu',          'MALE',   '1996-01-09', 'BOTH'),
(6,  'flora_both',   'hash6',  'flora@both.com',       '+84906666666', 'Flora Ho',         'FEMALE', '1999-09-19', 'BOTH'),
(7,  'gia_cust',     'hash7',  'gia@example.com',      '+84907777777', 'Gia Do',           'OTHER',  '2000-02-01', 'CUSTOMER'),
(8,  'huy_cust',     'hash8',  'huy@example.com',      '+84908888888', 'Huy Nguyen',       'MALE',   '1997-08-30', 'CUSTOMER'),
(9,  'ivy_cust',     'hash9',  'ivy@example.com',      '+84909999999', 'Ivy Phan',         'FEMALE', '1994-04-14', 'CUSTOMER'),
(10, 'jack_cust',    'hash10', 'jack@example.com',     '+84901112223', 'Jack Bui',         'MALE',   '1993-12-25', 'CUSTOMER'),
(11, 'ken_org',      'hash11', 'ken@org.com',          '+84901113334', 'Ken Hoang',        'MALE',   '1989-06-17', 'ORGANIZER'),
(12, 'lisa_org',     'hash12', 'lisa@org.com',         '+84901114445', 'Lisa Truong',      'FEMALE', '1992-10-05', 'ORGANIZER'),
(13, 'minh_cust',    'hash13', 'minh@example.com',     '+84901115556', 'Minh Chau',        'MALE',   '1998-07-07', 'CUSTOMER'),
(14, 'nhu_cust',     'hash14', 'nhu@example.com',      '+84901116667', 'Nhu Vo',           'FEMALE', '1999-03-03', 'CUSTOMER'),
(15, 'oscar_cust',   'hash15', 'oscar@example.com',    '+84901117778', 'Oscar Phan',       'MALE',   '1995-09-09', 'CUSTOMER'),
(16, 'phuc_cust',    'hash16', 'phuc@example.com',     '+84901118889', 'Phuc Lam',         'MALE',   '1994-01-20', 'CUSTOMER'),
(17, 'quynh_cust',   'hash17', 'quynh@example.com',    '+84901119990', 'Quynh Ha',         'FEMALE', '1997-02-15', 'CUSTOMER'),
(18, 'ron_org',      'hash18', 'ron@org.com',          '+84901120001', 'Ron Dang',         'MALE',   '1987-05-05', 'ORGANIZER'),
(19, 'sara_org',     'hash19', 'sara@org.com',         '+84901121112', 'Sara Ngo',         'FEMALE', '1986-08-18', 'ORGANIZER'),
(20, 'tina_both',    'hash20', 'tina@both.com',        '+84901122223', 'Tina Dao',         'FEMALE', '1995-11-11', 'BOTH');

-- =========================================================
-- 2. CUSTOMER (user_type = CUSTOMER hoặc BOTH)
-- =========================================================
INSERT INTO Customer (User_Id) VALUES
(1),(2),(5),(6),(7),(8),(9),(10),
(13),(14),(15),(16),(17),(20);

-- =========================================================
-- 3. ORGANIZER (user_type = ORGANIZER hoặc BOTH)
-- =========================================================
INSERT INTO Organizer (User_Id) VALUES
(3),(4),(5),(6),(11),(12),(18),(19),(20);

-- =========================================================
-- 4. VENUE
-- =========================================================
INSERT INTO Venue (Venue_Id, Parent_Venue_Id, Venue_Address, Total_Capacity, Venue_Name, Venue_Type) VALUES
(101,  NULL, '123 Nguyen Hue, District 1, HCMC',     5000, 'Saigon Arena',           'INDOOR'),
(102,  101,    '07 Lam Son Square, District 1, HCMC',  1800, 'Saigon Concert Hall',    'INDOOR'),
(103,  NULL,    'My Khe Beach, Son Tra, Da Nang',       8000, 'Danang Beach Stage',     'OUTDOOR'),
(104,  NULL, NULL,                                   0,    'Virtual Event Hall',     'ONLINE'),
(105,  NULL, '01 Trang Tien, Hoan Kiem, Ha Noi',     600,  'Hanoi Opera House',      'INDOOR'),
(106,  105,    '02 Ly Thai To, Hoan Kiem, Ha Noi',     1500, 'Hanoi Outdoor Square',   'OUTDOOR'),
(107,  NULL, '72 Nguyen Trai, District 5, HCMC',     900,  'Galaxy Cinema D5',       'INDOOR'),
(108,  NULL, '3/2 Street, Ninh Kieu, Can Tho',       1200, 'Can Tho Riverside Hall', 'INDOOR');
-- =========================================================
-- 5. EVENT
-- =========================================================
INSERT INTO Event (Event_Id, User_Id, Event_Name, Event_Description, Event_Category, Privacy_Level, Primary_Language, Is_Online_Event, Poster_Image, Event_Duration) VALUES
(201,  3, 'Saigon Rock Night',      'Rock concert with local bands.',            'Music',     'PUBLIC',    'VI', 0, 'https://picsum.photos/id/1011/600/800', 2.5),
(202,  4, 'Classical Evening',      'Classical symphony with orchestra.',        'Music',     'PUBLIC',    'EN', 0, 'https://picsum.photos/id/1012/600/800', 2.0),
(203,  5, 'Tech Conference 2025',   'Talks about AI, Cloud, DevOps.',            'Conference','PUBLIC',    'EN', 0, 'https://picsum.photos/id/1015/600/800', 3.0),
(204,  6, 'Indie Film Festival',    'Screening of independent movies.',          'Film',      'PUBLIC',    'EN', 0, 'https://picsum.photos/id/1016/600/800', 4.0),
(205, 11, 'Startup Pitch Night',    'Startup founders pitch to investors.',      'Business',  'RESTRICTED','EN', 0, 'https://picsum.photos/id/1019/600/800', 3.0),
(206, 12, 'Online Coding Bootcamp', 'Intensive coding bootcamp online.',         'Education', 'PUBLIC',    'EN', 1, 'https://picsum.photos/id/1020/600/800', 5.0),
(207,  5, 'K-Pop Dance Cover',      'Dance cover competition.',                  'Dance',     'PUBLIC',    'VI', 0, 'https://picsum.photos/id/1024/600/800', 2.0),
(208,  6, 'Jazz & Wine Night',      'Jazz music with wine tasting.',             'Music',     'RESTRICTED','EN', 0, 'https://picsum.photos/id/1025/600/800', 2.0),
(209,  3, 'Beach Night',   'Music and party at beach.',               'Music',  'PUBLIC',    'EN', 0, 'https://picsum.photos/id/1027/600/800', 1.5);

-- =========================================================
-- 6. EVENT_SUBTITLES
-- =========================================================
INSERT INTO Event_Subtitles (Event_Id, Subtitle) VALUES
(201,'VI'), (201,'EN'),
(202,'EN'), 
(203,'EN'), (203,'VI'),
(204,'EN'), (204,'VI'),
(205,'EN'), (205,'VI'),
(206,'EN'), (206,'VI'),
(207,'VI'), 
(208,'EN'), (208,'VI'),
(209,'EN');
-- =========================================================
-- 7. EVENT_SESSION
-- =========================================================
INSERT INTO Event_Session
(Session_Id, Event_Id, Venue_Id, Start_Date,            End_Date,              Open_Date,             Close_Date,            Available_Seats_Count, Session_Status)
VALUES
(301, 201, 101, '2025-12-24 20:00:00', '2025-12-24 22:30:00', '2025-10-01 00:00:00', '2025-12-24 18:00:00', 26, 'SCHEDULED'),
(302, 202, 106, '2025-11-29 19:00:00', '2025-11-29 21:00:00', '2025-09-01 00:00:00', '2025-11-15 08:00:00', 28, 'SCHEDULED'),
(303, 201, 101, '2025-12-29 19:30:00', '2025-12-29 22:00:00', '2025-11-25 00:00:00', '2025-12-28 19:00:00', 26, 'SCHEDULED'),
(304, 207, 102, '2026-06-01 15:00:00', '2026-06-01 17:00:00', '2025-11-26 00:00:00', '2026-06-01 15:00:00', 16, 'SCHEDULED'),
(305, 201, 102, '2026-02-05 20:00:00', '2026-02-05 22:30:00', '2025-11-27 00:00:00', '2026-02-01 20:00:00', 18, 'SCHEDULED'),
(306, 209, 103, '2024-10-10 20:30:00', '2024-10-10 22:00:00', '2024-09-01 00:00:00', '2024-10-10 19:00:00', 0, 'COMPLETED'),
(307, 208, 106,'2025-11-28 13:30:00', '2025-11-28 21:00:00', '2025-11-22 00:00:00', '2025-12-26 19:00:00', 28, 'ONGOING'),
(308, 206, 104, '2026-01-01 10:00:00', '2026-01-01 15:00:00', '2025-12-01 00:00:00', '2025-12-29 09:00:00', 0, 'CANCELLED'),
(309, 205, 108, '2025-12-31 18:00:00', '2025-12-31 21:00:00', '2025-11-01 00:00:00', '2025-12-29 17:00:00', 8, 'SCHEDULED'),
(310, 204, 107, '2025-07-15 17:00:00', '2025-07-15 21:00:00', '2025-06-01 00:00:00', '2025-07-15 19:00:00', 16, 'COMPLETED'),
(311, 203, 108, '2025-08-20 09:00:00', '2025-08-20 12:00:00', '2025-07-01 00:00:00', '2025-08-20 08:30:00', 8, 'COMPLETED'),
(312, 204, 107, '2025-05-10 18:00:00', '2025-05-10 22:00:00', '2025-04-01 00:00:00', '2025-05-10 18:00:00', 16, 'COMPLETED'),
(313, 202, 105, '2025-09-11 19:00:00', '2025-09-11 21:00:00', '2025-08-01 00:00:00', '2025-09-01 20:00:00', 16, 'COMPLETED'),
(314, 207, 102, '2025-12-30 18:00:00', '2025-12-30 20:00:00', '2025-11-01 00:00:00', '2025-11-30 16:00:00', 18, 'SCHEDULED'),
(315, 209, 103, '2025-11-26 20:00:00', '2025-11-26 21:30:00', '2025-10-01 00:00:00', '2025-11-26 08:00:00', 38, 'CANCELLED');

-- =========================================================
-- 8. SEAT_SECTION
-- =========================================================
INSERT INTO Seat_Section (Section_Id, Venue_Id, Section_Name, Seats_Per_Row, Row_Count, View_Description) VALUES
-- Venue 101 (Saigon Arena)
(501, 101, 'VIP Floor A', 2, 5, 'Close to the stage, front'),
(502, 101, 'VIP Floor B', 2, 5, 'Close to the stage, left wing'),
(503, 101, 'Standard Stand', 4, 2, 'Elevated Grandstand'),

-- Venue 103 (Danang Beach)
(504, 103, 'Beach Front', 2, 4, 'Beach Seats'),
(505, 103, 'General Entry', 1, 1, 'Zone GA'),

-- Venue 105 (Hanoi Opera)
(506, 105, 'Stalls', 3, 4, 'Luxury Ground Floor'),
(507, 105, 'Balcony', 2,3, 'High Angle Balcony'),

-- Venue 102 (Saigon Concert Hall)
(508, 102, 'Orchestra', 2, 4, 'Main Area'),
(509, 102, 'Mezzanine', 2, 5, 'Mezzanine'),

-- Venue 106 (Hanoi Outdoor)
(510, 106, 'Outzone', 1, 1, 'Fan Standing Area'),

-- Venue 107
(511, 107, 'VIP Seat', 2, 5, 'Nice view, seat in center'),
(512, 107, 'Standard', 4, 2, 'Standard seat'),

-- Venue 108
(513, 108, 'All Seating', 2, 5, 'One zone seating');

-- =========================================================
-- 9. SEAT
-- =========================================================
INSERT INTO Seat (Section_Id, Seat_Number, Row_Identifier, Seat_Type) VALUES
-- VIP Floor A
(501,1,'A1','SEATED'), (501,2,'A1','SEATED'),
(501,3,'A2','SEATED'), (501,4,'A2','SEATED'),
(501,5,'A3','SEATED'),
(501,6,'A3','SEATED'),
(501,7,'A4','SEATED'),
(501,8,'A4','SEATED'),
(501,9,'A5','SEATED'),
(501,10,'A5','SEATED'),
-- VIP Floor B
(502,1,'B1','SEATED'), (502,2,'B1','SEATED'),
(502,3,'B2','SEATED'), (502,4,'B2','SEATED'),
(502,5,'B3','SEATED'),
(502,6,'B3','SEATED'),
(502,7,'B4','SEATED'),
(502,8,'B4','SEATED'),
(502,9,'B5','SEATED'),
(502,10,'B5','SEATED'),
-- Standard Stand
(503,1,'S1','SEATED'), (503,2,'S1','SEATED'),
(503,3,'S1','SEATED'),
(503,4,'S1','SEATED'),
(503,5,'S2','SEATED'),
(503,6,'S2','SEATED'),
(503,7,'S2','SEATED'),
(503,8,'S2','SEATED'),
-- Beach Front
(504,1,'SAND1','SEATED'), (504,2,'SAND1','SEATED'),
(504,3,'SAND2','SEATED'),
(504,4,'SAND2','SEATED'),
(504,5,'SAND3','SEATED'),
(504,6,'SAND3','SEATED'),
(504,7,'SAND4','SEATED'),
(504,8,'SAND4','SEATED'),
-- General Entry
(505,1,'GA','STANDING'), (505,2,'GA','STANDING'),
(505,3,'GA','STANDING'),
(505,4,'GA','STANDING'),
(505,5,'GA','STANDING'),
(505,6,'GA','STANDING'),
(505,7,'GA','STANDING'),
(505,8,'GA','STANDING'),
-- Stalls
(506,1,'ST1','SEATED'), (506,2,'ST1','SEATED'),
(506,3,'ST1','SEATED'),
(506,4,'ST2','SEATED'),
(506,5,'ST2','SEATED'),
(506,6,'ST2','SEATED'),
(506,7,'ST3','SEATED'),
(506,8,'ST3','SEATED'),
(506,9,'ST3','SEATED'),
(506,10,'ST4','SEATED'),
(506,11,'ST4','SEATED'),
(506,12,'ST4','SEATED'),
-- Balcony
(507,1,'BL1','SEATED'), (507,2,'BL1','SEATED'),
(507,3,'BL2','SEATED'),
(507,4,'BL2','SEATED'),
(507,5,'BL3','SEATED'),
(507,6,'BL3','SEATED'),
-- Orchestra
(508,1,'O1','SEATED'), (508,2,'O1','SEATED'),
(508,3,'O2','SEATED'),
(508,4,'O2','SEATED'),
(508,5,'O3','SEATED'),
(508,6,'O3','SEATED'),
(508,7,'O4','SEATED'),
(508,8,'O4','SEATED'),
-- Mezzanine
(509,1,'M1','SEATED'), (509,2,'M1','SEATED'),
(509,3,'M2','SEATED'),
(509,4,'M2','SEATED'),
(509,5,'M3','SEATED'),
(509,6,'M3','SEATED'),
(509,7,'M4','SEATED'),
(509,8,'M4','SEATED'),
(509,9,'M5','SEATED'),
(509,10,'M5','SEATED'),
-- Outzone
(510,1,'FZ','STANDING'), (510,2,'FZ','STANDING'),
(510,3,'FZ','STANDING'),
(510,4,'FZ','STANDING'),
(510,5,'FZ','STANDING'),
(510,6,'FZ','STANDING'),
(510,7,'FZ','STANDING'),
(510,8,'FZ','STANDING'),

(511,1,'V1','SEATED'), (511,2,'V1','SEATED'),
(511,3,'V2','SEATED'),
(511,4,'V2','SEATED'),
(511,5,'V3','SEATED'),
(511,6,'V3','SEATED'),
(511,7,'V4','SEATED'),
(511,8,'V4','SEATED'),
(511,9,'V5','SEATED'),
(511,10,'V5','SEATED'),

(512,1,'STA1','SEATED'), (512,2,'STA1','SEATED'),
(512,3,'STA1','SEATED'),
(512,4,'STA1','SEATED'),
(512,5,'STA2','SEATED'),
(512,6,'STA2','SEATED'),
(512,7,'STA2','SEATED'),
(512,8,'STA2','SEATED'),

(513,1,'SE','SEATED'), (513,2,'SE','SEATED'),
(513,3,'SE','SEATED'),
(513,4,'SE','SEATED'),
(513,5,'SE','SEATED'),
(513,6,'SE','SEATED'),
(513,7,'SE','SEATED'),
(513,8,'SE','SEATED'),
(513,9,'SE','SEATED'),
(513,10,'SE','SEATED');
-- =========================================================
-- 10. PRICING_TIER
-- =========================================================
INSERT INTO Pricing_Tier (Tier_Id, Tier_Name, Base_Price) VALUES
-- Venue 101 - session 301 303, event 201
(601, 'VIP Floor A',                 1500000),
(602, 'VIP Floor A EarlyBird',       1300000),
(603, 'VIP Floor B',                 1200000),
(604, 'Standard Stand',               600000),

-- Venue 106 - session 302 event 202
(605, 'Outzone',                  900000),
(606, 'Outzone EarlyBird',        700000),
-- Venue 106 - session 307 event 208
(626, 'Outzone',                  800000),
(627, 'Outzone EarlyBird',        600000),

-- Venue 105 (Opera)
(607, 'Stalls',                 3000000),
(608, 'Stalls EarlyBird',       2500000),
(609, 'Balcony',                 1500000),

-- Venue 103 (Beach)
(610, 'Beach Front',             1200000),
(611, 'Beach Front LastMinute',  1000000),
(612, 'General Entry',                500000),

-- Venue 102 (Concert Hall) - session 304 314, event 207
(613, 'Orchestra',               2000000),
(614, 'Orchestra EarlyBird',     1800000),
(615, 'Standard Mezzanine',           800000),

-- Venue 102 (Concert Hall) - session 305, event 201
(616, 'Orchestra',               1100000),
(617, 'Orchestra EarlyBird',     1000000),
(618, 'Standard Mezzanine',           700000),

-- Venue 107
(619, 'VIP Seat',                 1800000),
(620, 'VIP Seat EarlyBird',       1500000),
(621, 'Standard',               700000),

-- Venue 108 session 309 event 205
(622, 'All Seating',                  800000),
(623, 'All Seating EarlyBird',        600000),

(624, 'All Seating',                  700000),
(625, 'All Seating EarlyBird',        50000);
-- =========================================================
-- 11. DEFINE_PRICING
-- =========================================================
INSERT INTO Define_Pricing (Tier_Id, Section_Id, Session_Id, Price) VALUES
-- (Venue 101)
(601, 501, 301, 1500000),
(602, 501, 301, 1300000),
(603, 502, 301, 1200000),
(604, 503, 301, 600000),

(601, 501, 303, 1500000),
(602, 501, 303, 1300000),
(603, 502, 303, 1200000),
(604, 503, 303, 600000),

-- (Venue 106)
(605, 510, 302, 900000),
(606, 510, 302, 700000),

(626, 510, 307, 800000),
(627, 510, 307, 600000),

--  (Venue 105)
(607, 506, 313, 3000000),
(608, 506, 313, 2500000),
(609, 507, 313, 1500000),

-- (Venue 103)
(610, 504, 306, 1200000),
(611, 504, 306, 1000000),
(612, 505, 306, 500000),

(610, 504, 315, 1200000),
(611, 504, 315, 1000000),
(612, 505, 315, 500000),

-- (Venue 102)
(613, 508, 304, 2000000),
(614, 508, 304, 1800000),
(615, 509, 304, 800000),

(613, 508, 314, 2000000),
(614, 508, 314, 1800000),
(615, 509, 314, 800000),

(616, 508, 305, 1100000),
(617, 508, 305, 1000000),
(618, 509, 305, 700000),

-- (Venue 107)
(619, 511, 310, 1800000),
(620, 511, 310, 1500000),
(621, 512, 310, 700000),

(619, 511, 312, 1800000),
(620, 511, 312, 1500000),
(621, 512, 312, 700000),

-- (Venue 108)
(622, 513, 309, 800000),
(623, 513, 309, 600000),

(624, 513, 311, 700000),
(625, 513, 311, 500000);
-- =========================================================
-- 12. ORDER 
-- =========================================================
INSERT INTO `Order` (Order_Id, Customer_Id, Order_Datetime, Order_Status, Total_Amount) VALUES
-- session 301 (Saigon Rock Night)
(701,  1,  '2025-10-05 10:00:00', 'PAID',      2700000),
-- session 302 (Classical Evening)
(702,  2,  '2025-09-05 11:00:00', 'PAID',      1600000),
-- session 303 (Saigon Rock Night - second)
(703,  5,  '2025-11-28 09:30:00', 'PAID',      2100000),
-- session 304 (Concert Hall)
(704,  6,  '2025-11-26 16:45:00', 'PAID',      2800000),
-- session 305 (Indie Film)
(705,  7,  '2025-11-27 12:00:00', 'PENDING',   1800000),
-- session 307 (ongoing)
(707,  9,  '2025-11-23 15:30:00', 'PAID',      1400000),
-- session 309 (Startup Pitch Night)
(709, 13,  '2025-11-05 13:40:00', 'PAID',      1400000),
-- session 310 (Galaxy Cinema)
(710, 14,  '2025-07-01 09:10:00', 'PAID',      2500000),
-- session 311 (Can Tho)
(711, 15,  '2025-08-01 10:00:00', 'PAID',      1400000),
-- session 312 (completed)
(712, 16,  '2025-05-05 08:30:00', 'PAID',      3600000),
-- session 313 (Opera House)
(713, 17,  '2025-09-02 12:00:00', 'PAID',      4500000),
-- session 314 (scheduled)
(714, 20,  '2025-11-12 10:10:00', 'PENDING',   2800000),
-- session 315 (cancelled)
(715,  1,  '2025-10-10 09:00:00', 'CANCELLED', 1700000);

-- =========================================================
-- 13. PAYMENT 
-- =========================================================
INSERT INTO Payment (Payment_Id, Order_Id, Payment_Datetime, Payment_Status, Payment_Method, Voucher) VALUES
-- for 701 (PAID)
(901, 701, '2025-10-05 10:05:00', 'SUCCESS', 'MOMO',        'EARLYBIRD10'),
-- for 702
(902, 702, '2025-09-05 11:05:00', 'SUCCESS', 'CREDIT_CARD', 'VISA5'),
-- for 703
(903, 703, '2025-11-28 09:35:00', 'SUCCESS', 'ZALOPAY',     NULL),
-- for 704
(904, 704, '2025-11-26 16:50:00', 'SUCCESS', 'BANK_TRANSFER', NULL),
-- for 705 (PENDING)
(905, 705, '2025-11-27 12:05:00',       'PENDING', 'VNPAY',       NULL),
-- for 707
(907, 707, '2025-11-23 15:35:00', 'SUCCESS', 'SHOPEEPAY',   NULL),
-- for 709
(909, 709, '2025-11-05 13:45:00', 'SUCCESS', 'BANK_TRANSFER','NEWYEAR15'),
-- for 710
(910, 710, '2025-07-01 09:15:00', 'SUCCESS', 'CREDIT_CARD',  NULL),
-- for 711
(911, 711, '2025-08-01 10:05:00', 'SUCCESS', 'VNPAY',       NULL),
-- for 712
(912, 712, '2025-05-05 08:35:00', 'SUCCESS', 'ZALOPAY',     'FLASH50'),
-- for 713
(913, 713, '2025-09-02 12:05:00', 'SUCCESS', 'MOMO',        NULL),
-- for 714 (PENDING)
(914, 714, '2025-11-12 10:15:00',       'PENDING', 'VNPAY',       NULL),
-- for 715 (CANCELLED -> FAILED)
(915, 715, '2025-10-10 09:05:00', 'FAILED',  'MOMO',        NULL);

-- =========================================================
-- 14. TICKET (30 tickets: 2 per session 301..315)
-- =========================================================
-- Note: pick Section/Seat consistent with Seat_Section & Define_Pricing in sample.
INSERT INTO Ticket
(Ticket_Id, Session_Id, Order_Id, Section_Id, Seat_Number, Ticket_Type, Ticket_Price, Ticket_Status, Unique_QR, Checkin_Datetime)
VALUES
-- SESSION 301 (venue 101) : use sections 501 (VIP Floor A) and 502 (VIP Floor B) OR 503
(1001, 301, 701, 501, 1, 'VIP Floor A',      1500000, 'PAID',       'QR-301-701-501-001', NULL),
(1002, 301, 701, 502, 1, 'VIP Floor B',      1200000, 'PAID',       'QR-301-701-502-001', NULL),

-- SESSION 302 (venue 106) : Outzone (510)
(1003, 302, 702, 510, 1, 'Outzone',           900000, 'PAID',       'QR-302-702-510-001', NULL),
(1004, 302, 702, 510, 2, 'Outzone EarlyBird', 700000, 'PAID',       'QR-302-702-510-002', NULL),

-- SESSION 303 (venue 101)
(1005, 303, 703, 501, 2, 'VIP Floor A',      1500000, 'PAID',       'QR-303-703-501-002', NULL),
(1006, 303, 703, 503, 1, 'Standard Stand',    600000, 'PAID',       'QR-303-703-503-001', NULL),

-- SESSION 304 (venue 102)
(1007, 304, 704, 508, 1, 'Orchestra',        2000000, 'PAID',       'QR-304-704-508-001', NULL),
(1008, 304, 704, 509, 1, 'Standard Mezzanine',800000, 'PAID',      'QR-304-704-509-001', NULL),

-- SESSION 305 (venue 102)
(1009, 305, 705, 508, 2, 'Orchestra',        1100000, 'PENDING',    'QR-305-705-508-002', NULL),
(1010, 305, 705, 509, 2, 'Standard Mezzanine',700000, 'PENDING',   'QR-305-705-509-002', NULL),

-- SESSION 307 (venue 106) ONGOING
(1013, 307, 707, 510, 3, 'Outzone',           800000, 'PAID',       'QR-307-707-510-003', NULL),
(1014, 307, 707, 510, 4, 'Outzone EarlyBird', 600000, 'PAID',       'QR-307-707-510-004', NULL),

-- SESSION 309 (venue 108)
(1017, 309, 709, 513, 1, 'All Seating',       800000, 'PAID',       'QR-309-709-513-001', NULL),
(1018, 309, 709, 513, 2, 'All Seating EarlyBird',600000,'PAID',     'QR-309-709-513-002', NULL),

-- SESSION 310 (venue 107) COMPLETED
(1019, 310, 710, 511, 1, 'VIP Seat',         1800000, 'CHECKED_IN', 'QR-310-710-511-001', '2025-07-15 17:10:00'),
(1020, 310, 710, 512, 1, 'Standard',          700000, 'CHECKED_IN', 'QR-310-710-512-001', '2025-07-15 17:12:00'),

-- SESSION 311 (venue 108) COMPLETED
(1021, 311, 711, 513, 3, 'All Seating',       700000, 'CHECKED_IN', 'QR-311-711-513-003', '2025-08-20 09:15:00'),
(1022, 311, 711, 513, 4, 'All Seating',       700000, 'CHECKED_IN', 'QR-311-711-513-004', '2025-08-20 09:18:00'),

-- SESSION 312 (venue 107) COMPLETED
(1023, 312, 712, 511, 2, 'VIP Seat',         1800000, 'CHECKED_IN', 'QR-312-712-511-002', '2025-05-10 18:10:00'),
(1024, 312, 712, 511, 3, 'VIP Seat',         1800000, 'CHECKED_IN', 'QR-312-712-511-003', '2025-05-10 18:12:00'),

-- SESSION 313 (venue 105) COMPLETED
(1025, 313, 713, 506, 1, 'Stalls',           3000000, 'CHECKED_IN', 'QR-313-713-506-001', '2025-09-01 09:10:00'),
(1026, 313, 713, 507, 1, 'Balcony',          1500000, 'CHECKED_IN', 'QR-313-713-507-001', '2025-09-01 09:12:00'),

-- SESSION 314 (venue 102) PENDING
(1027, 314, 714, 508, 3, 'Orchestra',        2000000, 'PENDING',    'QR-314-714-508-003', NULL),
(1028, 314, 714, 509, 3, 'Standard Mezzanine',800000, 'PENDING',   'QR-314-714-509-003', NULL),

-- SESSION 315 (venue 103) CANCELLED
(1029, 315, 715, 504, 3, 'Beach Front',      1200000, 'CANCELLED',  'QR-315-715-504-003', NULL),
(1030, 315, 715, 505, 3, 'General Entry',     500000, 'CANCELLED',  'QR-315-715-505-003', NULL);