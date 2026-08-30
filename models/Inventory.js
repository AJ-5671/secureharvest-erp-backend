const mongoose = require("mongoose");

/**
 * One inventory record per batch that has arrived at a retailer.
 * batchId links this record back to the on-chain SecureHarvest batch,
 * so the ERP can cross-reference stock with verified environmental history.
 */
const inventorySchema = new mongoose.Schema(
  {
    batchId: {
      type: Number,
      required: true,
      unique: true, // one inventory record per batch
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    retailerId: {
      type: String,
      required: true,
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
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Keep `status` in sync with quantity whenever a record is saved.
inventorySchema.pre("save", function () {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= this.lowStockThreshold) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
});

module.exports = mongoose.model("Inventory", inventorySchema);
