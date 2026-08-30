const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const Order = require("../models/Order");
const { getNextBatchId } = require("../models/Counter");
const abi = require("../abi/SecureHarvest.json");

const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

function getWriteContract() {
  if (!PRIVATE_KEY || !CONTRACT_ADDRESS) return null;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}

/**
 * POST /api/orders
 * Place a new order — pure off-chain write, no blockchain involved yet.
 * Body: { retailerId, supplierId, productType, quantity, unit? }
 */
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/orders
 * List orders. Optional query: ?status=pending / ?retailerId=... / ?supplierId=...
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.retailerId) filter.retailerId = req.query.retailerId;
    if (req.query.supplierId) filter.supplierId = req.query.supplierId;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/:orderId
 */
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/orders/:orderId/accept
 * Supplier accepts the order — THIS is the one moment order data touches
 * the blockchain: a new batch is created on-chain, and its ID is linked
 * back onto the order record.
 * Body: { farmerAddress } — the wallet address to record as the batch's farmer.
 */
router.patch("/:orderId/accept", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.status !== "pending") {
      return res.status(400).json({ error: `Order is already ${order.status}.` });
    }

    const { farmerAddress } = req.body;
    if (!farmerAddress) {
      return res.status(400).json({ error: "farmerAddress is required to create the on-chain batch." });
    }

    const contract = getWriteContract();
    if (!contract) {
      return res.status(500).json({
        error: "Server is not configured to write to the blockchain (missing PRIVATE_KEY or CONTRACT_ADDRESS).",
      });
    }

    // Retry a few times in case the auto-incremented ID collides with a batch
    // created manually/outside this counter (e.g. batch 1, created earlier by hand).
    let batchId, tx, receipt;
    for (let attempt = 0; attempt < 5; attempt++) {
      batchId = await getNextBatchId();
      try {
        tx = await contract.createBatch(batchId, farmerAddress);
        receipt = await tx.wait();
        break; // success
      } catch (err) {
        if (err.message.includes("batch already exists") && attempt < 4) {
          continue; // try the next counter value
        }
        throw err;
      }
    }

    order.status = "fulfilled";
    order.fulfilledAt = new Date();
    order.linkedBatchId = batchId;
    await order.save();

    res.json({
      order,
      onChain: { txHash: tx.hash, blockNumber: receipt.blockNumber, batchId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/orders/:orderId/cancel
 * Cancel a pending order — pure off-chain, no blockchain interaction.
 */
router.patch("/:orderId/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.status !== "pending") {
      return res.status(400).json({ error: `Cannot cancel an order that is already ${order.status}.` });
    }
    order.status = "cancelled";
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
