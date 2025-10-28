import React, { useState } from 'react';
import api from '../api';
import { saveToken } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  // Local state for form inputs and error message
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');

  // React Router navigation hook
  const nav = useNavigate();

  // Handle form submit (login request)
  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      // Call the backend login endpoint
      // NOTE: keep '/login' if your backend is expecting that exact path.
      const { data } = await api.post('/login', { username, password });

      // Save auth token (JWT etc.) using your existing helper
      // Assumes backend returns something like { token: "<jwt>" }
      saveToken(data.token);

      // After successful sign-in, go to dashboard (NOT FAQ)
      nav('/dashboard');
    } catch (e) {
      // Show backend error if available, otherwise generic
      setErr(e.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setU(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>

        {/* Helpful links for account recovery */}
        <div className="flex justify-between text-sm mt-2">
          <Link to="/forgot-password" className="underline">
            Forgot password?
          </Link>
          <Link to="/forgot-username" className="underline">
            Forgot username?
          </Link>
        </div>
      </form>
    </div>
  );
}
