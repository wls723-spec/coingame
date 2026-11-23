import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { CoinPusherScene } from './components/CoinPusherScene'
import type { SceneEffectCommand } from './components/CoinPusherScene'
import { CardRevealOverlay, drawRandomCards } from './components/CardRevealOverlay'
import type { CardData } from './components/CardRevealOverlay'

const INITIAL_COINS = 1
const BASE_PUSHER_SPEED = 0.9

export default function App() {
  const [coins, setCoins] = useState(INITIAL_COINS)
  const [maxCoins, setMaxCoins] = useState(INITIAL_COINS)
  const [popTick, setPopTick] = useState(0)
  const [lastDeltaLabel, setLastDeltaLabel] = useState('+1')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [activeCards, setActiveCards] = useState<CardData[] | null>(null)
  const [coinScale, setCoinScale] = useState(1)
  const [pusherSpeed, setPusherSpeed] = useState(BASE_PUSHER_SPEED)
  const [pusherLevel, setPusherLevel] = useState(0)
  const [effectCommand, setEffectCommand] = useState<SceneEffectCommand | null>(null)
  const [effectBanner, setEffectBanner] = useState<{ id: number; text: string; accent: string } | null>(null)
  const [gameKey, setGameKey] = useState(0)

  const coinsRef = useRef(INITIAL_COINS)
  const isGameOverRef = useRef(false)
  const activeCardsRef = useRef<CardData[] | null>(null)
  const commandIdRef = useRef(0)

  const showToast = useCallback((text: string, accent: string) => {
    setEffectBanner({ id: Date.now() + Math.random(), text, accent })
  }, [])

  useEffect(() => {
    if (!effectBanner) return
    const timer = window.setTimeout(() => {
      setEffectBanner(null)
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [effectBanner])

  const handleDrop = useCallback(() => {
    if (coinsRef.current <= 0 || isGameOverRef.current || activeCardsRef.current !== null) return false
    const nextCoins = coinsRef.current - 1
    coinsRef.current = nextCoins
    setCoins(nextCoins)
    return true
  }, [])

  const handleScoreCoin = useCallback((amount: number) => {
    if (isGameOverRef.current) return
    const nextCoins = coinsRef.current + amount
    coinsRef.current = nextCoins
    setCoins(nextCoins)
    setMaxCoins((prev) => Math.max(prev, nextCoins))
    setLastDeltaLabel(`+${amount}`)
    setPopTick((prev) => prev + 1)
  }, [])

  const handleDrawCards = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (coinsRef.current < 5 || isGameOverRef.current || activeCardsRef.current !== null) return
    const nextCoins = coinsRef.current - 5
    coinsRef.current = nextCoins
    setCoins(nextCoins)
    const drawn = drawRandomCards()
    activeCardsRef.current = drawn
    setActiveCards(drawn)
  }, [])

  const handleSelectCard = useCallback(
    (card: CardData) => {
      activeCardsRef.current = null
      setActiveCards(null)

      switch (card.type) {
        case 'coin-size': {
          const pct = card.sizePercent ?? 0
          setCoinScale((prev) => Math.max(0.5, Math.min(2.8, Number((prev * (1 + pct / 100)).toFixed(3)))))
          showToast(`동전 크기 ${pct > 0 ? `+${pct}` : pct}% 누적!`, card.accent)
          break
        }
        case 'giant-coin': {
          const value = card.giantValue ?? 10
          setEffectCommand({ id: ++commandIdRef.current, type: 'giant-coin', value })
          showToast(`대왕 동전 (${value}) 낙하!`, card.accent)
          break
        }
        case 'coin-rain': {
          const count = card.rainCount ?? 10
          setEffectCommand({ id: ++commandIdRef.current, type: 'coin-rain', count })
          showToast(`동전 비 ${count}개!`, card.accent)
          break
        }
        case 'shake-machine': {
          setEffectCommand({ id: ++commandIdRef.current, type: 'shake-machine' })
          showToast('기기 흔들기 발동!', card.accent)
          break
        }
        case 'pusher-speed': {
          const boost = card.pusherBoost ?? 1
          setPusherSpeed((prev) => Math.min(4.2, Number((prev + boost * 0.22).toFixed(3))))
          setPusherLevel((prev) => prev + boost)
          showToast(`밀판 속도 +${boost} 강화!`, card.accent)
          break
        }
        case 'coin-multiply': {
          const outcome = card.multiplyOutcome ?? 'x2'
          const current = coinsRef.current
          const next = outcome === 'x2' ? current * 2 : Math.floor(current / 2)
          coinsRef.current = next
          setCoins(next)
          setMaxCoins((prev) => Math.max(prev, next))
          setLastDeltaLabel(outcome === 'x2' ? '×2!' : '×1/2')
          setPopTick((prev) => prev + 1)
          showToast(
            outcome === 'x2' ? '보유 코인 ×2배!!' : '보유 코인 ×1/2배...',
            outcome === 'x2' ? '#ffd54f' : '#fb7185',
          )
          break
        }
      }
    },
    [showToast],
  )

  const handleRestart = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation()
    coinsRef.current = INITIAL_COINS
    isGameOverRef.current = false
    activeCardsRef.current = null
    setCoins(INITIAL_COINS)
    setMaxCoins(INITIAL_COINS)
    setCountdown(null)
    setIsGameOver(false)
    setActiveCards(null)
    setCoinScale(1)
    setPusherSpeed(BASE_PUSHER_SPEED)
    setPusherLevel(0)
    setEffectCommand(null)
    setEffectBanner(null)
    setPopTick(0)
    setLastDeltaLabel('+1')
    setGameKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (coins > 0 || isGameOver || activeCards !== null) {
      setCountdown(null)
      return
    }
    if (countdown === null) {
      setCountdown(10)
      return
    }
    if (countdown <= 0) {
      isGameOverRef.current = true
      setIsGameOver(true)
      setCountdown(null)
      return
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [coins, isGameOver, activeCards, countdown])

  const stopButtonPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const canDrawCard = coins >= 5 && !isGameOver && activeCards === null
  const scalePercent = Math.round(coinScale * 100)

  return (
    <main className="app-shell">
      <CoinPusherScene
        key={gameKey}
        canDrop={coins > 0 && !isGameOver && activeCards === null}
        isPaused={activeCards !== null}
        coinScale={coinScale}
        pusherSpeed={pusherSpeed}
        effectCommand={effectCommand}
        onDrop={handleDrop}
        onScoreCoin={handleScoreCoin}
        onLostCoin={() => undefined}
      />

      <aside className="hud-top-right" aria-label="코인 및 카드 HUD">
        <div className="hud-coin-box">
          <div className="hud-coin-badge" aria-hidden="true">
            <span>¢</span>
          </div>
          <div className="hud-coin-number-wrap">
            {popTick > 0 && (
              <span key={`plus-${popTick}`} className="hud-plus-one" aria-hidden="true">
                {lastDeltaLabel}
              </span>
            )}
            <span
              key={`count-${popTick}`}
              className={popTick > 0 ? 'hud-coin-count is-bouncing' : 'hud-coin-count'}
            >
              {coins}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`hud-card-button ${canDrawCard ? 'is-ready' : ''}`}
          disabled={!canDrawCard}
          onPointerDown={stopButtonPointer}
          onClick={handleDrawCards}
          aria-label="5코인으로 카드 뽑기"
        >
          <span className="mini-card-silhouette" aria-hidden="true">
            <span className="mini-card-star">✦</span>
          </span>
          <span className="mini-card-cost">5 코인</span>
        </button>

        {(scalePercent !== 100 || pusherLevel > 0) && (
          <div className="hud-buff-list" aria-label="누적 강화 효과">
            {scalePercent !== 100 && <span className="hud-buff-pill">동전 크기 {scalePercent}%</span>}
            {pusherLevel > 0 && <span className="hud-buff-pill">밀판 속도 +{pusherLevel}</span>}
          </div>
        )}
      </aside>

      {effectBanner && (
        <div
          key={effectBanner.id}
          className="effect-toast"
          style={{ borderColor: effectBanner.accent, color: effectBanner.accent }}
          role="status"
        >
          {effectBanner.text}
        </div>
      )}

      {countdown !== null && countdown > 0 && !isGameOver && activeCards === null && (
        <div className="countdown-banner" role="status" aria-live="polite">
          <span className="countdown-label">코인이 충전되지 않으면 종료됩니다</span>
          <strong key={countdown} className="countdown-number">
            {countdown}
          </strong>
        </div>
      )}

      {activeCards && <CardRevealOverlay cards={activeCards} onSelectCard={handleSelectCard} />}

      {isGameOver && (
        <section
          className="game-over"
          role="dialog"
          aria-modal="true"
          aria-label="게임 종료"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="game-over-card">
            <p>게임 종료</p>
            <strong>최고 보유 코인: {maxCoins}개</strong>
            <button type="button" onPointerDown={stopButtonPointer} onClick={handleRestart}>
              다시 하기
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
