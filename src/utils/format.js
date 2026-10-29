export function fmtAddr(a) {
  if (!a) return '—';
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function fmtHash(h) {
  if (!h) return '—';
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

export function fmtTimestamp(tsSeconds) {
  const n = Number(tsSeconds);
  if (!Number.isFinite(n) || n < 946684800) {
    return 'Unavailable (early test data)';
  }
  return new Date(n * 1000).toLocaleString(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}