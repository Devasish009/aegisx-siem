# 🛡 AegisX — Enterprise SIEM & Intrusion Detection System

A full-stack Security Information and Event Management (SIEM) platform with real-time intrusion detection, automated IP blocking, threat scoring engine, and a live SOC dashboard.

---

## 🏗 Stack

| Layer      | Tech                                            |
|------------|-------------------------------------------------|
| Backend    | Node.js, Express.js                             |
| Database   | PostgreSQL                                      |
| Auth       | JWT + bcrypt                                    |
| Real-time  | Socket.io (WebSockets)                          |
| Frontend   | React (Vite) + TailwindCSS + Recharts           |
| Security   | Helmet, CORS, Rate Limiting, IP Blocking        |

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

---

### 1. Database Setup

```sql
CREATE DATABASE aegisx_db;
```

---

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env` and set your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegisx_db
DB_USER=postgres
DB_PASSWORD=yourpassword
```

Start the backend:
```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

The server will:
- Auto-create all database tables
- Seed a default admin account: `admin@aegisx.io` / `Admin@1234`
- Start on `http://localhost:5000`
- Initialize WebSocket on the same port

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`

---

## 🔐 Default Credentials

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@aegisx.io     | Admin@1234  |

> Change these in production!

---

## 📡 API Endpoints

### Auth
| Method | Endpoint           | Description          | Auth |
|--------|--------------------|----------------------|------|
| POST   | /api/auth/register | Register user        | No   |
| POST   | /api/auth/login    | Login + get JWT      | No   |
| GET    | /api/auth/me       | Get current user     | Yes  |

### Analytics
| Method | Endpoint                  | Description               | Auth    |
|--------|---------------------------|---------------------------|---------|
| GET    | /api/analytics/overview   | KPI overview              | User    |
| GET    | /api/analytics/timeline   | Hourly login data         | User    |
| GET    | /api/analytics/severity   | Threat severity breakdown | User    |
| GET    | /api/analytics/weekly     | 7-day threat trend        | User    |
| GET    | /api/analytics/top-ips    | Top suspicious IPs        | Admin   |

### Logs
| Method | Endpoint           | Description           | Auth |
|--------|--------------------|-----------------------|------|
| GET    | /api/logs/recent   | Last 50 login logs    | User |
| GET    | /api/logs/threats  | Threat events         | User |

### Blocked IPs
| Method | Endpoint                    | Description     | Auth  |
|--------|-----------------------------|-----------------|-------|
| GET    | /api/blocked                | List blocked IPs| User  |
| POST   | /api/blocked/block          | Block an IP     | Admin |
| POST   | /api/blocked/unblock/:ip    | Unblock an IP   | Admin |

### Users
| Method | Endpoint               | Description        | Auth  |
|--------|------------------------|--------------------|-------|
| GET    | /api/users             | List all users     | Admin |
| GET    | /api/users/:id/logs    | User's login logs  | Admin |
| PUT    | /api/users/:id/role    | Change user role   | Admin |
| DELETE | /api/users/:id         | Delete user        | Admin |

---

## ⚡ WebSocket Events

### Server → Client
| Event          | Trigger                          |
|----------------|----------------------------------|
| `threat_alert` | Any threat detected              |
| `login_event`  | Successful login                 |
| `ip_unblocked` | IP removed from blocklist        |
| `connected`    | Client connects                  |

### Payload example
```json
{
  "type": "BRUTE_FORCE",
  "ip": "185.220.101.45",
  "severity": "CRITICAL",
  "message": "Brute force detected: 5 attempts in 2 minutes",
  "timestamp": "2026-03-02T14:32:00.000Z"
}
```

---

## 🧠 Security Logic

### Risk Scoring
| Event                          | Score |
|--------------------------------|-------|
| Failed login                   | +2    |
| 3+ fails in 1 minute           | +5    |
| 5+ fails in 2 minutes          | +20   |
| Suspicious user-agent          | +10   |
| High request frequency         | +3    |
| SQL injection detected         | +15   |
| XSS attempt detected           | +10   |

**Auto-block threshold: 80/100**

### Brute Force Detection
- Monitors failed logins per IP
- 5+ failures in 2 minutes → CRITICAL alert + auto-block

### IP Blocking Middleware
- Runs before every route
- Blocked IPs receive 403 immediately
- Access attempts are logged as threat events

### Payload Inspection
- Scans all request bodies for SQL injection and XSS patterns
- Malicious requests are rejected and logged

---

## 📁 Folder Structure

```
aegisx/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main entry point
│   │   ├── db/index.js        # PostgreSQL + schema init
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT middleware
│   │   │   ├── ipBlock.js     # IP blocking middleware
│   │   │   └── payloadInspector.js
│   │   ├── controllers/
│   │   │   └── riskEngine.js  # Risk scoring engine
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── analytics.js
│   │   │   ├── logs.js
│   │   │   ├── blocked.js
│   │   │   └── users.js
│   │   └── socket/index.js    # WebSocket setup
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx            # App entry + routing
    │   ├── index.css           # Global styles + Tailwind
    │   ├── hooks/useAuth.jsx   # Auth context
    │   ├── utils/
    │   │   ├── api.js          # Axios instance
    │   │   └── socket.js       # Socket.io client
    │   └── components/
    │       ├── layout/
    │       │   ├── Layout.jsx
    │       │   ├── Sidebar.jsx
    │       │   └── Topnav.jsx
    │       ├── dashboard/
    │       │   ├── KpiCard.jsx
    │       │   └── LiveAlertFeed.jsx
    │       └── pages/
    │           ├── Login.jsx
    │           ├── Dashboard.jsx
    │           ├── ThreatLogs.jsx
    │           ├── BlockedIPs.jsx
    │           ├── Users.jsx
    │           ├── Analytics.jsx
    │           └── Settings.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔒 Security Best Practices Implemented

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens with expiry
- ✅ Role-based authorization (admin / user)
- ✅ Helmet security headers
- ✅ CORS configured
- ✅ Rate limiting (100 req / 10 min)
- ✅ IP blocking middleware on all routes
- ✅ SQL injection detection
- ✅ XSS payload detection
- ✅ Prepared statements (parameterized queries)
- ✅ Environment variables via dotenv
- ✅ Request size limiting (10kb)
- ✅ Input validation on all endpoints

