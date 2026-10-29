import { useEffect, useState } from 'react';
import { getInventory, decrementStock } from '../services/erpService';

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSell = async (batchId) => {
    setError(null);
    try {
      await decrementStock(batchId, 1);
      await loadInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="status-text">Loading inventory (first load may take up to a minute)...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Retailer / Stock</p>
        <h1 className="page-title">Inventory</h1>
      </div>

      {error && <p className="error-text">Error: {error}</p>}

      <table className="manifest-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Product</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const isLow = item.status === 'low_stock' || item.status === 'out_of_stock';
            return (
              <tr key={item.batchId}>
                <td className="mono">#{item.batchId}</td>
                <td>{item.productName}</td>
                <td className={isLow ? 'low-stock' : ''}>
                  {item.quantity} {item.status === 'low_stock' && '⚠️ Low stock'}
                  {item.status === 'out_of_stock' && '⚠️ Out of stock'}
                </td>
                <td>
                  <button className="btn" onClick={() => handleSell(item.batchId)} disabled={item.quantity === 0}>
                    Sell 1 unit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryPage;