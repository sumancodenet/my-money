// Whether the app is running as an installed PWA (standalone)
export const isStandalone = () => {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return true;
    // iOS Safari
    if (navigator.standalone === true) return true;
    return false;
  } catch { return false; }
};

// Whether to show the fingerprint / passkey button — only check WebAuthn API
// availability. Do not use platform authenticator checks to hide the button:
// some browsers lack that API entirely, yet passkeys (cloud / USB keys) still work.
export const supportsBiometric = async () => {
  try {
    if (!window.isSecureContext) return false; // HTTPS or localhost required
    if (!navigator.credentials || typeof navigator.credentials.get !== 'function' || typeof navigator.credentials.create !== 'function') return false;
    if (typeof PublicKeyCredential === 'undefined') return false;
    return true;
  } catch { return false; }
};

// User-friendly messages for common startRegistration / startAuthentication errors
export const biometricErrorMessage = (err, fallback) => {
  if (err?.name === 'NotAllowedError') return 'Fingerprint cancelled or timed out. Please try again.';
  if (err?.name === 'InvalidStateError') return 'This fingerprint is already registered on this device. Remove the old one from Settings and try again.';
  if (err?.name === 'NotSupportedError') return 'Fingerprint is not supported on this browser/device.';
  if (err?.name === 'SecurityError') return 'Fingerprint requires HTTPS or localhost.';
  return err?.response?.data?.message || err?.message || fallback;
};
