function Landing({ onSelectRole }) {
  return (
    <div className="page" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <p className="eyebrow">SecureHarvest</p>
        <h1 className="page-title">The field-to-shelf record, held by no one.</h1>
      </div>
      <p className="status-text" style={{ marginBottom: '32px' }}>
        Every temperature and humidity reading is anchored on-chain the moment it's taken.
        Nobody can edit yesterday's record — including us.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="crate-card">
          <div className="crate-card-inner">
            <p className="eyebrow">for shoppers</p>
            <h3 className="crate-title" style={{ fontSize: '1.2rem' }}>Consumer</h3>
            <p className="status-text" style={{ minHeight: '54px' }}>
              Look up any batch and see its full, untouched cold-chain history — plus supplier reliability.
            </p>
            <button className="btn btn-primary" onClick={() => onSelectRole('consumer')}>
              Continue as consumer
            </button>
          </div>
        </div>

        <div className="crate-card">
          <div className="crate-card-inner">
            <p className="eyebrow">for shops &amp; stores</p>
            <h3 className="crate-title" style={{ fontSize: '1.2rem' }}>Retailer</h3>
            <p className="status-text" style={{ minHeight: '54px' }}>
              Track your shelves, sell and restock against real batches, and reorder from suppliers.
            </p>
            <button className="btn btn-primary" onClick={() => onSelectRole('retailer')}>
              Continue as retailer
            </button>
          </div>
        </div>

        <div className="crate-card">
          <div className="crate-card-inner">
            <p className="eyebrow">for farms &amp; distributors</p>
            <h3 className="crate-title" style={{ fontSize: '1.2rem' }}>Distributor</h3>
            <p className="status-text" style={{ minHeight: '54px' }}>
              Review incoming orders and accept them to mint a new tracked batch under a farmer's address.
            </p>
            <button className="btn btn-primary" onClick={() => onSelectRole('supplier')}>
              Continue as distributor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;