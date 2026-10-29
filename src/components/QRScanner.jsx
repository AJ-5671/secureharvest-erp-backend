import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function QRScanner({ onScan, onClose }) {
  // A ref, not state, because this holds the scanner *instance* itself —
  // we need to call .clear() on it later, not re-render when it changes.
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', // must match the id of a div below
      { fps: 10, qrbox: 250 },
      false // verbose logging off
    );

    scanner.render(
      (decodedText) => {
        // Success callback — decodedText is whatever the QR code encodes.
        // Per our QR payload format, this will just be the batchId as a string.
        onScan(decodedText);
        scanner.clear(); // stop the camera once we have a result
      },
      (error) => {
        // Fires continuously while no QR code is in frame — not a real error,
        // so we deliberately don't log or surface it.
      }
    );

    scannerRef.current = scanner;

    // Cleanup: stop the camera if this component unmounts (e.g. user closes
    // the scanner) before a scan succeeds. Without this, the camera stays on.
    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '400px' }}></div>
      <button onClick={onClose} style={{ marginTop: '8px' }}>
        Cancel scan
      </button>
    </div>
  );
}

export default QRScanner;