# BCFrontendStarter component guide

This document summarizes how `frontend/BCFrontendStarter.jsx` is structured and how to point it at a real backend.

## What the component does
- Single React component that renders registration, delivery request, contract drafting, deployment, and tracking flows using shadcn/ui and Framer Motion for layout and animation.
- Initializes a read-only provider on load and upgrades to a signer once a wallet connects, then builds an API instance through `createSupplyChainApi`.
- Uses the API instance to register organizations, create delivery requests, fetch match candidates, draft and deploy agreements, pull tracking events, and run in-app self tests.

## Where backend calls are made today
- The component imports `createSupplyChainApi` and related helpers from `frontend/api.ts`. That helper currently wires the UI to smart contracts by exposing a `SupplyChainApi` implementation that calls the deployed registry contract.
- In `BCFrontendStarter.jsx`, the hook below rebuilds the API whenever the signer/account changes, so swapping in a backend-aware API only requires changing the factory:
  - `const instance = createSupplyChainApi({ provider, signer, account });` inside the `useEffect` that tracks `signer`, `readOnlyProvider`, and `account`.
- User actions then call that API throughout the component (e.g., `api.register`, `api.createDeliveryRequest`, `api.findMatches`, `api.draftContract`, `api.deployContract`, `api.trackingFor`).

## Connecting to your backend instead of the contract
You can keep the component as-is and replace `createSupplyChainApi` with a backend client that conforms to the same `SupplyChainApi` interface. A minimal approach is:

1. Implement an HTTP-backed API in `frontend/api.ts` (or a new module) that matches the existing function names and return shapes. Example:

```ts
export function createBackendApi(baseUrl: string, account?: string | null): SupplyChainApi {
  async function post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  return {
    register: (payload) => post("/register", payload),
    createDeliveryRequest: (payload) => post("/requests", payload),
    findMatches: (requestId) => post(`/requests/${requestId}/matches`, {}),
    draftContract: (requestId, partyA, partyB, providerAddress) =>
      post(`/requests/${requestId}/drafts`, { partyA, partyB, providerAddress }),
    deployContract: (contractId) => post(`/contracts/${contractId}/deploy`, {}),
    trackingFor: (requestId) => post(`/requests/${requestId}/tracking`, {}),
    canWrite: true,
    account,
    provider: {} as any,
    signer: null
  };
}
```

2. Update `BCFrontendStarter.jsx` to import your backend factory and swap the call inside the `useEffect` that currently builds the contract-backed API:

```diff
-import { createReadOnlyProvider, createSupplyChainApi, requestWalletConnection } from "./api";
+import { createReadOnlyProvider, createBackendApi as createSupplyChainApi, requestWalletConnection } from "./api";
```

3. If your backend still needs wallet identity (e.g., to sign payloads), keep `requestWalletConnection` and pass the `account` into your backend requests. Otherwise, you can drop wallet requirements by setting `canWrite: true` and leaving `account` null in your `SupplyChainApi` implementation.

4. Adjust the in-app self tests if your backend exposes different validation rules. They currently call the same API functions in sequence; you can keep them as a quick smoke test against your backend endpoints.

## Tips for backend parity
- Mirror the response shapes used in `frontend/api.ts` so the UI can stay unchanged: registration returns `{ ok: boolean; id: string }`, requests return `{ ok: boolean; id: string }`, and deployments return `{ ok: boolean; tx: string }`.
- Preserve the `REQ-` and `SC-` prefixes for IDs or adjust the parsing logic in the component accordingly.
- If you have distinct read-only and authenticated endpoints, you can still use the existing `readOnlyProvider` hook to gate write operations by toggling `canWrite` based on auth state.
