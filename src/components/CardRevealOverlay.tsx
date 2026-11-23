import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'

export type CardEffectType =
  | 'coin-size'
  | 'giant-coin'
  | 'coin-rain'
  | 'shake-machine'
  | 'pusher-speed'
  | 'coin-multiply'

export type CardData = {
  uid: string
  type: CardEffectType
  badge: string
  title: string
  desc: string
  accent: string
  secondaryAccent: string
  bgGradient: string
  sizePercent?: number
  giantValue?: number
  rainCount?: number
  pusherBoost?: number
  multiplyOutcome?: 'x2' | 'x0.5'
}

const GIANT_VALUES = [5, 10, 20, 30, 40, 50] as const
const RAIN_COUNTS = [1, 5, 10, 20, 50] as const

const ALL_EFFECT_TYPES: CardEffectType[] = [
  'coin-size',
  'giant-coin',
  'coin-rain',
  'shake-machine',
  'pusher-speed',
  'coin-multiply',
]

let nextCardUid = 1

function createCardByType(type: CardEffectType): CardData {
  const uid = `card-${nextCardUid++}`

  switch (type) {
    case 'coin-size': {
      let pct = Math.floor(Math.random() * 41) - 10
      if (pct === 0) pct = 10
      const sign = pct > 0 ? `+${pct}` : `${pct}`
      return {
        uid,
        type,
        badge: 'SIZE',
        title: `동전 크기 ${sign}%`,
        desc: '앞으로 떨어지는 동전 크기가 영구 누적 변경됩니다.',
        accent: '#38bdf8',
        secondaryAccent: '#0284c7',
        bgGradient: 'linear-gradient(155deg, #0b2d4d 0%, #09172e 65%, #113a61 100%)',
        sizePercent: pct,
      }
    }
    case 'giant-coin': {
      const value = GIANT_VALUES[Math.floor(Math.random() * GIANT_VALUES.length)]
      return {
        uid,
        type,
        badge: 'GIANT',
        title: `대왕 동전 (${value})`,
        desc: `크기와 득점이 ${value}배인 거대 동전이 떨어집니다.`,
        accent: '#fbbf24',
        secondaryAccent: '#d97706',
        bgGradient: 'linear-gradient(155deg, #472808 0%, #1d1004 65%, #52300b 100%)',
        giantValue: value,
      }
    }
    case 'coin-rain': {
      const count = RAIN_COUNTS[Math.floor(Math.random() * RAIN_COUNTS.length)]
      return {
        uid,
        type,
        badge: 'RAIN',
        title: `동전 비 ${count}개`,
        desc: `하늘에서 동전 ${count}개가 한꺼번에 쏟아집니다.`,
        accent: '#34d399',
        secondaryAccent: '#059669',
        bgGradient: 'linear-gradient(155deg, #063b2d 0%, #051c17 65%, #0c4a39 100%)',
        rainCount: count,
      }
    }
    case 'shake-machine':
      return {
        uid,
        type,
        badge: 'QUAKE',
        title: '기기 흔들기',
        desc: '기기 전체를 흔들어 쌓인 동전을 쏟아냅니다.',
        accent: '#fb7185',
        secondaryAccent: '#e11d48',
        bgGradient: 'linear-gradient(155deg, #4a0e20 0%, #1e060e 65%, #59142b 100%)',
      }
    case 'pusher-speed': {
      const boost = 1 + Math.floor(Math.random() * 5)
      return {
        uid,
        type,
        badge: 'TURBO',
        title: `밀판 속도 +${boost}`,
        desc: '아래 밀판 왕복 속도가 영구적으로 빨라집니다.',
        accent: '#c084fc',
        secondaryAccent: '#9333ea',
        bgGradient: 'linear-gradient(155deg, #2f1359 0%, #140829 65%, #3e1973 100%)',
        pusherBoost: boost,
      }
    }
    case 'coin-multiply': {
      const outcome: 'x2' | 'x0.5' = Math.random() < 0.5 ? 'x2' : 'x0.5'
      return {
        uid,
        type,
        badge: 'CHANCE',
        title: '코인 ×2 or ×1/2',
        desc: '선택 시 보유 코인이 2배 또는 절반이 됩니다.',
        accent: '#f472b6',
        secondaryAccent: '#f59e0b',
        bgGradient: 'linear-gradient(155deg, #3f1045 0%, #1a0924 65%, #4f1747 100%)',
        multiplyOutcome: outcome,
      }
    }
  }
}

