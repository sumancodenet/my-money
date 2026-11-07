// Fingerprint / passkey button tab dikhana hai ya nahi — sirf WebAuthn API
// ki maujoodgi check karo. Platform authenticator check ko button chhupane
// ke liye use mat karo: kuch browsers me wo API hoti hi nahi, phir bhi
// passkey (cloud / USB key) kaam kar sakta hai.
export const supportsBiometric = async () => {
  try {
    if (!window.isSecureContext) return false; // HTTPS ya localhost zaroori hai
    if (!navigator.credentials || typeof navigator.credentials.get !== 'function' || typeof navigator.credentials.create !== 'function') return false;
    if (typeof PublicKeyCredential === 'undefined') return false;
    return true;
  } catch { return false; }
};

// startRegistration / startAuthentication ke common errors ko user-friendly message do
export const biometricErrorMessage = (err, fallback) => {
  if (err?.name === 'NotAllowedError') return 'Fingerprint cancelled ya time khatam ho gaya. Dobara try karo.';
  if (err?.name === 'InvalidStateError') return 'Ye fingerprint is device par pehle se registered hai. Settings se purana remove karke dobara try karo.';
  if (err?.name === 'NotSupportedError') return 'Is browser/device par fingerprint supported nahi hai.';
  if (err?.name === 'SecurityError') return 'Fingerprint ke liye HTTPS ya localhost zaroori hai.';
  return err?.response?.data?.message || err?.message || fallback;
};
