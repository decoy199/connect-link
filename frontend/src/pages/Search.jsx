import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const fmt = (s) => new Date(s).toLocaleString()

function useQueryParam(name) {
  const { search } = useLocation()
  return new URLSearchParams(search).get(name) || ''
}

// normalized tag text (may come as string or object)
function tagText(tag) {
  if (!tag) return ''
  if (typeof tag === 'string') return tag.replace(/^#/, '')
  if (typeof tag === 'object' && tag.name) return String(tag.name)
  return String(tag).replace(/^#/, '')
}

function Pill({ children }) {
  const text = typeof children === 'string' ? children : tagText(children)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border">
      {text.startsWith('#') ? text : `#${text}`}
    </span>
  )
}

/** Small modal to show a person's profile (from search data) */
function ProfileModal({ open, onClose, person }) {
  if (!open || !person) return null
  const name = person.name || person.username
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-4 shadow">
        <div className="flex items-start gap-3">
          <img
            src={person.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
            className="w-14 h-14 rounded-full border"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg truncate">{name}</div>
            <div className="text-sm text-gray-600 truncate">@{person.username}</div>
            <div className="text-sm text-gray-600 mt-1 truncate">
              {person.department} · {person.years_experience} yrs experience
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
    </div>
  )
}

/** Ask Privately (now: creates a PUBLIC question assigned to a recipient) */
function AskModal({ open, onClose, person, onCreated }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const disabled = !title.trim() || submitting

  useEffect(() => {
    if (open) {
      setTitle('')
      setBody('')
      setTags('')
      setUrgent(false)
    }
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    try {
      const tagList = tags
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/^#/, ''))

      const payload = {
        title: title.trim(),
        body: body.trim(),
        tags: tagList,
        urgent,
        recipient_id: person?.id, // key change
      }
      const { data } = await api.post('/questions', payload)
      onCreated?.(data)
      onClose()
      alert('Your question was posted publicly and assigned to the selected recipient.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to post.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-xl p-4 shadow">
        <div className="mb-3">
          <div className="text-sm text-gray-500">Ask privately (publicly visible, assigned to)</div>
          <div className="font-semibold">{person?.name || person?.username}</div>
          <div className="text-xs text-gray-500">@{person?.username}</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of your question"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Details</label>
            <textarea
              className="w-full h-28 border rounded-lg px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add more context (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated: e.g. #python, #frontend"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={urgent} onChange={(e)=>setUrgent(e.target.checked)} />
            Mark as urgent
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-lg border">
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-lg text-white ${disabled ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Search() {
  const q = useQueryParam('q')
  const [people, setPeople] = useState([])
  const [questions, setQuestions] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [modalFor, setModalFor] = useState(null)
  const [profileFor, setProfileFor] = useState(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      if (!q.trim()) {
        setPeople([])
        setQuestions([])
        setTotalResults(0)
        return
      }

      try {
        setLoading(true)
        setErr('')
        const { data } = await api.get('/search', { params: { q } })
        if (!cancel) {
          setPeople(data.people || [])
          setQuestions(data.questions || [])
          setTotalResults(data.total_results || 0)
        }
      } catch (e) {
        if (!cancel) setErr(e.message || 'Search failed')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [q])

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Search</h1>
        {q && (
          <p className="text-gray-600">
            {loading ? 'Searching...' : `Found ${totalResults} results for "${q}"`}
          </p>
        )}
      </div>

      {err && <ErrorMessage error={err} onDismiss={() => setErr('')} className="mb-4" />}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: People */}
          <div className="md:col-span-1">
            <div className="border rounded-xl">
              <div className="p-3 border-b">
                <h2 className="font-medium">People</h2>
              </div>
              <div className="divide-y">
                {people.length === 0 && <div className="p-3 text-sm text-gray-500">No matching people</div>}
                {people.map((p) => (
                  <div key={p.id} className="p-3 flex items-center gap-3">
                    <button className="flex items-center gap-3 text-left min-w-0"
                            onClick={() => setProfileFor(p)}
                            title="Open profile">
                      <img
                        src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || p.username)}`}
                        alt=""
                        className="w-10 h-10 rounded-full border"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name || p.username}</div>
                        <div className="text-xs text-gray-500 truncate">
                          @{p.username} · {p.department} · {p.years_experience} yrs
                        </div>
                      </div>
                    </button>
                    <button
                      className="text-sm px-2.5 py-1.5 rounded-lg border hover:bg-gray-50"
                      onClick={() => setModalFor(p)}
                      title={`Ask ${p.name || p.username} privately (public question assigned to them)`}
                    >
                      Ask privately
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Public Questions */}
          <div className="md:col-span-2">
            <div className="border rounded-xl">
              <div className="p-3 border-b">
                <h2 className="font-medium">Public Questions</h2>
              </div>
              <ul className="divide-y">
                {questions.length === 0 && <li className="p-3 text-sm text-gray-500">No questions</li>}
                {questions.map((qi) => (
                  <li key={qi.id}>
                    <Link to={`/questions/${qi.id}`} className="block p-3 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{qi.title}</div>
                          <div className="text-xs text-gray-500">{fmt(qi.created_at)}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(qi.tags || []).map((t, idx) => {
                              const name = tagText(t)
                              return <Pill key={`${qi.id}-tag-${name}-${idx}`}>#{name}</Pill>
                            })}
                            {qi.assigned_answerer && (
                              <span className="text-xs ml-2 px-2 py-0.5 rounded-full border">
                                Assigned: @{qi.assigned_answerer.username}
                              </span>
                            )}
                            {qi.urgent && (
                              <span className="text-xs ml-2 px-2 py-0.5 rounded-full border border-red-300 bg-red-50 text-red-700">
                                URGENT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <AskModal
        open={!!modalFor}
        person={modalFor}
        onClose={() => setModalFor(null)}
        onCreated={() => {}}
      />

      <ProfileModal
        open={!!profileFor}
        person={profileFor}
        onClose={() => setProfileFor(null)}
      />
    </div>
  )
}