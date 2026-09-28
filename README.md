# DTG Group Role Management System

Professional Role Management System using React + Vite, Node.js + Express, MongoDB + Mongoose, JWT and bcrypt.

## Structure

- `backend` - Express REST API
- `frontend` - React/Vite UI

## Requirements

- Node.js 18+
- MongoDB local or MongoDB Atlas

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Backend: http://localhost:5000

## Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Default admin

The backend automatically creates an admin account on first startup if it does not exist:

- Email: admin@dtggroup.com
- Password: Admin@12345

Change this password for any real deployment.

## Main navigation

- Dashboard
- User Master
- Role Master
- Sign Out

Dashboard contains only two cards: User Master and Role Master.
