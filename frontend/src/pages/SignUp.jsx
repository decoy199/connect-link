// src/pages/SignUp.jsx
import React, { useMemo, useState } from 'react';
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

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Derived state
  const tags = useMemo(
    () =>
      form.expertise_hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [form.expertise_hashtags]
  );

  const passwordOk = form.password && form.password === form.confirmPassword;

  const passwordStrength = useMemo(() => {
    const p = form.password || '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 4); // 0..4
  }, [form.password]);

  const strengthLabel = ['Weak', 'Somewhat weak', 'Average', 'Somewhat strong', 'Strong'][passwordStrength];

  // Handlers
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        department: form.department,
        position: form.position,
        years_experience: form.years_experience ? Number(form.years_experience) : 0,
        expertise_hashtags: tags,
      };

      const res = await api.post('/register', payload);

      const tokens = res?.data?.token;
      if (tokens?.access) {
        localStorage.setItem('token', tokens.access);
        api.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
      }

      navigate('/faq', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const fieldBase =
    'w-full rounded-xl border px-3.5 py-2.5 bg-white/90 shadow-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500';
  const labelBase = 'block text-sm font-medium text-gray-700 mb-1.5';
  const selectBase = fieldBase + ' bg-white';

  return (　
　　<div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-md">
              {/* Simple logo glyph */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 4a6 6 0 0 1 6 6h-2a4 4 0 1 0-4 4v2a6 6 0 1 1 0-12Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-500">Let’s get you set up in a minute.</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-700 underline-offset-2 hover:underline">
              Log in
            </Link>
          </div>
        </div>

        {/* Card */}
        <div className="grid grid-cols-1 gap-6 rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur sm:p-8 lg:grid-cols-5">
          {/* Left: form */}
          <form onSubmit={submit} className="space-y-5 lg:col-span-3">
            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5">
                    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
                  </svg>
                  <p>{err}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelBase}>Email</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={fieldBase + ' pr-10'}
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-400">
                    <path d="M20 4H4a2 2 0 0 0-2 2v1l10 6 10-6V6a2 2 0 0 0-2-2Zm0 5.236-8 4.8-8-4.8V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* First / Last name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className={labelBase}>First Name</label>
                <input id="first_name" name="first_name" className={fieldBase} value={form.first_name} onChange={onChange} />
              </div>
              <div>
                <label htmlFor="last_name" className={labelBase}>Last Name</label>
                <input id="last_name" name="last_name" className={fieldBase} value={form.last_name} onChange={onChange} />
              </div>
            </div>

            {/* Password / Confirm Password */}
            <div>
              <label htmlFor="password" className={labelBase}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className={fieldBase + ' pr-12'}
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                  aria-describedby="password-help password-strength"
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
              {/* Strength meter */}
              <div id="password-strength" className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      ['w-1/12 bg-red-400','w-3/12 bg-orange-400','w-6/12 bg-amber-400','w-9/12 bg-lime-500','w-full bg-green-500'][passwordStrength]
                    }`}
                  />
                </div>
                <p id="password-help" className="mt-1 text-xs text-gray-500">
  We recommend 8+ characters with a mix of uppercase, lowercase, numbers, and symbols (current: {strengthLabel}).
</p>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelBase}>Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  className={`${fieldBase} pr-12 ${form.confirmPassword && !passwordOk ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : ''}`}
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-9 items-center rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-100"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {!passwordOk && form.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <hr className="my-2" />

            {/* Department (dropdown) */}
            <div>
              <label htmlFor="department" className={labelBase}>Department</label>
              <select id="department" name="department" className={selectBase} value={form.department} onChange={onChange} required>
                <option value="">Select your department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Position / seniority (dropdown) */}
            <div>
              <label htmlFor="position" className={labelBase}>Position / Seniority</label>
              <select id="position" name="position" className={selectBase} value={form.position} onChange={onChange} required>
                <option value="">Select your position level</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Years of Experience */}
            <div>
              <label htmlFor="years_experience" className={labelBase}>Years of Experience</label>
              <input
                id="years_experience"
                name="years_experience"
                type="number"
                min="0"
                className={fieldBase}
                value={form.years_experience}
                onChange={onChange}
                inputMode="numeric"
              />
            </div>

            {/* Expertise Hashtags */}
            <div>
              <label htmlFor="expertise_hashtags" className={labelBase}>Expertise Hashtags</label>
              <input
                id="expertise_hashtags"
                name="expertise_hashtags"
                placeholder="e.g. python, react, ml"
                className={fieldBase}
                value={form.expertise_hashtags}
                onChange={onChange}
              />
              <p className="mt-1 text-xs text-gray-500">Separate multiple items with commas.</p>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-3 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Signing up…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Right: highlights */}
          <aside className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5 lg:col-span-2">            <h2 className="text-base font-semibold text-gray-900">Why join?</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'Collaborate with your team seamlessly',
                'Personalised onboarding and helpful FAQ',
                'Track your expertise with hashtags',
                'Secure, token-based authentication',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5 text-blue-600">
                    <path d="m10 15 9-9 1.5 1.5L10 18 3.5 11.5 5 10z" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-white p-4 shadow-inner ring-1 ring-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Need help?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Questions about setting up your account? Visit our{' '}
                <Link to="/faq" className="font-medium text-blue-700 underline-offset-2 hover:underline">FAQ</Link>.
              </p>
            </div>
            <p className="text-xs text-gray-500">By signing up, you agree to our Terms and Privacy Policy.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
