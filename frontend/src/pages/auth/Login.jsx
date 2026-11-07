import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck, Zap, Wallet, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { webauthnApi } from '../../services/api';
import { supportsBiometric, biometricErrorMessage } from '../../utils/webauthn';
import { useEffect } from 'react';
import logo from '../../logo/logo.png';

export default function Login() {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Asdf1234');
  const [loading, setLoading] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSupported, setFpSupported] = useState(false);
  const { login, setUser } = useAuth();
  useEffect(() => { supportsBiometric().then(setFpSupported); }, []);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/app/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  const fingerprintLogin = async () => {
    if (!window.isSecureContext) return toast.error('Fingerprint ke liye HTTPS ya localhost zaroori hai');
    setFpLoading(true);
    try {
      // Email khali ho to discoverable (passkey picker) flow — browser khud
      // registered fingerprint dikhayega. Email ho to backend allowCredentials dega.
      const hint = email?.trim().toLowerCase() || '';
      const { data } = await webauthnApi.loginOptions(hint || undefined);
      const assertion = await startAuthentication({ optionsJSON: data.data });
      const { data: res } = await webauthnApi.login(assertion);
      setUser(res.data.user);
      toast.success('Welcome back (fingerprint)!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(biometricErrorMessage(err, 'Fingerprint login failed. Pehle Settings me fingerprint register karo.'));
    }
    finally { setFpLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="hidden lg:flex relative flex-col justify-between p-12 text-white bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-900 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3"><img src={logo} alt="My Money Logo" className="w-10 h-10 rounded-2xl object-cover" /><p className="font-extrabold text-xl">My Money</p></div>
        <div className="relative"><h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">Control your money.<br />From anywhere.</h1><p className="mt-5 text-violet-200/90 max-w-md leading-relaxed">Multi-bank ledger, budgets, goals and premium reports — one centralized SaaS dashboard.</p>
        <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
          {[{ i: Wallet, t: 'Multi-Bank Ledger' }, { i: ShieldCheck, t: 'Secure & Encrypted' }, { i: Zap, t: 'Real-time Insights' }].map(x => <div key={x.t} className="rounded-2xl bg-white/10 backdrop-blur p-3 border border-white/10"><x.i size={18} /><p className="text-xs font-bold mt-2">{x.t}</p></div>)}
        </div></div>
        <p className="relative text-sm text-violet-300/80">SOC2-ready • Ledger-based • Built for India</p>
      </div>
      <div className="flex items-center justify-center p-6 bg-[#F8F7FC] dark:bg-slate-950">
        <form onSubmit={submit} className="card w-full max-w-md p-8 shadow-premium">
          <img src={logo} alt="My Money Logo" className="w-12 h-12 rounded-2xl object-cover mb-5 shadow-soft" />
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back</h2><p className="text-sm text-slate-500 mt-1 mb-7">Sign in to your My Money dashboard</p>
          <label className="block text-xs font-bold mb-1.5">Email Address <span className="text-red-500">*</span></label>
          <input type="email" className="input mb-4" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="block text-xs font-bold mb-1.5">Password <span className="text-red-500">*</span></label>
          <input type="password" className="input mb-6" value={password} onChange={e => setPassword(e.target.value)} required />
          <button disabled={loading} className="btn-primary w-full py-3">{loading ? 'Signing in...' : <span className="flex items-center gap-2">Sign in <ArrowRight size={16} /></span>}</button>
          {fpSupported && <button type="button" disabled={fpLoading} onClick={fingerprintLogin} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-violet-600 text-violet-700 dark:text-violet-300 font-bold text-sm hover:bg-violet-50 dark:hover:bg-violet-500/10 transition disabled:opacity-60"><Fingerprint size={18} /> {fpLoading ? 'Verifying...' : 'Sign in with Fingerprint'}</button>}
          <p className="text-sm text-slate-500 mt-5 text-center">New to My Money? <Link to="/register" className="font-bold text-violet-600 hover:underline">Create free account</Link></p>
        </form>
      </div>
    </div>
  );
}
