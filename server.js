require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const inventoryRoutes = require("./routes/inventory");
const batchStatusRoutes = require("./routes/batchStatus");
const ordersRoutes = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "";

app.use("/api/inventory", inventoryRoutes);
app.use("/api/batch-status", batchStatusRoutes);
app.use("/api/orders", ordersRoutes);

app.get("/", (req, res) => {
  res.json({ status: "SecureHarvest ERP backend is running." });
});

async function start() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set in .env — cannot start without a database connection.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    app.listen(PORT, () => {
      console.log(`SecureHarvest ERP backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
