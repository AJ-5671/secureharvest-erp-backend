const mongoose = require("mongoose");

/**
 * An order is purely off-chain business data (see project decision: Option A).
 * It only touches the blockchain at the moment it's accepted/fulfilled, via
 * linkedBatchId — that's the one bridge point between ERP orders and the
 * tamper-proof traceability layer.
 */
const orderSchema = new mongoose.Schema(
  {
    retailerId: {
      type: String,
      required: true,
    },
    supplierId: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "kg",
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled"],
      default: "pending",
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    linkedBatchId: {
      type: Number,
      default: null, // filled in once the order is accepted and a batch is created on-chain
    },
    farmerAddress: {
      type: String,
      default: null, // the wallet address recorded as the batch's farmer, set on accept
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
