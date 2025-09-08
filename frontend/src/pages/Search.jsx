import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api'

const fmt = (s) => new Date(s).toLocaleString()

function useQueryParam(name){
  const { search } = useLocation()
  return new URLSearchParams(search).get(name) || ''
}

export default function Search(){
  const q = useQueryParam('q')
  const [people, setPeople] = useState([])
  const [questions, setQuestions] = useState([])
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(()=>{
    let cancel = false
    const run = async ()=>{
      try{
        const { data } = await api.get('/search', { params: { q } })
        if(!cancel){
          setPeople(data.people || [])
          setQuestions(data.questions || [])
        }
      }catch(e){
        if(!cancel) setErr(e.response?.data?.detail || 'Failed to search')
      }
    }
    if(q) run()
    return ()=>{ cancel = true }
  }, [q])

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Search results for: <span className="text-blue-700">{q}</span></h1>
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="font-semibold mb-2">Questions</div>
            {questions.length === 0 ? (
              <div className="text-sm text-gray-500">No matching questions</div>
            ) : questions.map(qi=>(
              <button key={qi.id} onClick={()=>nav(`/questions/${qi.id}`)} className="block w-full text-left border rounded p-3 mb-2 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  {qi.urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">URGENT</span>}
                  <div className="font-medium">{qi.title}</div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Posted: {fmt(qi.created_at)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {qi.tags.map(t=> <span key={t.id} className="mr-2">#{t.name}</span>)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="font-semibold mb-2">People</div>
            {people.length === 0 ? (
              <div className="text-sm text-gray-500">No matching people</div>
            ) : (
              <ul className="text-sm">
                {people.map((p,i)=>(
                  <li key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.username} ・ {p.department} ・ {p.years_experience} yrs</div>
                    </div>
                    {/* Link to profile could be added later */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
