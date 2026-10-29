import { useEffect, useState } from 'react';
import { getIdentityOptions } from '../services/erpService';

/**
 * "I am retailer/supplier: [dropdown]" — simulates identity without real
 * auth. `role` picks which id list to show ('retailer' or 'supplier').
 * Calls onChange(selectedId) whenever the selection changes, including
 * once automatically after the options load (so the parent always has
 * a valid starting selection instead of an empty string).
 */
function IdentitySelector({ role, value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getIdentityOptions();
      const ids = role === 'retailer' ? data.retailerIds : data.supplierIds;
      setOptions(ids || []);
      setLoading(false);
      if (ids && ids.length > 0 && !value) {
        onChange(ids[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (loading) return <p className="status-text">Loading identities...</p>;

  return (
    <div style={{ marginBottom: '24px' }}>
      <span className="field-label">I am {role}</span>
      <select
        className="select-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ maxWidth: '260px' }}
      >
        {options.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}

export default IdentitySelector;