import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function ResetPassword() {
  const [sp] = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const nav = useNavigate()

  const uid = sp.get('uid') || ''
  const token = sp.get('token') || ''

  useEffect(() => {
    if (!uid || !token) setErr('Invalid or missing reset link.')
  }, [uid, token])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (newPassword !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    try {
      await api.post('/reset-password', { uid, token, new_password: newPassword })
      setOk(true)
      setTimeout(() => nav('/login'), 1200)
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Unable to reset password.'
      setErr(msg)
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
      {ok ? (
        <p>Password updated! Redirecting…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            className="w-full border rounded p-2"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full border rounded p-2"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button className="w-full bg-black text-white rounded p-2">Reset password</button>
        </form>
      )}
    </div>
  )
}
