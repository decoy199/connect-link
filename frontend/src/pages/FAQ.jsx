import React from 'react'

export default function FAQ() {
  // This small FAQ list was originally in your component.
  // We'll keep it and show it at the bottom under "Quick questions".
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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Page header */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-2">
          Welcome! How to Use This Platform & How Points Work
        </h1>
        <p className="text-gray-600 text-sm">
          This page explains:
          <br />
          • What this platform is for
          <br />
          • How to ask / answer
          <br />
          • How points work
          <br />
          • How to redeem rewards using QR codes
        </p>
      </div>

      {/* 1. What is this platform? */}
      <section className="bg-white p-5 rounded-xl shadow">
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
      </section>

      {/* 2. Basic workflow */}
      <section className="bg-white p-5 rounded-xl shadow">
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
      </section>

      {/* 3. Direct Question / anonymous question */}
      <section className="bg-white p-5 rounded-xl shadow">
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
      </section>

      {/* 4. Points system */}
      <section className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow">
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
      </section>

      {/* 5. Redeeming points */}
      <section className="bg-amber-50 border border-amber-300 p-5 rounded-xl shadow">
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
      </section>

      {/* 6. General FAQ / quick questions */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          6. Quick questions (FAQ)
        </h2>

        <div className="space-y-4">
          {/* Dynamic list from the original component */}
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-3">
              <div className="font-medium text-gray-900">{f.q}</div>
              <div className="text-sm text-gray-600">{f.a}</div>
            </div>
          ))}

          {/* Extra common questions from the long explanation */}
          <div className="border-b border-gray-200 pb-3">
            <div className="font-medium text-gray-900">
              Should I ask questions publicly or privately?
            </div>
            <div className="text-sm text-gray-600">
              Prefer public questions when possible. Public Q&amp;A is
              searchable later, so other people can solve the same problem
              without needing to DM you.
            </div>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <div className="font-medium text-gray-900">
              What if my answer is not perfect?
            </div>
            <div className="text-sm text-gray-600">
              That’s okay. You can edit or add an update. Other people can also
              contribute. The goal is to help someone move forward, not to be
              100% perfect in one shot.
            </div>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <div className="font-medium text-gray-900">
              Who can see my points?
            </div>
            <div className="text-sm text-gray-600">
              Your points usually appear in the leaderboard. The leaderboard is
              basically a “most helpful teammates right now” board.
            </div>
          </div>
        </div>
      </section>

      {/* Footer / encouragement */}
      <section className="text-center text-xs text-gray-500 pb-10">
        You’re ready. Ask something, or answer something. Your knowledge saves
        someone else’s time 🚀
      </section>
    </div>
  )
}
