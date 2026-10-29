import { useEffect, useState } from 'react';

/**
 * Shows a normal "Loading..." message immediately, then upgrades to a
 * cold-start explanation if loading is still happening after a few seconds —
 * so a fast load never shows unnecessary text, but a slow Render wake-up
 * doesn't look broken/frozen.
 */
function LoadingMessage({ text = 'Loading...' }) {
  const [showColdStartHint, setShowColdStartHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowColdStartHint(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="status-text">
      {text}
      {showColdStartHint && (
        <span style={{ display: 'block', marginTop: '4px' }}>
          The server may be waking up from idle — this can take up to a minute
          on the first request.
        </span>
      )}
    </p>
  );
}

export default LoadingMessage;