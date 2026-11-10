import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Fingerprint, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { webauthnApi } from '../../services/api';
import { startRegistration } from '@simplewebauthn/browser';
import { supportsBiometric, biometricErrorMessage } from '../../utils/webauthn';
import { isAppLockEnabled, setAppLockEnabled } from '../../utils/appLock';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Settings() {
  const { user } = useAuth();
  const [creds, setCreds] = useState([]);
  const [fpSupported, setFpSupported] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [appLock, setAppLock] = useState(isAppLockEnabled());

  const load = () => webauthnApi.list().then(r => setCreds(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); supportsBiometric().then(setFpSupported); }, []);

  const register = async () => {
    if (!window.isSecureContext) return toast.error('Fingerprint requires HTTPS or localhost');
    setRegistering(true);
    try {
      const { data } = await webauthnApi.registerOptions();
      const registration = await startRegistration({ optionsJSON: data.data });
      await webauthnApi.register({ ...registration, deviceName: navigator.platform || 'Device' });
      toast.success('Fingerprint registered! You can now sign in with fingerprint on the login page.');
      load();
    } catch (err) {
      toast.error(biometricErrorMessage(err, 'Fingerprint registration failed'));
    }
    finally { setRegistering(false); }
  };

  const remove = async (id) => { setPendingRemove(id); };

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-subtitle">Profile, preferences & security</p></div></div>
      <div className="grid lg:grid-cols-2 gap-5 max-w-5xl">
        <div className="card"><div className="card-header"><h3 className="font-extrabold tracking-tight">Profile</h3></div><div className="card-body space-y-3"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white grid place-items-center font-extrabold text-lg">{user?.name?.[0]?.toUpperCase() || 'A'}</div><div><p className="font-extrabold">{user?.name}</p><p className="text-sm text-slate-500">{user?.email}</p></div></div><div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-sm"><p><span className="text-slate-500">Currency:</span> <b>{user?.currency || 'INR'}</b></p><p><span className="text-slate-500">Role:</span> <b className="capitalize">{user?.role || 'admin'}</b></p></div></div></div>
        <div className="card"><div className="card-header"><h3 className="font-extrabold tracking-tight">Preferences</h3></div><div className="card-body space-y-4"><label className="flex items-center justify-between text-sm font-semibold">Dark theme <input type="checkbox" className="h-4 w-4 accent-violet-600" onChange={(e) => document.documentElement.classList.toggle('dark', e.target.checked)} /></label><label className="flex items-center justify-between text-sm font-semibold">Email alerts <input type="checkbox" className="h-4 w-4 accent-violet-600" /></label><p className="text-xs text-slate-500">Theme, notifications, currency — backed by Settings table.</p></div></div>
        <div className="card lg:col-span-2"><div className="card-header"><h3 className="font-extrabold tracking-tight">Security — Fingerprint / Face Unlock</h3></div><div className="card-body">
          {!fpSupported ? (
            <p className="text-sm text-slate-500">Fingerprint not available on this device. Password login will be used.</p>
          ) : (
            <>
              <p className="text-sm text-slate-500">Register your device fingerprint to sign in without password. Works with Windows Hello, Face ID, Touch ID and Android fingerprint.</p>
              <button className="btn-primary mt-4" disabled={registering} onClick={register}>{registering ? <Loader2 size={16} className="loader-spin" /> : <Fingerprint size={16} />} {registering ? 'Waiting for fingerprint…' : 'Register Fingerprint'}</button>
            </>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-4">
            {creds.map(c => <div key={c.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><Fingerprint size={18} className="text-violet-600" /><div><p className="font-bold text-sm">{c.deviceName}</p><p className="text-xs text-slate-400 font-mono">{String(c.credentialId).slice(0,12)}…</p></div></div><button className="icon-btn w-8 h-8 hover:!bg-red-50 hover:!text-red-600" onClick={() => remove(c.id)}><Trash2 size={14} /></button></div>)}
            {creds.length === 0 && <p className="text-sm text-slate-400 py-3">No fingerprint registered yet.</p>}
          </div>
          {creds.length > 0 && (
            <label className="mt-4 flex items-center justify-between text-sm font-semibold border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="flex items-center gap-2"><Fingerprint size={16} className="text-violet-600" /> Lock app on open (fingerprint)</span>
              <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={appLock} onChange={(e) => { setAppLock(e.target.checked); setAppLockEnabled(e.target.checked); }} />
            </label>
          )}
        </div></div>
      </div>
      <ConfirmModal open={!!pendingRemove} onClose={() => setPendingRemove(null)} onConfirm={async () => { await webauthnApi.remove(pendingRemove); toast.success('Removed'); setPendingRemove(null); load(); }} title="Remove Fingerprint" message="Are you sure you want to remove this fingerprint?" confirmText="Remove" />
    </div>
  );
}
