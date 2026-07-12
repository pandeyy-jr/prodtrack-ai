# Architecture

```text
Browser
  |
  | React Router + local role session
  v
React / TypeScript / Tailwind
  |-- All-machine production matrix
  |-- Browser autosaved shift drafts
  |-- CSV/XLSX parser and validation
  |-- Admin analytics and exports
  |
  | JSON over HTTP
  v
FastAPI
  |-- Machine master API
  |-- Supervisor submission and bulk import API
  |-- Admin reports, review, and intelligence API
  |-- Rule-based anomaly detection and forecasting
  v
SQLAlchemy Async
  v
SQLite (local deployment)
```

The application keeps spreadsheet parsing in the browser so supervisors can preview
and correct data before upload. Only normalized, validated JSON reaches FastAPI.
The production matrix loads active machines and default product targets from
`machine_master`, then submits completed machine rows through one transactional bulk request.
The database layer can be moved to PostgreSQL by changing `DATABASE_URL` and installing
an async PostgreSQL driver.
