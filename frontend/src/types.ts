export type RiskLevel = "Low" | "Medium" | "High";

export interface NetworkSummary {
  name: string;
  block_height: number;
  smart_contract_version: string;
  uptime: string;
  risk_score: number;
  last_updated: string;
  total_transactions: number;
  oracle_integrations: string[];
}

export interface NodeStatus {
  id: string;
  role: string;
  location: string;
  status: string;
  throughput_tph: number;
  last_event: string;
  risk_level: RiskLevel;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
  last_checkpoint: string;
  blockchain_anchor: string;
  risk_level: RiskLevel;
}

export interface Alert {
  id: string;
  severity: RiskLevel;
  message: string;
  timestamp: string;
  recommended_action: string;
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  impact: string;
  description: string;
  suggested_action: string;
  confidence: number;
}

export interface DashboardData {
  network: NetworkSummary;
  nodes: NodeStatus[];
  shipments: Shipment[];
  alerts: Alert[];
  optimizations: OptimizationRecommendation[];
  resilience_highlights: string[];
}
