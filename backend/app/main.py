from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data import build_dashboard
from .models import DashboardResponse, HealthResponse

app = FastAPI(
    title="Blockchain Supply Chain Resilience API",
    description="Prototype API serving synthesized supply-chain resilience intelligence backed by blockchain anchors.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Simple health endpoint for uptime monitoring."""
    return HealthResponse(status="ok", timestamp=datetime.utcnow(), version=app.version)


@app.get("/api/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
def get_dashboard() -> DashboardResponse:
    """Return synthesized view of the decentralized supply-chain network."""
    return build_dashboard()
