import React, { useState } from 'react'
import api from '../api'
import { saveToken } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function SignUp(){
  const [form, setForm] = useState({ username:'', email:'', password:'', department:'', years_experience:0 })
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const update = (k,v)=> setForm(f=>({...f,[k]:v}))
  const submit = async (e)=>{
    e.preventDefault()
    try{
      const { data } = await api.post('/register', form)
      saveToken(data.token)
      nav('/dashboard')
    }catch(e){ setErr(e.response?.data?.detail || 'Sign up failed') }
  }
  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Username" onChange={e=>update('username', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Email" onChange={e=>update('email', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" onChange={e=>update('password', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Department" onChange={e=>update('department', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Years of Experience" type="number" onChange={e=>update('years_experience', e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Create Account</button>
      </form>
    </div>
  )
}
