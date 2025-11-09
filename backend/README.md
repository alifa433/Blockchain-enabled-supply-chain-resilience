# Backend Service

This FastAPI application exposes a small research-grade API that simulates blockchain-backed supply-chain resilience insights. I
t is designed so the React frontend can query realistic data without needing a full production deployment.

## Getting started

1. **Create a virtual environment** (optional but recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the development server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API root will be available at `http://localhost:8000`. The React frontend expects the `/api/dashboard` endpoint to be reacha
ble from the same host/port unless you override `VITE_API_URL`.

## Available endpoints

- `GET /health` — Lightweight health check used by the frontend to display connectivity state.
- `GET /api/dashboard` — Returns the consolidated dashboard payload that powers the overview, node map, alerts, and recommendati
ons components in the UI.

Because the dataset is synthesized in-memory, no additional infrastructure (databases, message brokers, etc.) is required.
