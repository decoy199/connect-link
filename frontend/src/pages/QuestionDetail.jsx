import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const fmt = (s) => new Date(s).toLocaleString()
const within30m = (iso) => (Date.now() - new Date(iso).getTime()) <= 30 * 60 * 1000

export default function QuestionDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const [q, setQ] = useState(null)
  const [answers, setA] = useState([])
  const [body, setBody] = useState('')
  const [likes, setLikes] = useState({})
  const [err, setErr] = useState('')
  const [sentOK, setSentOK] = useState(false)
  const [me, setMe] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const load = async ()=>{
    try {
      const rq = await api.get(`/questions/${id}`)
      setQ(rq.data)
      const ra = await api.get(`/questions/${id}/answers`)
      setA(ra.data)
    } catch (e){
      setErr(e.response?.data?.detail || 'Failed to load question')
    }
  }

  useEffect(()=>{
    (async ()=>{
      try { const { data } = await api.get('/me'); setMe(data.user || data) } catch {}
      await load()
    })()
  }, [id])

  const canAnswer = (() => {
    if (!q || !me) return false
    // if assigned, only that user can answer; otherwise anyone can answer once (handled server side)
    if (q.assigned_answerer) return q.assigned_answerer.id === me.id
    return true
  })()

  const submit = async ()=>{
    try{
      if (!canAnswer) return
      const { data } = await api.post(`/questions/${id}/answers`, { body })
      setBody('')
      setSentOK(true)
      setTimeout(()=>setSentOK(false), 2000)
      setA(prev=>[data, ...prev])
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to send')
    }
  }

  const like = async (aid)=>{
    try{
      await api.post(`/answers/${aid}/like`)
      setLikes(prev => ({...prev, [aid]: (prev[aid]||0)+1}))
    }catch(_){}
  }

  const del = async (aid)=>{
    if(!window.confirm('Delete this answer?')) return
    try{
      await api.delete(`/answers/${aid}`)
      setA(prev => prev.filter(a=>a.id!==aid))
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const markBest = async (aid)=>{
    try{
      await api.post(`/answers/${aid}/mark-best`)
      load()
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to mark best')
    }
  }

  const startEdit = (a)=>{ setEditingId(a.id); setEditText(a.body) }
  const saveEdit  = async ()=>{
    try{
      await api.put(`/answers/${editingId}`, { body: editText })
      setEditingId(null)
      setEditText('')
      load()
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to edit')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button onClick={()=>nav(-1)} className="text-sm text-blue-600 hover:underline">← Back</button>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      {!q ? (
        <div className="mt-4">Loading…</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow mt-3">
          <div className="text-xl font-semibold">{q.title}</div>
          <div className="text-sm text-gray-500 mt-1">
            Asked by {q.author?.username} · {fmt(q.created_at)}
          </div>
          <div className="mt-3 whitespace-pre-wrap">{q.body}</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(q.tags || []).map((t, idx)=>(
              <span key={idx} className="text-xs px-2 py-0.5 rounded-full border">#{t.name || t}</span>
            ))}
            {q.urgent && <span className="text-xs px-2 py-0.5 rounded-full border border-red-300 bg-red-50 text-red-700">URGENT</span>}
            {q.assigned_answerer && (
              <span className="text-xs px-2 py-0.5 rounded-full border">
                Assigned: @{q.assigned_answerer.username}
              </span>
            )}
          </div>

          <div className="mt-6">
            <div className="font-semibold mb-2">Answers</div>
            {answers.length === 0 && <div className="text-sm text-gray-500">No answers yet</div>}
            <ul className="space-y-3">
              {answers.map(a=>(
                <li key={a.id} className="border rounded p-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{a.body}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    by {a.author?.username} · {fmt(a.created_at)} · Likes: {a.like_count}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={()=>like(a.id)} className="text-xs px-2 py-1 rounded border">Like</button>
                    {/* author-only edit/delete within time window could be kept if present in your API */}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="font-semibold mb-2">Your answer</div>
            {!canAnswer && q.assigned_answerer ? (
              <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">
                Only <b>@{q.assigned_answerer.username}</b> can answer this question.
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 border p-2 rounded"
                    placeholder="Write your answer…"
                    value={body}
                    onChange={e=>setBody(e.target.value)}
                  />
                  <button onClick={submit} className="bg-gray-800 text-white px-3 rounded">Send</button>
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
