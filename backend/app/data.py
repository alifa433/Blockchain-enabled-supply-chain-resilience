from __future__ import annotations

from datetime import datetime, timedelta

from .models import Alert, DashboardResponse, NetworkSummary, NodeStatus, OptimizationRecommendation, RiskLevel, Shipment


NOW = datetime.utcnow()

NETWORK_SUMMARY = NetworkSummary(
    name="Global Resilience Network",
    block_height=2845,
    smart_contract_version="v1.4.2",
    uptime="99.982%",
    risk_score=76,
    last_updated=NOW,
    total_transactions=158_240,
    oracle_integrations=["PortAuthority", "WeatherNet", "FXRateHub"],
)

NODES = [
    NodeStatus(
        id="node-mfg-001",
        role="Manufacturer",
        location="Nagoya, Japan",
        status="Operational",
        throughput_tph=420.0,
        last_event=NOW - timedelta(minutes=12),
        risk_level=RiskLevel.LOW,
    ),
    NodeStatus(
        id="node-supplier-014",
        role="Tier 2 Supplier",
        location="Penang, Malaysia",
        status="Capacity Watch",
        throughput_tph=265.0,
        last_event=NOW - timedelta(minutes=24),
        risk_level=RiskLevel.MEDIUM,
    ),
    NodeStatus(
        id="node-log-007",
        role="Logistics Hub",
        location="Rotterdam, Netherlands",
        status="Weather Delay",
        throughput_tph=310.0,
        last_event=NOW - timedelta(hours=1, minutes=5),
        risk_level=RiskLevel.HIGH,
    ),
]

SHIPMENTS = [
    Shipment(
        id="shipment-4839",
        origin="Nagoya, Japan",
        destination="Munich, Germany",
        status="In Transit",
        eta=NOW + timedelta(days=5, hours=4),
        last_checkpoint="Anchored at block #2841",
        blockchain_anchor="0x84d1...9a3f",
        risk_level=RiskLevel.MEDIUM,
    ),
    Shipment(
        id="shipment-4840",
        origin="Penang, Malaysia",
        destination="Austin, USA",
        status="Awaiting Customs",
        eta=NOW + timedelta(days=2, hours=19),
        last_checkpoint="Document notarized in block #2844",
        blockchain_anchor="0xd091...be4c",
        risk_level=RiskLevel.HIGH,
    ),
    Shipment(
        id="shipment-4821",
        origin="Rotterdam, Netherlands",
        destination="Birmingham, UK",
        status="Delivered",
        eta=NOW - timedelta(hours=6),
        last_checkpoint="Delivery proof in block #2838",
        blockchain_anchor="0x1a24...bb92",
        risk_level=RiskLevel.LOW,
    ),
]

ALERTS = [
    Alert(
        id="alert-1201",
        severity=RiskLevel.HIGH,
        message="Typhoon disrupting sailings from East China Sea corridor",
        timestamp=NOW - timedelta(minutes=8),
        recommended_action="Reroute maritime legs through Singapore hub",
    ),
    Alert(
        id="alert-1188",
        severity=RiskLevel.MEDIUM,
        message="Supplier quality variance detected on alloy batch",
        timestamp=NOW - timedelta(hours=2, minutes=17),
        recommended_action="Trigger additional inspection workflow",
    ),
    Alert(
        id="alert-1179",
        severity=RiskLevel.LOW,
        message="FX volatility exceeds smart-contract guard band",
        timestamp=NOW - timedelta(hours=5, minutes=42),
        recommended_action="Increase collateral buffers for next settlement",
    ),
]

OPTIMIZATIONS = [
    OptimizationRecommendation(
        id="opt-220",
        title="Dynamic Safety Stock",
        impact="Projected 18% resilience improvement",
        description="Model suggests increasing safety stock at Rotterdam hub to buffer against port delays.",
        suggested_action="Adjust smart contract thresholds for automatic replenishment",
        confidence=0.82,
    ),
    OptimizationRecommendation(
        id="opt-221",
        title="Dual Sourcing Trigger",
        impact="Projected 12% lead-time reduction",
        description="Activate alternate supplier in Vietnam for alloy components to mitigate Malaysian disruptions.",
        suggested_action="Deploy contingent purchase order contract",
        confidence=0.74,
    ),
]

RESILIENCE_HIGHLIGHTS = [
    "Oracle feeds confirm carbon tracking compliance across lanes.",
    "All critical manufacturing smart contracts passed overnight audits.",
    "Predictive risk model indicates improving trend for APAC routes.",
]


def build_dashboard() -> DashboardResponse:
    return DashboardResponse(
        network=NETWORK_SUMMARY,
        nodes=NODES,
        shipments=SHIPMENTS,
        alerts=ALERTS,
        optimizations=OPTIMIZATIONS,
        resilience_highlights=RESILIENCE_HIGHLIGHTS,
    )
