import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../api'

const formatPoints = (value) => Number(value || 0).toLocaleString('en-US')

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const SPECIES_VARIANTS = [
  {
    key: 'dragon',
    displayName: 'Skyfire Dragon',
    shortLabel: 'DR',
    stages: [
      { level: 1, label: 'Crystalline Egg', image: '/pets/eggDragon.png' },
      { level: 2, label: 'Spark Hatchling', image: '/pets/dragonLittle.png' },
      { level: 3, label: 'Blazing Dragon', image: '/pets/dragonAdult.png' },
    ],
  },
  {
    key: 'butterfly',
    displayName: 'Aurora Butterfly',
    shortLabel: 'BF',
    stages: [
      { level: 1, label: 'Leaf Cradle', image: '/pets/caterpillar.png' },
      { level: 2, label: 'Silken Cocoon', image: '/pets/chrysalis.png' },
      { level: 3, label: 'Radiant Butterfly', image: '/pets/butterfly.png' },
    ],
  },
  {
    key: 'frog',
    displayName: 'Verdant Frog',
    shortLabel: 'FG',
    stages: [
      { level: 1, label: 'Pond Eggs', image: '/pets/eggsFrog.png' },
      { level: 2, label: 'Taplod Tadpole', image: '/pets/tadpole.png' },
      { level: 3, label: 'Verdant Frog', image: '/pets/frog.png' },
    ],
  },
  {
    key: 'songbird',
    displayName: 'Skyline Songbird',
    shortLabel: 'SB',
    stages: [
      { level: 1, label: 'Cozy Nest', image: '/pets/nest.png' },
      { level: 2, label: 'Gentle Songbird', image: '/pets/robin.png' },
      { level: 3, label: 'Soaring Eagle', image: '/pets/Eagle.png' },
    ],
  },
]

const DEPARTMENT_SPECIES = [
  { keywords: ['dragon', 'fire', 'engineering'], species: 'dragon' },
  { keywords: ['butterfly', 'design', 'creative'], species: 'butterfly' },
  { keywords: ['frog', 'support', 'operations'], species: 'frog' },
  { keywords: ['bird', 'marketing', 'growth'], species: 'songbird' },
]

const getSpeciesForDepartment = (name, stageKey) => {
  if (!name && !stageKey) return SPECIES_VARIANTS[0]
  const lowered = (name || '').toLowerCase()
  const hint = (stageKey || '').toLowerCase()
  const hintMatch = SPECIES_VARIANTS.find((variant) => hint.includes(variant.key))
  if (hintMatch) return hintMatch
  const keywordMatch = DEPARTMENT_SPECIES.find((entry) =>
    entry.keywords.some((word) => lowered.includes(word))
  )
  if (keywordMatch) {
    return SPECIES_VARIANTS.find((variant) => variant.key === keywordMatch.species) || SPECIES_VARIANTS[0]
  }
  if (!name) return SPECIES_VARIANTS[0]
  const hash = Array.from(name).reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0)
  return SPECIES_VARIANTS[hash % SPECIES_VARIANTS.length]
}

