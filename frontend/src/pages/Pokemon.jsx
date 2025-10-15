import React, { useEffect, useState } from 'react'
import babyunicorn from '../components/images/babyUnicorn.png'

export default function Pokemon() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let time = 0
    const animationFrame = setInterval(() => {
      time += 0.05
      setOffset(Math.sin(time) * 20)
    }, 16)

    return () => clearInterval(animationFrame)
  }, [])

  return (
    <div 
        style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}
    >
      <img
        src={babyunicorn}
        alt="Baby Unicorn"
        style={{
          width: '1200px',
          height: '1200px',
          objectFit: 'contain',
          transform: `translate(${ -100 }px, ${offset}px)`,
          transition: 'transform 0.2s ease'
        }}
      />
    </div>
  )
}