export function drawRandomCards(): CardData[] {
  const count = Math.random() < 0.5 ? 2 : 3
  const pool = [...ALL_EFFECT_TYPES]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pool[i]
    pool[i] = pool[j]
    pool[j] = temp
  }
  return pool.slice(0, count).map((type) => createCardByType(type))
}

function CardArtwork({ card }: { card: CardData }) {
  switch (card.type) {
    case 'coin-size':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <defs>
            <radialGradient id={`g-${card.uid}`} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="rgba(125,211,252,0.14)" strokeWidth="1">
            <line x1="0" y1="60" x2="240" y2="60" />
            <line x1="0" y1="120" x2="240" y2="120" />
            <line x1="0" y1="180" x2="240" y2="180" />
            <line x1="60" y1="0" x2="60" y2="340" />
            <line x1="120" y1="0" x2="120" y2="340" />
            <line x1="180" y1="0" x2="180" y2="340" />
          </g>
          <circle cx="120" cy="138" r="95" fill={`url(#g-${card.uid})`} />
          <circle cx="120" cy="138" r="78" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.7" />
          <circle cx="120" cy="138" r="52" fill="rgba(56,189,248,0.18)" stroke="#bae6fd" strokeWidth="3" />
          <circle cx="120" cy="138" r="30" fill="rgba(255,213,79,0.28)" stroke="#ffd54f" strokeWidth="2.5" />
          <path d="M120 44 L110 60 H130 Z M120 232 L110 216 H130 Z M26 138 L42 128 V148 Z M214 138 L198 128 V148 Z" fill="#7dd3fc" opacity="0.9" />
        </svg>
      )
    case 'giant-coin':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <defs>
            <radialGradient id={`g-${card.uid}`} cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="rgba(251,191,36,0.28)" strokeWidth="3" strokeLinecap="round">
            <line x1="42" y1="16" x2="42" y2="112" />
            <line x1="76" y1="8" x2="76" y2="86" />
            <line x1="164" y1="8" x2="164" y2="86" />
            <line x1="198" y1="16" x2="198" y2="112" />
          </g>
          <circle cx="120" cy="142" r="100" fill={`url(#g-${card.uid})`} />
          <ellipse cx="120" cy="212" rx="84" ry="16" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.55" />
          <ellipse cx="120" cy="214" rx="108" ry="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.35" />
          <circle cx="120" cy="136" r="68" fill="rgba(251,191,36,0.24)" stroke="#fde68a" strokeWidth="5" />
          <circle cx="120" cy="136" r="54" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 5" />
          <path d="M88 152 L96 116 L112 132 L120 110 L128 132 L144 116 L152 152 Z" fill="#fef08a" opacity="0.9" />
        </svg>
      )
    case 'coin-rain':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <g stroke="rgba(52,211,153,0.35)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="58" y1="92" x2="42" y2="176" />
            <line x1="96" y1="98" x2="80" y2="198" />
            <line x1="138" y1="94" x2="122" y2="188" />
            <line x1="178" y1="92" x2="162" y2="174" />
          </g>
          <path
            d="M66 94 C44 94 34 74 48 56 C54 34 86 24 110 38 C128 22 164 26 174 50 C198 52 206 84 182 94 Z"
            fill="rgba(52,211,153,0.24)"
            stroke="#6ee7b7"
            strokeWidth="2.5"
          />
          {[
            [56, 134, 15],
            [116, 122, 18],
            [168, 140, 14],
            [82, 180, 17],
            [144, 178, 19],
            [114, 212, 13],
          ].map(([cx, cy, r], idx) => (
            <g key={idx}>
              <circle cx={cx} cy={cy} r={r} fill="rgba(255,213,79,0.28)" stroke="#fde68a" strokeWidth="2.5" />
              <circle cx={cx} cy={cy} r={r * 0.58} fill="none" stroke="#34d399" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      )
    case 'shake-machine':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <g fill="none" stroke="#fb7185" strokeWidth="3" strokeLinecap="round">
            <path d="M24 106 Q14 134 26 162" opacity="0.7" />
            <path d="M38 98 Q28 134 40 170" opacity="0.95" />
            <path d="M216 106 Q226 134 214 162" opacity="0.7" />
            <path d="M202 98 Q212 134 200 170" opacity="0.95" />
          </g>
          <g transform="rotate(-7 120 142)">
            <rect x="64" y="74" width="112" height="132" rx="14" fill="rgba(251,113,133,0.16)" stroke="#fda4af" strokeWidth="3" />
            <rect x="78" y="90" width="84" height="58" rx="8" fill="rgba(255,255,255,0.08)" stroke="#fb7185" strokeWidth="2" />
            <rect x="78" y="164" width="84" height="16" rx="4" fill="rgba(251,191,36,0.35)" stroke="#fde68a" strokeWidth="2" />
          </g>
          <circle cx="70" cy="218" r="12" fill="rgba(255,213,79,0.38)" stroke="#fde68a" strokeWidth="2" />
          <circle cx="170" cy="222" r="14" fill="rgba(255,213,79,0.38)" stroke="#fde68a" strokeWidth="2" />
        </svg>
      )
    case 'pusher-speed':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <g fill="none" stroke="#c084fc" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="42,96 86,138 42,180" opacity="0.45" />
            <polyline points="92,96 136,138 92,180" opacity="0.75" />
            <polyline points="142,96 186,138 142,180" stroke="#e9d5ff" />
          </g>
          <g stroke="rgba(192,132,252,0.35)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="68" x2="118" y2="68" />
            <line x1="54" y1="208" x2="210" y2="208" />
            <line x1="30" y1="222" x2="156" y2="222" />
          </g>
        </svg>
      )
    case 'coin-multiply':
      return (
        <svg className="card-art-svg" viewBox="0 0 240 340" aria-hidden="true">
          <defs>
            <radialGradient id={`g-${card.uid}`} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="120" cy="138" r="98" fill={`url(#g-${card.uid})`} />
          <path d="M120 42 L120 234" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="84" cy="138" r="46" fill="rgba(251,191,36,0.22)" stroke="#fde68a" strokeWidth="3" />
          <circle cx="156" cy="138" r="46" fill="rgba(244,114,182,0.22)" stroke="#f9a8d4" strokeWidth="3" />
          <text x="84" y="149" textAnchor="middle" fill="#fef08a" fontSize="30" fontWeight="900">×2</text>
          <text x="156" y="149" textAnchor="middle" fill="#fbcfe8" fontSize="28" fontWeight="900">½</text>
        </svg>
      )
  }
}

