import { useEffect, useState } from 'react';
import IdentitySelector from '../components/IdentitySelector';
import ChainRecordPanel from '../components/ChainRecordPanel';
import LoadingMessage from '../components/LoadingMessage';
import { getOrders, acceptOrder, getBatchStatus, getIdentityOptions } from '../services/erpService';

function SupplierDashboard({ initialSupplierId, onViewBatch }) {
  const [supplierId, setSupplierId] = useState(initialSupplierId || null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [farmerAddresses, setFarmerAddresses] = useState({});
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptErrors, setAcceptErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const [farmerOptions, setFarmerOptions] = useState([]);
  const [ownScore, setOwnScore] = useState(null);
  const [peekBatchId, setPeekBatchId] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await getIdentityOptions();
      setFarmerOptions(data.farmerAddresses || []);
    })();
  }, []);

  const loadOrders = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const pending = await getOrders({ supplierId: id, status: 'pending' });
      setPendingOrders(pending);

      const all = await getOrders({ supplierId: id });
      setAllOrders(all);

      const fulfilled = all.filter((o) => o.status === 'fulfilled' && o.linkedBatchId != null);
      if (fulfilled.length > 0) {
        const statuses = await Promise.all(fulfilled.map((o) => getBatchStatus(o.linkedBatchId)));
        const scores = statuses
          .map((s) => s.onChain?.reliabilityScore)
          .filter((score) => score !== null && score !== undefined);
        if (scores.length > 0) {
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          setOwnScore(avg);
        } else {
          setOwnScore(null);
        }
      } else {
        setOwnScore(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(supplierId);
  }, [supplierId]);

  const handleAccept = async (orderId) => {
    const address = (farmerAddresses[orderId] || '').trim();
    if (!address) {
      setAcceptErrors((prev) => ({ ...prev, [orderId]: 'Enter a farmer wallet address first.' }));
      return;
    }

    setAcceptErrors((prev) => ({ ...prev, [orderId]: null }));
    setAcceptingId(orderId);
    try {
      const result = await acceptOrder(orderId, address);
      const newBatchId = result?.linkedBatchId ?? result?.order?.linkedBatchId ?? null;

      await loadOrders(supplierId);

      if (newBatchId != null) {
        setSuccessMessage({ batchId: newBatchId });
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (err) {
      setAcceptErrors((prev) => ({ ...prev, [orderId]: err.message }));
    } finally {
      setAcceptingId(null);
    }
  };

  const fulfilled = allOrders.filter((o) => o.status === 'fulfilled' && o.linkedBatchId != null);

  return (
    <div className="page" style={{ maxWidth: '960px' }}>
      <div className="mode-bar mode-supplier"></div>
      <div className="dash-head">
        <div>
          <h1>Pending orders</h1>
          <div className="sub">Scoped to supplier {supplierId || '—'}. Accepting creates a real on-chain batch.</div>
        </div>
      </div>

      <IdentitySelector role="supplier" value={supplierId} onChange={setSupplierId} />

      <div className="note-box" style={{ marginTop: '16px', marginBottom: '20px' }}>
        <strong>Distributor</strong> is your account here — it's who's ordering fulfilled and who the
        retailer deals with. <strong>Farmer</strong> is a separate, on-chain identity: the wallet
        address of whoever actually grew this shipment and is accountable for its temperature and
        humidity readings. Pick the farmer this order came from below — it's not your distributor ID,
        and a new farmer just needs a wallet address entered manually.
      </div>

      {error && <p className="banner err">{error}</p>}

      {successMessage && (
        <div className="banner ok">
          ✅ Order accepted — batch #{successMessage.batchId} created on-chain.
          {onViewBatch && (
            <>
              {' '}
              <button className="linklike" onClick={() => onViewBatch(successMessage.batchId)}>
                View verification →
              </button>
            </>
          )}
        </div>
      )}

      {loading && <LoadingMessage />}

      {!loading && supplierId && (
        <>
          {ownScore !== null && (
            <div className="panel">
              <div className="panel-body">
                <p className="crate-row-label">Your reliability score</p>
                <p className="score-value" style={{ marginTop: '4px' }}>{ownScore}%</p>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head">
              <h2>Awaiting your acceptance</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button className="linklike" onClick={() => loadOrders(supplierId)}>refresh</button>
                <span className="count">{pendingOrders.length}</span>
              </div>
            </div>
            <div className="panel-body tight">
              {pendingOrders.length === 0 ? (
                <p className="status-text" style={{ padding: '20px' }}>
                  Nothing pending right now. New retailer orders will show up here.
                </p>
              ) : (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>order</th>
                      <th>retailer</th>
                      <th>product</th>
                      <th>quantity</th>
                      <th>accept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((o) => {
                      const orderId = o.orderId || o._id;
                      return (
                        <tr key={orderId}>
                          <td className="mono">{orderId ? String(orderId).slice(-6) : '—'}</td>
                          <td>{o.retailerId}</td>
                          <td>{o.productType}</td>
                          <td>{o.quantity} {o.unit || ''}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <select
                                className="select-input"
                                style={{ width: 'auto', minWidth: '160px', marginTop: 0 }}
                                value={farmerAddresses[orderId] || ''}
                                onChange={(e) =>
                                  setFarmerAddresses((prev) => ({ ...prev, [orderId]: e.target.value }))
                                }
                              >
                                <option value="">— choose farmer —</option>
                                {farmerOptions.map((addr) => (
                                  <option key={addr} value={addr}>{addr}</option>
                                ))}
                              </select>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleAccept(orderId)}
                                disabled={acceptingId === orderId}
                              >
                                {acceptingId === orderId ? 'Accepting...' : 'Accept'}
                              </button>
                            </div>
                            {acceptErrors[orderId] && (
                              <p className="error-text" style={{ marginTop: '8px' }}>
                                {acceptErrors[orderId]}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Fulfilled by you</h2>
              <span className="count">{fulfilled.length}</span>
            </div>
            <div className="panel-body tight">
              {fulfilled.length === 0 ? (
                <p className="status-text" style={{ padding: '20px' }}>
                  Nothing accepted yet — once you do, the resulting batch shows up here.
                </p>
              ) : (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>order</th>
                      <th>retailer</th>
                      <th>product</th>
                      <th>quantity</th>
                      <th>farmer</th>
                      <th>batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fulfilled.map((o) => {
                      const orderId = o.orderId || o._id;
                      return (
                        <tr key={orderId}>
                          <td className="mono">{orderId ? String(orderId).slice(-6) : '—'}</td>
                          <td>{o.retailerId}</td>
                          <td>{o.productType}</td>
                          <td>{o.quantity} {o.unit || ''}</td>
                          <td className="mono">
                            {o.farmerAddress ? `${o.farmerAddress.slice(0, 6)}…${o.farmerAddress.slice(-4)}` : '—'}
                          </td>
                          <td>
                            {o.linkedBatchId}{' '}
                            <button className="linklike" onClick={() => setPeekBatchId(o.linkedBatchId)}>view</button>
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
        </>
      )}
    </div>
  );
}

export default SupplierDashboard;