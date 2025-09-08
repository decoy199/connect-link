import { useState } from 'react'
import api from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await api.post('/forgot-password', { email })
      setSent(true)
    } catch (e) {
      setErr('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Forgot your password?</h1>
      {sent ? (
        <p>Check your email for a reset link (in dev, see server logs).</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            className="w-full border rounded p-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button className="w-full bg-black text-white rounded p-2">Send reset link</button>
        </form>
      )}
    </div>
  )
}
