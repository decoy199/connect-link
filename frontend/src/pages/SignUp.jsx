// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

// You can adjust these lists as needed for your company
const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'HR / People',
  'Operations',
  'Sales',
  'Marketing',
  'Finance',
  'Other',
];

const POSITIONS = [
  'Intern',
  'Junior',
  'Mid-level',
  'Senior',
  'Lead',
  'Manager',
  'Director',
  'VP / Executive',
  'Other',
];

export default function SignUp() {
  const navigate = useNavigate();

  // Form state for all signup fields
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    years_experience: '',
    expertise_hashtags: '', // comma-separated string: "python, react, ml"
  });

  // UI state for submit-in-progress and error feedback
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Generic change handler for text inputs
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Handle signup submit
  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    // Basic client-side validation
    if (form.password !== form.confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    if (!form.department) {
      setErr('Please select a department');
      return;
    }

    if (!form.position) {
      setErr('Please select a position/seniority');
      return;
    }

    setSubmitting(true);
    try {
      // Convert comma-separated "expertise_hashtags" into an array of clean tags
      const tags = form.expertise_hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Payload structure we send to the backend
      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        department: form.department, // now comes from dropdown
        position: form.position,     // now comes from dropdown
        years_experience: form.years_experience
          ? Number(form.years_experience)
          : 0,
        expertise_hashtags: tags,
      };

      // Call backend register endpoint
      // NOTE: keep '/register' if the backend expects that exact route
      const res = await api.post('/register', payload);

      // Auto-login behavior:
      // If your backend returns tokens on signup, store them so the user is "logged in"
      // Adjust this depending on your actual backend response shape.
      const tokens = res?.data?.token;
      if (tokens?.access) {
        localStorage.setItem('token', tokens.access);
        api.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
      }

      // After SIGNUP ONLY -> redirect to FAQ (onboarding / how-to-use page)
      navigate('/faq', { replace: true });
    } catch (ex) {
      // Show backend-provided error if present
      setErr(ex.response?.data?.detail || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const selectCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-6">Sign Up</h1>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      <form onSubmit={submit} className="space-y-4">
        {/* Email */}
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

        {/* First / Last name */}
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

        {/* Password / Confirm Password */}
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

        {/* Department (dropdown) */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium mb-1"
          >
            Department
          </label>
          <select
            id="department"
            name="department"
            className={selectCls}
            value={form.department}
            onChange={onChange}
            required
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Position / seniority (dropdown) */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium mb-1">
            Position / Seniority
          </label>
          <select
            id="position"
            name="position"
            className={selectCls}
            value={form.position}
            onChange={onChange}
            required
          >
            <option value="">Select your position level</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Years of Experience */}
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

        {/* Expertise Hashtags */}
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
            placeholder="e.g. python, react, ml"
            className={inputCls}
            value={form.expertise_hashtags}
            onChange={onChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple items with commas.
          </p>
        </div>

        {/* Submit button */}
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
