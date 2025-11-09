import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Factory,
  Network,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { checkHealth, fetchDashboard } from "./api";
import type {
  Alert,
  DashboardData,
  NodeStatus,
  RiskLevel,
  Shipment,
} from "./types";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" },
} as const;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatEta = (value: string) => {
  const eta = new Date(value);
  const now = new Date();
  const diff = eta.getTime() - now.getTime();

  if (Number.isNaN(diff)) {
    return "Unknown";
  }

  if (diff < 0) {
    return `Arrived ${formatDateTime(value)}`;
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return `${days}d ${hours}h`;
};

const riskClass = (risk: RiskLevel) => `risk-tag ${risk.toLowerCase()}`;

const statusCopy = (status: string) =>
  status.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

type LoadingState = "idle" | "loading" | "success" | "error";

export default function App(): JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);
  const [healthOk, setHealthOk] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setState("loading");
      setError(null);

      try {
        const [health, dashboard] = await Promise.all([
          checkHealth(controller.signal).catch(() => null),
          fetchDashboard(controller.signal),
        ]);

        if (cancelled) return;

        setHealthOk(Boolean(health?.status === "ok"));
        setData(dashboard);
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshToken]);

  const activeShipments = useMemo(
    () => data?.shipments.filter((shipment) => shipment.status !== "Delivered").length ?? 0,
    [data],
  );

  const highSeverityAlerts = useMemo(
    () => data?.alerts.filter((alert) => alert.severity === "High").length ?? 0,
    [data],
  );

  const averageThroughput = useMemo(() => {
    if (!data?.nodes.length) return 0;
    const total = data.nodes.reduce((sum, node) => sum + node.throughput_tph, 0);
    return Math.round(total / data.nodes.length);
  }, [data]);

  const handleRefresh = () => setRefreshToken((token) => token + 1);

  const renderNodes = (nodes: NodeStatus[]) => (
    <div className="node-list">
      {nodes.map((node) => (
        <motion.div key={node.id} className="node-item" {...fadeIn}>
          <div className="node-meta">
            <span>{node.role}</span>
            <span>{node.location}</span>
            <span>{statusCopy(node.status)}</span>
          </div>
          <strong>{node.id}</strong>
          <div className="node-meta">
            <span>{node.throughput_tph} tph</span>
            <span>Last event {formatDateTime(node.last_event)}</span>
            <span className={riskClass(node.risk_level)}>Risk {node.risk_level}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderShipments = (shipments: Shipment[]) => (
    <div className="shipment-wrapper">
      <table className="shipment-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Route</th>
            <th>Status</th>
            <th>ETA</th>
            <th>Anchor</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>{shipment.id}</td>
              <td>
                {shipment.origin} → {shipment.destination}
              </td>
              <td>{statusCopy(shipment.status)}</td>
              <td>{formatEta(shipment.eta)}</td>
              <td>{shipment.blockchain_anchor}</td>
              <td>
                <span className={riskClass(shipment.risk_level)}>{shipment.risk_level}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAlerts = (alerts: Alert[]) => (
    <div className="alert-list">
      {alerts.map((alert) => (
        <motion.div key={alert.id} className="alert-item" {...fadeIn}>
          <div className="alert-meta">
            <span>{formatDateTime(alert.timestamp)}</span>
            <span className={riskClass(alert.severity)}>Severity {alert.severity}</span>
          </div>
          <strong>{alert.message}</strong>
          <span>{alert.recommended_action}</span>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <motion.section className="hero" {...fadeIn}>
        <div className="badges">
          <span className="badge">
            <Network size={16} /> Blockchain-backed orchestration
          </span>
          <span className="badge">
            <ShieldCheck size={16} /> Resilience intelligence
          </span>
          <span className="badge">
            <Sparkles size={16} /> Predictive insights
          </span>
        </div>
        <h1>Supply Chain Resilience Command</h1>
        <p>
          A connected research environment that fuses blockchain notarisation with stochastic optimisation to monitor, predict,
          and orchestrate supply chain networks in real-time.
        </p>
        <div className="hero-actions">
          {state === "success" && healthOk && <span className="status-banner">Backend link healthy</span>}
          {state === "error" && (
            <span className="status-banner error-banner">
              <AlertTriangle size={16} /> {error || "Unable to reach backend"}
            </span>
          )}
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={handleRefresh}
          disabled={state === "loading"}
        >
          <RefreshCcw size={18} /> Refresh intelligence
        </button>
      </motion.section>

      <section className="stats-grid">
        <motion.div className="stat-card" {...fadeIn}>
          <span className="label">Network height</span>
          <span className="value">{data?.network.block_height ?? "—"}</span>
          <span className="meta">Smart contract {data?.network.smart_contract_version ?? "unknown"}</span>
        </motion.div>
        <motion.div className="stat-card" {...fadeIn}>
          <span className="label">Resilience score</span>
          <span className="value">{data?.network.risk_score ?? "—"}</span>
          <span className="meta">Calculated from stochastic risk model</span>
        </motion.div>
        <motion.div className="stat-card" {...fadeIn}>
          <span className="label">Active shipments</span>
          <span className="value">{activeShipments}</span>
          <span className="meta">Total tracked {data?.shipments.length ?? 0}</span>
        </motion.div>
        <motion.div className="stat-card" {...fadeIn}>
          <span className="label">Critical alerts</span>
          <span className="value">{highSeverityAlerts}</span>
          <span className="meta">Average node throughput {averageThroughput} tph</span>
        </motion.div>
      </section>

      {state === "loading" && (
        <motion.p {...fadeIn}>Synchronising with blockchain network…</motion.p>
      )}

      {state === "success" && data && (
        <>
          <section className="grid-two-column">
            <motion.div className="section-card" {...fadeIn}>
              <header>
                <h2>
                  <Factory size={20} /> Network nodes
                </h2>
              </header>
              {renderNodes(data.nodes)}
            </motion.div>

            <motion.div className="section-card" {...fadeIn}>
              <header>
                <h2>
                  <PackageSearch size={20} /> Shipments on-ledger
                </h2>
              </header>
              {renderShipments(data.shipments)}
            </motion.div>
          </section>

          <section className="grid-two-column">
            <motion.div className="section-card" {...fadeIn}>
              <header>
                <h2>
                  <AlertTriangle size={20} /> Live risk advisories
                </h2>
              </header>
              {renderAlerts(data.alerts)}
            </motion.div>

            <motion.div className="section-card" {...fadeIn}>
              <header>
                <h2>
                  <Sparkles size={20} /> Optimisation levers
                </h2>
              </header>
              <div className="optimization-list">
                {data.optimizations.map((item) => (
                  <motion.div key={item.id} className="optimization-item" {...fadeIn}>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                    <span>{item.suggested_action}</span>
                    <span className="confidence">
                      {item.impact} · Confidence {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.section className="section-card" {...fadeIn}>
            <header>
              <h2>
                <ShieldCheck size={20} /> Resilience highlights
              </h2>
            </header>
            <div className="highlights">
              {data.resilience_highlights.map((highlight) => (
                <motion.div key={highlight} className="highlight-item" {...fadeIn}>
                  {highlight}
                </motion.div>
              ))}
            </div>
            <p className="footer-note">
              Data notarised at block {data.network.block_height} · Oracle feeds: {data.network.oracle_integrations.join(
                ", ",
              )}
            </p>
          </motion.section>
        </>
      )}
    </div>
  );
}
