import { fmtAddr, fmtHash, fmtTimestamp } from '../utils/format';

function ChainRecordBody({ record }) {
  if (!record || record.exists === false) return null;

  const rel = record.status?.onChain?.reliabilityScore;
  const relText = rel === null || rel === undefined ? 'No data yet' : `${rel}%`;

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{record.closed ? 'Closed' : 'Open'}</div>
          <div className="l">batch status</div>
        </div>
        <div className="stat">
          <div className="v mono">{fmtAddr(record.farmer)}</div>
          <div className="l">farmer address</div>
        </div>
        <div className="stat">
          <div className="v">{fmtTimestamp(record.createdAt)}</div>
          <div className="l">created</div>
        </div>
        <div className="stat">
          <div className="v">{record.readings.length}</div>
          <div className="l">readings on file</div>
        </div>
        <div className="stat">
          <div className="v">{relText}</div>
          <div className="l">reliability score</div>
        </div>
      </div>

      {record.status?.inventory ? (
        <div className="banner info" style={{ marginTop: '20px' }}>
          {record.status.inventory.productName} — {record.status.inventory.quantity}{' '}
          {record.status.inventory.unit || ''} at retailer {record.status.inventory.retailerId},
          currently <strong>{(record.status.inventory.status || '').replace('_', ' ')}</strong>.
        </div>
      ) : (
        <div className="banner info" style={{ marginTop: '20px' }}>
          This batch hasn't reached a retailer's inventory yet.
        </div>
      )}

      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <h2>Environmental ledger</h2>
          <span className="count">{record.readings.length} reading{record.readings.length === 1 ? '' : 's'}</span>
        </div>
        <div className="panel-body tight">
          {record.readings.length === 0 ? (
            <p className="status-text" style={{ padding: '20px' }}>No readings anchored yet for this batch.</p>
          ) : (
            <table className="manifest-table">
              <thead>
                <tr>
                  <th>data hash</th>
                  <th>timestamp</th>
                  <th>temp</th>
                  <th>humidity</th>
                  <th>flag</th>
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
        </div>
      </div>
    </>
  );
}

export default ChainRecordBody;