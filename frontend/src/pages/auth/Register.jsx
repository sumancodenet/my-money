import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import logo from '../../logo/logo.png';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      await login(email, password);
      toast.success('Account created!');
      navigate('/app/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="hidden lg:flex relative flex-col justify-between p-12 text-white bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-900 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl" />
        <Link to="/" className="relative flex items-center gap-3"><img src={logo} alt="My Money Logo" className="w-10 h-10 rounded-2xl object-cover" /><p className="font-extrabold text-xl">My Money</p></Link>
        <div className="relative"><h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">Start managing<br />money smarter.</h1><p className="mt-5 text-violet-200/90 max-w-md leading-relaxed">Create your free account and add banks, income, expenses in seconds.</p></div>
        <p className="relative text-sm text-violet-300/80">Free forever • No card required</p>
      </div>
      <div className="flex items-center justify-center p-6 bg-[#F8F7FC] dark:bg-slate-950">
        <form onSubmit={submit} className="card w-full max-w-md p-8 shadow-premium">
          <img src={logo} alt="My Money Logo" className="w-12 h-12 rounded-2xl object-cover mb-5 shadow-soft" />
          <h2 className="text-2xl font-extrabold tracking-tight">Create account</h2><p className="text-sm text-slate-500 mt-1 mb-7">Get started with My Money — it is free</p>
          <label className="block text-xs font-bold mb-1.5">Full Name <span className="text-red-500">*</span></label>
          <input className="input mb-4" placeholder="Ex: Rohan Kumar" value={name} onChange={e => setName(e.target.value)} required />
          <label className="block text-xs font-bold mb-1.5">Email Address <span className="text-red-500">*</span></label>
          <input type="email" className="input mb-4" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="block text-xs font-bold mb-1.5">Password <span className="text-red-500">*</span></label>
          <input type="password" className="input mb-6" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
          <button disabled={loading} className="btn-primary w-full py-3">{loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="loader-spin" /> Creating…</span> : <span className="flex items-center justify-center gap-2">Create Account <ArrowRight size={16} /></span>}</button>
          <p className="text-sm text-slate-500 mt-5 text-center">Already have an account? <Link to="/login" className="font-bold text-violet-600 hover:underline">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
