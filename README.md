# SecureHarvest — ERP Backend

Express + MongoDB backend for the retail ERP layer: inventory tracking, tied to the
same live smart contract your middleware and dashboard already use.

## What's in here

- `models/Inventory.js` — inventory schema (one record per batch at a retailer)
- `routes/inventory.js` — CRUD + sell/restock endpoints
- `routes/batchStatus.js` — combines MongoDB inventory data with **live on-chain data**
  (breach count, reliability score) for a single batch — this is the bridge between
  your ERP and your trust layer
- `server.js` — Express app entry point

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — your Atlas connection string (see below if you haven't set this up yet)
- `CONTRACT_ADDRESS` / `SEPOLIA_RPC_URL` — already filled in with your deployed contract, no change needed unless you redeploy

### Getting your MongoDB Atlas connection string (if not done yet)

1. `mongodb.com/cloud/atlas/register` → sign up free
2. Create a free **M0** cluster
3. Create a database user (username + password)
4. Network Access → Allow Access from Anywhere (`0.0.0.0/0`)
5. Connect → Drivers → copy the connection string, replace `<password>` with your actual password
6. Paste into `.env` as `MONGODB_URI`

## Run it

```bash
node server.js
```

You should see:
```
Connected to MongoDB Atlas.
SecureHarvest ERP backend running on http://localhost:4000
```

## API reference

### Inventory

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/inventory` | Create a record when a batch arrives. Body: `{ batchId, productName, retailerId, quantity, unit?, lowStockThreshold? }` |
| GET | `/api/inventory` | List all records. Optional: `?status=low_stock` |
| GET | `/api/inventory/:batchId` | Get one record |
| PATCH | `/api/inventory/:batchId/sell` | Decrement stock. Body: `{ quantitySold }` |
| PATCH | `/api/inventory/:batchId/restock` | Increase stock. Body: `{ quantityAdded }` |
| DELETE | `/api/inventory/:batchId` | Remove a record |

`status` (`in_stock` / `low_stock` / `out_of_stock`) is computed automatically from
quantity vs. `lowStockThreshold` — you never set it directly.

### Batch status (combined view)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/batch-status/:batchId` | Returns inventory info + live on-chain data (breach count, reliability score) for one batch |

Example response:
```json
{
  "batchId": 1,
  "inventory": { "productName": "Tomatoes", "quantity": 45, "status": "in_stock", ... },
  "onChain": {
    "exists": true,
    "farmer": "0x4b89...",
    "closed": false,
    "readingCount": 6,
    "breachCount": 1,
    "reliabilityScore": 83.3
  }
}
```

`reliabilityScore` is `(readings without breach / total readings) × 100` — this is your
starting point for the supplier scorecard module (aggregate this across a supplier's
batches to get their overall score).

### Orders (reorder module)

Orders are pure off-chain business data — see the project's Option A decision: order
placement doesn't need blockchain guarantees. The **only** point an order touches the
chain is when it's **accepted**, which creates a new tracked batch.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/orders` | Place a new order. Body: `{ retailerId, supplierId, productType, quantity, unit? }` |
| GET | `/api/orders` | List orders. Optional: `?status=pending`, `?retailerId=...`, `?supplierId=...` |
| GET | `/api/orders/:orderId` | Get one order |
| PATCH | `/api/orders/:orderId/accept` | Supplier accepts — creates a new on-chain batch and links it. Body: `{ farmerAddress }` |
| PATCH | `/api/orders/:orderId/cancel` | Cancel a pending order |

**Requires `PRIVATE_KEY` in `.env`** for the `/accept` endpoint specifically, since it
writes to the blockchain (creating a batch costs gas). All other endpoints are read-only
and work without it.

Batch IDs for new orders are auto-incremented via an internal counter (starting from 1),
with automatic retry if a generated ID happens to collide with a batch created manually
outside this system (like your original batch 1).

Example accept response:
```json
{
  "order": { "_id": "...", "status": "fulfilled", "linkedBatchId": 2, ... },
  "onChain": { "txHash": "0xabc...", "blockNumber": 11584600, "batchId": 2 }
}
```

## Quick test with curl

```bash
# Create an inventory record for batch 1 (already live on-chain)
curl -X POST http://localhost:4000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"batchId": 1, "productName": "Tomatoes", "retailerId": "retailer-01", "quantity": 50}'

# Check combined status
curl http://localhost:4000/api/batch-status/1

# Simulate a sale
curl -X PATCH http://localhost:4000/api/inventory/1/sell \
  -H "Content-Type: application/json" \
  -d '{"quantitySold": 5}'

# Place an order
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"retailerId": "retailer-01", "supplierId": "supplier-01", "productType": "Tomatoes", "quantity": 100}'

# Accept the order (creates a new batch on-chain — costs gas, needs PRIVATE_KEY set)
curl -X PATCH http://localhost:4000/api/orders/<orderId>/accept \
  -H "Content-Type: application/json" \
  -d '{"farmerAddress": "0xYourWalletAddress"}'
```

## For your teammate (frontend)

Point his ERP dashboard's API calls at `http://localhost:4000/api/...` while developing
locally. When you're ready to demo, either both run it locally on the same network, or
deploy this backend for free on Render/Railway so it's reachable from anywhere.
