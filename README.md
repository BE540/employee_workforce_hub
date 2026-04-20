# WorkspaceHub – Toyota Internal Mobility POC

A workforce management platform for managers, directors, and VPs to move employees between teams within a project based on skills.

---

## What's Inside

```
workforce-poc/
├── database/
│   └── schema.sql          ← Run this FIRST in MySQL Workbench
├── backend/                ← Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/db.ts
│   │   ├── middleware/auth.ts
│   │   ├── controllers/    ← authController, employeeController, teamController, transferController, analyticsController
│   │   ├── routes/index.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/               ← React + TypeScript + Tailwind
    ├── src/
    │   ├── pages/          ← Login, Dashboard, Employees, Teams, Transfers, Analytics
    │   ├── components/     ← Layout, Sidebar
    │   ├── hooks/          ← useAuth
    │   └── services/       ← api.ts (Axios + JWT)
    ├── vite.config.ts      ← Proxy: /api → localhost:4000
    └── package.json
```

---

## Prerequisites – Install These First

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql/ |
| MySQL Workbench | any | https://www.mysql.com/products/workbench/ |
| VS Code | any | https://code.visualstudio.com |

---

## Step 1 – Set Up the Database

1. Open **MySQL Workbench**
2. Connect to your local MySQL (host: `localhost`, port: `3306`, user: `root`)
3. Click **File → Open SQL Script**
4. Open `database/schema.sql`
5. Click the ⚡ **Execute** button (or press `Ctrl+Shift+Enter`)
6. You should see `workforce_poc` database created with all tables and seed data

✅ **Verify:** In the left panel under Schemas, you should see `workforce_poc` with tables like `employees`, `transfers`, `teams`, etc.

---

## Step 2 – Set Up the Backend

Open VS Code in the `workforce-poc` folder.

### Open Terminal 1 (Backend):

```bash
cd backend
```

**Copy the env file:**
```bash
# On Mac/Linux:
cp .env.example .env

# On Windows PowerShell:
copy .env.example .env
```

**Edit `.env` – set your MySQL password:**
```
DB_PASSWORD=your_actual_mysql_root_password
```

**Install dependencies and start:**
```bash
npm install
npm run dev
```

✅ **Expected output:**
```
✅ Backend running on http://localhost:4000
```

**Quick test** – open browser and go to: `http://localhost:4000/health`
You should see: `{"status":"ok","time":"..."}`

---

## Step 3 – Set Up the Frontend

Open a **second terminal** in VS Code (`Ctrl+Shift+`` ` then click `+`).

```bash
cd frontend
npm install
npm run dev
```

✅ **Expected output:**
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open your browser: **http://localhost:5173**

---

## Step 4 – Log In and Test

On the login page, use the **quick-fill buttons** or type manually:

| Role | Email | Password |
|------|-------|----------|
| VP | vp@toyota.poc | Test@1234 |
| Director | director@toyota.poc | Test@1234 |
| Manager | manager1@toyota.poc | Test@1234 |

### What each role can do:
- **Manager** → Initiate transfers (can't approve)
- **Director** → Approve/reject transfers pending at director level
- **VP** → Approve/reject any pending transfer (full authority)

---

## Testing the Full Workflow

1. Log in as **Manager** (`manager1@toyota.poc`)
2. Go to **Employees** → click **Transfer** next to any employee
3. Select source team, target team, add a reason → **Submit**
4. Log out → Log in as **Director** (`director@toyota.poc`)
5. Go to **Transfers** → you'll see the pending request → click **Approve**
6. Log out → Log in as **VP** (`vp@toyota.poc`)
7. Go to **Transfers** → click **Approve** → transfer is **Executed**
8. Go to **Employees** → the employee now shows in the new team ✅

---

## API Endpoints (for Postman testing)

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Get JWT token |
| GET | `/employees` | Yes | List employees (supports ?search=, ?skill=, ?availability=) |
| GET | `/employees/match?required_skills=Java,React` | Yes | Skill-match candidates |
| GET | `/teams` | Yes | All teams with utilization |
| GET | `/teams/:id/members` | Yes | Team members |
| GET | `/teams/:id/skill-coverage` | Yes | Skill gap matrix |
| POST | `/transfers` | Manager+ | Create transfer |
| GET | `/transfers` | Yes | List transfers (supports ?status=) |
| PATCH | `/transfers/:id/approve` | Director/VP | Approve or reject |
| GET | `/analytics/dashboard` | Yes | KPIs and metrics |
| GET | `/analytics/skill-gaps` | Yes | Teams with missing skills |

**To get a token for Postman:**
```json
POST /api/auth/login
{ "email": "vp@toyota.poc", "password": "Test@1234" }
```
Copy the `token` from the response. Add header: `Authorization: Bearer <token>`

---

## Common Issues & Fixes

### Backend won't start
- Check `.env` – is `DB_PASSWORD` set correctly?
- Is MySQL running? (Check MySQL Workbench can connect)
- Is port 4000 in use? Change `PORT=4001` in `.env`

### "Database not found" error
- Run `database/schema.sql` in MySQL Workbench again
- Check `DB_NAME=workforce_poc` in `.env`

### Frontend shows blank / no data
- Is backend running on port 4000? Check Terminal 1
- Open browser DevTools (F12) → Network tab → look for red requests
- The Vite proxy forwards `/api` to `localhost:4000` automatically

### "Invalid credentials" on login
- The seed data uses demo password comparison. Make sure you typed `Test@1234`
- If you changed the MySQL password, update `.env` and restart backend

---

## Pages Overview

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | KPIs, team utilization chart, critical skill concentration |
| Employees | `/employees` | Search, filter by skill/availability, initiate transfer |
| Teams | `/teams` | Team list, click to see members + skill coverage matrix |
| Transfers | `/transfers` | All transfers, approve/reject based on role |
| New Transfer | `/transfers/new` | Step-by-step form with auto skill-gap detection |
| Analytics | `/analytics` | Skill gap table across all teams |
