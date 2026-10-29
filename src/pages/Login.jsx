import { useEffect, useState } from 'react';
import { getIdentityOptions } from '../services/erpService';

function Login({ role, onComplete, onBack }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(role !== 'consumer');
  const [selected, setSelected] = useState('');
  const [manual, setManual] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (role === 'consumer') return;
    (async () => {
      const data = await getIdentityOptions();
      const ids = role === 'retailer' ? data.retailerIds : data.supplierIds;
      setOptions(ids || []);
      setLoading(false);
    })();
  }, [role]);

  const handleContinue = () => {
    if (role === 'consumer') {
      onComplete(name.trim() || 'guest');
      return;
    }
    const id = selected || manual.trim();
    if (!id) return;
    onComplete(id);
  };

  const roleLabel = role === 'retailer' ? 'retailer' : role === 'supplier' ? 'distributor' : 'consumer';
  const buttonLabel = role === 'consumer' ? 'Enter as consumer' : `Continue as ${roleLabel}`;
  const description = role === 'consumer'
    ? "No account needed — this just labels the session so the interface knows what to show you."
    : `Pick the ${roleLabel} identity you're operating as. This is a stand-in for a real login, scoped to this demo.`;

  return (
    <div className="page" style={{ maxWidth: '480px' }}>
      <button className="btn" onClick={onBack} style={{ marginBottom: '32px' }}>← Back</button>

      <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '16px' }}>
        {roleLabel === 'consumer' ? 'Consumer login' : `${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} login`}
      </h1>
      <p className="status-text" style={{ marginBottom: '24px' }}>{description}</p>

      {role === 'consumer' ? (
        <>
          <span className="field-label">Name (optional)</span>
          <input
            type="text"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How should we address you?"
            style={{ marginBottom: '20px' }}
          />
        </>
      ) : loading ? (
        <p className="status-text">Loading known identities...</p>
      ) : (
        <>
          <span className="field-label">I am {roleLabel}</span>
          <select
            className="select-input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ marginBottom: '12px' }}
          >
            <option value="">— choose one —</option>
            {options.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <p className="status-text" style={{ margin: '8px 0' }}>or enter one directly</p>
          <input
            type="text"
            className="text-input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={`e.g. ${role}-01`}
            style={{ marginBottom: '20px' }}
          />
        </>
      )}

      <button className="btn btn-primary" onClick={handleContinue} style={{ width: '100%' }}>
        {buttonLabel}
      </button>
    </div>
  );
}

export default Login;