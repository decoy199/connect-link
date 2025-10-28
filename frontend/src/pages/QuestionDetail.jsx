// src/pages/QuestionDetail.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

// Format timestamp
const fmt = (s) => new Date(s).toLocaleString()

export default function QuestionDetail() {
  const { id } = useParams()
  const nav = useNavigate()

  const [q, setQ] = useState(null)
  const [answers, setA] = useState([])
  const [body, setBody] = useState('')
  const [likes, setLikes] = useState({})
  const [err, setErr] = useState('')
  const [sentOK, setSentOK] = useState(false)
  const [me, setMe] = useState(null)

  // Load question + answers
  const load = async () => {
    try {
      const rq = await api.get(`/questions/${id}`)
      setQ(rq.data)
      const ra = await api.get(`/questions/${id}/answers`)
      setA(ra.data)
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load question')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/me')
        // me is mainly used to decide if I can answer (assigned case)
        setMe(data.user || data)
      } catch {}
      await load()
    })()
  }, [id])

  // Can I answer?
  const canAnswer = (() => {
    if (!q || !me) return false
    // If the question has an assigned_answerer, only that user can answer.
    if (q.assigned_answerer) {
      return q.assigned_answerer.id === me.id
    }
    // Otherwise anyone can (the backend still enforces "1 answer per user")
    return true
  })()

  // Display "Asked by ..."
  const askedBy = (() => {
    if (!q || !q.author) return 'Anonymous'
    const fn = q.author.first_name?.trim()
    const ln = q.author.last_name?.trim()
    const full = `${fn || ''} ${ln || ''}`.trim()
    if (full) return full
    return q.author.username || 'Unknown user'
  })()

  const submit = async () => {
    try {
      if (!canAnswer) return
      const { data } = await api.post(`/questions/${id}/answers`, { body })
      setBody('')
      setSentOK(true)
      setTimeout(() => setSentOK(false), 2000)
      setA(prev => [data, ...prev])
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to send')
    }
  }

  const like = async (aid) => {
    try {
      await api.post(`/answers/${aid}/like`)
      setLikes(prev => ({
        ...prev,
        [aid]: (prev[aid] || 0) + 1
      }))
    } catch (_) {}
  }

  const markBest = async (aid) => {
    try {
      await api.post(`/answers/${aid}/mark-best`)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to mark best')
    }
  }

  // NOTE: This detail page keeps a simpler read-only answer list.
  // (The Dashboard card has the full inline edit/delete UI.)

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        onClick={() => nav(-1)}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>

      {err && (
        <div className="mt-3 text-sm text-red-600">{err}</div>
      )}

      {!q ? (
        <div className="mt-4">Loading…</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow mt-3">
          <div className="text-xl font-semibold">{q.title}</div>

          <div className="text-sm text-gray-500 mt-1">
            Asked by {askedBy} · {fmt(q.created_at)}
          </div>

          <div className="mt-3 whitespace-pre-wrap">{q.body}</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(q.tags || []).map((t, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full border"
              >
                #{t.name || t}
              </span>
            ))}

            {q.urgent && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-red-300 bg-red-50 text-red-700">
                URGENT
              </span>
            )}

            {q.assigned_answerer && (
              <span className="text-xs px-2 py-0.5 rounded-full border">
                Assigned: @{q.assigned_answerer.username}
              </span>
            )}
          </div>

          <div className="mt-6">
            <div className="font-semibold mb-2">Answers</div>
            {answers.length === 0 && (
              <div className="text-sm text-gray-500">
                No answers yet
              </div>
            )}

            <ul className="space-y-3">
              {answers.map(a => (
                <li key={a.id} className="border rounded p-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {a.body}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    by {a.author?.username || 'unknown'} ·{' '}
                    {fmt(a.created_at)} · Likes:{' '}
                    {likes[a.id] ?? a.like_count}
                  </div>

                  <div className="mt-2 flex gap-2 text-xs">
                    <button
                      onClick={() => like(a.id)}
                      className="px-2 py-1 rounded border hover:underline"
                    >
                      Like
                    </button>

                    <button
                      onClick={() => markBest(a.id)}
                      className="px-2 py-1 rounded border hover:underline"
                    >
                      Mark Best
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="font-semibold mb-2">Your answer</div>

            {!canAnswer && q.assigned_answerer ? (
              <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">
                Only <b>@{q.assigned_answerer.username}</b> can answer this
                question.
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 border p-2 rounded"
                    placeholder="Write your answer…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                  <button
                    onClick={submit}
                    className="bg-gray-800 text-white px-3 rounded"
                  >
                    Send
                  </button>
                </div>

                {sentOK && (
                  <div className="mt-2 text-sm rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2">
                    Thanks for your answer!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
