import { useEffect, useState } from 'react';
import { getSupplierScorecards } from '../services/scorecardService';

function ScorecardPage() {
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getSupplierScorecards();
      setScorecards(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading scorecards...</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h1>Supplier Reliability Scorecard</h1>
      {scorecards.map((sc) => (
        <div key={sc.supplierName} style={styles.card}>
          <h3 className="mono">{sc.supplierId}</h3>
          <p style={{ ...styles.score, color: scoreColor(sc.reliabilityScore) }}>
            {sc.reliabilityScore}% reliable
          </p>
          <p>{sc.totalBatches} batch{sc.totalBatches !== 1 && 'es'} tracked, {sc.breachedBatches} with a breach</p>
        </div>
      ))}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 90) return '#16a34a'; // green
  if (score >= 70) return '#d97706'; // amber
  return '#b91c1c'; // red
}

const styles = {
  card: {
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  score: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    margin: '8px 0',
  },
};

export default ScorecardPage;