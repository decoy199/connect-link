import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'

const fmt = (s) => new Date(s).toLocaleString()

// ----- helpers -----
function useQueryParam(name) {
  const { search } = useLocation()
  return new URLSearchParams(search).get(name) || ''
}

// normalize a tag coming from API (might be string or {id,name})
function tagText(tag) {
  if (typeof tag === 'string') return tag
  if (tag && typeof tag === 'object') {
    if (typeof tag.name === 'string') return tag.name
    try { return JSON.stringify(tag) } catch { return String(tag) }
  }
  return String(tag ?? '')
}

function Pill({ children }) {
  // children might be a string or an object  -> coerce to readable text
  const text = typeof children === 'string' ? children : tagText(children)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border">
      {text}
    </span>
  )
}

function AskModal({ open, onClose, person, onCreated }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const disabled = !title.trim() || submitting

  useEffect(() => {
    if (open) {
      setTitle('')
      setBody('')
      setTags('')
    }
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    try {
      const payload = {
        recipient_id: person.id,
        title: title.trim(),
        body: body.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
      }
      const { data } = await api.post('/direct-questions', payload)
      onCreated?.(data)
      onClose()
      alert('Your direct question was sent successfully.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Ask {person?.name || person?.username} privately</h3>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, descriptive question title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Details (optional)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[120px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add context, constraints, examples…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated: e.g. #python, #frontend"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-lg border">
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-lg text-white ${
                disabled ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Sending…' : 'Send privately'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ----- main page -----
export default function Search() {
  const q = useQueryParam('q')
  const [people, setPeople] = useState([])
  const [questions, setQuestions] = useState([])
  const [err, setErr] = useState('')
  const [modalFor, setModalFor] = useState(null)

  const filters = useMemo(() => {
    const tags = Array.from(q.matchAll(/#([\w-]+)/g)).map((m) => m[1])
    const ats = Array.from(q.matchAll(/@([\w.-]+)/g)).map((m) => m[1])
    const cleaned = q
      .replace(/#[\w-]+/g, ' ')
      .replace(/@[\w.-]+/g, ' ')
      .trim()
    const words = cleaned ? cleaned.split(/\s+/) : []
    return { tags, ats, words }
  }, [q])

  useEffect(() => {
    let cancel = false
    async function run() {
      try {
        const { data } = await api.get('/search', { params: { q } })
        if (!cancel) {
          setPeople(data.people || [])
          setQuestions(data.questions || [])
        }
      } catch (e) {
        if (!cancel) setErr(e.response?.data?.detail || 'Failed to search')
      }
    }
    if (q) run()
    return () => { cancel = true }
  }, [q])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-2">Search results</h1>
      <div className="text-sm text-gray-600 mb-4">
        Filters:&nbsp;
        {filters.tags.map((t) => (
          <Pill key={`t-${t}`}>#{t}</Pill>
        ))}{' '}
        {filters.ats.map((a) => (
          <Pill key={`a-${a}`}>@{a}</Pill>
        ))}{' '}
        {filters.words.map((w) => (
          <Pill key={`w-${w}`}>{w}</Pill>
        ))}
      </div>

      {err && <div className="text-red-600 text-sm mb-4">{err}</div>}

      <div className="grid md:grid-cols-3 gap-6">
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
                  <img
                    src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || p.username)}`}
                    alt=""
                    className="w-10 h-10 rounded-full border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name || p.username}</div>
                    <div className="text-xs text-gray-500 truncate">
                      @{p.username} · {p.department} · {p.years_experience} yrs
                    </div>
                  </div>
                  <button
                    className="text-sm px-2.5 py-1.5 rounded-lg border hover:bg-gray-50"
                    onClick={() => setModalFor(p)}
                    title={`Ask ${p.name || p.username} privately`}
                  >
                    Ask privately
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Public Questions (clickable rows) */}
        <div className="md:col-span-2">
          <div className="border rounded-xl">
            <div className="p-3 border-b">
              <h2 className="font-medium">Public questions</h2>
            </div>
            {questions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No matching questions</div>
            ) : (
              <ul className="divide-y">
                {questions.map((qi) => (
                  <li key={qi.id} className="p-0">
                    <Link
                      to={`/questions/${qi.id}`}
                      className="block p-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{qi.title}</div>
                          {qi.body && <div className="text-xs text-gray-500 truncate">{qi.body}</div>}

                          {/* Tags: support strings or {id,name} objects */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(qi.tags || []).map((t, idx) => {
                              const name = tagText(t)
                              return <Pill key={`${qi.id}-tag-${name}-${idx}`}>#{name}</Pill>
                            })}
                          </div>
                        </div>

                        {/* Hide poster's name per requirement; show only time */}
                        <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                          <div className="italic text-gray-400">Asked</div>
                          <div>{qi.created_at ? fmt(qi.created_at) : ''}</div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <AskModal
        open={!!modalFor}
        person={modalFor}
        onClose={() => setModalFor(null)}
        onCreated={() => {}}
      />
    </div>
  )
}
