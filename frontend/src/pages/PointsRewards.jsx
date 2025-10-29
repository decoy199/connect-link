import React, { useEffect, useState } from 'react'
import api from '../api'

export default function PointsRewards(){
  const [tx, setTx] = useState([])
  useEffect(()=>{ api.get('/points/transactions').then(r=>setTx(r.data)) }, [])
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-3">Points</h1>
        <p className="text-sm text-gray-600 mb-4">Use your points to grow your companion and purchase accessories for them.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="py-2">Date</th><th>Amount</th><th>Reason</th></tr></thead>
          <tbody>
            {tx.map(t=>(<tr key={t.id} className="border-t">
              <td className="py-2">{new Date(t.created_at).toLocaleString()}</td>
              <td className={t.amount>=0?'text-green-700':'text-red-700'}>{t.amount}</td>
              <td>{t.reason}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
