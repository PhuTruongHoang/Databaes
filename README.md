# Database – BTL2: TicketBox Event System
Project/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── TicketQRCode.jsx
│   │   ├── context/         # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Organizer pages
│   │   │   │   ├── AdminEventFormPage.jsx
│   │   │   │   ├── AdminSessionManagerPage.jsx
│   │   │   │   └── AdminStatsPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── EventDetailPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── PaymentSuccessPage.jsx
│   │   │   ├── MyTicketsPage.jsx
│   │   │   ├── MyEventsPage.jsx
│   │   │   ├── MyAccountPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/        # API services
│   │   │   └── api.js
│   │   ├── utils/           # Utility functions
│   │   │   └── formatPrice.js
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Node.js backend
│   ├── controllers/         # Request handlers
│   │   ├── event.controller.js
│   │   ├── session.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── report.controller.js
│   │   └── user.controller.js
│   ├── routes/              # API routes
│   │   ├── event.routes.js
│   │   ├── session.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── report.routes.js
│   │   └── user.routes.js
│   ├── utils/               # Helper functions
│   │   └── userRoleHelper.js
│   ├── db.js                # Database connection
│   ├── server.js            # Express app
│   └── package.json
│
├── db/            # SQL scripts
│   ├── 1.schema.sql
│   ├── 2.procedure.sql
│   └── 1.1_sample_data.sql
│
├── .env                     # Environment variables
└── README.md
```
