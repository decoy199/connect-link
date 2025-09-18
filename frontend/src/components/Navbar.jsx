import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout, isAuthed } from '../auth'
import api from '../api'

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium block w-full text-left ${active ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'}`}
    >
      {children}
    </Link>
  )
}

export default function Navbar({ profile }) {
  const [notes, setNotes] = useState([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef(null)
  const nav = useNavigate()
  const authed = isAuthed()

  const loadNotes = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotes(data || [])
    } catch (_) {}
  }

  useEffect(() => {
    if (authed) {
      loadNotes()
      const id = setInterval(loadNotes, 10000)
      return () => clearInterval(id)
    }
  }, [authed])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  const unreadCount = notes.filter((n) => !n.read).length

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read')
      loadNotes()
    } catch (_) {}
  }

  const clickNote = async (n) => {
    if (n.question_id) {
      try { await api.post('/notifications/read', { ids: [n.id] }) } catch (_){}
      nav(`/questions/${n.question_id}`)
      setOpen(false)
    }
  }

  const doSearch = () => {
    const q = query.trim()
    if (!q) return
    nav(`/search?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') doSearch()
  }

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <nav className="fixed left-0 top-0 h-screen w-60 bg-[#8B4513] text-white z-50 shadow-lg flex flex-col sidebar overflow-hidden">
      <div className="px-3 w-full">
        {/* 3-area grid with intrinsic sizing:
            left = auto, center = 1fr, right = auto */}
        <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
          {/* LEFT: Brand + links (scrollable if overflow) */}
          <div className="flex flex-col items-start min-w-0 w-full">
            <span className="text-xl font-bold text-white whitespace-nowrap shrink-0">HandRaise</span>
            <div
              className="flex flex-col gap-1 mt-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {authed ? (
                <>
                  <NavLink to="/dashboard">Question Dashboard</NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                  <NavLink to="/points">Points &amp; Rewards</NavLink>
                  <NavLink to="/faq">FAQ</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/signup">Sign Up</NavLink>
                </>
              )}
            </div>
          </div>

          {/* CENTER: Search (stays centered; won’t be pushed by left/right) */}
          <div className="w-full min-w-0">
            {authed && (
              <div className="flex items-center border rounded-md px-2 py-1 w-full max-w-full">
                <input
                  type="text"
                  id="global-search"
                  aria-label="Global search"
                  placeholder="Search: keywords, #tags, @username, or names…"
                  className="outline-none text-sm flex-1 h-9 text-gray-900 placeholder:text-gray-500 caret-gray-700 bg-white"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button
                  onClick={doSearch}
                  className="ml-2 text-white/90 hover:text-white"
                  title="Search"
                  aria-label="Run search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Notifications + avatar + logout */}
          <div className="flex flex-col items-start gap-3 mt-auto w-full">
            {authed && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen((o) => !o)}
                    className="relative p-2 rounded-full hover:bg-white/10"
                    title="Notifications"
                    aria-label="Open notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.172V11a6 6 0 1 0-12 0v3.172a2 2 0 0 1-.6 1.428L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-4 px-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg p-2">
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="text-sm font-semibold">Notifications</div>
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {notes.length === 0 ? (
                          <div className="text-xs text-gray-500 px-2 py-3">No notifications</div>
                        ) : notes.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => clickNote(n)}
                            className={`w-full text-left px-2 py-2 text-sm rounded ${n.read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'}`}
                          >
                            <div>{n.message}</div>
                            <div className="text-[11px] text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" title="My Profile" className="flex items-center">
                  <img
                    src={profile?.avatar_url || 'https://ui-avatars.com/api/?name=U'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border"
                  />
                </Link>
                <button onClick={handleLogout} className="text-xs text-white/80 hover:text-white block">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
