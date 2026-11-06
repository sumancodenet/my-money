export const supportsBiometric = async () => {
  try {
    if (!window.isSecureContext) return false;
    if (!navigator.credentials || typeof navigator.credentials.get !== 'function') return false;
    if (typeof PublicKeyCredential !== 'undefined' && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) return true;
    }
    // Fallback: conditional mediation support means passkey capable
    if (typeof PublicKeyCredential !== 'undefined' && PublicKeyCredential.isConditionalMediationAvailable) {
      return await PublicKeyCredential.isConditionalMediationAvailable();
    }
    // Generic WebAuthn support (external key may exist) — let user try
    return true;
  } catch { return false; }
};
