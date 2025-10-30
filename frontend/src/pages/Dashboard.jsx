// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import QuizPopup from '../components/QuizPopup'

// Format timestamp for display
const fmt = (s) => new Date(s).toLocaleString()

// Within the last 30 minutes?
const within30m = (iso) =>
  (Date.now() - new Date(iso).getTime()) <= 30 * 60 * 1000

function Toast({ show, children }) {
  if (!show) return null
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 shadow px-4 py-2">
        {children}
      </div>
    </div>
  )
}

/** Track my posted question ids locally (defense-in-depth). */
const MY_Q_IDS_KEY = 'my_q_ids'
const keyFor = (username) => `${MY_Q_IDS_KEY}:${username || 'unknown'}`
function getMyQuestionIds(username) {
  try {
    const raw = localStorage.getItem(MY_Q_IDS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
function addMyQuestionId(id,username) {
  if (!id) return
  const arr = getMyQuestionIds()
  if (!arr.includes(id)) {
    arr.push(id)
    try { localStorage.setItem(MY_Q_IDS_KEY, JSON.stringify(arr)) } catch {}
  }
}

// Helper to build querystring
function qs(params) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export default function Dashboard() {
  const [questions, setQ] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [postAnonymous, setPostAnonymous] = useState(true)

  const [suggest, setSuggest] = useState([])
  const [me, setMe] = useState(null)
  const [postedInfo, setPostedInfo] = useState('')

  // NEW: department filter state
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [loadingDepts, setLoadingDepts] = useState(false)

  const suggestTimer = useRef(null)

  // Load departments once
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoadingDepts(true)
      try {
        const { data } = await api.get('/departments')
        if (!cancelled) setDepartments(data?.items || [])
      } catch {
        if (!cancelled) setDepartments([])
      } finally {
        if (!cancelled) setLoadingDepts(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  // Load questions (obeys department filter)
  const load = async () => {
    const { data } = await api.get('/questions' + qs({
      department: selectedDept || undefined,
    }))
    setQ(data)
  }
  useEffect(() => { load() }, [selectedDept])

  // Load my profile
  useEffect(() => {
    api.get('/me').then(r => {
      setMe(r.data)
      try { localStorage.removeItem(MY_Q_IDS_KEY) } catch {}
    })
  }, [])

  // Post a new question
  const post = async () => {
    const tagArr = tags.split(',')
      .map(s => s.trim())
      .filter(Boolean)

    try {
      const { data } = await api.post('/questions', {
        title,
        body,
        tags: tagArr,
        urgent,
        anonymous: postAnonymous,
      })
      const createdId = data?.id ?? data?.question?.id
      if (createdId) addMyQuestionId(createdId, me?.user?.username)

    } finally {
      setTitle('')
      setBody('')
      setTags('')
      setUrgent(false)
      setPostAnonymous(true)
      setSuggest([])
      load()

      if (urgent) {
        setPostedInfo('Notifications were sent to users with matching tags.')
        setTimeout(() => setPostedInfo(''), 4000)
      }
    }
  }

  // Debounced suggestions
  const onTitleChange = (v) => {
    setTitle(v)
    const t = v.trim()
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (!t) { setSuggest([]); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/questions/suggest', { params: { title: t } })
        setSuggest(data || [])
      } catch {
        setSuggest([])
      }
    }, 200)
  }
  useEffect(() => () => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
  }, [])

  const onDeleted = () => load()
  const hasDeptFilter = useMemo(() => selectedDept.trim().length > 0, [selectedDept])

  return (
    <div className="max-w-6xl mx-auto p-4">
      <QuizPopup />

      <Toast show={!!postedInfo}>{postedInfo}</Toast>

      {/* Department filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="dept" className="text-sm font-medium">Filter by department</label>
        <select
          id="dept"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loadingDepts}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {hasDeptFilter && (
          <span className="text-xs text-gray-600">Showing posts from <b>{selectedDept}</b></span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* LEFT / MAIN COLUMN */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold text-lg mb-2">Ask a Question</h2>

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Title"
              value={title}
              onChange={e => onTitleChange(e.target.value)}
            />

            {suggest.length > 0 && (
              <div className="text-xs text-gray-600 mb-2">
                Similar:{' '}
                {suggest.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => window.location.assign(`/questions/${s.id}`)}
                    className="mr-2 text-blue-600 hover:underline"
                  >
                    #{s.title}
                  </button>
                ))}
              </div>
            )}

            <textarea
              className="w-full border p-2 rounded mb-2"
              rows="3"
              placeholder="Body"
              value={body}
              onChange={e => setBody(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="tags (comma separated, e.g. Python, Django)"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />

            <div className="flex flex-col gap-2 text-sm mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={postAnonymous}
                  onChange={e => setPostAnonymous(e.target.checked)}
                />
                <span>Post anonymously (hide my name)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={e => setUrgent(e.target.checked)}
                />
                <span>Urgent</span>
              </label>
            </div>

            <button
              onClick={post}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Post
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {questions.map(q => (
              <QuestionCard
                key={q.id}
                q={q}
                meUsername={me?.user?.username}
                meUserId={me?.user?.id}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          <PointsWidget />
          <Leaderboard />
          <Notifications />
        </div>
      </div>
    </div>
  )
}

function QuestionCard({ q, meUsername, meUserId, onDeleted }) {
  const [answers, setA] = React.useState([])
  const [body, setBody] = React.useState('')
  const [likes, setLikes] = React.useState({})
  const [sentOK, setSentOK] = React.useState(false)
  const [editingId, setEditingId] = React.useState(null)
  const [editText, setEditText] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState('')
  const nav = useNavigate()

  // Display author name (author is null when anonymous)
  const authorName = (() => {
    if (!q.author) return 'Anonymous'
    const fn = q.author.first_name?.trim()
    const ln = q.author.last_name?.trim()
    const full = `${fn || ''} ${ln || ''}`.trim()
    if (full) return full
    return q.author.username || 'Unknown user'
  })()

  // Load answers for this question
  const load = async () => {
    const { data } = await api.get(`/questions/${q.id}/answers`)
    setA(data)
  }
  useEffect(() => { load() }, [])

  // Assignment guard
  const assigned = q.assigned_answerer || null
  const isAssignedGuardActive = !!assigned && !!meUsername && assigned.username !== meUsername
  const assignedLabel = assigned ? `Assigned: @${assigned.username}` : null

  // Server says if this question is mine. Fallback: localStorage.
  const localMine = (() => {
    try {
      return getMyQuestionIds(meUsername).includes(q.id)

    } catch { return false }
  })()
  const isOwnerQ = !!(q.mine || localMine)

  // Disable answering when guard is active or when it's my own question
  const isAnswerDisabled = isAssignedGuardActive || isOwnerQ

  const submit = async () => {
    setErrorMsg('')

    if (isOwnerQ) {
      setErrorMsg("You can't answer your own question.")
      return
    }
    if (isAssignedGuardActive) {
      setErrorMsg(`Only @${assigned.username} can answer this question.`)
      return
    }

    try {
      await api.post(`/questions/${q.id}/answers`, { body })
      setBody('')
      await load()
      setSentOK(true)
      setTimeout(() => setSentOK(false), 2000)
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to send'
      setErrorMsg(msg)
    }
  }

  // Like an answer
  const like = async (aid) => {
    try {
      const { data } = await api.post(`/answers/${aid}/like`)
      setLikes(s => ({ ...s, [aid]: data.like_count }))
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to like')
    }
  }

  // Mark best answer (only owner)
  const markBest = async (aid) => {
    try {
      await api.post(`/answers/${aid}/mark-best`)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to mark best')
    }
  }

  // Edit answer flow
  const startEdit = (a) => {
    setEditingId(a.id)
    setEditText(a.body)
  }
  const saveEdit = async () => {
    try {
      await api.put(`/answers/${editingId}`, { body: editText })
      setEditingId(null); setEditText(''); load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update')
    }
  }
  const cancelEdit = () => { setEditingId(null); setEditText('') }

  // Delete answer
  const removeAnswer = async (aid) => {
    if (!confirm('Are you sure you want to delete this answer?')) return
    try {
      await api.delete(`/answers/${aid}`)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete')
    }
  }

  // Delete question (owner-only, and only within 30 minutes)
  const canDeleteQ = isOwnerQ && within30m(q.created_at)
  const removeQuestion = async () => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    try {
      await api.delete(`/questions/${q.id}`)
      onDeleted?.()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete question')
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {q.urgent && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
              URGENT
            </span>
          )}
          {assignedLabel && (
            <span className="text-xs px-2 py-0.5 rounded border">
              {assignedLabel}
            </span>
          )}
          <button
            className="font-semibold text-lg hover:underline text-left"
            onClick={() => nav(`/questions/${q.id}`)}
          >
            {q.title}
          </button>
        </div>

        {canDeleteQ && (
          <button
            onClick={removeQuestion}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
        <span>Posted: {fmt(q.created_at)}</span>
        <span>•</span>
        <span>By {authorName}</span>
      </div>

      <div className="text-gray-600 text-sm my-2 whitespace-pre-wrap">
        {q.body}
      </div>

      <div className="text-xs text-gray-500 mb-2">
        {q.tags.map(t => (
          <span key={t.id || t.name} className="mr-2">
            #{t.name || t}
          </span>
        ))}
      </div>

      {/* Answers list */}
      <div className="space-y-2">
        {answers.map(a => {
          const isMine = meUsername && a.author && a.author.username === meUsername
          const canEditDel = isMine && within30m(a.created_at)
          const likeCount = likes[a.id] ?? a.like_count
          return (
            <div
              key={a.id}
              className={`border rounded p-2 ${
                q.best_answer_id === a.id
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {editingId === a.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full border rounded p-2"
                    rows="3"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={saveEdit}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="border px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm whitespace-pre-wrap">{a.body}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Answered: {fmt(a.created_at)}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3 mt-1 items-center">
                    <button
                      onClick={() => like(a.id)}
                      className="hover:underline"
                    >
                      Like ({likeCount})
                    </button>
                    <button
                      onClick={() => markBest(a.id)}
                      className="hover:underline"
                    >
                      Mark Best
                    </button>
                    {canEditDel && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => startEdit(a)}
                          className="hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeAnswer(a.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Guards */}
      {isAssignedGuardActive && (
        <div className="mt-2 text-sm rounded bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2">
          Only <b>@{assigned.username}</b> can answer this question.
        </div>
      )}
      {isOwnerQ && (
        <div className="mt-2 text-sm rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2">
          You can't answer your own question.
        </div>
      )}

      {/* Answer input */}
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 border p-2 rounded disabled:bg-gray-100"
          placeholder="Write an answer..."
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={isAnswerDisabled}
        />
        <button
          onClick={submit}
          className={`px-3 rounded text-white ${
            isAnswerDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800'
          }`}
          disabled={isAnswerDisabled}
        >
          Send
        </button>
      </div>

      {errorMsg && (
        <div className="mt-2 text-sm rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2">
          {errorMsg}
        </div>
      )}

      {sentOK && (
        <div className="mt-2 text-sm rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2">
          Thanks for your answer!
        </div>
      )}
    </div>
  )
}

function PointsWidget() {
  const [bal, setBal] = useState(0)
  const [amt, setAmt] = useState('')
  const [qr, setQR] = useState(null)

  useEffect(() => {
    api.get('/points/balance').then(r => setBal(r.data.points_balance))
  }, [])

  const redeem = async () => {
    const { data } = await api.post('/points/redeem', {
      points: Number(amt),
    })
    setQR(data.qr_data_url)
    api.get('/points/balance').then(r => setBal(r.data.points_balance))
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4">
      <div className="font-semibold mb-2">My Points</div>
      <div className="text-3xl font-bold">{bal}</div>
      <div className="mt-3 flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Points to use"
          value={amt}
          onChange={e => setAmt(e.target.value)}
        />
        <button
          onClick={redeem}
          className="bg-green-600 text-white px-3 rounded"
        >
          Redeem
        </button>
      </div>
      {qr && (
        <img
          src={qr}
          className="mt-3 w-full rounded"
          alt="redeem qr"
        />
      )}
    </div>
  )
}

function Leaderboard() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/leaderboard').then(r => setRows(r.data))
  }, [])

  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4">
      <div className="font-semibold mb-2">Department Leaderboard</div>
      <ul className="text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex justify-between py-1">
            <span>{i + 1}. {r.department}</span>
            <span className="font-semibold">{r.points}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Notifications() {
  const [rows, setRows] = useState([])

  const [onlyUrgentWithTags, setOnlyUrgentWithTags] = useState(false)
  const [onlyPrivateAssigned, setOnlyPrivateAssigned] = useState(false)

  const nav = useNavigate()

  const load = async () => {
    const r = await api.get('/notifications')
    setRows(r.data)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read')
      load()
    } catch (e) {
      if (e?.response?.status === 404) {
        try {
          await api.post('/notifications_read')
          load()
        } catch {
          /* ignore */
        }
      }
    }
  }

  const filtered = rows.filter(n => {
    const msg = String(n.message || '')
    const isUrgent = msg.startsWith('URGENT:')
    const isAssigned = msg.startsWith('You were assigned')
    if (onlyUrgentWithTags && !isUrgent) return false
    if (onlyPrivateAssigned && !isAssigned) return false
    return true
  })

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Notifications</div>
        <button
          onClick={markAllRead}
          className="text-xs text-blue-600 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm mb-3">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyUrgentWithTags}
            onChange={e => setOnlyUrgentWithTags(e.target.checked)}
          />
          Urgent + related hashtags
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyPrivateAssigned}
            onChange={e => setOnlyPrivateAssigned(e.target.checked)}
          />
          Private/assigned only
        </label>
      </div>

      <ul className="text-sm space-y-2">
        {filtered.map(n => (
          <li
            key={n.id}
            className={`border rounded p-2 ${n.read ? 'bg-white' : 'bg-blue-50'} cursor-pointer hover:bg-blue-100`}
            onClick={() => { if (n.question_id) nav(`/questions/${n.question_id}`) }}
            title={n.question_id ? 'Open question' : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div>{n.message}</div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {String(n.message || '').startsWith('You were assigned') && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border">private</span>
                  )}
                  {String(n.message || '').startsWith('URGENT:') && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-red-300 bg-red-50 text-red-700">urgent</span>
                  )}
                  {n.question_id && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border">question #{n.question_id}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-[11px] text-gray-500">{fmt(n.created_at)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
