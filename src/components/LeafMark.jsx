function LeafMark({ size = 22, color = '#2B4632' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40C8 22 22 8 40 8C40 26 26 40 8 40Z" stroke={color} strokeWidth="2.4" fill="none" />
      <path d="M8 40C16 32 24 24 40 8" stroke={color} strokeWidth="2.4" />
    </svg>
  );
}

export default LeafMark;