function ReceiptPanel({ receipt, history, onDismiss, onPreview }) {
  return (
    <div className="crate-card" style={{ borderStyle: 'dashed', marginBottom: '24px' }}>
      <div className="crate-card-inner">
        <div className="crate-header">
          <h3 className="crate-title" style={{ fontSize: '1.1rem' }}>Receipt</h3>
          <button className="btn" onClick={onDismiss}>Dismiss</button>
        </div>
        <p className="score-value" style={{ margin: '4px 0' }}>#{receipt.batchId}</p>
        <p className="status-text">Batch / lot number — hand this to the customer</p>
        <p style={{ marginTop: '12px' }}>
          {receipt.productName} · {receipt.quantitySold} {receipt.unit}
        </p>
        <p className="mono status-text">
          {receipt.receiptNo} · {new Date(receipt.time).toLocaleString()}
        </p>
        <button className="btn" style={{ marginTop: '12px' }} onClick={onPreview}>
          Preview what the consumer will see
        </button>

        {history.length > 0 && (
          <table className="manifest-table" style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Product</th>
                <th>Qty sold</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s, i) => (
                <tr key={i}>
                  <td className="mono">#{s.batchId}</td>
                  <td>{s.productName}</td>
                  <td>{s.quantitySold} {s.unit}</td>
                  <td>{new Date(s.time).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ReceiptPanel;