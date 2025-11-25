# Frontend ↔ Backend Integration Guide

This frontend already knows how to talk to the deployed smart contracts through the helper functions in [`frontend/api.ts`](./api.ts). Use this guide to rebuild the contract artifacts from the backend and point the React app at your running Hardhat network.

## Prerequisites
- Node.js 18+
- `npm` (uses the backend `package-lock.json`)
- MetaMask or another EVM wallet available in the browser for write operations

## 1) Build backend artifacts for the frontend
1. Install backend dependencies (from the repo root):
   ```bash
   cd backend
   npm install
   ```
2. Start a local Hardhat node in one terminal:
   ```bash
   npx hardhat node
   ```
3. In a second terminal, deploy the contracts to that node (this also writes fresh artifacts to `frontend/contracts/`):
   ```bash
   cd backend
   npx hardhat run scripts/deploy.js --network localhost
   ```
   The script outputs:
   - `frontend/contracts/SupplyChainRegistry.json` (address + ABI + bytecode)
   - `frontend/contracts/DeliveryEscrow.json` (ABI + bytecode)
   - `frontend/contracts/deployment.json` (network metadata)

> If you already have deployed contracts and only need ABI/bytecode exports, you can run `npm run export` (`node scripts/exportArtifacts.js`) instead; it reuses the compiled artifacts without redeploying.

## 2) Point the frontend at the backend network
- The React code reads `VITE_RPC_URL` (or `RPC_URL`) to build its read-only provider. For a local Hardhat node, set:
  ```bash
  export VITE_RPC_URL="http://127.0.0.1:8545"
  ```
- Open the app in a browser and connect your wallet. When MetaMask is connected, `requestWalletConnection()` in `api.ts` supplies the signer and account to `createSupplyChainApi`, enabling write calls like registration, drafting, and deployment.

## 3) Working with the SupplyChain API wrapper
- `createSupplyChainApi` wires the ethers provider/signer to the deployed `SupplyChainRegistry` and `DeliveryEscrow` contracts using the artifacts in `frontend/contracts/`.
- Key flows exposed to the UI:
  - `register(payload)` → writes organization metadata to `SupplyChainRegistry`
  - `createDeliveryRequest(payload)` / `findMatches(requestId)` → uses contract helpers to generate match candidates
  - `draftContract(requestId, partyA, partyB, providerAddress?)` → builds a delivery agreement draft
  - `deployContract(contractId)` → deploys the escrow contract for the draft
  - `trackingFor(requestId)` → pulls tracking events for a request
- The component-level tests in `BCFrontendStarter.jsx` call these methods end-to-end once a signer is available.

## 4) Updating artifacts after contract changes
Whenever you modify Solidity contracts under `backend/contracts/`, rerun:
```bash
cd backend
npx hardhat run scripts/deploy.js --network localhost
```
This recompiles, redeploys, and refreshes the frontend artifacts so the React app stays in sync with the backend chain state.
