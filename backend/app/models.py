from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class NodeStatus(BaseModel):
    id: str = Field(..., description="Unique identifier for the supply chain node")
    role: str = Field(..., description="Node responsibility within the network")
    location: str = Field(..., description="Geographic location of the node")
    status: str = Field(..., description="Operational health indicator")
    throughput_tph: float = Field(..., description="Hourly throughput handled by the node")
    last_event: datetime = Field(..., description="Timestamp of the most recent blockchain event")
    risk_level: RiskLevel = Field(..., description="Risk indicator derived from resilience model")


class Shipment(BaseModel):
    id: str
    origin: str
    destination: str
    status: str
    eta: datetime
    last_checkpoint: str
    blockchain_anchor: str
    risk_level: RiskLevel


class Alert(BaseModel):
    id: str
    severity: RiskLevel
    message: str
    timestamp: datetime
    recommended_action: str


class OptimizationRecommendation(BaseModel):
    id: str
    title: str
    impact: str
    description: str
    suggested_action: str
    confidence: float = Field(..., ge=0, le=1)


class NetworkSummary(BaseModel):
    name: str
    block_height: int
    smart_contract_version: str
    uptime: str
    risk_score: int = Field(..., ge=0, le=100)
    last_updated: datetime
    total_transactions: int
    oracle_integrations: List[str]


class DashboardResponse(BaseModel):
    network: NetworkSummary
    nodes: List[NodeStatus]
    shipments: List[Shipment]
    alerts: List[Alert]
    optimizations: List[OptimizationRecommendation]
    resilience_highlights: List[str]


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    notes: Optional[str] = None
