import { useEffect, useState } from 'react';
import IdentitySelector from '../components/IdentitySelector';
import ReceiptPanel from '../components/ReceiptPanel';
import ChainRecordPanel from '../components/ChainRecordPanel';
import LoadingMessage from '../components/LoadingMessage';
import { getIdentityOptions } from '../services/erpService';
import StatusBadge from '../components/StatusBadge';
import {
  getInventory,
  decrementStock,
  restockInventory,
  removeInventoryRecord,
  getOrders,
  createOrder,
} from '../services/erpService';

function RetailerDashboard({ initialRetailerId }) {
  const [retailerId, setRetailerId] = useState(initialRetailerId || null);

  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productType, setProductType] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [restockQty, setRestockQty] = useState({});
  const [rowBusy, setRowBusy] = useState({});
  const [peekBatchId, setPeekBatchId] = useState(null);

  const [lastReceipt, setLastReceipt] = useState(null);
  const [recentSales, setRecentSales] = useState([]);

  const loadData = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [inv, ord] = await Promise.all([
        getInventory(id),
        getOrders({ retailerId: id }),
      ]);
      setInventory(inv);
      setOrders(ord);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(retailerId);
  }, [retailerId]);

  useEffect(() => {
    (async () => {
      const data = await getIdentityOptions();
      setSupplierOptions(data.supplierIds || []);
    })();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSell = async (batchId) => {
    setError(null);
    const item = inventory.find((i) => i.batchId === batchId);
    setRowBusy((prev) => ({ ...prev, [batchId]: true }));
    try {
      const updated = await decrementStock(batchId, 1);
      await loadData(retailerId);
      const remaining = updated?.quantity ?? updated?.inventory?.quantity;
      showToast(remaining != null ? `Sold! ${remaining} remaining.` : 'Sold 1 unit.');

      const receipt = {
        batchId,
        productName: item?.productName || '',
        quantitySold: 1,
        unit: item?.unit || '',
        time: new Date().toISOString(),
        receiptNo: `R-${Date.now().toString().slice(-6)}`,
      };
      setLastReceipt(receipt);
      setRecentSales((prev) => [receipt, ...prev].slice(0, 8));
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const handleRestock = async (batchId) => {
    const qty = Number(restockQty[batchId]);
    if (!qty || qty <= 0) return;
    setError(null);
    setRowBusy((prev) => ({ ...prev, [batchId]: true }));
    try {
      await restockInventory(batchId, qty);
      await loadData(retailerId);
      showToast(`Restocked ${qty} on batch #${batchId}.`);
      setRestockQty((prev) => ({ ...prev, [batchId]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const handleRemove = async (batchId) => {
    setError(null);
    setRowBusy((prev) => ({ ...prev, [batchId]: true }));
    try {
      await removeInventoryRecord(batchId);
      await loadData(retailerId);
      showToast(`Removed the record for batch #${batchId}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!productType.trim() || !supplierId || !quantity || Number(quantity) <= 0) {
      setError('Fill in product, supplier, and a quantity greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        retailerId,
        supplierId,
        productType: productType.trim(),
        quantity: Number(quantity),
      };
      if (unit.trim()) payload.unit = unit.trim();
      await createOrder(payload);
      setProductType('');
      setSupplierId('');
      setQuantity('');
      setUnit('');
      await loadData(retailerId);
      showToast('Order placed, awaiting supplier acceptance.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: '960px' }}>
      <div className="mode-bar mode-retailer"></div>
      <div className="dash-head">
        <div>
          <h1>Inventory</h1>
          <div className="sub">Scoped to retailer {retailerId || '—'}.</div>
        </div>
      </div>

      <IdentitySelector role="retailer" value={retailerId} onChange={setRetailerId} />

      {toast && (
        <p style={{ color: 'var(--verified)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          ✅ {toast}
        </p>
      )}
      {error && <p className="banner err">{error}</p>}
      {loading && <LoadingMessage />}

      {!loading && retailerId && (
        <>
          {lastReceipt && (
            <ReceiptPanel
              receipt={lastReceipt}
              history={recentSales.slice(1)}
              onDismiss={() => setLastReceipt(null)}
              onPreview={() => setPeekBatchId(lastReceipt.batchId)}
            />
          )}

          <div className="panel">
            <div className="panel-head">
              <h2>On your shelves</h2>
              <span className="count">{inventory.length} record{inventory.length === 1 ? '' : 's'}</span>
            </div>
            <div className="panel-body tight">
              {inventory.length === 0 ? (
                <p className="status-text" style={{ padding: '20px' }}>No inventory yet for {retailerId}.</p>
              ) : (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>batch</th>
                      <th>product</th>
                      <th>quantity</th>
                      <th>status</th>
                      <th>actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const busy = !!rowBusy[item.batchId];
                      return (
                        <tr key={item.batchId}>
                          <td>{item.batchId}</td>
                          <td>{item.productName}</td>
                          <td>{item.quantity} {item.unit || ''}</td>
                          <td><StatusBadge status={item.status} /></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                className="text-input qty-compact"
                                style={{ width: '56px', display: 'inline-block', marginTop: 0, padding: '10px 8px' }}
                                placeholder="qty"
                              />
                              <button className="btn" onClick={() => handleSell(item.batchId)} disabled={busy || item.quantity === 0}>
                                Sell
                              </button>
                              <input
                                type="number"
                                min="1"
                                className="text-input qty-compact"
                                style={{ width: '56px', display: 'inline-block', marginTop: 0, padding: '10px 8px' }}
                                placeholder="qty"
                                value={restockQty[item.batchId] || ''}
                                onChange={(e) => setRestockQty((prev) => ({ ...prev, [item.batchId]: e.target.value }))}
                              />
                              <button className="btn" onClick={() => handleRestock(item.batchId)} disabled={busy}>
                                Restock
                              </button>
                              <button className="linklike" onClick={() => setPeekBatchId(item.batchId)}>
                                view chain record
                              </button>
                              <button className="linklike" onClick={() => handleRemove(item.batchId)} disabled={busy}>
                                remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {peekBatchId && (
            <ChainRecordPanel batchId={peekBatchId} onClose={() => setPeekBatchId(null)} />
          )}

          <div className="panel">
            <div className="panel-head">
              <h2>Reorder</h2>
            </div>
            <div className="panel-body">
              <form className="reorder-form" onSubmit={handleSubmit}>
                <label className="field span2">
                  <span className="field-label">product</span>
                  <input
                    type="text"
                    className="text-input"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="e.g. Tomatoes"
                  />
                </label>
                <label className="field">
                  <span className="field-label">quantity</span>
                  <input
                    type="number"
                    min="1"
                    className="text-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </label>
                <label className="field">
                  <span className="field-label">unit (optional)</span>
                  <input
                    type="text"
                    className="text-input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg"
                  />
                </label>
                <label className="field span2">
                  <span className="field-label">supplier</span>
                  <select
                    className="select-input"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">— choose a supplier —</option>
                    {supplierOptions.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Placing...' : 'Place order'}
                </button>
              </form>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Order history</h2>
              <span className="count">{orders.length}</span>
            </div>
            <div className="panel-body tight">
              {orders.length === 0 ? (
                <p className="status-text" style={{ padding: '20px' }}>No orders yet for {retailerId}.</p>
              ) : (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>product</th>
                      <th>supplier</th>
                      <th>quantity</th>
                      <th>status</th>
                      <th>linked batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.orderId || o._id}>
                        <td>{o.productType}</td>
                        <td>{o.supplierId}</td>
                        <td>{o.quantity}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td>
                          {o.linkedBatchId != null ? (
                            <>
                              {o.linkedBatchId}{' '}
                              <button className="linklike" onClick={() => setPeekBatchId(o.linkedBatchId)}>view</button>
                            </>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RetailerDashboard;