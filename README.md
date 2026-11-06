# MoneyFlow — Personal Finance Management System

Premium SaaS-level finance dashboard. Separate Frontend (React+Vite) & Backend (Node+Express+Sequelize+MySQL).

## Stack
- Frontend: React 18, Vite, Tailwind CSS, Chart.js, Axios, React Router
- Backend: Node 24, Express ES Modules, Sequelize, MySQL, JWT cookie auth

## Quick Start
### Backend
```bash
cd backend
cp .env.example .env   # set DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev            # http://localhost:5000/api/v1 — health: /health
```
> Ensure MySQL is running and database `moneyflow` exists: `CREATE DATABASE moneyflow CHARACTER SET utf8mb4;`
> On first run, Sequelize syncs tables + seeds default Income/Expense categories.

**Create admin user (one-time):** Call via SQL or API after backend starts:
```bash
POST http://localhost:5000/api/v1/auth/register
{"name":"Admin","email":"admin@moneyflow.app","password":"Admin@123"}
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## API Base
`http://localhost:5000/api/v1`
- Auth: POST /auth/login, /auth/logout, /auth/register, GET /auth/profile, POST /auth/change-password, POST /auth/forgot-password, POST /auth/reset-password
- Accounts: GET/POST/PATCH/DELETE /accounts
- Transactions: GET/POST /transactions, POST /transactions/transfer, POST /transactions/:id/reverse
- Dashboard: GET /dashboard/summary|income-expense|category-expenses|bank-balances
- Categories: GET/POST/PATCH/DELETE /categories
- Budgets/Goals/Reminders: GET/POST /budgets, /goals, /reminders
- Reports: GET /reports/monthly|yearly|bank-wise|category-wise|export/pdf|export/excel

## Finance Logic
- Balance = OpeningBalance + Income + TransferIn - Expense - TransferOut + Adjustment
- MySQL transactions + row locking, DECIMAL(15,2), idempotency keys, atomic transfers, reversal pattern
- Insufficient balance rejected unless overdraft enabled
