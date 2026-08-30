const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

/**
 * POST /api/inventory
 * Create a new inventory record — call this when a batch physically arrives at the retailer.
 * Body: { batchId, productName, retailerId, quantity, unit?, lowStockThreshold? }
 */
router.post("/", async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Inventory record for this batchId already exists." });
    }
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/inventory
 * List all inventory records. Optional query: ?status=low_stock
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Inventory.find(filter).sort({ receivedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/:batchId
 * Get a single inventory record by batch ID.
 */
router.get("/:batchId", async (req, res) => {
  try {
    const item = await Inventory.findOne({ batchId: req.params.batchId });
    if (!item) return res.status(404).json({ error: "No inventory record for this batchId." });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/:batchId/sell
 * Decrement stock by a given quantity — call this on each sale at checkout.
 * Body: { quantitySold }
 */
router.patch("/:batchId/sell", async (req, res) => {
  try {
    const { quantitySold } = req.body;
    if (typeof quantitySold !== "number" || quantitySold <= 0) {
      return res.status(400).json({ error: "quantitySold must be a positive number." });
    }

    const item = await Inventory.findOne({ batchId: req.params.batchId });
    if (!item) return res.status(404).json({ error: "No inventory record for this batchId." });

    if (item.quantity < quantitySold) {
      return res.status(400).json({ error: "Not enough stock for this sale.", available: item.quantity });
    }

    item.quantity -= quantitySold;
    await item.save(); // triggers the pre-save hook to recompute status
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/:batchId/restock
 * Increase stock by a given quantity.
 * Body: { quantityAdded }
 */
router.patch("/:batchId/restock", async (req, res) => {
  try {
    const { quantityAdded } = req.body;
    if (typeof quantityAdded !== "number" || quantityAdded <= 0) {
      return res.status(400).json({ error: "quantityAdded must be a positive number." });
    }

    const item = await Inventory.findOne({ batchId: req.params.batchId });
    if (!item) return res.status(404).json({ error: "No inventory record for this batchId." });

    item.quantity += quantityAdded;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/inventory/:batchId
 * Remove an inventory record (e.g. batch fully sold out and closed).
 */
router.delete("/:batchId", async (req, res) => {
  try {
    const result = await Inventory.findOneAndDelete({ batchId: req.params.batchId });
    if (!result) return res.status(404).json({ error: "No inventory record for this batchId." });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
