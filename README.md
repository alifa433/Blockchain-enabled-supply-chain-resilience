# Blockchain-enabled-supply-chain-resilience

A decentralized platform for enhancing supply chain resilience using blockchain technology.  
This system includes:

- Smart contracts for procurement, production, inventory, transport, and payments  
- Oracle integration for real-time data  
- Multi-stage stochastic programming model for optimization  
- A React-based frontend with TailwindCSS + shadcn/ui + framer-motion  
- A FastAPI backend with blockchain interaction endpoints  

---

## 🚀 Features

### Frontend
- Role-based **organization registration** (supplier, manufacturer, carrier, demander, etc.)
- **Delivery request creation** with deadlines, pricing, and collateral
- **Matching dashboard** to evaluate suppliers and carriers based on score, cost, lead time, and CO₂
- **Smart contract drafting & deployment** with rewards/penalties
- **Shipment tracking** with live events
- **Admin tab** with placeholder oracle feeds and consensus settings

### Backend
- Built with **FastAPI** (Python)  
- Provides endpoints for registration, requests, matching, contracts, and tracking  
- CORS enabled for frontend communication  
- Future extension: integration with real blockchain nodes and oracles  

---

## 🏗 Project Structure

