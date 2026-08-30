const mongoose = require("mongoose");

/**
 * Simple auto-incrementing counter, used to hand out sequential batch IDs
 * when an order is accepted and a new on-chain batch needs to be created.
 * Keeps batch IDs predictable (1, 2, 3, ...) instead of using timestamps.
 */
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

async function getNextBatchId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "batchId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}

module.exports = { Counter, getNextBatchId };
