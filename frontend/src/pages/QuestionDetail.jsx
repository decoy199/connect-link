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
    try{
      const qres = await api.get(`/questions/${id}`)
      setQ(qres.data)
      const ares = await api.get(`/questions/${id}/answers`)
      setA(ares.data)
      const meRes = await api.get('/me')
      setMe(meRes.data)
    }catch(e){ setErr(e.response?.data?.detail || 'Failed to load') }
  }
  useEffect(()=>{ load() }, [id])

  const submit = async ()=>{
    try{
      await api.post(`/questions/${id}/answers`, { body })
      setBody(''); load()
      setSentOK(true)
      setTimeout(()=>setSentOK(false), 4000)
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to answer')
    }
  }
  const like = async (aid)=>{
    try{
      const { data } = await api.post(`/answers/${aid}/like`)
      setLikes(s=>({...s,[aid]:data.like_count}))
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to like')
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
      setEditingId(null); setEditText(''); load()
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to update')
    }
  }
  const cancelEdit = ()=>{ setEditingId(null); setEditText('') }
  const remove = async (aid)=>{
    if(!confirm('Are you sure you want to delete this answer?')) return
    try{
      await api.delete(`/answers/${aid}`)
      load()
    }catch(e){
      setErr(e.response?.data?.detail || 'Failed to delete')
    }
  }

  if(!q) return <div className="max-w-3xl mx-auto p-4">{err || 'Loading...'}</div>

  const isOwnerQ = me?.user?.username && q.author && q.author.username === me.user.username
  const canDeleteQ = isOwnerQ && within30m(q.created_at)

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {q.urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">URGENT</span>}
            <h1 className="text-xl font-semibold">{q.title}</h1>
          </div>
          {canDeleteQ && (
            <button onClick={()=>{}} className="hidden" />
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">Posted: {fmt(q.created_at)}</div>
        <div className="text-gray-600 text-sm my-2">{q.body}</div>
        <div className="text-xs text-gray-500 mb-2">{q.tags.map(t=> <span key={t.id} className="mr-2">#{t.name}</span>)}</div>

        {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

        <div className="space-y-2">
          {answers.map(a=>{
            const isMine = me?.user?.username && a.author && a.author.username === me.user.username
            const canEditDel = isMine && within30m(a.created_at)
            const likeCount = likes[a.id] ?? a.like_count
            return (
              <div key={a.id} className={`border rounded p-2 ${q.best_answer_id === a.id ? 'border-green-500' : 'border-gray-200'}`}>
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <textarea className="w-full border rounded p-2" rows="3" value={editText} onChange={e=>setEditText(e.target.value)} />
                    <div className="flex gap-2 text-sm">
                      <button onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                      <button onClick={cancelEdit} className="border px-3 py-1 rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm">{a.body}</div>
                    <div className="text-[11px] text-gray-500 mt-1">Answered: {fmt(a.created_at)}</div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-3 mt-1 items-center">
                      <button onClick={()=>like(a.id)} className="hover:underline">Like ({likeCount})</button>
                      <button onClick={()=>markBest(a.id)} className="hover:underline">Mark Best</button>
                      {canEditDel && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button onClick={()=>startEdit(a)} className="hover:underline">Edit</button>
                          <button onClick={()=>remove(a.id)} className="text-red-600 hover:underline">Delete</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <input className="flex-1 border p-2 rounded" placeholder="Write an answer..." value={body} onChange={e=>setBody(e.target.value)} />
          <button onClick={submit} className="bg-gray-800 text-white px-3 rounded">Send</button>
        </div>

        {sentOK && (
          <div className="mt-2 text-sm rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2">
            Thanks for your answer!
          </div>
        )}
      </div>
    </div>
  )
}
