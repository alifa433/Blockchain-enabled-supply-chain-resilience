import React, { useEffect, useMemo, useState } from "react";
import type {
  DeliveryRequest,
  MatchCandidate,
  Registration,
  SmartContractDraft,
  SupplyChainApi,
  TrackingEvent
} from "../api";
import {
  createReadOnlyProvider,
  createSupplyChainApi,
  deploymentInfo,
  requestWalletConnection
} from "../api";

export type TestResult = { name: string; ok: boolean; details?: string };

async function runSelfTests(api: SupplyChainApi | null): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const push = (name: string, ok: boolean, details?: string) => results.push({ name, ok, details });

  if (!api) {
    push("API ready", false, "Deploy contracts and refresh the page after exporting artifacts.");
    return results;
  }

  if (!api.canWrite) {
    push("Wallet connected", false, "Connect a signer to run integration tests.");
    return results;
  }

  try {
    const reg = await api.register({ orgName: "Test Org", role: "supplier", email: "demo@test", region: "Test" });
    push("register() returns id", reg.ok && Boolean(reg.id));
  } catch (error: any) {
    push("register() returns id", false, error?.message ?? String(error));
    return results;
  }

  try {
    const deadline = new Date(Date.now() + 3600 * 1000).toISOString();
    const request = await api.createDeliveryRequest({
      demander: "QA",
      fromRegion: "Origin",
      toRegion: "Destination",
      materialId: "TEST",
      quantity: 5,
      deadlineISO: deadline,
      notes: "self-test"
    });
    push("createDeliveryRequest() returns prefixed id", request.ok && request.id.startsWith("REQ-"));

    const matches = await api.findMatches(request.id);
    const structureOK = Array.isArray(matches) && matches.every((m) => typeof m.providerName === "string");
    push("findMatches() returns candidates", structureOK);

    const draft = await api.draftContract(request.id, "Party A", "Party B");
    push("draftContract() returns contract", draft.id.startsWith("SC-"));

    const deployed = await api.deployContract(draft.id);
    push("deployContract() returns tx hash", deployed.ok && deployed.tx.startsWith("0x"));

    const timeline = await api.trackingFor(request.id);
    push("trackingFor() returns timeline", Array.isArray(timeline) && timeline.length > 0);
  } catch (error: any) {
    push("End-to-end flow", false, error?.message ?? String(error));
  }

  return results;
}

const roleOptions: Array<{ label: string; value: Registration["role"] }> = [
  { label: "Supplier", value: "supplier" },
  { label: "Manufacturer", value: "manufacturer" },
  { label: "Regional Depot", value: "depot" },
  { label: "Carrier", value: "carrier" },
  { label: "Demander", value: "demander" }
];

