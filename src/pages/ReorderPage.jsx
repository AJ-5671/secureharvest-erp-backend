import { useEffect, useState } from 'react';
import { getOrders, createOrder } from '../services/erpService';

// No GET /api/suppliers exists yet — these are placeholder IDs.
// Confirm real supplier IDs with your teammate before demoing this.
const SUPPLIER_OPTIONS = [
  { id: 'supplier-01', label: 'Supplier 01' },
];

// Also a placeholder — no retailer auth/identity flow exists yet.
const RETAILER_ID = 'retailer-001';

function ReorderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [productType, setProductType] = useState('');
  const [supplierId, setSupplierId] = useState(SUPPLIER_OPTIONS[0].id);
  const [quantity, setQuantity] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!productType.trim() || !quantity || Number(quantity) <= 0) {
      setError('Enter a product name and a quantity greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        retailerId: RETAILER_ID,
        supplierId,
        productType: productType.trim(),
        quantity: Number(quantity),
      });
      setProductType('');
      setQuantity('');
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="status-text">Loading...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Retailer / Reorder</p>
        <h1 className="page-title">Reorder Stock</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
        <label>
          <span className="field-label">Product</span>
          <input
            type="text"
            className="text-input"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder="e.g. Mango"
          />
        </label>

        <label>
          <span className="field-label">Supplier</span>
          <select className="select-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {SUPPLIER_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="field-label">Quantity</span>
          <input
            type="number"
            min="1"
            className="text-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Placing order...' : 'Place reorder'}
        </button>
      </form>

      <h2 style={{ marginTop: '32px', fontSize: '1.3rem' }}>Order History</h2>
      <table className="manifest-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Supplier</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Linked Batch</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId || o._id}>
              <td>{o.productType}</td>
              <td>{o.supplierId}</td>
              <td>{o.quantity}</td>
              <td>{o.status}</td>
              <td>{o.linkedBatchId ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReorderPage;