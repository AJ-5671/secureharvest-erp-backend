import { useState, useEffect } from 'react';
import BatchSearch from '../components/BatchSearch';
import ChainRecordBody from '../components/ChainRecordBody';
import QRScanner from '../components/QRScanner';
import { getChainRecord } from '../services/chainRecord';
import { getSupplierScorecards } from '../services/scorecardService';

function Dashboard({ initialBatchId }) {
  const [record, setRecord] = useState(null);
  const [lookedUpId, setLookedUpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [scorecards, setScorecards] = useState([]);
  const [scorecardsLoading, setScorecardsLoading] = useState(false);
  const [scorecardRequested, setScorecardRequested] = useState(false);

  const handleSearch = async (batchId) => {
    setLoading(true);
    setError(null);
    setRecord(null);
    setLookedUpId(batchId);

    try {
      const data = await getChainRecord(batchId);
      setRecord(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBatchId) {
      handleSearch(String(initialBatchId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBatchId]);

  const loadScorecards = async () => {
    setScorecardRequested(true);
    setScorecardsLoading(true);
    const data = await getSupplierScorecards();
    setScorecards(data);
    setScorecardsLoading(false);
  };

  return (
    <div className="page" style={{ maxWidth: '960px' }}>
      <div className="dash-head">
        <div>
          <h1>Batch lookup</h1>
          <div className="sub">Read directly from Sepolia — nothing here can be edited after the fact.</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          {showScanner ? (
            <QRScanner
              onScan={(batchId) => {
                setShowScanner(false);
                handleSearch(batchId);
              }}
              onClose={() => setShowScanner(false)}
            />
          ) : (
            <>
              <div className="lookup-row">
                <div>
                  <span className="field-label">batch number</span>
                  <BatchSearch onSearch={handleSearch} />
                </div>
              </div>
              <button className="btn" onClick={() => setShowScanner(true)} style={{ marginTop: '8px' }}>
                Scan QR Code instead
              </button>
              {!record && (
                <p className="helper-text">
                  This number comes from the receipt a retailer hands you at checkout, or a tag on the
                  package itself. Don't have one handy? <button className="linklike" onClick={() => handleSearch('1')}>Try batch 1</button>.
                </p>
              )}
            </>
          )}

          {loading && <p className="status-text" style={{ marginTop: '16px' }}>Reading the chain...</p>}
          {error && <p className="banner err">{error}</p>}

          {!loading && record && record.exists === false && (
            <p className="status-text" style={{ marginTop: '16px' }}>
              No batch {lookedUpId} exists on-chain. Double-check the number.
            </p>
          )}

          {!loading && record && record.exists !== false && (
            <div style={{ marginTop: '24px' }}>
              <ChainRecordBody record={record} />
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Supplier scorecard</h2>
          {scorecardRequested && <button className="linklike" onClick={loadScorecards}>refresh</button>}
        </div>
        <div className="panel-body">
          {!scorecardRequested && (
            <>
              <p className="status-text">
                Reliability is computed live from every batch linked to a supplier's fulfilled orders. Run it when you want the current picture.
              </p>
              <button className="btn" style={{ marginTop: '14px' }} onClick={loadScorecards}>
                Load supplier scorecard
              </button>
            </>
          )}
          {scorecardRequested && scorecardsLoading && (
            <p className="status-text">Aggregating every supplier's linked batches — this walks the whole order book, give it a moment.</p>
          )}
          {scorecardRequested && !scorecardsLoading && scorecards.length === 0 && (
            <p className="status-text">No suppliers on record yet.</p>
          )}
          {scorecardRequested && !scorecardsLoading && scorecards.length > 0 && (
            <table className="manifest-table">
              <thead>
                <tr>
                  <th>supplier</th>
                  <th>linked batches</th>
                  <th>avg. reliability</th>
                </tr>
              </thead>
              <tbody>
                {scorecards.map((sc) => (
                  <tr key={sc.supplierId}>
                    <td className="mono">{sc.supplierId}</td>
                    <td>{sc.totalBatches}</td>
                    <td>{sc.hasScoreData ? `${sc.reliabilityScore}%` : 'No data yet'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;