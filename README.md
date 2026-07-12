# ProdTrack AI

Production intelligence and digital shift reporting for Jay Precision Products Pvt. Ltd.

## Capabilities

- Role-based Supervisor and Admin workspaces
- All-machine Excel matrix for Shift 1 and Shift 2 hourly production entry
- Shift 3 direct-total production entry
- Frozen machine columns, arrow/Enter navigation, multi-cell paste, row copy, fill-down, and autosaved drafts
- Dynamic machine master loaded from the database
- CSV/XLSX template, upload, preview, duplicate checks, and bulk import
- Target achievement, consistency, anomaly, shift, machine, daily, weekly, and monthly analytics
- Rule-based production insights and next-shift forecasting
- Admin review workflow with management remarks
- CSV, Excel, and browser PDF export
- Responsive dark industrial interface

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Chart.js
- Backend: FastAPI, Pydantic, async SQLAlchemy
- Database: SQLite for local deployment

## Quick Start

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_demo.py
uvicorn main:app --host 127.0.0.1 --port 8001
```

API documentation: `http://127.0.0.1:8001/docs`

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Application: `http://127.0.0.1:5173`

The username and password fields are demonstration-only. Select Supervisor or Admin
on the login page. Role state is stored in browser `localStorage`.

## Spreadsheet Format

Download the template from the Supervisor workspace. Accepted files are `.xlsx`,
`.xls`, and `.csv`.

Required columns:

| Column | Shift 1/2 | Shift 3 |
| --- | --- | --- |
| Date | Required | Required |
| Shift | Required | Required |
| Machine | Required | Required |
| Product | Required | Required |
| Target | Required | Required |
| Hour1 through Hour8 | Required | Empty |
| Total | Optional | Required |

Validation covers missing values, invalid dates/shifts, negative values, duplicate
rows, duplicate database reports, and unusually high production outliers.

## Production Build

```powershell
cd frontend
npm run lint
npm run build
```

Set `VITE_API_BASE_URL` to the deployed FastAPI URL before building.

## API

- `POST /supervisor/submit-shift`
- `POST /supervisor/submit-bulk`
- `GET /supervisor/machines`
- `GET /supervisor/targets`
- `GET /admin/reports`
- `GET /admin/report/{id}`
- `PUT /admin/report/{id}/review`
- `GET /admin/intelligence`

## Project Structure

```text
backend/
  analytics.py
  models.py
  routes/
  seed_demo.py
frontend/src/
  components/
  lib/
  pages/
  types/
docs/
  architecture.md
```

See [docs/architecture.md](docs/architecture.md) for the system diagram.

## Current Security Model

Authentication is intentionally a local demonstration session and is not suitable
for an internet-facing production deployment. Before public deployment, replace it
with server-side authentication, password hashing, secure cookies, authorization
middleware, audit logs, and managed secrets.
