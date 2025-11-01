import React, { useEffect, useRef, useState } from 'react'

/**
 
 */
function FlowIn({ as: Tag = 'div', className = '', delay = 0, direction = 'up', children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) { setVisible(true); return }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const t = window.setTimeout(() => setVisible(true), delay)
            io.disconnect()
            return () => window.clearTimeout(t)
          }
        })
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  const base = 'transition-all duration-700 will-change-transform'
  const hiddenAxis =
    direction === 'left' ? '-translate-x-6'
    : direction === 'right' ? 'translate-x-6'
    : 'translate-y-3'
  const hidden = `opacity-0 ${hiddenAxis}`
  const shown  = 'opacity-100 translate-x-0 translate-y-0'
  const cls    = `${base} ${visible ? shown : hidden} ${className}`

  return (
    <Tag ref={ref} className={cls}>
      {children}
    </Tag>
  )
}


function TypingLine({
  children,
  className = '',
  delay = 0,          // ms
  duration = 2000,    // ms
  cursorWidth = 2,    // px
  cursorColor = '#111',
  mono = false,       // 
}) {
  const ref = useRef(null)
  const [run, setRun] = useState(false)

  
  const text = typeof children === 'string' ? children : ''
  const steps = Math.max(10, Math.ceil(text.length * 0.9))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) { setRun(true); return }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const t = window.setTimeout(() => setRun(true), delay)
            obs.disconnect()
            return () => window.clearTimeout(t)
          }
        })
      },
      { threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={{ borderRightWidth: run ? cursorWidth : 0, borderRightColor: cursorColor }}
    >
      <span
        className={`${mono ? 'font-mono' : ''} inline-block will-change-transform`}
        style={{
          
          width: run ? undefined : 0,
          visibility: run ? 'visible' : 'hidden',
          
          animation: run
            ? `typing ${duration}ms steps(${steps}) both, blink .7s step-end infinite`
            : 'none',
          borderRightWidth: cursorWidth,
          borderRightStyle: 'solid',
          borderRightColor: cursorColor,
        }}
      >
        {children}
      </span>

      {/* key from */}
      <style>{`
        @keyframes typing {
          0%   { width: 0 }
          100% { width: 100% }
        }
        @keyframes blink {
          0%, 100% { border-color: ${cursorColor} }
          50%      { border-color: transparent }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style*="animation"] { animation: none !important; width: auto !important; visibility: visible !important; }
        }
      `}</style>
    </div>
  )
}

