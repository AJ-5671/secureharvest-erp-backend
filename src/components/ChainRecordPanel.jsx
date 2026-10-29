import { useEffect, useState } from 'react';
import { getChainRecord } from '../services/chainRecord';
import { fmtAddr, fmtHash, fmtTimestamp } from '../utils/format';

function ChainRecordPanel({ batchId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);
    setRecord(null);
    (async () => {
      try {
        const data = await getChainRecord(batchId);
        if (isCurrent) setRecord(data);
      } catch (err) {
        if (isCurrent) setError(err.message);
      } finally {
        if (isCurrent) setLoading(false);
      }
    })();
    return () => { isCurrent = false; };
  }, [batchId]);

  return (
    <div className="crate-card" style={{ marginTop: '16px' }}>
      <div className="crate-card-inner">
        <div className="crate-header">
          <h3 className="crate-title" style={{ fontSize: '1.1rem' }}>Chain record — batch #{batchId}</h3>
          {onClose && <button className="btn" onClick={onClose}>Close</button>}
        </div>

        {loading && <p className="status-text">Reading the chain (first request can take up to a minute if the backend is asleep)...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && record && record.exists === false && (
          <p className="status-text">No on-chain record exists for batch #{batchId}.</p>
        )}

        {!loading && record && record.exists !== false && (
          <>
            <div className="crate-row">
              <span className="crate-row-label">Status</span>
              <span className="crate-row-value">{record.closed ? 'Closed' : 'Open'}</span>
            </div>
            <div className="crate-row">
              <span className="crate-row-label">Farmer</span>
              <span className="crate-row-value mono">{fmtAddr(record.farmer)}</span>
            </div>
            <div className="crate-row">
              <span className="crate-row-label">Created</span>
              <span className="crate-row-value">{fmtTimestamp(record.createdAt)}</span>
            </div>
            <div className="crate-row">
              <span className="crate-row-label">Readings</span>
              <span className="crate-row-value">{record.readings.length}</span>
            </div>
            <div className="crate-row">
              <span className="crate-row-label">Reliability</span>
              <span className="crate-row-value">
                {record.status?.onChain?.reliabilityScore != null
                  ? `${record.status.onChain.reliabilityScore}%`
                  : 'No data yet'}
              </span>
            </div>

            {record.status?.inventory ? (
              <p className="status-text" style={{ marginTop: '12px' }}>
                {record.status.inventory.productName} — {record.status.inventory.quantity} {record.status.inventory.unit || ''} at retailer {record.status.inventory.retailerId}, currently{' '}
                <strong>{(record.status.inventory.status || '').replace('_', ' ')}</strong>.
              </p>
            ) : (
              <p className="status-text" style={{ marginTop: '12px' }}>
                This batch hasn't reached a retailer's inventory yet.
              </p>
            )}

            <h4 style={{ marginTop: '20px', fontSize: '0.9rem' }}>Environmental ledger</h4>
            {record.readings.length === 0 ? (
              <p className="status-text">No readings anchored yet for this batch.</p>
            ) : (
              <table className="manifest-table">
                <thead>
                  <tr>
                    <th>Hash</th>
                    <th>Timestamp</th>
                    <th>Temp</th>
                    <th>Humidity</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {record.readings.map((r, i) => (
                    <tr key={i}>
                      <td className="mono">{fmtHash(r.dataHash)}</td>
                      <td>{fmtTimestamp(r.timestamp)}</td>
                      <td>{r.temperature.toFixed(1)}°C</td>
                      <td>{r.humidity.toFixed(1)}%</td>
                      <td>
                        {r.breach ? (
                          <span className="badge badge-red">breach</span>
                        ) : (
                          <span className="badge badge-green">clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChainRecordPanel;