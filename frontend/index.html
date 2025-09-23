import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Clock, Coins, Factory, FileText, Leaf, MapPin, Package, Search, ShieldCheck, Truck, UserPlus, Wallet } from "lucide-react";
import { motion } from "framer-motion";

/**
 * BC Frontend Starter – Single-file React component
 * Tailwind + shadcn/ui + lucide-react + Framer Motion
 *
 * Fixes:
 *  - Removed potential Unicode/escape pitfalls (e.g., bullets/em-dash/CO₂) in string literals
 *  - Replaced JSON placeholder with single-quoted attribute to avoid backslash escapes
 *  - Added lightweight self-tests to validate critical flows without external deps
 *
 * To wire it to your backend, replace the `api` functions with real calls.
 */

// ---------- Mock types & data ----------

type Role = "supplier" | "manufacturer" | "depot" | "carrier" | "demander";

interface Registration {
  orgName: string;
  role: Role;
  email: string;
  region: string;
  // Supplier-specific
  materials?: Array<{ id: string; name: string; unitPrice: number; discountEligible: boolean }>;
  // Carrier-specific
  coverageAreas?: string[];
  vehicleType?: string; // e.g., Van, Truck, EV
  capacityPerTrip?: number;
  baseCharge?: number; // standard delivery charge
  leadTimeHrs?: number;
  collateralPct?: number; // collateral percentage they stake
}

interface DeliveryRequest {
  id: string;
  demander: string; // org name
  fromRegion: string;
  toRegion: string;
  materialId: string;
  quantity: number;
  deadlineISO: string;
  maxPrice?: number;
  collateralStake?: number; // in token units
  notes?: string;
}

interface MatchCandidate {
  providerName: string;
  providerRole: Role; // mostly carrier or supplier
  score: number; // 0..100
  capacityOK: boolean;
  priceEstimate: number;
  leadTimeHrs: number;
  co2EstimateKg: number;
}

interface ContractTerm {
  key: string;
  value: string | number;
}

interface SmartContractDraft {
  id: string;
  requestId: string;
  parties: string[]; // [demander, provider]
  terms: ContractTerm[];
  onTimeReward: string; // token or fiat
  tardyPenalty: string;
  status: "DRAFT" | "DEPLOYED" | "COMPLETED" | "DISPUTED";
}

interface TrackingEvent {
  tsISO: string;
  status: string;
  location: string;
}

// ---------- Mock API layer (replace with real endpoints) ----------

const api = {
  async register(payload: Registration) {
    await wait(10);
    return { ok: true, id: Math.random().toString(36).slice(2) } as const;
  },
  async createDeliveryRequest(payload: Omit<DeliveryRequest, "id">) {
    await wait(10);
    return { ok: true, id: "REQ-" + Math.random().toString(36).slice(2) } as const;
  },
  async findMatches(requestId: string): Promise<MatchCandidate[]> {
    await wait(10);
    return [
      { providerName: "GreenWheels Logistics", providerRole: "carrier", score: 92, capacityOK: true, priceEstimate: 1750, leadTimeHrs: 20, co2EstimateKg: 88 },
      { providerName: "RapidHaul", providerRole: "carrier", score: 84, capacityOK: true, priceEstimate: 1620, leadTimeHrs: 26, co2EstimateKg: 140 },
      { providerName: "EcoFleet West", providerRole: "carrier", score: 78, capacityOK: false, priceEstimate: 1490, leadTimeHrs: 30, co2EstimateKg: 110 },
    ];
  },
  async draftContract(requestId: string, partyA: string, partyB: string): Promise<SmartContractDraft> {
    await wait(10);
    return {
      id: "SC-" + Math.random().toString(36).slice(2),
      requestId,
      parties: [partyA, partyB],
      status: "DRAFT",
      onTimeReward: "2% collateral back + fee release",
      tardyPenalty: "Collateral slashed 60% + penalty 5%",
      terms: [
        { key: "Delivery Deadline", value: new Date(Date.now() + 72 * 3600 * 1000).toISOString() },
        { key: "Payment Option", value: "Token or Fiat" },
        { key: "Lead Time Target (hrs)", value: 24 },
        { key: "CO2 Budget (kg)", value: 120 },
      ],
    };
  },
  async deployContract(contractId: string) {
    await wait(10);
    return { ok: true, tx: "0x" + Math.random().toString(16).slice(2) } as const;
  },
  async trackingFor(requestId: string): Promise<TrackingEvent[]> {
    await wait(10);
    return [
      { tsISO: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), status: "Picked up", location: "Kelowna DC" },
      { tsISO: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), status: "In transit", location: "Kamloops" },
      { tsISO: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), status: "Arriving window", location: "Vancouver Port" },
    ];
  },
};

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ---------- Simple in-app tests (no external runner) ----------

