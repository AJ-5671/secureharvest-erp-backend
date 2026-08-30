const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const Inventory = require("../models/Inventory");
const abi = require("../abi/SecureHarvest.json");

const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = CONTRACT_ADDRESS ? new ethers.Contract(CONTRACT_ADDRESS, abi, provider) : null;

/**
 * GET /api/batch-status/:batchId
 * Combines off-chain inventory data with live on-chain batch/breach data —
 * this is the "single view" the retail ERP dashboard would show for a batch.
 */
router.get("/:batchId", async (req, res) => {
  const batchId = req.params.batchId;

  if (!contract) {
    return res.status(500).json({ error: "Contract not configured on the server (missing CONTRACT_ADDRESS)." });
  }

  try {
    const inventory = await Inventory.findOne({ batchId });

    const [batchInfo, readings] = await Promise.all([
      contract.batches(batchId),
      contract.getBatchHistory(batchId),
    ]);

    const breachCount = readings.filter((r) => r.breach).length;

    res.json({
      batchId: Number(batchId),
      inventory: inventory || null,
      onChain: {
        exists: batchInfo.exists,
        farmer: batchInfo.farmer,
        closed: batchInfo.closed,
        readingCount: readings.length,
        breachCount,
        reliabilityScore: readings.length > 0
          ? Number((((readings.length - breachCount) / readings.length) * 100).toFixed(1))
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
