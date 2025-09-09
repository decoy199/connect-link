// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    years_experience: '',
    expertise_hashtags: '', // comma-separated: "python, react, ml"
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (form.password !== form.confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const tags = form.expertise_hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        department: form.department.trim(),
        position: form.position.trim(),
        years_experience: form.years_experience
          ? Number(form.years_experience)
          : 0,
        expertise_hashtags: tags,
      };

      const res = await api.post('/register', payload);

      // Auto-login on success (align with app’s getToken() which reads "token")
      const tokens = res?.data?.token;
      if (tokens?.access) {
        localStorage.setItem('token', tokens.access);
        api.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
      }

      // Go to home page (change to '/dashboard' if that’s your home)
      navigate('/', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-6">Sign Up</h1>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={inputCls}
            value={form.email}
            onChange={onChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-1"
            >
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              className={inputCls}
              value={form.first_name}
              onChange={onChange}
            />
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium mb-1"
            >
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              className={inputCls}
              value={form.last_name}
              onChange={onChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={inputCls}
            value={form.password}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={inputCls}
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
        </div>

        <hr className="my-2" />

        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium mb-1"
          >
            Department
          </label>
          <input
            id="department"
            name="department"
            className={inputCls}
            value={form.department}
            onChange={onChange}
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium mb-1">
            Position
          </label>
          <input
            id="position"
            name="position"
            className={inputCls}
            value={form.position}
            onChange={onChange}
          />
        </div>

        <div>
          <label
            htmlFor="years_experience"
            className="block text-sm font-medium mb-1"
          >
            Years of Experience
          </label>
          <input
            id="years_experience"
            name="years_experience"
            type="number"
            min="0"
            className={inputCls}
            value={form.years_experience}
            onChange={onChange}
          />
        </div>

        <div>
          <label
            htmlFor="expertise_hashtags"
            className="block text-sm font-medium mb-1"
          >
            Expertise Hashtags
          </label>
          <input
            id="expertise_hashtags"
            name="expertise_hashtags"
            placeholder="e.g., python, react, ml"
            className={inputCls}
            value={form.expertise_hashtags}
            onChange={onChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple items with commas.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Signing up…' : 'Sign Up'}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
