import { useEffect, useRef, useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { webauthnApi } from '../../services/api';
import { startAuthentication } from '@simplewebauthn/browser';
import { supportsBiometric, biometricErrorMessage } from '../../utils/webauthn';
import { isAppLockEnabled, setAppLockEnabled, isUnlocked, setUnlocked, clearUnlock } from '../../utils/appLock';
import logo from '../../logo/logo.png';

export { isAppLockEnabled, setAppLockEnabled, clearUnlock };

export default function AppLock({ children }) {
  const { user, setUser, logout } = useAuth();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(isAppLockEnabled());
  const [unlocked, setUnlockedState] = useState(isUnlocked());
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState([]);
  const unlockingRef = useRef(false);
  const [credsLoaded, setCredsLoaded] = useState(false);

  useEffect(() => { supportsBiometric().then(setSupported); }, []);
  useEffect(() => {
    if (!user) return;
    webauthnApi.list().then(r => { setCreds(r.data.data || []); setCredsLoaded(true); }).catch(() => setCredsLoaded(true));
  }, [user]);

  // If no registered creds, disable lock (only after load, to avoid race)
  useEffect(() => {
    if (credsLoaded && creds.length === 0 && enabled) {
      setAppLockEnabled(false);
      setEnabled(false);
      setUnlocked();
      setUnlockedState(true);
    }
  }, [creds, credsLoaded, enabled]);

  const unlock = async (silent = false) => {
    if (unlockingRef.current) return;
    if (!user?.email) return;
    if (credsLoaded && creds.length === 0) {
      toast.error('No fingerprint registered on this device. Register one in Settings.');
      setAppLockEnabled(false);
      setEnabled(false);
      setUnlocked();
      setUnlockedState(true);
      return;
    }
    unlockingRef.current = true;
    setLoading(true);
    try {
      const { data } = await webauthnApi.loginOptions(user.email);
      const assertion = await startAuthentication({ optionsJSON: data.data });
      const { data: res } = await webauthnApi.login(assertion);
      setUser(res.data.user);
      setUnlocked();
      setUnlockedState(true);
      toast.success('Unlocked');
    } catch (err) {
      if (!silent) toast.error(biometricErrorMessage(err, 'Fingerprint unlock failed.'));
    } finally {
      unlockingRef.current = false;
      setLoading(false);
    }
  };

  // Auto-trigger once when locked
  useEffect(() => {
    if (!enabled || unlocked || !supported || !user) return;
    const t = setTimeout(() => { unlock(true); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, unlocked, supported, user]);

  if (!enabled || unlocked || !user) return children;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <img src={logo} alt="My Money" className="w-16 h-16 rounded-2xl object-cover mb-6 shadow-soft" />
      <h2 className="text-2xl font-extrabold tracking-tight mb-2">App Locked</h2>
      <p className="text-sm text-slate-500 mb-8 text-center max-w-xs">Verify your fingerprint to unlock My Money.</p>
      <button disabled={loading} onClick={unlock} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-base shadow-premium disabled:opacity-60 transition">
        {loading ? <Loader2 size={20} className="loader-spin" /> : <Fingerprint size={20} />}
        {loading ? 'Verifying…' : 'Unlock with Fingerprint'}
      </button>
      <p className="mt-6 text-xs text-slate-400">Or <button onClick={logout} className="text-violet-600 font-bold hover:underline">sign out</button> and sign in again.</p>
    </div>
  );
}
