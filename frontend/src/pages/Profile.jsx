import React, { useEffect, useState } from 'react'
import api from '../api'

function Toast({ show, children }) {
  if (!show) return null
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="rounded-md border border-green-200 bg-green-50 text-green-700 shadow px-4 py-2">
        {children}
      </div>
    </div>
  )
}

export default function Profile() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    bio: '',
    hobbies: '',
    years_experience: 0,
    avatar_url: '',
    expertise: '' // comma-separated for editing
  })
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/me')
        const u = data?.user ?? data // user ネスト or トップレベル どちらでも対応
  
        setForm({
          first_name: u?.first_name ?? u?.firstName ?? '',
          last_name:  u?.last_name  ?? u?.lastName  ?? '',
          department: data?.department ?? u?.department ?? '',
          position:   data?.position   ?? u?.position   ?? '',
          bio:        data?.bio        ?? u?.bio        ?? '',
          hobbies:    data?.hobbies    ?? u?.hobbies    ?? '',
          years_experience: Number(data?.years_experience ?? u?.years_experience ?? 0),
          avatar_url: data?.avatar_url ?? u?.avatar_url ?? '',
          expertise:  (data?.expertise ?? u?.expertise ?? [])
                        .map(t => (typeof t === 'string' ? t : t?.name))
                        .filter(Boolean)
                        .join(', ')
        })
        setErr('')
      } catch (e) {
        setErr(e?.response?.data?.detail || 'Failed to load profile')
      }
    }
    load()
  }, [])
  

  const body = {
    firstName: form.first_name,
    lastName: form.last_name,
    department: form.department,
    position: form.position,
    bio: form.bio,
    hobbies: form.hobbies,
    yearsExperience: Number(form.years_experience || 0),
    avatarUrl: form.avatar_url,
    expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
  }
  

  const save = async () => {
    try {
      const body = {
        first_name: form.first_name,
        last_name: form.last_name,
        department: form.department,
        position: form.position,
        bio: form.bio,
        hobbies: form.hobbies,
        years_experience: Number(form.years_experience || 0),
        avatar_url: form.avatar_url,
        expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
      }
      await api.put('/me', body)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
      setErr('')
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to update')
    }
  }

  const on = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }))

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Toast show={saved}>Updated</Toast>

      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <h1 className="text-xl font-semibold">My Profile</h1>

        {err && <div className="text-sm rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">{err}</div>}

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">First name</label>
            <input className="w-full border rounded p-2" value={form.first_name} onChange={on('first_name')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Last name</label>
            <input className="w-full border rounded p-2" value={form.last_name} onChange={on('last_name')} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Department</label>
            <input className="w-full border rounded p-2" value={form.department} onChange={on('department')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Position</label>
            <input className="w-full border rounded p-2" value={form.position} onChange={on('position')} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Bio</label>
            <textarea className="w-full border rounded p-2" rows="3" value={form.bio} onChange={on('bio')} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Hobbies</label>
            <input className="w-full border rounded p-2" value={form.hobbies} onChange={on('hobbies')} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Years of Experience</label>
            <input type="number" className="w-full border rounded p-2" value={form.years_experience} onChange={on('years_experience')} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Avatar URL</label>
            <input className="w-full border rounded p-2" value={form.avatar_url} onChange={on('avatar_url')} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Expertise Hashtags (comma separated)</label>
            <input className="w-full border rounded p-2" placeholder="Python, ProjectManagement, MarketingAnalytics" value={form.expertise} onChange={on('expertise')} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          {form.avatar_url && <img src={form.avatar_url} className="w-10 h-10 rounded-full border" alt="avatar preview" />}
        </div>
      </div>
    </div>
  )
}
