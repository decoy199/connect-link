import React from 'react'
export default function FAQ(){
  const faqs = [
    {q:'How do I ask anonymously?', a:'Go to the Dashboard and use the "Ask Anonymously" form.'},
    {q:'How are points awarded?', a:'10 points per chat, +15 cross-department bonus, +5 for posting questions, +10 for answers, +20 when your answer is marked Best.'},
    {q:'How to redeem points?', a:'In the Dashboard, enter points and redeem. Show the QR code at the cafeteria.'},
  ]
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-3">FAQ</h1>
        {faqs.map((f,i)=>(
          <div key={i} className="border-b py-3">
            <div className="font-medium">{f.q}</div>
            <div className="text-sm text-gray-600">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
