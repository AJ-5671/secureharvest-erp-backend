import { useEffect, useState } from 'react';
import { getBreachEvents } from '../services/contractService';

function BreachAlert({ batchId }) {
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      setLoading(true);
      const events = await getBreachEvents(batchId);
      if (isCurrent) {
        setBreaches(events);
        setLoading(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [batchId]);

  if (loading) return <p className="status-text">Checking breach history...</p>;
  if (breaches.length === 0) return null;

  return (
    <div className="breach-box">
      <h4 className="breach-heading">Breach Details</h4>
      {breaches.map((b, i) => (
        <div key={i} className="breach-entry">
          <p>
            <strong>{b.breachType}</strong> — recorded {b.temperature}°C /{' '}
            {b.humidity}% humidity
          </p>
          <p className="status-text">
            Thresholds: {b.tempThreshold}°C / {b.humidityThreshold}% humidity
          </p>
          <p className="breach-timestamp">
            {new Date(b.timestamp * 1000).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default BreachAlert;