import React, { useState } from 'react'
import api from '../api'
import { saveToken } from '../auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const { data } = await api.post('/login', { username, password })
      saveToken(data.token)
      nav('/dashboard')
    }catch(e){
      setErr(e.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-custom-gradient flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={username}
          onChange={e=>setU(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setP(e.target.value)}
        />
        <button className="w-full bg-custom-gradient text-white py-2 rounded hover:opacity-90 transition-opacity">Login</button>

        {/* added */}
        <div className="flex justify-between text-sm mt-2">
          <Link to="/forgot-password" className="underline">Forgot password?</Link>
          <Link to="/forgot-username" className="underline">Forgot username?</Link>
        </div>
      </form>
      </div>
    </div>
  )
}
