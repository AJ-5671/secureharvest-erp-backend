const BASE_URL = 'https://secureharvest-erp-backend.onrender.com';

// Render free tier spins down when idle — first call after inactivity
// can take 30-50s. Not a bug, just a cold start.
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getInventory(retailerId) {
  const query = retailerId ? `?retailerId=${encodeURIComponent(retailerId)}` : '';
  return apiFetch(`/api/inventory${query}`);
}

export async function getInventoryByBatch(batchId) {
  return apiFetch(`/api/inventory/${batchId}`);
}

export async function decrementStock(batchId, quantity) {
  return apiFetch(`/api/inventory/${batchId}/sell`, {
    method: 'PATCH',
    body: JSON.stringify({ quantitySold: quantity }),
  });
}

export async function getLowStockItems() {
  return apiFetch('/api/inventory?status=low_stock');
}

/**
 * Combined inventory + live on-chain breach/reliability view for one batch.
 * New in the real backend — the mock version never had this, since we used
 * to combine contractService + erpService reads manually on the frontend.
 */
export async function getBatchStatus(batchId) {
  return apiFetch(`/api/batch-status/${batchId}`);
}

export async function getOrders(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/api/orders${params ? `?${params}` : ''}`);
}

export async function createOrder({ retailerId, supplierId, productType, quantity, unit }) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ retailerId, supplierId, productType, quantity, unit }),
  });
}

/**
 * Writes to the blockchain server-side (creates a new batch) — costs real
 * test-ETH gas from the backend's wallet. Don't call this repeatedly while testing.
 */
export async function acceptOrder(orderId, farmerAddress) {
  return apiFetch(`/api/orders/${orderId}/accept`, {
    method: 'PATCH',
    body: JSON.stringify({ farmerAddress }),
  });
}

export async function cancelOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
}
/**
 * Returns { retailerIds: [...], supplierIds: [...] } — powers the identity
 * selector dropdowns on the Retailer and Supplier dashboards. There's no
 * real login system; picking an ID from this list is how we simulate "being"
 * a specific retailer/supplier for this demo.
 */
export async function getIdentityOptions() {
  return apiFetch('/api/orders/meta/ids');
}
export async function restockInventory(batchId, quantityAdded) {
  return apiFetch(`/api/inventory/${batchId}/restock`, {
    method: 'PATCH',
    body: JSON.stringify({ quantityAdded }),
  });
}

export async function removeInventoryRecord(batchId) {
  return apiFetch(`/api/inventory/${batchId}`, { method: 'DELETE' });
}