const SPARKS = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2
  const distance = 155 + (index % 3) * 48
  return {
    id: index,
    tx: `${Math.round(Math.cos(angle) * distance)}px`,
    ty: `${Math.round(Math.sin(angle) * distance)}px`,
    rot: `${Math.round((angle * 180) / Math.PI)}deg`,
    delay: `${(index % 4) * 0.03}s`,
  }
})

type TiltState = {
  uid: string | null
  rx: number
  ry: number
  gx: number
  gy: number
}

const DEFAULT_TILT: TiltState = {
  uid: null,
  rx: 0,
  ry: 0,
  gx: 50,
  gy: 50,
}

export function CardRevealOverlay({
  cards,
  onSelectCard,
}: {
  cards: CardData[]
  onSelectCard: (card: CardData) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [tilt, setTilt] = useState<TiltState>(DEFAULT_TILT)

  const cardsSignature = cards.map((c) => c.uid).join('|')

  useEffect(() => {
    setRevealed(false)
    setSelectedUid(null)
    setTilt(DEFAULT_TILT)
    const timer = window.setTimeout(() => {
      setRevealed(true)
    }, 1250)
    return () => window.clearTimeout(timer)
  }, [cardsSignature])

  useEffect(() => {
    if (!selectedUid) return
    const chosen = cards.find((c) => c.uid === selectedUid)
    if (!chosen) return
    const timer = window.setTimeout(() => {
      onSelectCard(chosen)
    }, 620)
    return () => window.clearTimeout(timer)
  }, [selectedUid, cards, onSelectCard])

  const handleCardClick = (event: MouseEvent<HTMLButtonElement>, card: CardData) => {
    event.stopPropagation()
    if (!revealed || selectedUid !== null) return
    setTilt(DEFAULT_TILT)
    setSelectedUid(card.uid)
  }

  const handleCardMouseMove = (event: MouseEvent<HTMLButtonElement>, uid: string) => {
    if (!revealed || selectedUid !== null) return
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
    setTilt({
      uid,
      rx: Math.max(-16, Math.min(16, -ny * 16)),
      ry: Math.max(-20, Math.min(20, nx * 20)),
      gx: Math.max(0, Math.min(100, (nx + 1) * 50)),
      gy: Math.max(0, Math.min(100, (ny + 1) * 50)),
    })
  }

  const selectedCard = cards.find((c) => c.uid === selectedUid) ?? null

  return (
    <div
      className={`card-overlay ${selectedUid ? 'is-choosing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="카드 선택"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="card-sunburst" aria-hidden="true" />
      <div className="card-shockwave" aria-hidden="true" />
      <div className="card-reveal-flash" aria-hidden="true" />

      <div className="card-sparks" aria-hidden="true">
        {SPARKS.map((spark) => (
          <span
            key={spark.id}
            className="card-spark"
            style={
              {
                '--tx': spark.tx,
                '--ty': spark.ty,
                '--rot': spark.rot,
                '--delay': spark.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <p className={`card-pick-prompt ${revealed && !selectedUid ? 'is-visible' : ''}`}>
        원하는 카드 1장을 클릭해 선택하세요
      </p>

      <div className={`card-deck-row count-${cards.length}`}>
        {cards.map((card, index) => {
          const isSelected = selectedUid === card.uid
          const isDismissed = selectedUid !== null && !isSelected
          const isTilted = tilt.uid === card.uid

          const cardThemeStyle = {
            '--card-accent': card.accent,
            '--card-accent-2': card.secondaryAccent,
            '--card-bg': card.bgGradient,
            '--enter-delay': `${index * 0.09}s`,
          } as CSSProperties

          const tiltStyle = {
            transform:
              revealed && selectedUid === null && isTilted
                ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
                : undefined,
            transition: isTilted
              ? 'transform 0.08s ease-out'
              : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            '--holo-x': `${isTilted ? tilt.gx.toFixed(1) : '50'}%`,
            '--holo-y': `${isTilted ? tilt.gy.toFixed(1) : '50'}%`,
          } as CSSProperties

          return (
            <button
              key={card.uid}
              type="button"
              className={`card-stage ${revealed ? 'is-revealed' : ''} ${isSelected ? 'is-selected' : ''} ${isDismissed ? 'is-dismissed' : ''}`}
              style={cardThemeStyle}
              disabled={!revealed || selectedUid !== null}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => handleCardClick(event, card)}
              onMouseMove={(event) => handleCardMouseMove(event, card.uid)}
              onMouseLeave={() => setTilt(DEFAULT_TILT)}
            >
              <div className="card-spin-wrapper">
                <div className="card-tilt-wrapper" style={tiltStyle}>
                  <div className="card-face card-face-back" aria-hidden="true">
                    <div className="card-back-pattern">
                      <div className="card-back-emblem">★</div>
                    </div>
                  </div>

                  <div className="card-face card-face-front">
                    <CardArtwork card={card} />
                    <div className="card-holo-layer" aria-hidden="true" />
                    <div className="card-front-inner">
                      <span className="card-grade-badge">{card.badge}</span>

                      {isSelected && card.type === 'coin-multiply' && (
                        <span
                          className={`card-outcome-pill ${
                            card.multiplyOutcome === 'x2' ? 'is-win' : 'is-half'
                          }`}
                        >
                          {card.multiplyOutcome === 'x2' ? '결과: ×2배!' : '결과: ×1/2배'}
                        </span>
                      )}

                      <div className="card-copy-bottom">
                        <h2 className="card-title">{card.title}</h2>
                        <p className="card-desc">{card.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedCard && (
        <div
          className="card-select-burst"
          style={{ '--card-accent': selectedCard.accent } as CSSProperties}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
