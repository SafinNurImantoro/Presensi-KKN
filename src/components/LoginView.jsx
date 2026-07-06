import React, { useState } from 'react';
import { AlertCircle, LockKeyhole, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import LogoSendiri from '../assets/logo.png';
import BgGambar from '../assets/tim.jpeg';

export default function LoginView() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
    } catch (signInError) {
      console.error('Login gagal:', signInError);
      setError('Email atau kata sandi tidak valid.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-accent px-4 py-10 flex items-center justify-center">
      <section className="neo-card bg-brand-surface w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-7">
          <div className="mx-auto w-14 h-14 rounded-2xl border-2 border-brand-accent bg-brand-pink flex items-center justify-center mb-4">
            <img 
              src={LogoSendiri} 
              alt="Logo POSKO KKN" 
              className="w-full h-full object-contain p-1" 
            />
          </div>
          <h1 className="text-3xl font-black">Login POSKO KKN</h1>
          <p className="text-sm font-semibold text-brand-accent/65 mt-2">
            Masuk menggunakan akun anggota yang diberikan koordinator.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl border-2 border-red-500 bg-red-100 text-red-700 font-bold text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-extrabold uppercase mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="neo-input w-full pl-10"
                placeholder="nama@kkn.local"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-extrabold uppercase mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="neo-input w-full pl-10"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="neo-btn neo-btn-accent w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={18} />
            {submitting ? 'Memeriksa akun...' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  );
}
