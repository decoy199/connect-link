// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';

// These lists are shared with SignUp so the UI stays consistent.
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

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // The raw profile data returned from /me
  const [profile, setProfile] = useState(null);

  // Form state for editing
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    years_experience: '',
    expertise_hashtags: '',
  });

  // Helper to map API /me response -> draft state
  function applyProfileToDraft(p) {
    // p.expertise is an array like [{id:1,name:'python'}, ...]
    const expertiseNames = Array.isArray(p.expertise)
      ? p.expertise.map(t => t.name)
      : [];

    return {
      first_name: p.user?.first_name || '',
      last_name: p.user?.last_name || '',
      department: p.department || '',
      position: p.position || '',
      years_experience: p.years_experience?.toString?.() || '',
      expertise_hashtags: expertiseNames.join(', '),
    };
  }

  // Load profile data from backend
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get('/me')
      .then((res) => {
        if (!mounted) return;
        const data = res.data;
        setProfile(data);
        setDraft(applyProfileToDraft(data));
        setLoading(false);
      })
      .catch((_ex) => {
        if (!mounted) return;
        setErr('Failed to load profile');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle changes while editing
  const onChange = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  // Save profile changes to backend
  const saveProfile = async () => {
    setSaving(true);
    setErr('');

    try {
      // Convert comma-separated string -> list of tag names
      const tags = draft.expertise_hashtags
        .split(',')
        .map((t) => t.trim().replace(/^#/, '')) // remove leading '#'
        .filter(Boolean);

      const payload = {
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
        department: draft.department,
        position: draft.position,
        years_experience: draft.years_experience
          ? Number(draft.years_experience)
          : 0,
        // backend /me PUT expects "expertise": ["python","react",...]
        expertise: tags,
      };

      // PUT /me updates both User and UserProfile
      const res = await api.put('/me', payload);

      // Update local state with fresh server response
      setProfile(res.data);
      setDraft(applyProfileToDraft(res.data));

      // Leave edit mode
      setEditMode(false);
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Loading / error UI
  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
        <div className="text-gray-500 text-sm">Loading profile…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
        <div className="text-red-600 text-sm">
          {err || 'No profile data'}
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const selectCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  // Build expertise display for read-only mode
  const expertiseDisplay = Array.isArray(profile.expertise)
    ? profile.expertise.map(t => t.name).join(', ')
    : '';

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow space-y-4">
      <h1 className="text-xl font-semibold">My Profile</h1>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {!editMode ? (
        <>
          <div className="text-sm">
            <div className="mb-2">
              <div className="text-gray-500">Name</div>
              <div className="font-medium">
                {(profile.user?.first_name || '') + ' ' + (profile.user?.last_name || '')}
              </div>
            </div>

            <div className="mb-2">
              <div className="text-gray-500">Department</div>
              <div className="font-medium">{profile.department || '-'}</div>
            </div>

            <div className="mb-2">
              <div className="text-gray-500">Position / Seniority</div>
              <div className="font-medium">{profile.position || '-'}</div>
            </div>

            <div className="mb-2">
              <div className="text-gray-500">Years of Experience</div>
              <div className="font-medium">
                {profile.years_experience ?? 0}
              </div>
            </div>

            <div className="mb-2">
              <div className="text-gray-500">Expertise Hashtags</div>
              <div className="font-medium text-xs break-words">
                {expertiseDisplay || '-'}
              </div>
            </div>
          </div>

          <button
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        </>
      ) : (
        <>
          <div className="space-y-4 text-sm">
            {/* First Name */}
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                First Name
              </label>
              <input
                className={inputCls}
                name="first_name"
                value={draft.first_name}
                onChange={onChange}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                Last Name
              </label>
              <input
                className={inputCls}
                name="last_name"
                value={draft.last_name}
                onChange={onChange}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                Department
              </label>
              <select
                className={selectCls}
                name="department"
                value={draft.department}
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

            {/* Position */}
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                Position / Seniority
              </label>
              <select
                className={selectCls}
                name="position"
                value={draft.position}
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
              <label className="block text-gray-600 text-xs mb-1">
                Years of Experience
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                name="years_experience"
                value={draft.years_experience}
                onChange={onChange}
              />
            </div>

            {/* Expertise Hashtags */}
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                Expertise Hashtags
              </label>
              <input
                className={inputCls}
                name="expertise_hashtags"
                placeholder="e.g. python, react, ml"
                value={draft.expertise_hashtags}
                onChange={onChange}
              />
              <div className="text-gray-500 text-[11px] mt-1">
                Separate multiple items with commas.
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
              onClick={saveProfile}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

            <button
              className="bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => {
                setEditMode(false);
                setErr('');
                // Reset draft back to what's in profile (discard unsaved edits)
                setDraft(applyProfileToDraft(profile));
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
