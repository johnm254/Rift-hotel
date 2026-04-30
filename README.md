# Azura Haven — Hotel Management Web App

Full-stack hotel management application built with **React + Vite** (frontend) and **Node.js/Express** (backend) on **Firebase** (Firestore, Auth, Storage).

🔗 Repo: [johnm254/Rift-hotel](https://github.com/johnm254/Rift-hotel)

## Features

### 🏨 Guest Experience
- Browse rooms with photo galleries
- View dining menu with categories
- Book rooms with date picker
- M-Pesa STK Push & card payments
- User authentication (Firebase Auth)
- Booking history & profile management
- Fully responsive (mobile → desktop)

### 👑 Admin Panel
- Dashboard with real-time stats
- Room CRUD with photo uploads
- Meal CRUD with photo uploads
- Approve/reject bookings
- Revenue tracking
- User management

### 💳 Payments
- **M-Pesa STK Push** (Daraja API integration)
- **Card payments** (Stripe-ready)
- Payment status tracking
- Automatic booking confirmation on payment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| State | TanStack React Query |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Payments | M-Pesa Daraja API + Stripe |

## Project Structure

```
hotel-app/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/     # Navbar, Footer, etc.
│       ├── context/        # Auth context (Firebase)
│       ├── lib/            # Axios API client
│       ├── pages/          # All page components
│       │   └── admin/      # Admin panel pages
│       └── main.jsx        # Entry point
├── server/                 # Express backend
│   └── src/
│       ├── config/         # Firebase init
│       ├── middleware/      # Auth guards
│       └── routes/         # API routes
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore, Auth, and Storage enabled
- M-Pesa Daraja API credentials (for payments)

### 1. Clone & Install

```bash
git clone https://github.com/johnm254/Rift-hotel.git
cd Rift-hotel

# Backend
cd server
cp .env.example .env
# Fill in your Firebase & M-Pesa credentials
npm install
npm run dev

# Frontend (new terminal)
cd client
cp .env.example .env
# Fill in your Firebase client config
npm install
npm run dev
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database**, **Authentication** (Email/Password), and **Storage**
3. Download your service account key → fill in `server/.env`
4. Get your web app Firebase config → fill in `client/.env`

### 3. M-Pesa Setup

1. Create a [Safaricom Daraja](https://developer.safaricom.co.ke) developer account
2. Create an app to get Consumer Key & Secret
3. Use the sandbox passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
4. Fill in `server/.env` with your credentials

### Environment Variables

**`server/.env`**
```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_AUTH_URI=
FIREBASE_TOKEN_URI=
FIREBASE_AUTH_PROVIDER_CERT_URL=
FIREBASE_CLIENT_CERT_URL=
FIREBASE_STORAGE_BUCKET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
API_BASE_URL=http://localhost:5000
```

**`client/.env`**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_APP_ID=
```

## Running

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| GET | `/api/rooms` | — | List all rooms |
| GET | `/api/rooms/:id` | — | Get single room |
| POST | `/api/rooms` | Admin | Create room |
| PUT | `/api/rooms/:id` | Admin | Update room |
| DELETE | `/api/rooms/:id` | Admin | Delete room |
| GET | `/api/meals` | — | List meals |
| POST | `/api/meals` | Admin | Create meal |
| PUT | `/api/meals/:id` | Admin | Update meal |
| DELETE | `/api/meals/:id` | Admin | Delete meal |
| POST | `/api/bookings` | Guest | Create booking |
| GET | `/api/bookings/mine` | Guest | My bookings |
| PATCH | `/api/bookings/:id/status` | Admin | Approve/reject |
| POST | `/api/payments/mpesa/stk-push` | Guest | M-Pesa payment |
| POST | `/api/payments/card/create-intent` | Guest | Card payment |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1B2A4A` | Primary, headers, nav |
| Gold | `#C9A96E` | Accent, CTAs, highlights |
| Cream | `#F5F1EB` | Backgrounds, cards |

---

Built with ❤️ in Nairobi, Kenya.
