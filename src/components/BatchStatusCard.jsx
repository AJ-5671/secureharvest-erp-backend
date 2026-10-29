function BatchStatusCard({ batch }) {
  if (!batch) return null;

  return (
    <div className="crate-card">
      <div className="crate-card-inner">
        <div className="crate-header">
          <h2 className="crate-title">Batch #{batch.batchId}</h2>
          {batch.hasBreach ? (
            <div className="stamp hazard" data-label="⚠ BREACH FLAGGED ⚠">
              <span className="stamp-icon">⚠</span>
            </div>
          ) : (
            <div className="stamp verified" data-label="✓ CHAIN VERIFIED ✓">
              <span className="stamp-icon">✓</span>
            </div>
          )}
        </div>
        <div className="crate-row">
          <span className="crate-row-label">Farmer</span>
          <span className="crate-row-value">{batch.farmer}</span>
        </div>
        <div className="crate-row">
          <span className="crate-row-label">Created</span>
          <span className="crate-row-value">
            {new Date(batch.createdAt * 1000).toLocaleString()}
          </span>
        </div>
        <div className="crate-row">
          <span className="crate-row-label">Status</span>
          <span className="crate-row-value">{batch.closed ? 'Closed' : 'Open'}</span>
        </div>
        <div className="crate-row">
          <span className="crate-row-label">Readings recorded</span>
          <span className="crate-row-value">{batch.readingCount}</span>
        </div>
      </div>
    </div>
  );
}

export default BatchStatusCard;