---

## 📝 Resume Description

> Built a full-stack enterprise-grade Security Information and Event Management (SIEM) system with real-time intrusion detection, automated IP blocking, threat scoring engine (0–100), brute-force detection, SQL/XSS payload inspection, live SOC dashboard with WebSocket alerts, and JWT-secured REST API — using Node.js, PostgreSQL, Socket.io, React, and TailwindCSS.

```
aegisx
├─ backend
│  ├─ .env
│  ├─ package-lock.json
│  ├─ package.json
│  └─ src
│     ├─ controllers
│     │  └─ riskEngine.js
│     ├─ db
│     │  └─ index.js
│     ├─ middleware
│     │  ├─ auth.js
│     │  ├─ ipBlock.js
│     │  └─ payloadInspector.js
│     ├─ routes
│     │  ├─ analytics.js
│     │  ├─ auth.js
│     │  ├─ blocked.js
│     │  ├─ logs.js
│     │  └─ users.js
│     ├─ server.js
│     └─ socket
│        └─ index.js
├─ frontend
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ src
│  │  ├─ components
│  │  │  ├─ dashboard
│  │  │  │  ├─ KpiCard.jsx
│  │  │  │  └─ LiveAlertFeed.jsx
│  │  │  ├─ layout
│  │  │  │  ├─ Layout.jsx
│  │  │  │  ├─ Sidebar.jsx
│  │  │  │  └─ Topnav.jsx
│  │  │  └─ pages
│  │  │     ├─ Analytics.jsx
│  │  │     ├─ BlockedIPs.jsx
│  │  │     ├─ Dashboard.jsx
│  │  │     ├─ Login.jsx
│  │  │     ├─ Settings.jsx
│  │  │     ├─ ThreatLogs.jsx
│  │  │     └─ Users.jsx
│  │  ├─ hooks
│  │  │  └─ useAuth.jsx
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  └─ utils
│  │     ├─ api.js
│  │     └─ socket.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
├─ package-lock.json
└─ README.md

```