import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout, isAuthed } from '../auth'
import api from '../api'

const NavLink = ({to, children}) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to} className={
      `px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
    }>{children}</Link>
  )
}

export default function Navbar({ profile }){
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

  useEffect(()=>{
    if (authed) {
      loadNotes()
      const id = setInterval(loadNotes, 10000)
      return ()=>clearInterval(id)
    }
  }, [authed])

  useEffect(()=>{
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return ()=>document.removeEventListener('click', onClickOutside)
  }, [])

  const unreadCount = notes.filter(n=>!n.read).length

  const markAllRead = async () => {
    try{
      await api.post('/notifications/read')
      loadNotes()
    }catch(_){}
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
    if (e.key === 'Enter') {
      doSearch()
    }
  }

  // ★ Add this: clear token then redirect to /login
  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-700">ConnectLink</span>
            <div className="hidden md:flex gap-2 ml-6">
              {authed && (
                <>
                  <NavLink to="/dashboard">Question Dashboard</NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                  <NavLink to="/points">Points & Rewards</NavLink>
                  <NavLink to="/faq">FAQ</NavLink>
                </>
              )}
              {!authed && (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/signup">Sign Up</NavLink>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {authed && (
              <>
                <div className="flex items-center border rounded-md px-2 py-1">
                  <input
                    type="text"
                    placeholder="#Search hashtag or keyword"
                    className="outline-none text-sm"
                    id="global-search"
                    value={query}
                    onChange={(e)=>setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                  />
                  <button
                    onClick={doSearch}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                    title="Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"></line>
                    </svg>
                  </button>
                </div>

                {/* Notifications */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={()=>setOpen(o=>!o)}
                    className="relative p-2 rounded-full hover:bg-gray-100"
                    title="Notifications"
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
                        ) : notes.map(n=>(
                          <button
                            key={n.id}
                            onClick={()=>clickNote(n)}
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
                  <img src={profile?.avatar_url || 'https://ui-avatars.com/api/?name=U'} alt="avatar" className="w-8 h-8 rounded-full border"/>
                </Link>
                <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
