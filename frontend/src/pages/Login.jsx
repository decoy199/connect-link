import React, { useState } from 'react';
import api from '../api';
import { saveToken } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/login', { username, password });
      saveToken(data.token);
      nav('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldBase =
    'w-full rounded-xl border px-3.5 py-2.5 bg-white/90 shadow-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500';
  const labelBase = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 sm:p-7 rounded-2xl shadow-xl ring-1 ring-black/5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500">Please sign in to continue.</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          New here?{' '}
          <Link to="/signup" className="font-medium text-blue-700 underline-offset-2 hover:underline">
            Create account
          </Link>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
            </svg>
            <p>{err}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className={labelBase}>Username</label>
          <div className="relative">
            <input
              id="username"
              name="username"
              className={fieldBase + ' pr-10'}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-400">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 6v1h16v-1c0-4-4-6-8-6Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelBase}>Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              className={fieldBase + ' pr-12'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto inline-flex h-9 items-center rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-100"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 select-none">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Remember me
          </label>
          <div className="flex gap-4 text-sm">
            <Link to="/forgot-password" className="text-blue-700 underline-offset-2 hover:underline">Forgot password?</Link>
            <Link to="/forgot-username" className="text-blue-700 underline-offset-2 hover:underline">Forgot username?</Link>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting || !username || !password}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-500">
        By continuing, you agree to our Terms and Privacy Policy.
      </div>
    </div>
  );
}
