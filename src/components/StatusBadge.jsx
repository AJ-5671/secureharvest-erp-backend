// Maps known backend status strings to a badge color. Centralized here so
// every table (inventory, orders) uses the same colors for the same words —
// "pending" always means amber, everywhere, not a different shade per page.
const STATUS_COLORS = {
  in_stock: 'green',
  fulfilled: 'green',

  low_stock: 'amber',
  pending: 'amber',

  out_of_stock: 'red',
  cancelled: 'red',
};

function StatusBadge({ status }) {
  if (!status) return null;
  const color = STATUS_COLORS[status] || 'gray';
  const label = status.replace(/_/g, ' ');

  return <span className={`badge badge-${color}`}>{label}</span>;
}

export default StatusBadge;