const defaultRequest: Omit<DeliveryRequest, "id"> = {
  demander: "",
  fromRegion: "Lower Mainland",
  toRegion: "Vancouver Island",
  materialId: "BAT-001",
  quantity: 100,
  deadlineISO: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
  maxPrice: 1500,
  collateralStake: 400,
  notes: "Handle with care"
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatScore(value: number) {
  return `${Math.round(value)} pts`;
}

function formatCurrency(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const statusBadge = (status: string) => {
  if (status === "READY" || status === "connected") return "status-pill ready";
  if (status === "WARN" || status === "pending") return "status-pill warn";
  return "status-pill error";
};

const statusLabel = (status: string) => {
  switch (status) {
    case "connected":
      return "Signer connected";
    case "pending":
      return "Read-only";
    case "error":
      return "Not available";
    default:
      return status;
  }
};

interface ActionState {
  action: "register" | "request" | "matches" | "draft" | "deploy" | "tracking" | "tests" | null;
  message?: string | null;
}

const initialRegistration: Registration = {
  orgName: "",
  role: "supplier",
  email: "",
  region: "British Columbia"
};

const connectionSummary = (chainId: string | null, account: string | null) => {
  if (!account) return "Wallet not connected";
  const short = `${account.slice(0, 6)}…${account.slice(-4)}`;
  return chainId ? `${short} · Chain ${chainId}` : short;
};

const deploymentSummary = () => {
  if (!deploymentInfo) return "No deployment metadata detected";
  const when = deploymentInfo.timestamp ? new Date(deploymentInfo.timestamp * 1000).toLocaleString() : "unknown";
  return `${deploymentInfo.registry} on ${deploymentInfo.network} (deployed ${when})`;
};

function BCFrontendStarter() {
  const readOnlyProvider = useMemo(() => createReadOnlyProvider(), []);
  const [browserProvider, setBrowserProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [api, setApi] = useState<SupplyChainApi | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [registration, setRegistration] = useState<Registration>(initialRegistration);
  const [regId, setRegId] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState<Omit<DeliveryRequest, "id">>(defaultRequest);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [draft, setDraft] = useState<SmartContractDraft | null>(null);
  const [events, setEvents] = useState<TrackingEvent[] | null>(null);
  const [actionState, setActionState] = useState<ActionState>({ action: null });
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  useEffect(() => {
    try {
      const provider = signer?.provider ?? readOnlyProvider;
      const apiInstance = createSupplyChainApi({ provider, signer, account });
      setApi(apiInstance);
      setApiError(null);
    } catch (error: any) {
      setApi(null);
      setApiError(error?.message ?? String(error));
    }
  }, [signer, readOnlyProvider, account]);

  useEffect(() => {
    if (!browserProvider?.provider?.on) return;
    const provider = browserProvider.provider;

    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] ?? null);
    };
    const handleChainChanged = (nextChainId: string) => {
      setChainId(nextChainId);
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [browserProvider]);

  const handleConnectWallet = async () => {
    try {
      setWalletError(null);
      const result = await requestWalletConnection();
      setBrowserProvider(result.browserProvider);
      setSigner(result.signer);
      setAccount(result.account);
      setChainId(result.chainId);
    } catch (error: any) {
      setWalletError(error?.message ?? String(error));
    }
  };

  const updateActionState = (action: ActionState["action"], message?: string) => {
    setActionState({ action, message });
  };

  const runAction = async <T,>(action: ActionState["action"], fn: () => Promise<T>, successMessage: string) => {
    try {
      updateActionState(action, "processing");
      const result = await fn();
      updateActionState(null, successMessage);
      return result;
    } catch (error: any) {
      updateActionState(null, error?.message ?? String(error));
      throw error;
    }
  };

  const handleRegister = async () => {
    if (!api) return;
    const result = await runAction("register", () => api.register(registration), "Registration submitted");
    setRegId(result.id);
  };

  const handleCreateRequest = async () => {
    if (!api) return;
    const result = await runAction("request", () => api.createDeliveryRequest(requestForm), "Delivery request submitted");
    setRequestId(result.id);
    setMatches(null);
    setDraft(null);
    setEvents(null);
  };

  const handleFindMatches = async () => {
    if (!api || !requestId) return;
    const result = await runAction("matches", () => api.findMatches(requestId), "Matches refreshed");
    setMatches(result);
  };

  const handleDraftContract = async (selected?: MatchCandidate) => {
    if (!api || !requestId) return;
    const providerAddress = selected?.providerAddress;
    const result = await runAction("draft", () => api.draftContract(requestId, "Buyer Org", "Provider Org", providerAddress), "Draft created");
    setDraft(result);
  };

  const handleDeploy = async () => {
    if (!api || !draft) return;
    const result = await runAction("deploy", () => api.deployContract(draft.id), "Contract deployed");
    setDraft({ ...draft, status: "DEPLOYED" });
    updateActionState(null, `Deployment transaction ${result.tx}`);
  };

  const handleTracking = async () => {
    if (!api || !requestId) return;
    const result = await runAction("tracking", () => api.trackingFor(requestId), "Tracking timeline updated");
    setEvents(result);
  };

  const handleRunTests = async () => {
    updateActionState("tests", "Running self-tests");
    const results = await runSelfTests(api);
    setTestResults(results);
    updateActionState(null, "Self-tests completed");
  };

  const registrationStatus = api
    ? api.canWrite
      ? "connected"
      : "pending"
    : "error";

  return (
    <div className="app-shell">
      <div className="hero">
        <span className="tagline">Blockchain-enabled Supply Chain</span>
        <h1>Transparent logistics from registration to delivery tracking</h1>
        <p>
          Connect a wallet, onboard your organisation, publish delivery requests, match with optimal partners,
          and deploy escrow-backed smart contracts to track milestones — all from a single control surface.
        </p>
        <div className="actions">
          <button className="button-primary" onClick={handleConnectWallet} type="button">
            {account ? "Reconnect wallet" : "Connect wallet"}
          </button>
          {walletError && <span className="alert">{walletError}</span>}
        </div>
        <div className="stats">
          <div className="stat-card">
            <span>Connection</span>
            <strong>{connectionSummary(chainId, account)}</strong>
          </div>
          <div className="stat-card">
            <span>Registry deployment</span>
            <strong>{deploymentSummary()}</strong>
          </div>
          <div className="stat-card">
            <span>API status</span>
            <strong>
              <span className={statusBadge(registrationStatus)}>{statusLabel(registrationStatus)}</span>
            </strong>
          </div>
        </div>
      </div>

      {apiError && <div className="alert">{apiError}</div>}

      <div className="grid two">
        <section className="panel">
          <h2>1 · Register participant</h2>
          <p>Store your organisation&apos;s credentials on-chain to unlock matchmaking and contract drafting.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="orgName">Organisation name</label>
              <input
                id="orgName"
                type="text"
                value={registration.orgName}
                onChange={(event) => setRegistration({ ...registration, orgName: event.target.value })}
                placeholder="Rainier Minerals"
              />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={registration.role}
                onChange={(event) => setRegistration({ ...registration, role: event.target.value as Registration["role"] })}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="email">Contact email</label>
              <input
                id="email"
                type="email"
                value={registration.email}
                onChange={(event) => setRegistration({ ...registration, email: event.target.value })}
                placeholder="ops@supplychain.dev"
              />
            </div>
            <div className="field">
              <label htmlFor="region">Primary region</label>
              <input
                id="region"
                type="text"
                value={registration.region}
                onChange={(event) => setRegistration({ ...registration, region: event.target.value })}
                placeholder="British Columbia"
              />
            </div>
          </div>
          <div className="actions">
            <button className="button-primary" type="button" onClick={handleRegister} disabled={!api}>
              Submit registration
            </button>
            {regId && <span className="badge">Registered as {regId}</span>}
          </div>
        </section>

        <section className="panel">
          <h2>2 · Post delivery request</h2>
          <p>Describe your demand and we&apos;ll surface best-fit carriers based on distance, price, and emissions.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="demander">Demander</label>
              <input
                id="demander"
                type="text"
                value={requestForm.demander}
                onChange={(event) => setRequestForm({ ...requestForm, demander: event.target.value })}
                placeholder="Coastal Fabrication Co."
              />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div className="field">
                <label htmlFor="fromRegion">From</label>
                <input
                  id="fromRegion"
                  type="text"
                  value={requestForm.fromRegion}
                  onChange={(event) => setRequestForm({ ...requestForm, fromRegion: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="toRegion">To</label>
                <input
                  id="toRegion"
                  type="text"
                  value={requestForm.toRegion}
                  onChange={(event) => setRequestForm({ ...requestForm, toRegion: event.target.value })}
                />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
              <div className="field">
                <label htmlFor="materialId">Material</label>
                <input
                  id="materialId"
                  type="text"
                  value={requestForm.materialId}
                  onChange={(event) => setRequestForm({ ...requestForm, materialId: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  value={requestForm.quantity}
                  onChange={(event) => setRequestForm({ ...requestForm, quantity: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={requestForm.deadlineISO.slice(0, 16)}
                  onChange={(event) => setRequestForm({ ...requestForm, deadlineISO: new Date(event.target.value).toISOString() })}
                />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
              <div className="field">
                <label htmlFor="maxPrice">Budget (USD)</label>
                <input
                  id="maxPrice"
                  type="number"
                  value={requestForm.maxPrice ?? 0}
                  onChange={(event) => setRequestForm({ ...requestForm, maxPrice: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="collateralStake">Collateral</label>
                <input
                  id="collateralStake"
                  type="number"
                  value={requestForm.collateralStake ?? 0}
                  onChange={(event) => setRequestForm({ ...requestForm, collateralStake: Number(event.target.value) })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Special instructions</label>
              <textarea
                id="notes"
                rows={3}
                value={requestForm.notes ?? ""}
                onChange={(event) => setRequestForm({ ...requestForm, notes: event.target.value })}
              />
            </div>
          </div>
          <div className="actions">
            <button className="button-primary" type="button" onClick={handleCreateRequest} disabled={!api}>
              Submit request
            </button>
            {requestId && <span className="badge">Request {requestId}</span>}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: "20px" }}>
        <h2>3 · Evaluate matches &amp; contracts</h2>
        <p>
          Discover optimal partners. Draft smart contracts with escrow and timeline incentives, then deploy to the
          blockchain when ready.
        </p>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={handleFindMatches} disabled={!api || !requestId}>
            Find matches
          </button>
          <button className="button-secondary" type="button" onClick={() => handleDraftContract()} disabled={!api || !requestId}>
            Draft with top candidate
          </button>
        </div>

        {matches && matches.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Role</th>
                <th>Score</th>
                <th>Lead time (hrs)</th>
                <th>Price est.</th>
                <th>CO₂ (kg)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((candidate) => (
                <tr key={candidate.providerAddress}>
                  <td>{candidate.providerName}</td>
                  <td>{candidate.providerRole}</td>
                  <td>{formatScore(candidate.score)}</td>
                  <td>{candidate.leadTimeHrs}</td>
                  <td>{formatCurrency(candidate.priceEstimate)}</td>
                  <td>{candidate.co2EstimateKg.toFixed(1)}</td>
                  <td>
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => handleDraftContract(candidate)}
                    >
                      Draft contract
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">Run a search to surface best-fit carriers for this request.</div>
        )}

        {draft && (
          <div className="tests" style={{ marginTop: "24px", background: "rgba(22, 163, 74, 0.1)", borderColor: "rgba(22, 163, 74, 0.3)" }}>
            <h3>Draft summary</h3>
            <p>
              <strong>{draft.id}</strong> · Status: {draft.status} · Provider {draft.providerAddress}
            </p>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {draft.terms.map((term) => (
                <div key={term.key} className="timeline-item" style={{ background: "rgba(37, 99, 235, 0.08)" }}>
                  <strong>{term.key}</strong>
                  <div>{term.value}</div>
                </div>
              ))}
            </div>
            <div className="actions" style={{ marginTop: "18px" }}>
              <button className="button-primary" type="button" onClick={handleDeploy} disabled={!api}>
                Deploy smart contract
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: "20px" }}>
        <h2>4 · Track delivery milestones</h2>
        <p>Monitor real-time updates emitted by the escrow contract once a delivery request is in motion.</p>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={handleTracking} disabled={!api || !requestId}>
            Refresh timeline
          </button>
        </div>
        {events && events.length > 0 ? (
          <div className="timeline">
            {events.map((event) => (
              <div key={`${event.tsISO}-${event.status}`} className="timeline-item">
                <strong>{event.status}</strong>
                <div>{event.location}</div>
                <small>{formatDate(event.tsISO)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No tracking events yet. Deploy a contract and trigger milestones to populate this view.</div>
        )}
      </section>

      <section className="panel" style={{ marginTop: "20px" }}>
        <h2>Built-in confidence checks</h2>
        <p>Run deterministic self-tests that execute the full smart-contract flow against your current network.</p>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={handleRunTests}>
            Run integration tests
          </button>
        </div>
        {testResults && (
          <div className="tests">
            {testResults.map((result) => (
              <div key={result.name} className="test-item">
                <span>{result.name}</span>
                <strong className={result.ok ? "status-pill ready" : "status-pill error"}>
                  {result.ok ? "Pass" : "Fail"}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {actionState.message && (
        <div className="alert" style={{ marginTop: "20px" }}>
          {actionState.action ? `${actionState.action} · ${actionState.message}` : actionState.message}
        </div>
      )}
    </div>
  );
}

export default BCFrontendStarter;