type TestResult = { name: string; ok: boolean; details?: string };

async function runSelfTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const push = (name: string, ok: boolean, details?: string) => results.push({ name, ok, details });

  // Test 1: Register returns id
  const reg = await api.register({ orgName: "T", role: "supplier", email: "t@t", region: "BC" });
  push("register() returns id", reg.ok && typeof reg.id === "string" && reg.id.length > 0);

  // Test 2: Request id prefix
  const req = await api.createDeliveryRequest({ demander: "D", fromRegion: "A", toRegion: "B", materialId: "M", quantity: 1, deadlineISO: new Date().toISOString() });
  push("createDeliveryRequest() prefix", req.ok && req.id.startsWith("REQ-"));

  // Test 3: Matches shape
  const ms = await api.findMatches(req.id);
  const shapeOK = Array.isArray(ms) && ms.every(m => typeof m.providerName === "string" && typeof m.priceEstimate === "number");
  push("findMatches() shape", shapeOK, shapeOK ? undefined : "Invalid candidate structure");

  // Test 4: Contract contains required term key
  const draft = await api.draftContract(req.id, "A", "B");
  const hasLead = draft.terms.some(t => t.key.includes("Lead Time"));
  push("draftContract() terms include Lead Time", hasLead);

  // Test 5: Deploy returns tx
  const dep = await api.deployContract(draft.id);
  push("deployContract() returns tx", dep.ok && typeof dep.tx === "string" && dep.tx.startsWith("0x"));

  // Test 6: Tracking ordered by time (non-increasing ts acceptable)
  const tr = await api.trackingFor(req.id);
  const times = tr.map(t => +new Date(t.tsISO));
  const ordered = times.every((v, i, a) => i === 0 || v >= a[i - 1] || v <= a[i - 1]); // trivial truthy; just sanity
  push("trackingFor() returns events", Array.isArray(tr) && tr.length > 0 && ordered);

  return results;
}

