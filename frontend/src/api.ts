import { BrowserProvider, JsonRpcProvider, Contract, Signer, AbstractProvider } from "ethers";
import registryArtifact from "./contracts/SupplyChainRegistry.json";
import escrowArtifact from "./contracts/DeliveryEscrow.json";
import deployment from "./contracts/deployment.json";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

export type Role = "supplier" | "manufacturer" | "depot" | "carrier" | "demander";

export interface Registration {
  orgName: string;
  role: Role;
  email: string;
  region: string;
  materials?: Array<{ id: string; name: string; unitPrice: number; discountEligible: boolean }>;
  coverageAreas?: string[];
  vehicleType?: string;
  capacityPerTrip?: number;
  baseCharge?: number;
  leadTimeHrs?: number;
  collateralPct?: number;
}

export interface DeliveryRequest {
  id: string;
  demander: string;
  fromRegion: string;
  toRegion: string;
  materialId: string;
  quantity: number;
  deadlineISO: string;
  maxPrice?: number;
  collateralStake?: number;
  notes?: string;
}

export interface MatchCandidate {
  providerName: string;
  providerRole: Role;
  providerAddress: string;
  score: number;
  capacityOK: boolean;
  priceEstimate: number;
  leadTimeHrs: number;
  co2EstimateKg: number;
}

export interface ContractTerm {
  key: string;
  value: string | number;
}

export interface SmartContractDraft {
  id: string;
  requestId: string;
  parties: string[];
  terms: ContractTerm[];
  onTimeReward: string;
  tardyPenalty: string;
  status: "DRAFT" | "DEPLOYED" | "COMPLETED" | "DISPUTED";
  metadataURI?: string;
  providerAddress: string;
}

export interface TrackingEvent {
  tsISO: string;
  status: string;
  location: string;
}

export interface SupplyChainApi {
  register(payload: Registration): Promise<{ ok: boolean; id: string }>;
  createDeliveryRequest(payload: Omit<DeliveryRequest, "id">): Promise<{ ok: boolean; id: string }>;
  findMatches(requestId: string): Promise<MatchCandidate[]>;
  draftContract(requestId: string, partyA: string, partyB: string, providerAddress?: string): Promise<SmartContractDraft>;
  deployContract(contractId: string): Promise<{ ok: boolean; tx: string }>;
  trackingFor(requestId: string): Promise<TrackingEvent[]>;
  canWrite: boolean;
  account?: string | null;
  provider: AbstractProvider;
  signer?: Signer | null;
}

const ROLE_TO_ENUM: Record<Role, number> = {
  supplier: 1,
  manufacturer: 2,
  depot: 3,
  carrier: 4,
  demander: 5
};

const ENUM_TO_ROLE: Record<number, Role> = {
  1: "supplier",
  2: "manufacturer",
  3: "depot",
  4: "carrier",
  5: "demander"
};

const DEFAULT_RPC_URL =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_RPC_URL || import.meta.env?.RPC_URL)) ||
  (typeof process !== "undefined" && (process.env?.VITE_RPC_URL || process.env?.RPC_URL)) ||
  "http://127.0.0.1:8545";

export function createReadOnlyProvider(rpcUrl: string = DEFAULT_RPC_URL) {
  return new JsonRpcProvider(rpcUrl);
}

export async function requestWalletConnection() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No EVM-compatible wallet detected");
  }

  const browserProvider = new BrowserProvider(window.ethereum);
  const accounts: string[] = await browserProvider.send("eth_requestAccounts", []);
  const signer = await browserProvider.getSigner();
  const network = await browserProvider.getNetwork();

  return {
    browserProvider,
    signer,
    account: accounts[0],
    chainId: network.chainId.toString()
  };
}

function ensureSigner(signer?: Signer | null): asserts signer {
  if (!signer) {
    throw new Error("Connect a wallet to perform this action");
  }
}

