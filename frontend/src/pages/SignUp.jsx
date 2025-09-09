import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api'; // Assuming existing axios instance

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    years_experience: '',
    avatar_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and Password are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password and confirmation do not match');
      return;
    }

    setSubmitting(true);
    try {
      const usernameFromEmail = (form.email.split('@')[0] || '').trim();
      const payload = {
        email: form.email.trim(),
        password: form.password,
        // Username can be omitted, but we send it explicitly (server also supports auto-generation when omitted)
        username: usernameFromEmail,
        department: form.department,
        position: form.position,
        years_experience: form.years_experience ? Number(form.years_experience) : 0,
        avatar_url: form.avatar_url
      };

      // No trailing slash: /auth/register
      const res = await api.post('/auth/register', payload);

      // --- Auto-login ---
      // Server also sets HttpOnly cookies; we additionally store tokens in localStorage for client use.
      const tokens = res?.data?.token || null;
      if (tokens && tokens.access) {
        try {
          localStorage.setItem('accessToken', tokens.access);
          localStorage.setItem('refreshToken', tokens.refresh || '');
        } catch (_) {
          // Even if localStorage fails, HttpOnly cookies still work.
        }
      }

      // Optionally add default Authorization header for axios
      if (tokens?.access) {
        api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      }

      // --- Navigate to Home ---
      navigate('/', { replace: true });
      // Or if you prefer a full reload:
      // window.location.replace('/');

    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'signup failed';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520, margin: '40px auto' }}>
      <h1>Sign Up</h1>
      {error ? (
        <div style={{ background: '#fee', border: '1px solid #f99', padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            style={{ width: '100%' }}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            style={{ width: '100%' }}
            autoComplete="new-password"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            required
            style={{ width: '100%' }}
            autoComplete="new-password"
          />
        </div>

        <hr style={{ margin: '16px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <label>Department</label>
          <input
            name="department"
            value={form.department}
            onChange={onChange}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Position</label>
          <input
            name="position"
            value={form.position}
            onChange={onChange}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Years of Experience</label>
          <input
            name="years_experience"
            type="number"
            min="0"
            value={form.years_experience}
            onChange={onChange}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Avatar URL</label>
          <input
            name="avatar_url"
            value={form.avatar_url}
            onChange={onChange}
            style={{ width: '100%' }}
          />
        </div>

        <button type="submit" disabled={submitting} style={{ padding: '10px 16px' }}>
          {submitting ? 'Signing up…' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;