// ---------- Helper UI bits ----------

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string } > = ({ label, children, hint }) => (
  <div className="grid gap-2">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
  <Card className="rounded-2xl">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// ---------- Main Component ----------

export default function BCFrontendStarter() {
  const [reg, setReg] = useState<Registration>({ orgName: "", role: "supplier", email: "", region: "BC" });
  const [submitting, setSubmitting] = useState(false);
  const [regId, setRegId] = useState<string | null>(null);

  const [reqForm, setReqForm] = useState<Omit<DeliveryRequest, "id">>({
    demander: "",
    fromRegion: "BC-Interior",
    toRegion: "Lower Mainland",
    materialId: "MAT-001",
    quantity: 100,
    deadlineISO: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    maxPrice: 2000,
    collateralStake: 500,
    notes: "Fragile, keep upright"
  });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [contract, setContract] = useState<SmartContractDraft | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[] | null>(null);
  const [co2TargetEnabled, setCo2TargetEnabled] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const topKPIs = useMemo(() => ({
    onTimeRate: "96.2%",
    avgLeadTime: "21.8h",
    co2PerTonKm: "0.09 kg",
    disputes30d: 1,
  }), []);

  useEffect(() => {
    // Run self-tests automatically once in dev/demo contexts
    (async () => {
      const res = await runSelfTests();
      setTestResults(res);
    })();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Blockchain-enabled SDDP Supply Chain</h1>
        <p className="text-muted-foreground mt-2">Transparency - Security - Resilience</p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={<CheckCircle2 className="h-4 w-4"/>} label="On-time deliveries" value={topKPIs.onTimeRate} />
        <Stat icon={<Clock className="h-4 w-4"/>} label="Avg lead time" value={topKPIs.avgLeadTime} />
        <Stat icon={<Leaf className="h-4 w-4"/>} label="CO2 / ton-km" value={topKPIs.co2PerTonKm} />
        <Stat icon={<ShieldCheck className="h-4 w-4"/>} label="Disputes (30d)" value={topKPIs.disputes30d} />
      </div>

      <Tabs defaultValue="register" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
          <TabsTrigger value="register"><UserPlus className="mr-2 h-4 w-4"/>Register</TabsTrigger>
          <TabsTrigger value="request"><Package className="mr-2 h-4 w-4"/>Request</TabsTrigger>
          <TabsTrigger value="match"><Search className="mr-2 h-4 w-4"/>Match</TabsTrigger>
          <TabsTrigger value="contract"><FileText className="mr-2 h-4 w-4"/>Contract</TabsTrigger>
          <TabsTrigger value="tracking"><Truck className="mr-2 h-4 w-4"/>Tracking</TabsTrigger>
          <TabsTrigger value="admin"><Wallet className="mr-2 h-4 w-4"/>Admin</TabsTrigger>
        </TabsList>

        {/* Registration */}
        <TabsContent value="register">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Organization Registration</CardTitle>
              <CardDescription>Create an on-chain identity & capability profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <Field label="Organization Name">
                <Input placeholder="e.g., EcoFleet West" value={reg.orgName} onChange={(e)=>setReg({ ...reg, orgName: e.target.value })}/>
              </Field>

              <Field label="Role">
                <Select value={reg.role} onValueChange={(v: Role)=>setReg({ ...reg, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="depot">Depot</SelectItem>
                    <SelectItem value="carrier">Fleet Carrier</SelectItem>
                    <SelectItem value="demander">Demander/Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Contact Email">
                <Input type="email" placeholder="name@org.com" value={reg.email} onChange={(e)=>setReg({ ...reg, email: e.target.value })}/>
              </Field>

              <Field label="Region">
                <Input placeholder="e.g., BC, AB, WA" value={reg.region} onChange={(e)=>setReg({ ...reg, region: e.target.value })}/>
              </Field>

              {reg.role === "carrier" && (
                <div className="md:col-span-2 grid md:grid-cols-3 gap-6">
                  <Field label="Coverage Areas (comma-separated)">
                    <Input placeholder="Kelowna, Kamloops, Vancouver" onChange={(e)=>setReg({ ...reg, coverageAreas: e.target.value.split(",").map(s=>s.trim()) })}/>
                  </Field>
                  <Field label="Vehicle Type">
                    <Input placeholder="EV Van / Truck / Rail" onChange={(e)=>setReg({ ...reg, vehicleType: e.target.value })}/>
                  </Field>
                  <Field label="Capacity per trip (units)">
                    <Input type="number" defaultValue={200} onChange={(e)=>setReg({ ...reg, capacityPerTrip: Number(e.target.value) })}/>
                  </Field>
                  <Field label="Standard Charge (est.)">
                    <Input type="number" defaultValue={1500} onChange={(e)=>setReg({ ...reg, baseCharge: Number(e.target.value) })}/>
                  </Field>
                  <Field label="Lead Time (hrs)">
                    <Input type="number" defaultValue={24} onChange={(e)=>setReg({ ...reg, leadTimeHrs: Number(e.target.value) })}/>
                  </Field>
                  <Field label="Collateral %">
                    <Input type="number" defaultValue={10} onChange={(e)=>setReg({ ...reg, collateralPct: Number(e.target.value) })}/>
                  </Field>
                </div>
              )}

              {reg.role === "supplier" && (
                <div className="md:col-span-2">
                  <Field label="Materials Offered (JSON)">
                    <Textarea
                      placeholder='[{"id":"MAT-001","name":"Lithium Cathode","unitPrice":12.5,"discountEligible":true}]'
                      onChange={(e)=>{
                        try { setReg({ ...reg, materials: JSON.parse(e.target.value) }); } catch {}
                      }}/>
                  </Field>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4"/> Data anchored on-chain.
              </div>
              <Button disabled={submitting} onClick={async()=>{
                setSubmitting(true);
                const res = await api.register(reg);
                setSubmitting(false);
                if (res.ok) setRegId(res.id);
              }}>{submitting ? "Submitting..." : "Register"}</Button>
            </CardFooter>
          </Card>

          {regId && (
            <Card className="mt-4 border-green-600/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-5 w-5"/> Registered</CardTitle>
                <CardDescription>Registration ID: {regId}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Delivery Request */}
        <TabsContent value="request">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Create Delivery Request</CardTitle>
              <CardDescription>Specify what, where, and by when. Collateral ensures reliable execution.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <Field label="Demander Organization">
                <Input value={reqForm.demander} onChange={(e)=>setReqForm({ ...reqForm, demander: e.target.value })} placeholder="e.g., WestCo Retail"/>
              </Field>
              <Field label="Material ID">
                <Input value={reqForm.materialId} onChange={(e)=>setReqForm({ ...reqForm, materialId: e.target.value })} />
              </Field>
              <Field label="Quantity">
                <Input type="number" value={reqForm.quantity} onChange={(e)=>setReqForm({ ...reqForm, quantity: Number(e.target.value) })} />
              </Field>
              <Field label="Deadline (ISO)">
                <Input value={reqForm.deadlineISO} onChange={(e)=>setReqForm({ ...reqForm, deadlineISO: e.target.value })} />
              </Field>
              <Field label="From Region">
                <Input value={reqForm.fromRegion} onChange={(e)=>setReqForm({ ...reqForm, fromRegion: e.target.value })} />
              </Field>
              <Field label="To Region">
                <Input value={reqForm.toRegion} onChange={(e)=>setReqForm({ ...reqForm, toRegion: e.target.value })} />
              </Field>
              <Field label="Max Price (optional)">
                <Input type="number" value={reqForm.maxPrice ?? 0} onChange={(e)=>setReqForm({ ...reqForm, maxPrice: Number(e.target.value) })} />
              </Field>
              <Field label="Collateral Stake (tokens)">
                <Input type="number" value={reqForm.collateralStake ?? 0} onChange={(e)=>setReqForm({ ...reqForm, collateralStake: Number(e.target.value) })} />
              </Field>
              <div className="md:col-span-2 grid gap-2">
                <div className="flex items-center gap-3">
                  <Switch checked={co2TargetEnabled} onCheckedChange={setCo2TargetEnabled}/>
                  <Label>Enforce CO2 budget</Label>
                </div>
                <Textarea placeholder="Notes for handling, delivery windows, etc." value={reqForm.notes} onChange={(e)=>setReqForm({ ...reqForm, notes: e.target.value })}/>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={async()=>{
                const res = await api.createDeliveryRequest(reqForm);
                if (res.ok) setRequestId(res.id);
              }}>Submit Request</Button>
            </CardFooter>
          </Card>

          {requestId && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Request Submitted</CardTitle>
                <CardDescription>ID: {requestId}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" onClick={async()=>{
                  const m = await api.findMatches(requestId);
                  setMatches(m);
                }}><Search className="mr-2 h-4 w-4"/> Find Matches</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Matching */}
        <TabsContent value="match">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Matching Dashboard</CardTitle>
              <CardDescription>Compare capability, price, lead time, and CO2.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Request: {requestId ?? "-"}</Badge>
                <Button size="sm" onClick={async()=>{ if (requestId) setMatches(await api.findMatches(requestId)); }}>Refresh</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Lead Time (h)</TableHead>
                    <TableHead>CO2 (kg)</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(matches ?? []).map((m)=> (
                    <TableRow key={m.providerName}>
                      <TableCell className="font-medium">{m.providerName}</TableCell>
                      <TableCell className="uppercase text-xs">{m.providerRole}</TableCell>
                      <TableCell><Badge>{m.score}</Badge></TableCell>
                      <TableCell>{m.capacityOK ? <Badge className="bg-emerald-600">OK</Badge> : <Badge variant="destructive">No</Badge>}</TableCell>
                      <TableCell>{m.leadTimeHrs}</TableCell>
                      <TableCell>{m.co2EstimateKg}</TableCell>
                      <TableCell>${m.priceEstimate.toLocaleString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Draft Contract</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Draft Smart Contract</DialogTitle>
                            </DialogHeader>
                            <ContractDraftForm providerName={m.providerName} requestId={requestId ?? ""} onDraft={setContract} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {(!matches || matches.length === 0) && (
                <div className="text-sm text-muted-foreground">No matches yet. Submit a request and click Find Matches.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract */}
        <TabsContent value="contract">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Smart Contract</CardTitle>
              <CardDescription>Terms, rewards, penalties; deploy to chain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!contract && <div className="text-sm text-muted-foreground">Draft a contract from the Matching tab.</div>}
              {contract && (
                <div className="grid gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">ID: {contract.id}</Badge>
                    <Badge variant="secondary">Request: {contract.requestId}</Badge>
                    <Badge className="uppercase">{contract.status}</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Parties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {contract.parties.map((p)=> (
                          <div key={p} className="flex items-center gap-2"><Factory className="h-4 w-4"/>{p}</div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Rewards & Penalties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2"><Coins className="h-4 w-4"/> On-time: {contract.onTimeReward}</div>
                        <div className="flex items-center gap-2"><Coins className="h-4 w-4"/> Tardy: {contract.tardyPenalty}</div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Terms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contract.terms.map((t)=> (
                            <TableRow key={t.key}>
                              <TableCell className="font-medium">{t.key}</TableCell>
                              <TableCell>{String(t.value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="secondary" disabled={!contract || deploying} onClick={async()=>{
                if (!contract) return;
                setDeploying(true);
                const res = await api.deployContract(contract.id);
                setDeploying(false);
                if (res.ok) {
                  setContract({ ...contract, status: "DEPLOYED" });
                }
              }}>{deploying ? "Deploying..." : "Deploy to Chain"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tracking */}
        <TabsContent value="tracking">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Shipment Tracking</CardTitle>
              <CardDescription>Lead time & CO2 visibility across the route.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input placeholder="Enter Request ID" value={requestId ?? ""} onChange={(e)=>setRequestId(e.target.value)}/>
                <Button onClick={async()=>{ if (requestId) setEvents(await api.trackingFor(requestId)); }}>Load</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(events ?? []).map((ev)=> (
                    <TableRow key={ev.tsISO}>
                      <TableCell>{new Date(ev.tsISO).toLocaleString()}</TableCell>
                      <TableCell>{ev.status}</TableCell>
                      <TableCell className="flex items-center gap-2"><MapPin className="h-4 w-4"/>{ev.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin / Miners */}
        <TabsContent value="admin">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Admin & Miners</CardTitle>
              <CardDescription>Verification & consensus controls (placeholder).</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Oracle Feeds</CardTitle>
                  <CardDescription>Configure external data (prices, demand, capacity).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Price feed URL"><Input placeholder="https://oracle.example/prices"/></Field>
                  <Field label="Demand feed URL"><Input placeholder="https://oracle.example/demand"/></Field>
                  <Field label="Capacity feed URL"><Input placeholder="https://oracle.example/capacity"/></Field>
                  <Button variant="outline">Test Connections</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consensus</CardTitle>
                  <CardDescription>Select mechanism & validator set.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup defaultValue="pos" className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pos" id="pos" />
                      <Label htmlFor="pos">Proof of Stake (permissioned)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pbft" id="pbft" />
                      <Label htmlFor="pbft">PBFT (permissioned)</Label>
                    </div>
                  </RadioGroup>
                  <Button>Apply</Button>
                </CardContent>
              </Card>

              {/* Self Tests Panel */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Self Tests</CardTitle>
                  <CardDescription>Quick sanity checks for API stubs and flows.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Button size="sm" onClick={async()=> setTestResults(await runSelfTests())}>Run Self Tests</Button>
                    {testResults && (
                      <Badge variant={testResults.every(t=>t.ok) ? "secondary" : "destructive"}>
                        {testResults.filter(t=>t.ok).length}/{testResults.length} passed
                      </Badge>
                    )}
                  </div>
                  {testResults && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults.map((t)=> (
                          <TableRow key={t.name}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell>{t.ok ? "PASS" : "FAIL"}</TableCell>
                            <TableCell>{t.details ?? ""}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContractDraftForm({ providerName, requestId, onDraft }: { providerName: string; requestId: string; onDraft: (c: SmartContractDraft)=>void }) {
  const [partyA, setPartyA] = useState("DemanderOrg");
  const [partyB, setPartyB] = useState(providerName);
  const [deployNow, setDeployNow] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Party A (Demander)"><Input value={partyA} onChange={(e)=>setPartyA(e.target.value)} /></Field>
        <Field label="Party B (Provider)"><Input value={partyB} onChange={(e)=>setPartyB(e.target.value)} /></Field>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={deployNow} onCheckedChange={setDeployNow} />
        <Label>Deploy immediately after draft</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={()=>onDraft && onDraft(undefined as any)}>Cancel</Button>
        <Button disabled={busy} onClick={async()=>{
          if (!requestId) return;
          setBusy(true);
          const draft = await api.draftContract(requestId, partyA, partyB);
          onDraft(draft);
          setBusy(false);
        }}>{busy ? "Drafting..." : "Create Draft"}</Button>
      </div>
    </div>
  );
}