export default function PetLobby() {
  const [stages, setStages] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [petSignals, setPetSignals] = useState({})
  const [petMoods, setPetMoods] = useState({})
  const [now, setNow] = useState(Date.now())
  const [missingStageArt, setMissingStageArt] = useState({})
  const [petPositions, setPetPositions] = useState({})
  const [activeDrag, setActiveDrag] = useState(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/department-pets')
      .then(({ data }) => {
        if (!active) return
        setStages(data?.stages || [])
        setDepartments(data?.departments || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        const detail = err?.response?.data?.detail
        setError(detail || 'Unable to load department pet data. Please try again later.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const decoratedDepartments = useMemo(() => {
    return (departments || []).map((dept) => {
      const species = getSpeciesForDepartment(dept?.department || '', dept?.stage?.key || '')
      const stageLevel = dept?.stage?.level || 1
      const stageIndex = clamp(stageLevel - 1, 0, species.stages.length - 1)
      const stageVariant = species.stages[stageIndex]
      const nextVariant = stageIndex + 1 < species.stages.length ? species.stages[stageIndex + 1] : null
      return {
        ...dept,
        species,
        stageVariant,
        nextVariant,
        stageIndex,
      }
    })
  }, [departments])

  useEffect(() => {
    if (!decoratedDepartments.length) {
      setPetPositions({})
      return
    }
    setPetPositions((prev) => {
      const next = {}
      let changed = false
      decoratedDepartments.forEach((dept, idx) => {
        if (prev[dept.department]) {
          next[dept.department] = prev[dept.department]
        } else {
          const seed = getOrbitPosition(idx, Math.max(1, decoratedDepartments.length))
          next[dept.department] = { top: seed.top, left: seed.left }
          changed = true
        }
      })
      Object.keys(prev).forEach((key) => {
        if (!decoratedDepartments.some((dept) => dept.department === key)) {
          changed = true
        }
      })
      if (changed || Object.keys(prev).length !== decoratedDepartments.length) {
        return next
      }
      return prev
    })
  }, [decoratedDepartments])

  useEffect(() => {
    if (!decoratedDepartments || decoratedDepartments.length === 0) {
      setPetSignals({})
      return
    }
    setPetSignals((prev) => {
      const updated = {}
      decoratedDepartments.forEach((dept) => {
        const key = dept.department
        const currentStageKey = dept.stage?.key || 'unknown'
        const prevEntry = prev[key] || {}
        const stageChanged = prevEntry.stageKey && prevEntry.stageKey !== currentStageKey
        updated[key] = {
          ...prevEntry,
          stageKey: currentStageKey,
          evolvedAt: stageChanged ? Date.now() : (prevEntry.evolvedAt || 0),
        }
      })
      return updated
    })
  }, [decoratedDepartments])

  const canShowStageImage = (stageKey, url, variantKey = '') => {
    const key = variantKey ? `${variantKey}:${stageKey}` : stageKey
    return Boolean(url) && !missingStageArt[key]
  }

  const handleStageImageError = (stageKey, variantKey = '') => {
    const key = variantKey ? `${variantKey}:${stageKey}` : stageKey
    setMissingStageArt((prev) => {
      if (prev[key]) return prev
      return { ...prev, [key]: true }
    })
  }

  const getOrbitPosition = (index, total) => {
    if (total <= 1) {
      return { top: 52, left: 50 }
    }
    const radius = total > 7 ? 40 : 34
    const angle = (index / total) * Math.PI * 2
    const top = 55 + radius * Math.sin(angle)
    const left = 50 + radius * Math.cos(angle)
    return {
      top: clamp(top, 8, 92),
      left: clamp(left, 8, 92),
    }
  }

  const fireflies = useMemo(() => {
    const count = 24
    return Array.from({ length: count }, (_, idx) => {
      const angle = (idx / count) * Math.PI * 2
      const drift = 38 + 8 * Math.sin(idx * 1.3)
      const top = 50 + drift * Math.sin(angle)
      const left = 50 + drift * Math.cos(angle)
      return (
        <span
          key={`firefly-${idx}`}
          style={{
            top: `${clamp(top, 6, 94)}%`,
            left: `${clamp(left, 4, 96)}%`,
            '--twinkle-delay': `${(idx % 6) * 0.6}s`,
            '--twinkle-duration': `${3.5 + (idx % 4) * 0.7}s`,
          }}
        />
      )
    })
  }, [decoratedDepartments.length])

  const handlePointerDown = useCallback(
    (deptName) => (e) => {
      if (!sceneRef.current) return
      if (e.target.closest && e.target.closest('.pet-care-actions')) return
      if (e.target.closest && e.target.closest('button')) return
      const position = petPositions[deptName] || { top: 50, left: 50 }
      const rect = sceneRef.current.getBoundingClientRect()
      setActiveDrag({
        dept: deptName,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseTop: position.top,
        baseLeft: position.left,
        sceneRect: rect,
      })
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch (_) {}
      e.preventDefault()
    },
    [petPositions]
  )

  useEffect(() => {
    if (!activeDrag) return

    const handleMove = (e) => {
      if (e.pointerId !== activeDrag.pointerId) return
      const { sceneRect, baseTop, baseLeft, startX, startY, dept } = activeDrag
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      const newLeft = clamp(baseLeft + (deltaX / sceneRect.width) * 100, 4, 96)
      const newTop = clamp(baseTop + (deltaY / sceneRect.height) * 100, 6, 94)
      setPetPositions((prev) => ({
        ...prev,
        [dept]: { top: newTop, left: newLeft },
      }))
    }

    const handleUp = (e) => {
      if (e.pointerId !== activeDrag.pointerId) return
      try {
        e.target.releasePointerCapture(activeDrag.pointerId)
      } catch (_) {}
      setActiveDrag(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [activeDrag])

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-10">
      <section className="bg-white/95 rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-3 flex items-center gap-3 text-emerald-900">
          <span role="img" aria-label="pet lobby">🐾</span>
          Pet Lobby
        </h1>
        <p className="text-base text-gray-600 leading-7 max-w-3xl">
          Step into the shared forest glade where every department cares for its own companion. Earn knowledge points,
          nurture habitats, and watch your chosen species grow from humble beginnings into a legendary partner.
        </p>
      </section>

      <section className="shadow-2xl rounded-3xl overflow-hidden border border-emerald-700/40">
        <div className="forest-scene" ref={sceneRef}>
          <div className="forest-layer canopy" />
          <div className="forest-layer midground" />
          <div className="forest-layer ground" />
          <div className="forest-fireflies">{fireflies}</div>

          {loading && (
            <div className="forest-empty">Summoning the forest... please hold tight.</div>
          )}

          {!loading && error && (
            <div className="forest-empty">{error}</div>
          )}

          {!loading && !error && decoratedDepartments.length === 0 && (
            <div className="forest-empty">
              No departments have appeared yet. Ask teammates to add their department in the profile page and earn points together!
            </div>
          )}

          {!loading && !error && decoratedDepartments.map((dept, index) => {
            const fallback = getOrbitPosition(index, decoratedDepartments.length)
            const position = petPositions[dept.department] || fallback
            const progressPct = Math.round(clamp((dept.progress_ratio || 0) * 100, 0, 100))
            const nearEvolution = Boolean(dept.nextVariant) && (dept.points_to_next || 0) <= 200
            const atCap = !dept.nextVariant
            const signal = petSignals[dept.department] || {}
            const evolvedRecently = signal.evolvedAt ? now - signal.evolvedAt < 6000 : false
            const caredRecently = signal.lastCareAt ? now - signal.lastCareAt < 2000 : false
            const isDragging = activeDrag?.dept === dept.department
            const spriteClasses = [
              'pet-sprite',
              nearEvolution ? 'glow' : '',
              evolvedRecently ? 'stage-evolved' : '',
              caredRecently ? 'care-anim' : '',
              isDragging ? 'dragging' : '',
            ].filter(Boolean).join(' ')
            const mood = petMoods[dept.department]
            const stageKey = dept.stage.key
            const stageImage = dept.stageVariant?.image || dept.stage.image_url
            const showStageImage = canShowStageImage(stageKey, stageImage, dept.species.key)
            const stageLabel = dept.stageVariant?.label || dept.stage.name
            return (
              <div
                key={dept.department}
                className={spriteClasses}
                onPointerDown={handlePointerDown(dept.department)}
                style={{
                  top: `${position.top}%`,
                  left: `${position.left}%`,
                }}
              >
                <span className="pet-icon">
                  {showStageImage ? (
                    <img
                      src={stageImage}
                      alt={`${stageLabel} sprite`}
                      className="pet-img"
                      onError={() => handleStageImageError(stageKey, dept.species.key)}
                    />
                  ) : (
                    dept.stage.icon
                  )}
                </span>
                <div className="pet-meta flex flex-col gap-1">
                  <span className="text-base font-semibold text-white">{dept.department}</span>
                  <span className="text-sm text-emerald-100 pet-stage">{stageLabel}</span>
                  <span className="text-[13px] text-emerald-200">{dept.species.displayName}</span>
                  <span className="text-sm text-emerald-200 font-semibold">{formatPoints(dept.total_points)} pts</span>
                  <div className="w-32 h-2 bg-emerald-900/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-[12px] text-emerald-100">
                    {dept.nextVariant
                      ? `${formatPoints(dept.points_to_next || 0)} pts to ${dept.nextVariant.label}`
                      : 'Fully evolved companion'}
                  </span>
                  {nearEvolution && (
                    <span className="text-[12px] text-amber-200 font-medium">
                      Almost there! Keep it up for {dept.nextVariant?.label}.
                    </span>
                  )}
                  {atCap && (
                    <span className="text-[12px] text-indigo-200 font-medium">
                      {dept.species.displayName} mastered—keep shining together!
                    </span>
                  )}
                  {mood && (
                    <span className="text-[12px] text-emerald-200">{mood.icon} {mood.message}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 text-emerald-900">Evolution Roadmap</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stages.filter((stage) => (stage.level || 0) <= 3).map((stage) => (
            <article key={stage.key} className="stage-card rounded-2xl p-5 flex flex-col gap-4">
              <header>
                <div className="stage-level-badge">
                  Stage {stage.level}
                  <span className="text-xs font-normal text-emerald-700">
                    {(stage.level - 1) * 50} pts unlock
                  </span>
                </div>
              </header>
              <div className="species-stage-list">
                {SPECIES_VARIANTS.map((species) => {
                  const speciesStage = species.stages[Math.min(stage.level - 1, species.stages.length - 1)]
                  const canShow = canShowStageImage(stage.key, speciesStage.image, species.key)
                  return (
                    <div key={`${stage.key}-${species.key}`} className="species-stage-row">
                      {canShow ? (
                        <img
                          src={speciesStage.image}
                          alt={`${species.displayName} ${speciesStage.label}`}
                          onError={() => handleStageImageError(stage.key, species.key)}
                        />
                      ) : (
                        <div className="stage-thumb-fallback">{species.shortLabel}</div>
                      )}
                      <div className="species-label">
                        <span>{species.displayName}</span>
                        <span>{speciesStage.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 text-emerald-900">Department Garden</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading progress…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : decoratedDepartments.length === 0 ? (
          <div className="text-sm text-gray-500">No departments on record yet—invite teammates to complete their profiles.</div>
        ) : (
          <div className="space-y-5">
            {decoratedDepartments.map((dept) => {
              const progress = Math.round(Math.min(Math.max(dept.progress_ratio || 0, 0), 1) * 100)
              const stageImage = dept.stageVariant?.image
              const showStageImage = canShowStageImage(dept.stage.key, stageImage, `${dept.species.key}-table`)
              const stageLabel = dept.stageVariant?.label || dept.stage.name
              const nextVariant = dept.nextVariant
              return (
                <article key={dept.department} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{dept.department}</div>
                      <div className="text-xs text-gray-500">
                        {dept.member_count} members · {formatPoints(dept.total_points)} total points · average {formatPoints(dept.average_points)} each
                      </div>
                      <div className="text-xs text-emerald-600">
                        {dept.species.displayName} · {dept.stageVariant?.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="table-icon">
                        {showStageImage ? (
                          <img
                            src={stageImage}
                            alt={`${dept.species.displayName} preview`}
                            onError={() => handleStageImageError(dept.stage.key, `${dept.species.key}-table`)}
                          />
                        ) : (
                          <div className="stage-thumb-fallback">{dept.species.shortLabel}</div>
                        )}
                      </span>
                      <div className="text-sm font-medium text-gray-900">{stageLabel}</div>
                    </div>
                  </header>
                  <p className="text-sm text-gray-600 leading-6">
                    The {dept.species.displayName} is thriving as a <strong>{stageLabel}</strong>.
                    {nextVariant ? ` Next goal: ${nextVariant.label}.` : ' This companion has reached its peak form.'}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{(dept.stage.level - 1) * 50} pts</span>
                      <span>
                        {nextVariant
                          ? `${dept.stage.level * 50} pts goal → ${nextVariant.label}`
                          : 'Top stage reached'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      {nextVariant
                        ? `${formatPoints(dept.points_to_next)} pts to ${nextVariant.label}—keep the momentum going!`
                        : `${dept.species.displayName} is already dazzling the forest ✨`}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
