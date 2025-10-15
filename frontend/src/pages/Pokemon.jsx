import React, { useEffect, useState } from 'react'
import api from '../api'
import babyUnicorn from '../components/images/babyUnicorn.png'
import teenageUnicorn from '../components/images/teenageUnicorn.png'
import adultUnicorn from '../components/images/adultUnicorn.png'

export default function PointsRewards() {
  const [tx, setTx] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    api.get('/points/transactions').then(r => {
      setTx(r.data)
      // Calculate total points from transactions
      const total = r.data.reduce((sum, t) => sum + t.amount, 0)
      setTotalPoints(total)
    })
  }, [])

  // Floating animation for unicorn
  useEffect(() => {
    let time = 0
    const animationFrame = setInterval(() => {
      time += 0.05
      setOffset(Math.sin(time) * 15)
    }, 16)
    return () => clearInterval(animationFrame)
  }, [])

  // Determine which unicorn to show based on points
  const getUnicornImage = () => {
    if (totalPoints >= 20) return adultUnicorn
    if (totalPoints >= 10) return teenageUnicorn
    return babyUnicorn
  }

  const getUnicornStage = () => {
    if (totalPoints >= 20) return 'Adult Unicorn'
    if (totalPoints >= 10) return 'Teenage Unicorn'
    return 'Baby Unicorn'
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid md:grid-cols-[70%_28%] gap-4 mb-4">
        {/* Unicorn Display */}
        <div className="rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[400px]"> {/*Place abacgkround image somewhere here*/}
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Your Avatar</h2>
          <p className="text-lg text-purple-600 mb-4">{getUnicornStage()}</p>
          <div className="relative w-full flex justify-center items-center flex-1">
            <img
              src={getUnicornImage()}
              alt={getUnicornStage()}
              style={{
                maxWidth: '1000px',
                maxHeight: '1000px',
                objectFit: 'contain',
                transform: `translateY(${offset}px)`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold text-purple-800">{totalPoints} Points</p>
            {totalPoints < 10 && (
              <p className="text-sm text-purple-600 mt-1">
                {10 - totalPoints} points until Teenage Unicorn! 
              </p>
            )}
            {totalPoints >= 10 && totalPoints < 20 && (
              <p className="text-sm text-purple-600 mt-1">
                {20 - totalPoints} points until Adult Unicorn! ✨
              </p>
            )}
            {totalPoints >= 20 && (
              <p className="text-sm text-purple-600 mt-1">
                Congratulations! Your unicorn is fully grown! 🎉
              </p>
            )}
          </div>
        </div>

        {/* Points Summary */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">Points Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Points</span>
              <span className="text-2xl font-bold text-green-600">{totalPoints}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Earn points through asking and answering questions in the company dashboard!
              </p>
            </div>
          </div>

          {/* Growth Progress */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 mb-2">Growth Progress</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalPoints / 20) * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{Math.min(Math.round((totalPoints / 20) * 100), 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}