export default function FAQ() {
  const faqs = [
    {
      q: 'How do I ask anonymously?',
      a: 'Go to the Dashboard and use the "Ask Anonymously" form.',
    },
    {
      q: 'How are points awarded?',
      a: '10 points per chat, +15 cross-department bonus, +5 for posting questions, +10 for answers, +20 when your answer is marked Best.',
    },
    {
      q: 'How to redeem points?',
      a: 'In the Dashboard, enter points and redeem. Show the QR code at the cafeteria.',
    },
  ]

  const headerLines = [
    'This page explains:',
    '• What this platform is for',
    '• How to ask / answer',
    '• How points work',
    '• How to redeem rewards using QR codes',
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      
      <div className="rounded-xl shadow bg-gradient-to-tr from-indigo-900 to-blue-700 p-6">
        <FlowIn direction="left">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-3">
            Welcome! How to Use This Platform & How Points Work
          </h1>
        </FlowIn>

        <div className="text-white/95 text-sm space-y-1">
          {headerLines.map((line, i) => (
            <TypingLine
              key={i}
              delay={200 + i * 200}
              duration={1600}
              cursorWidth={3}
              cursorColor="#fff"
              className="pr-2"
            >
              {line}
            </TypingLine>
          ))}
        </div>
      </div>

      {/* 1. What is this platform? */}
      <FlowIn as="section" className="bg-white p-5 rounded-xl shadow" delay={50}>
        <h2 className="text-xl font-semibold mb-3">
          1. What is this platform?
        </h2>
        <p className="text-gray-700 mb-3">
          This is an internal knowledge sharing and Q&amp;A platform.
          You can ask questions, help other people by answering, and
          earn points for being helpful.
        </p>
        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
          <li>Post questions (for example: “How do I do X?”, “Where is Y?”).</li>
          <li>Answer other people’s questions and share your know-how.</li>
          <li>Earn points when you help others.</li>
          <li>Redeem your points for rewards. A QR code will be generated for you.</li>
        </ul>
      </FlowIn>

      {/* 2. Basic workflow */}
      <FlowIn as="section" className="bg-white p-5 rounded-xl shadow" delay={90}>
        <h2 className="text-xl font-semibold mb-3">
          2. How do I use it? (Basic workflow)
        </h2>
        <ol className="list-decimal pl-5 text-gray-700 space-y-2 text-sm">
          <li>
            <span className="font-medium">Search first:</span> Use search or
            tags to see if somebody already asked the same thing.
          </li>
          <li>
            <span className="font-medium">Ask a new question:</span> If you
            don’t find it, ask publicly. Be clear and specific about the
            problem.
          </li>
          <li>
            <span className="font-medium">Get answers:</span> People in the
            company will answer. You can mark the best answer.
          </li>
          <li>
            <span className="font-medium">Answer others:</span> When you reply
            to other people’s questions, you earn points and recognition.
          </li>
        </ol>
      </FlowIn>

      {/* 3. Direct / private / anonymous */}
      <FlowIn as="section" className="bg-white p-5 rounded-xl shadow" delay={130}>
        <h2 className="text-xl font-semibold mb-3">
          3. Direct / private / anonymous questions
        </h2>

        <h3 className="text-base font-medium mb-1">
          Direct Question
        </h3>
        <p className="text-gray-700 text-sm mb-3">
          A Direct Question is a private question to a specific person (like a
          team lead or subject expert). Use this when it should not be visible
          to everyone.
        </p>

        <h3 className="text-base font-medium mb-1">
          Anonymous question
        </h3>
        <p className="text-gray-700 text-sm">
          You can also post anonymously. Go to the Dashboard and use the
          &quot;Ask Anonymously&quot; form. Your identity will not be shown.
        </p>

        <p className="text-gray-500 text-xs mt-3">
          Tip: Public questions are still better for general topics, because
          they stay searchable and help future teammates.
        </p>
      </FlowIn>

      {/* 4. Points system */}
      <FlowIn as="section" className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow" delay={170}>
        <h2 className="text-xl font-semibold mb-3">
          4. How do points work?
        </h2>

        <p className="text-gray-700 text-sm mb-3">
          Points reward helpful behavior. You earn points when you:
        </p>

        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
          <li>Answer someone’s question.</li>
          <li>Get likes on your answer.</li>
          <li>Have your answer marked as “Best Answer.”</li>
          <li>Share useful guides, steps, internal know-how, tips, templates, etc.</li>
        </ul>

        <p className="text-gray-700 text-sm mt-4 mb-2">
          In addition, this app may award specific point values such as:
        </p>
        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
          <li>+10 points per chat / help interaction</li>
          <li>+15 bonus for helping across departments</li>
          <li>+5 for posting a question</li>
          <li>+10 for posting an answer</li>
          <li>+20 if your answer is marked Best</li>
        </ul>

        <p className="text-gray-700 text-sm mt-4">
          Your total points are shown in your balance, and you also appear on
          the leaderboard. The leaderboard highlights people who are actively
          helping the team.
        </p>
      </FlowIn>

      {/* 5. Redeeming points */}
      <FlowIn as="section" className="bg-amber-50 border border-amber-300 p-5 rounded-xl shadow" delay={210}>
        <h2 className="text-xl font-semibold mb-3">
          5. How do I redeem my points?
        </h2>

        <p className="text-gray-700 text-sm mb-3">
          You can convert your points into a reward. When you redeem, the
          system generates a unique QR code for you. That QR code is what you
          actually “spend.”
        </p>

        <h3 className="text-base font-medium mb-2">
          Redemption flow:
        </h3>

        <ol className="list-decimal pl-5 text-gray-700 space-y-2 text-sm">
          <li>
            Go to your Dashboard / Points section and choose &quot;Redeem&quot;.
          </li>
          <li>
            Enter how many points to redeem, or pick the reward item you want.
          </li>
          <li>
            The backend creates a QR code for that redemption.
          </li>
          <li>
            The QR code is shown on screen.
          </li>
          <li>
            Show that QR code at the cafeteria / office desk / reward counter
            to claim the item.
          </li>
        </ol>

        <h3 className="text-base font-medium mt-4 mb-2">
          Typical reward examples:
        </h3>

        <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
          <li>Drink / snack tickets</li>
          <li>Lunch coupon or meal subsidy</li>
          <li>Early leave pass / break perk</li>
          <li>Company swag / internal merch</li>
        </ul>

        <p className="text-gray-500 text-xs mt-3">
          Rewards and point costs may change depending on your team or HR
          policy. Please follow your internal rules.
        </p>
      </FlowIn>

      {/* 6. General FAQ / quick questions */}
      <FlowIn as="section" className="bg-white p-5 rounded-xl shadow" delay={250}>
        <h2 className="text-xl font-semibold mb-4">
          6. Quick questions (FAQ)
        </h2>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <FlowIn key={i} className="border-b border-gray-200 pb-3" delay={i * 70}>
              <div className="font-medium text-gray-900">{f.q}</div>
              <div className="text-sm text-gray-600">{f.a}</div>
            </FlowIn>
          ))}
        </div>
      </FlowIn>

      {/* Footer / encouragement */}
      <FlowIn as="section" className="text-center text-xs text-gray-500 pb-10" delay={280}>
        You’re ready. Ask something, or answer something. Your knowledge saves
        someone else’s time 🚀
      </FlowIn>
    </div>
  )
}