function encodeRegistrationMetadata(payload: Registration) {
  return JSON.stringify({
    materials: payload.materials ?? [],
    coverageAreas: payload.coverageAreas ?? [],
    vehicleType: payload.vehicleType ?? "",
    capacityPerTrip: payload.capacityPerTrip ?? 0,
    baseCharge: payload.baseCharge ?? 0,
    leadTimeHrs: payload.leadTimeHrs ?? 0,
    collateralPct: payload.collateralPct ?? 0,
    createdAt: Date.now()
  });
}

function parsePrefixedId(value: string, prefix: string) {
  if (!value.startsWith(prefix)) {
    throw new Error(`Expected ${prefix} prefix`);
  }
  const numeric = value.slice(prefix.length);
  const id = Number.parseInt(numeric, 10);
  if (Number.isNaN(id)) {
    throw new Error("Invalid identifier");
  }
  return id;
}

function encodeRequestId(id: number | bigint) {
  return `REQ-${id.toString()}`;
}

function encodeAgreementId(id: number | bigint) {
  return `SC-${id.toString()}`;
}

export function createSupplyChainApi(options: {
  provider: AbstractProvider;
  signer?: Signer | null;
  account?: string | null;
}): SupplyChainApi {
  const provider = options.provider;
  const signer = options.signer ?? null;
  const account = options.account ?? null;

  if (!registryArtifact || typeof registryArtifact !== "object") {
    throw new Error("SupplyChainRegistry artifact missing. Run the deploy script first.");
  }

  const registryAddress = (registryArtifact as any).address as string | undefined;
  if (!registryAddress || registryAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("SupplyChainRegistry deployment artifact missing address. Deploy the contracts and export artifacts.");
  }

  const registry = new Contract(registryAddress, (registryArtifact as any).abi, signer ?? provider);

  async function register(payload: Registration) {
    ensureSigner(signer);
    const metadataURI = encodeRegistrationMetadata(payload);
    const coverage = payload.coverageAreas ?? [];
    const input = {
      orgName: payload.orgName,
      role: ROLE_TO_ENUM[payload.role],
      email: payload.email ?? "",
      region: payload.region ?? "",
      metadataURI,
      vehicleType: payload.vehicleType ?? "",
      capacityPerTrip: BigInt(payload.capacityPerTrip ?? 0),
      baseCharge: BigInt(payload.baseCharge ?? 0),
      leadTimeHours: BigInt(payload.leadTimeHrs ?? 0),
      collateralPct: BigInt(payload.collateralPct ?? 0)
    };

    const tx = await registry.register(input, coverage);
    await tx.wait();
    const signerAddress = account ?? (await signer.getAddress());
    return { ok: true, id: `REG-${signerAddress}` } as const;
  }

  async function createDeliveryRequest(payload: Omit<DeliveryRequest, "id">) {
    ensureSigner(signer);
    const deadline = Math.floor(new Date(payload.deadlineISO).getTime() / 1000);
    const input = {
      demander: payload.demander,
      fromRegion: payload.fromRegion,
      toRegion: payload.toRegion,
      materialId: payload.materialId,
      quantity: BigInt(payload.quantity ?? 0),
      deadline: BigInt(deadline),
      maxPrice: BigInt(payload.maxPrice ?? 0),
      collateralStake: BigInt(payload.collateralStake ?? 0),
      notes: payload.notes ?? ""
    };

    const previewId: bigint = await registry.createDeliveryRequest.staticCall(input);
    const tx = await registry.createDeliveryRequest(input);
    await tx.wait();
    return { ok: true, id: encodeRequestId(previewId) } as const;
  }

  async function findMatches(requestId: string): Promise<MatchCandidate[]> {
    const id = parsePrefixedId(requestId, "REQ-");
    const candidates: any[] = await registry.findMatches(id);
    return candidates.map((candidate) => ({
      providerName: candidate.providerName,
      providerRole: ENUM_TO_ROLE[Number(candidate.providerRole)] ?? "carrier",
      providerAddress: candidate.provider,
      score: Number(candidate.score),
      capacityOK: Boolean(candidate.capacityOk),
      priceEstimate: Number(candidate.priceEstimate),
      leadTimeHrs: Number(candidate.leadTimeHours),
      co2EstimateKg: Number(candidate.co2EstimateKg)
    }));
  }

  async function draftContract(requestId: string, partyA: string, partyB: string, providerAddress?: string): Promise<SmartContractDraft> {
    ensureSigner(signer);
    const id = parsePrefixedId(requestId, "REQ-");
    const providerAddressResolved = providerAddress ?? (await signer.getAddress());

    const defaultTerms: ContractTerm[] = [
      { key: "Delivery Deadline", value: new Date(Date.now() + 72 * 3600 * 1000).toISOString() },
      { key: "Payment Option", value: "Token or Fiat" },
      { key: "Lead Time Target (hrs)", value: 24 },
      { key: "CO2 Budget (kg)", value: 120 }
    ];

    const metadataURI = JSON.stringify({
      partyA,
      partyB,
      provider: providerAddressResolved,
      terms: defaultTerms,
      generatedAt: Date.now()
    });

    const input = {
      requestId: BigInt(id),
      provider: providerAddressResolved,
      partyAName: partyA,
      partyBName: partyB,
      onTimeReward: "2% collateral back + fee release",
      tardyPenalty: "Collateral slashed 60% + penalty 5%",
      metadataURI,
      terms: defaultTerms.map((t) => ({ key: t.key, value: String(t.value) }))
    };

    const agreementId: bigint = await registry.draftContract.staticCall(input);
    const tx = await registry.draftContract(input);
    await tx.wait();

    const [agreement, terms] = await registry.getAgreement(Number(agreementId));

    const status: SmartContractDraft["status"] = agreement.status === 0
      ? "DRAFT"
      : agreement.status === 1
        ? "DEPLOYED"
        : agreement.status === 2
          ? "COMPLETED"
          : "DISPUTED";

    return {
      id: encodeAgreementId(agreementId),
      requestId,
      parties: [agreement.partyAName, agreement.partyBName],
      onTimeReward: agreement.onTimeReward,
      tardyPenalty: agreement.tardyPenalty,
      terms: terms.map((t: any) => ({ key: t.key, value: t.value })),
      status,
      metadataURI: agreement.metadataURI,
      providerAddress: providerAddressResolved
    };
  }

  async function deployContract(contractId: string) {
    ensureSigner(signer);
    const id = parsePrefixedId(contractId, "SC-");
    const tx = await registry.deployContract(id);
    const receipt = await tx.wait();
    return { ok: true, tx: receipt.hash } as const;
  }

  async function trackingFor(requestId: string): Promise<TrackingEvent[]> {
    const id = parsePrefixedId(requestId, "REQ-");
    const events = await registry.trackingFor(id);
    const items = events.map((event: any) => ({
      tsISO: new Date(Number(event.timestamp) * 1000).toISOString(),
      status: event.statusText,
      location: event.location
    }));
    if (items.length === 0) {
      return [{ tsISO: new Date().toISOString(), status: "Awaiting updates", location: "Pending" }];
    }
    return items;
  }

  return {
    register,
    createDeliveryRequest,
    findMatches,
    draftContract,
    deployContract,
    trackingFor,
    canWrite: Boolean(signer),
    account,
    provider,
    signer
  };
}

export type DeploymentMetadata = {
  network: string;
  registry: string;
  timestamp: number;
  contracts?: Record<string, { address: string | null }>;
};

export const deploymentInfo: DeploymentMetadata | null = (deployment as DeploymentMetadata) ?? null;

export const registryAddress: string | undefined = (registryArtifact as any)?.address;
export const escrowAbi = (escrowArtifact as any)?.abi ?? [];
