// src/components/QuizPopup.jsx
// A plug-and-play quiz modal that appears on the Dashboard after login
// when there's a question older than 24 hours with a "best answer" chosen.
//
// Requirements covered:
// - Pops up on dashboard (render this component in Dashboard page)
// - Shows the original question
// - Picks the best answer from answers and generates 3 similar options
// - User selects one; if correct, awards 10 points
// - All UI copy & code in English; background styling left to parent page
//
// Backend expectations (flexible):
// GET  /quiz/pending               -> {
//   question: { id, title, body, created_at },
//   answers:  [{ id, text, is_best?, upvotes? }],
//   best_answer_id?: string
// }
// POST /quiz/submit { question_id, answer_id } -> { correct: boolean, points_awarded: number }
// (If POST is not implemented, we fall back to client-side correctness check and call /users/award)

import React, { useEffect, useRef, useState } from 'react';
import api from '../api';

const PENDING_ENDPOINT = '/quiz/pending';
const SUBMIT_ENDPOINT = '/quiz/submit';
const AWARD_ENDPOINT = '/users/award'; // optional fallback


function synthChoicesIfNeeded(picked, answers, bestId) {
  // Ensure we always have exactly 3 options.
  let out = picked?.choices ? [...picked.choices] : [];
  // Remove nulls/dupes
  out = out.filter(Boolean);
  const ids = new Set(out.map(o => o.id));

  // Use available non-best answers as distractors
  for (const a of answers) {
    if (out.length >= 3) break;
    if (a.id === bestId) continue;
    if (!ids.has(a.id)) { out.push(a); ids.add(a.id); }
  }

  // Synthetic distractors if still short
  let seq = 1;
  const makeFake = (text) => ({ id: `fake_${seq++}`, text, is_best: false, upvotes: 0 });
  while (out.length < 3) {
    if (seq == 1) out.push(makeFake("None of these"));
    else if (seq == 2) out.push(makeFake("I don't know"));
    else out.push(makeFake("Not sure"));
  }

  // Shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, 3);
}

function pickSimilarOptions(answers, bestId) {
  if (!Array.isArray(answers)) return [];
  const best = answers.find(a => a.id === bestId) || answers.find(a => a.is_best);
  if (!best) return [];

  // Heuristic: sort by closeness of length & upvotes (descending), exclude best
  const scored = answers
    .filter(a => a.id !== best.id)
    .map(a => ({
      a,
      lenDiff: Math.abs((a.text || '').length - (best.text || '').length),
      up: typeof a.upvotes === 'number' ? a.upvotes : 0,
    }))
    .sort((x, y) => {
      // Prefer higher upvotes and smaller length difference
      if (y.up !== x.up) return y.up - x.up;
      return x.lenDiff - y.lenDiff;
    });

  // Take top 2 similar distractors; if not enough, pad with any others
  const distractors = scored.slice(0, 2).map(s => s.a);
  while (distractors.length < 2) {
    const extra = answers.find(a => a.id !== best.id && !distractors.includes(a));
    if (!extra) break;
    distractors.push(extra);
  }

  // Shuffle choices
  const all = [best, ...distractors].slice(0, 3);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { best, choices: all };
}

export default function QuizPopup() {
  const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('quizDebug') === '1';

  const FORCE_FLAG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceQuiz') === '1';
  const TODAY = new Date().toISOString().slice(0,10);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(null);
  const [bestId, setBestId] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null); // { correct, points }
  const dialogRef = useRef(null);

  // Fetch pending quiz once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (DEBUG) console.log('[QuizPopup] fetching pending...');
      setError('');
      try {
        const { data } = await api.get(PENDING_ENDPOINT);
        if (!data || !data.question || !Array.isArray(data.answers)) {
          if (DEBUG) console.log('[QuizPopup] no data or malformed:', data);
          setLoading(false);
          return;
        }

        const q = data.question;

        // Show only once per question id per session/day
        const key = `quizDismissed:${q.id}:${TODAY}`;
        if (!FORCE_FLAG && localStorage.getItem(key)) {
          setLoading(false);
          return;
        }

        // Optional local 24h check if backend didn't filter
      /*  if (q.created_at) {
          const created = new Date(q.created_at).getTime();
          const now = Date.now();
          if (now - created < 24 * 60 * 60 * 1000) {
            setLoading(false);
            return;
          }
        }*/

          if (q.created_at) {
            const created = new Date(q.created_at).getTime();
            const now = Date.now();
            // 24 hours -> 5 minutes
            if (now - created < 5 * 60 * 1000) {
              setLoading(false);
              return;
            }
          }



        if (cancelled) return;

        const best =
          data.best_answer_id ||
          (data.answers.find(a => a.is_best) || {}).id;

        if (!best) {
          if (DEBUG) console.log('[QuizPopup] no best answer resolved');
          setLoading(false);
          return;
        }

        const picked = pickSimilarOptions(data.answers, best);
        const finalChoices = synthChoicesIfNeeded(picked, data.answers, best);
        setQuestion(q);
        setBestId(best);
        setChoices(finalChoices);
        setOpen(true);
      } catch (e) {
        setError(e.response?.data?.detail || 'Failed to load quiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ESC to close; basic focus management
  useEffect(() => {
    if (!open) return;
    const onKey = (ev) => {
      if (ev.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    if (open && dialogRef.current) {
      const btn = dialogRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      btn && btn.focus();
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    if (question?.id) {
      localStorage.setItem(`quizDismissed:${question.id}:${TODAY}`, '1');
    }
    setOpen(false);
  };

  const submit = async () => {
    if (!question?.id || !selected || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(SUBMIT_ENDPOINT, {
        question_id: question.id,
        answer_id: selected,
      });
      if (typeof data?.correct === 'boolean') {
        setResult({
          correct: data.correct,
          points: data.points_awarded ?? (data.correct ? 10 : 0),
        });
      } else {
        // Fallback: check locally
        const correct = selected === bestId;
        setResult({ correct, points: correct ? 10 : 0 });
        if (correct) {
          // Optional: notify backend about points
          try {
            await api.post(AWARD_ENDPOINT, {
              points: 10,
              reason: 'quiz-correct',
            });
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick quiz</h2>
            <p className="text-sm text-gray-500">
              Based on your question from 24+ hours ago.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Question */}
        <div className="mb-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
          <p className="font-medium">{question?.title || 'Your question'}</p>
          {question?.body && (
            <p className="mt-1 text-gray-600">{question.body}</p>
          )}
        </div>

        {/* Choices */}
        <div className="space-y-2">
          {choices.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-all hover:bg-gray-50 ${
                selected === c.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="quiz-choice"
                value={c.id}
                checked={selected === c.id}
                onChange={() => setSelected(c.id)}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span>{c.text}</span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={close}
            className="rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Not now
          </button>
          <button
            onClick={submit}
            disabled={!selected || submitting}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`mt-4 rounded-xl p-3 text-sm ${
              result.correct
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {result.correct ? (
              <p>Correct! +{result.points} points awarded.</p>
            ) : (
              <p>Not quite. Better luck next time!</p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

        // Optional local 24h check if backend didn't filter
      /*  if (q.created_at) {
          const created = new Date(q.created_at).getTime();
          const now = Date.now();
          if (now - created < 24 * 60 * 60 * 1000) {
            setLoading(false);
            return;
          }
        }*/