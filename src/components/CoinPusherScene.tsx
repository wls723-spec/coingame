import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls, Sparkles } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'

export type SceneEffectCommand =
  | { id: number; type: 'giant-coin'; value: number }
  | { id: number; type: 'coin-rain'; count: number }
  | { id: number; type: 'shake-machine' }

function createBrushedMetalTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#353f5e')
  grad.addColorStop(0.5, '#465378')
  grad.addColorStop(1, '#394466')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  for (let i = 0; i < 950; i += 1) {
    const y = Math.random() * 462
    const x = Math.random() * 512
    const len = 36 + Math.random() * 140
    const bright = Math.random() > 0.48
    ctx.strokeStyle = bright ? 'rgba(215, 230, 255, 0.065)' : 'rgba(14, 18, 32, 0.08)'
    ctx.lineWidth = 1 + Math.random() * 1.3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo((x + len) % 512, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(18, 22, 38, 0.35)'
  ctx.lineWidth = 2
  for (let y = 96; y < 440; y += 112) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  ctx.fillStyle = '#ff9f1c'
  ctx.fillRect(0, 462, 512, 5)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 469, 512, 43)
  ctx.clip()
  ctx.fillStyle = '#22283c'
  ctx.fillRect(0, 469, 512, 43)
  ctx.fillStyle = '#ffb703'
  for (let sx = -64; sx < 576; sx += 36) {
    ctx.beginPath()
    ctx.moveTo(sx, 512)
    ctx.lineTo(sx + 18, 512)
    ctx.lineTo(sx + 46, 469)
    ctx.lineTo(sx + 28, 469)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function createCoinBumpTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = '#7c7c7c'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(cx, cy, 110, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#383838'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy, 94, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 3
  for (let i = 0; i < 36; i += 1) {
    const a = (i / 36) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * 102, cy + Math.sin(a) * 102)
    ctx.lineTo(cx + Math.cos(a) * 114, cy + Math.sin(a) * 114)
    ctx.stroke()
  }

  ctx.fillStyle = '#f2f2f2'
  ctx.strokeStyle = '#303030'
  ctx.lineWidth = 4
  ctx.beginPath()
  const spikes = 5
  const outerR = 54
  const innerR = 24
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = (i * Math.PI) / spikes - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  return new THREE.CanvasTexture(canvas)
}

const brushedMetalTexture = createBrushedMetalTexture()
const coinBumpTexture = createCoinBumpTexture()

const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16)
const coinMaterial = new THREE.MeshStandardMaterial({
  color: '#ffca28',
  metalness: 0.75,
  roughness: 0.22,
  envMapIntensity: 1.5,
  bumpMap: coinBumpTexture ?? undefined,
  bumpScale: 0.028,
})

const giantCoinMaterial = new THREE.MeshStandardMaterial({
  color: '#ffe066',
  emissive: '#ff8f00',
  emissiveIntensity: 0.22,
  metalness: 0.85,
  roughness: 0.16,
  envMapIntensity: 1.75,
  bumpMap: coinBumpTexture ?? undefined,
  bumpScale: 0.04,
})

const brushedMetalMaterial = new THREE.MeshStandardMaterial({
  map: brushedMetalTexture ?? undefined,
  color: '#ffffff',
  roughness: 0.35,
  metalness: 0.6,
})

const pusherMetalMaterial = new THREE.MeshStandardMaterial({
  map: brushedMetalTexture ?? undefined,
  color: '#d4def2',
  roughness: 0.35,
  metalness: 0.6,
})

const glassWallMaterial = new THREE.MeshStandardMaterial({
  color: '#88d4ff',
  transparent: true,
  opacity: 0.22,
  roughness: 0.12,
  metalness: 0.2,
  depthWrite: false,
})

const neonCyanMaterial = new THREE.MeshStandardMaterial({
  color: '#00e5ff',
  emissive: '#00e5ff',
  emissiveIntensity: 1.8,
  roughness: 0.2,
  metalness: 0.4,
})

const neonPinkMaterial = new THREE.MeshStandardMaterial({
  color: '#ff3d9a',
  emissive: '#ff3d9a',
  emissiveIntensity: 1.8,
  roughness: 0.2,
  metalness: 0.4,
})

const scoreNeonTrimMaterial = new THREE.MeshStandardMaterial({
  color: '#ffd54f',
  emissive: '#10e898',
  emissiveIntensity: 1.0,
  metalness: 0.82,
  roughness: 0.2,
})

const cabinetDarkMaterial = new THREE.MeshStandardMaterial({ color: '#1b2236', metalness: 0.75, roughness: 0.28 })
const backCoverMaterial = new THREE.MeshStandardMaterial({ color: '#0d1222', metalness: 0.6, roughness: 0.4 })
const gutterMaterial = new THREE.MeshStandardMaterial({ color: '#141927', metalness: 0.65, roughness: 0.4 })
const scoreBinBodyMaterial = new THREE.MeshStandardMaterial({ color: '#d4a638', metalness: 0.85, roughness: 0.22 })
const arcadePillarMaterial = new THREE.MeshStandardMaterial({ color: '#161b2e', metalness: 0.72, roughness: 0.32 })

const burstRingGeometry = new THREE.RingGeometry(0.15, 0.28, 16)
const burstSparkGeometry = new THREE.OctahedronGeometry(0.055, 0)

const GIANT_SCALE_BY_VALUE: Record<number, number> = {
  5: 1.7,
  10: 2.1,
  20: 2.5,
  30: 2.9,
  40: 3.3,
  50: 3.7,
}

type Coin = {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  value: number
  isGiant: boolean
}

type BurstItem = {
  id: number
  position: [number, number, number]
  scaleMultiplier: number
}

type CoinItemProps = {
  coin: Coin
  bodiesRef: MutableRefObject<Map<number, RapierRigidBody>>
}

const CoinItem = memo(function CoinItem({ coin, bodiesRef }: CoinItemProps) {
  return (
    <RigidBody
      ref={(body) => {
        if (body) bodiesRef.current.set(coin.id, body)
        else bodiesRef.current.delete(coin.id)
      }}
      colliders={false}
      position={coin.position}
      rotation={coin.rotation}
      friction={0.5}
      restitution={0.05}
      linearDamping={0.4}
      angularDamping={0.6}
      ccd
    >
      <CylinderCollider
        args={[0.04 * coin.scale, 0.25 * coin.scale]}
        friction={0.5}
        restitution={0.05}
        density={coin.isGiant ? 1.8 : 1.0}
      />
      <mesh
        geometry={coinGeometry}
        material={coin.isGiant ? giantCoinMaterial : coinMaterial}
        scale={coin.scale}
        castShadow={false}
        receiveShadow={false}
      />
    </RigidBody>
  )
})

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function buildInitialCoins(): Coin[] {
  const coins: Coin[] = []
  let id = 1
  const scatter = (count: number, xRange: [number, number], zRange: [number, number], indexOffset: number) => {
    for (let index = 0; index < count; index += 1) {
      const globalIndex = indexOffset + index
      coins.push({
        id: id++,
        position: [
          randomBetween(xRange[0], xRange[1]),
          1.2 + globalIndex * 0.045,
          randomBetween(zRange[0], zRange[1]),
        ],
        rotation: [randomBetween(-0.34, 0.34), randomBetween(-0.34, 0.34), randomBetween(-0.34, 0.34)],
        scale: 1,
        value: 1,
        isGiant: false,
      })
    }
  }
  scatter(35, [-2.3, 2.3], [-2.9, -0.7], 0)
  scatter(80, [-2.3, 2.3], [-0.1, 2.45], 35)
  return coins
}

export function CoinPusherScene({
  canDrop,
  isPaused,
  coinScale,
  pusherSpeed,
  effectCommand,
  onDrop,
  onScoreCoin,
  onLostCoin,
}: {
  canDrop: boolean
  isPaused: boolean
  coinScale: number
  pusherSpeed: number
  effectCommand: SceneEffectCommand | null
  onDrop: () => boolean
  onScoreCoin: (amount: number) => void
  onLostCoin: () => void
}) {
  const [coins, setCoins] = useState<Coin[]>(buildInitialCoins)
  const [bursts, setBursts] = useState<BurstItem[]>([])
  const bodiesRef = useRef(new Map<number, RapierRigidBody>())
  const coinsByIdRef = useRef(new Map<number, Coin>())
  const processedIdsRef = useRef(new Set<number>())
  const chuteXRef = useRef(0)
  const elapsedRef = useRef(0)
  const nextIdRef = useRef(10000)
  const nextBurstIdRef = useRef(1)
  const lastCommandIdRef = useRef(0)
  const shakeRemainingRef = useRef(0)
  const shakePulsesLeftRef = useRef(0)
  const shakePulseTimerRef = useRef(0)
  const shakeVisualGroupRef = useRef<THREE.Group>(null)

  const canDropRef = useRef(canDrop)
  const isPausedRef = useRef(isPaused)
  const coinScaleRef = useRef(coinScale)
  const pusherSpeedRef = useRef(pusherSpeed)
  const onDropRef = useRef(onDrop)

  useEffect(() => {
    canDropRef.current = canDrop
    isPausedRef.current = isPaused
    coinScaleRef.current = coinScale
    pusherSpeedRef.current = pusherSpeed
    onDropRef.current = onDrop
  }, [canDrop, isPaused, coinScale, pusherSpeed, onDrop])

  useEffect(() => {
    const map = coinsByIdRef.current
    map.clear()
    coins.forEach((coin) => map.set(coin.id, coin))
  }, [coins])

  useEffect(() => {
    if (!effectCommand || effectCommand.id === lastCommandIdRef.current) return
    lastCommandIdRef.current = effectCommand.id

    if (effectCommand.type === 'giant-coin') {
      const value = effectCommand.value
      const scale = GIANT_SCALE_BY_VALUE[value] ?? 2.4
      const id = nextIdRef.current++
      setCoins((current) => [
        ...current,
        {
          id,
          position: [randomBetween(-1.05, 1.05), 3.1, randomBetween(-1.3, 0.1)],
          rotation: [randomBetween(-0.18, 0.18), randomBetween(0, Math.PI * 2), randomBetween(-0.18, 0.18)],
          scale,
          value,
          isGiant: true,
        },
      ])
    } else if (effectCommand.type === 'coin-rain') {
      const scale = coinScaleRef.current
      const added: Coin[] = []
      for (let i = 0; i < effectCommand.count; i += 1) {
        added.push({
          id: nextIdRef.current++,
          position: [
            randomBetween(-2.2, 2.2),
            2.5 + i * 0.08,
            randomBetween(-2.2, 1.6),
          ],
          rotation: [randomBetween(-0.45, 0.45), randomBetween(-0.45, 0.45), randomBetween(-0.45, 0.45)],
          scale,
          value: 1,
          isGiant: false,
        })
      }
      setCoins((current) => [...current, ...added])
    } else if (effectCommand.type === 'shake-machine') {
      shakeRemainingRef.current = 0.85
      shakePulsesLeftRef.current = 4
      shakePulseTimerRef.current = 0
    }
  }, [effectCommand])

  const removeCoins = useCallback((ids: number[]) => {
    if (!ids.length) return
    setCoins((current) => current.filter((coin) => !ids.includes(coin.id)))
  }, [])

  const spawnBurst = useCallback((position: [number, number, number], scaleMultiplier = 1) => {
    const id = nextBurstIdRef.current++
    setBursts((current) => [...current.slice(-19), { id, position, scaleMultiplier }])
  }, [])

  const removeBurst = useCallback((id: number) => {
    setBursts((current) => current.filter((item) => item.id !== id))
  }, [])

  const dropCoin = useCallback(() => {
    if (isPausedRef.current || !canDropRef.current || !onDropRef.current()) return
    const id = nextIdRef.current++
    const scale = coinScaleRef.current
    setCoins((current) => [
      ...current,
      {
        id,
        position: [chuteXRef.current, 2.0 + Math.max(0, scale - 1) * 0.25, -2.75],
        rotation: [0, 0, Math.PI / 2],
        scale,
        value: 1,
        isGiant: false,
      },
    ])
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault()
        dropCoin()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dropCoin])

  return (
    <div className="scene">
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{ toneMappingExposure: 1.25 }}
        camera={{ position: [0, 5.8, 9.6], fov: 45 }}
        onPointerDown={dropCoin}
      >
        <color attach="background" args={['#090617']} />
        <fog attach="fog" args={['#090617', 14, 28]} />

        <directionalLight position={[1, 8, 12]} intensity={2.2} color="#fff6e0" />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#ffffff', '#3a325c', 1.1]} />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 6, 12]} scale={[18, 12, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.8} color="#fff1cc" position={[0, 10, 2]} scale={[14, 14, 1]} rotation={[Math.PI / 2, 0, 0]} />
          <Lightformer form="rect" intensity={2.5} color="#ff3d9a" position={[-10, 3, 2]} scale={[10, 8, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={2.5} color="#00e5ff" position={[10, 3, 2]} scale={[10, 8, 1]} target={[0, 0, 0]} />
        </Environment>

        <FrameController
          isPaused={isPaused}
          elapsedRef={elapsedRef}
          bodiesRef={bodiesRef}
          processedIdsRef={processedIdsRef}
          shakeRemainingRef={shakeRemainingRef}
          shakePulsesLeftRef={shakePulsesLeftRef}
          shakePulseTimerRef={shakePulseTimerRef}
          shakeVisualGroupRef={shakeVisualGroupRef}
        />

        <Physics gravity={[0, -9.81, 0]} paused={isPaused}>
          <MachineCabinetColliders />
          <PusherBar isPaused={isPaused} pusherSpeedRef={pusherSpeedRef} />
          <CoinMonitor
            isPaused={isPaused}
            bodiesRef={bodiesRef}
            coinsByIdRef={coinsByIdRef}
            processedIdsRef={processedIdsRef}
            removeCoins={removeCoins}
            onScoreCoin={onScoreCoin}
            onLostCoin={onLostCoin}
            onScoreBurst={spawnBurst}
          />
          {coins.map((coin) => (
            <CoinItem key={coin.id} coin={coin} bodiesRef={bodiesRef} />
          ))}
          <DropChute xRef={chuteXRef} elapsedRef={elapsedRef} coinScale={coinScale} />
        </Physics>

        <group ref={shakeVisualGroupRef}>
          <MachineCabinetVisuals />
          <ArcadeDecor elapsedRef={elapsedRef} />
        </group>

        <Sparkles count={45} scale={[12, 8, 10]} size={2.2} speed={0.35} color="#ffd700" opacity={0.5} />

        {bursts.map((burst) => (
          <CoinBurst
            key={burst.id}
            id={burst.id}
            position={burst.position}
            scaleMultiplier={burst.scaleMultiplier}
            isPaused={isPaused}
            onDone={removeBurst}
          />
        ))}

        <OrbitControls target={[0, -0.4, 0.4]} minDistance={7} maxDistance={16} minPolarAngle={0.55} maxPolarAngle={1.35} />
      </Canvas>
    </div>
  )
}

function FrameController({
  isPaused,
  elapsedRef,
  bodiesRef,
  processedIdsRef,
  shakeRemainingRef,
  shakePulsesLeftRef,
  shakePulseTimerRef,
  shakeVisualGroupRef,
}: {
  isPaused: boolean
  elapsedRef: MutableRefObject<number>
  bodiesRef: MutableRefObject<Map<number, RapierRigidBody>>
  processedIdsRef: MutableRefObject<Set<number>>
  shakeRemainingRef: MutableRefObject<number>
  shakePulsesLeftRef: MutableRefObject<number>
  shakePulseTimerRef: MutableRefObject<number>
  shakeVisualGroupRef: MutableRefObject<THREE.Group | null>
}) {
  const headLightRef = useRef<THREE.PointLight>(null)

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)

    if (!isPaused) {
      elapsedRef.current += dt

      if (scoreNeonTrimMaterial.emissiveIntensity > 1.0) {
        scoreNeonTrimMaterial.emissiveIntensity = Math.max(
          1.0,
          scoreNeonTrimMaterial.emissiveIntensity - dt * 6.0,
        )
      }

      if (shakeRemainingRef.current > 0) {
        shakeRemainingRef.current = Math.max(0, shakeRemainingRef.current - dt)
        const age = 0.85 - shakeRemainingRef.current
        const envelope = Math.exp(-age * 4.2)

        if (shakeVisualGroupRef.current) {
          shakeVisualGroupRef.current.position.set(
            Math.sin(age * 48) * 0.14 * envelope,
            Math.abs(Math.sin(age * 36)) * 0.06 * envelope,
            Math.cos(age * 40) * 0.1 * envelope,
          )
        }

        shakePulseTimerRef.current -= dt
        if (shakePulsesLeftRef.current > 0 && shakePulseTimerRef.current <= 0) {
          shakePulsesLeftRef.current -= 1
          shakePulseTimerRef.current = 0.14

          bodiesRef.current.forEach((body, id) => {
            if (processedIdsRef.current.has(id)) return
            if (!body || (typeof body.isValid === 'function' && !body.isValid())) {
              bodiesRef.current.delete(id)
              return
            }
            try {
              const pos = body.translation()
              if (pos.y < -0.5 || pos.z > 2.9) return
              const m = body.mass()
              if (!Number.isFinite(m) || m <= 0) return
              body.applyImpulse(
                {
                  x: m * randomBetween(-1.2, 1.2),
                  y: m * randomBetween(0.65, 1.05),
                  z: m * randomBetween(0.55, 1.15),
                },
                true,
              )
            } catch {
              bodiesRef.current.delete(id)
            }
          })
        }

        if (shakeRemainingRef.current === 0 && shakeVisualGroupRef.current) {
          shakeVisualGroupRef.current.position.set(0, 0, 0)
        }
      }
    }

    headLightRef.current?.position.copy(camera.position)
  })

  return <pointLight ref={headLightRef} intensity={1.4} decay={0} distance={30} color="#fff9ee" />
}

function CoinMonitor({
  isPaused,
  bodiesRef,
  coinsByIdRef,
  processedIdsRef,
  removeCoins,
  onScoreCoin,
  onLostCoin,
  onScoreBurst,
}: {
  isPaused: boolean
  bodiesRef: MutableRefObject<Map<number, RapierRigidBody>>
  coinsByIdRef: MutableRefObject<Map<number, Coin>>
  processedIdsRef: MutableRefObject<Set<number>>
  removeCoins: (ids: number[]) => void
  onScoreCoin: (amount: number) => void
  onLostCoin: () => void
  onScoreBurst: (position: [number, number, number], scaleMultiplier: number) => void
}) {
  useFrame(() => {
    if (isPaused) return
    const removed: number[] = []
    bodiesRef.current.forEach((body, id) => {
      if (processedIdsRef.current.has(id)) return
      if (!body || (typeof body.isValid === 'function' && !body.isValid())) {
        bodiesRef.current.delete(id)
        return
      }
      let pos: { x: number; y: number; z: number }
      try {
        pos = body.translation()
      } catch {
        bodiesRef.current.delete(id)
        return
      }
      const coin = coinsByIdRef.current.get(id)
      const isGiant = coin?.isGiant ?? false
      const fallenNormal = pos.y < -1.25
      const fallenGiantInBin = isGiant && pos.y < -0.55 && pos.z > 3.05
      if (!fallenNormal && !fallenGiantInBin) return

      processedIdsRef.current.add(id)
      bodiesRef.current.delete(id)
      removed.push(id)

      if (pos.z > 2.75 && Math.abs(pos.x) <= 2.85) {
        const value = coin?.value ?? 1
        scoreNeonTrimMaterial.emissiveIntensity = isGiant ? 5.0 : 3.5
        onScoreBurst([pos.x, pos.y + 0.15, pos.z], isGiant ? 1.85 : 1)
        onScoreCoin(value)
      } else {
        onLostCoin()
      }
    })
    if (removed.length) removeCoins(removed)
  })
  return null
}

const BURST_DURATION = 0.45

const SPARK_DIRECTIONS: ReadonlyArray<[number, number, number]> = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2 + 0.3
  return [Math.cos(angle) * 1.9, 2.5 + (index % 2) * 0.8, Math.sin(angle) * 1.9]
})

function CoinBurst({
  id,
  position,
  scaleMultiplier,
  isPaused,
  onDone,
}: {
  id: number
  position: [number, number, number]
  scaleMultiplier: number
  isPaused: boolean
  onDone: (id: number) => void
}) {
  const ageRef = useRef(0)
  const doneRef = useRef(false)
  const ringRef = useRef<THREE.Mesh>(null)
  const ghostRef = useRef<THREE.Mesh>(null)
  const sparkRefs = useRef<Array<THREE.Mesh | null>>([])

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffd54f',
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  )

  const ghostMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffca28',
        emissive: '#ffdd55',
        emissiveIntensity: 2,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 1,
      }),
    [],
  )

  const sparkMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffe57f',
        transparent: true,
        opacity: 1,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      ringMaterial.dispose()
      ghostMaterial.dispose()
      sparkMaterial.dispose()
    }
  }, [ringMaterial, ghostMaterial, sparkMaterial])

  useFrame((_, delta) => {
    if (isPaused || doneRef.current) return
    ageRef.current += Math.min(delta, 0.05)
    const t = Math.min(1, ageRef.current / BURST_DURATION)

    if (ringRef.current) {
      const s = (0.6 + t * 2.2) * scaleMultiplier
      ringRef.current.scale.set(s, s, s)
      ringMaterial.opacity = 1 - t
    }

    if (ghostRef.current) {
      ghostRef.current.position.y = t * 0.8 * scaleMultiplier
      ghostRef.current.rotation.y += delta * 18
      const gs = Math.max(0.01, 1.2 * (1 - t) * scaleMultiplier)
      ghostRef.current.scale.set(gs, gs, gs)
      ghostMaterial.opacity = 1 - t
    }

    const age = ageRef.current
    SPARK_DIRECTIONS.forEach(([vx, vy, vz], index) => {
      const spark = sparkRefs.current[index]
      if (!spark) return
      spark.position.set(
        vx * age * scaleMultiplier,
        (vy * age - 4.8 * age * age) * scaleMultiplier,
        vz * age * scaleMultiplier,
      )
      const ss = Math.max(0.01, 1.15 * (1 - t) * scaleMultiplier)
      spark.scale.set(ss, ss, ss)
    })
    sparkMaterial.opacity = 1 - t

    if (t >= 1) {
      doneRef.current = true
      onDone(id)
    }
  })

  return (
    <group position={position}>
      <mesh ref={ringRef} geometry={burstRingGeometry} material={ringMaterial} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh ref={ghostRef} geometry={coinGeometry} material={ghostMaterial} />
      {SPARK_DIRECTIONS.map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            sparkRefs.current[index] = el
          }}
          geometry={burstSparkGeometry}
          material={sparkMaterial}
        />
      ))}
    </group>
  )
}

function MachineCabinetColliders() {
  return (
    <RigidBody type="fixed" friction={0.82} restitution={0.03}>
      <CuboidCollider args={[2.8, 0.25, 3.0]} position={[0, -0.25, -0.2]} />
      <CuboidCollider args={[2.8, 2.5, 0.2]} position={[0, 3.08, -3.4]} />
      <CuboidCollider args={[0.1, 2.0, 2.35]} position={[-2.9, 2.0, -0.85]} />
      <CuboidCollider args={[0.1, 2.0, 2.35]} position={[2.9, 2.0, -0.85]} />

      {[-2.85, 2.85].map((x) => (
        <CuboidCollider key={`div-col-${x}`} args={[0.05, 1.0, 1.9]} position={[x, -1.05, 3.4]} />
      ))}

      <CuboidCollider args={[2.8, 0.1, 1.2]} position={[0, -1.8, 4.0]} />
      <CuboidCollider args={[2.8, 0.6, 0.1]} position={[0, -1.3, 5.2]} />

      {[-3.9, 3.9].map((x) => (
        <group key={`gutter-col-${x}`}>
          <CuboidCollider args={[1.0, 0.1, 0.9]} position={[x, -1.8, 2.15]} />
          <CuboidCollider args={[1.0, 0.6, 0.1]} position={[x, -1.3, 3.05]} />
          <CuboidCollider args={[1.0, 0.6, 0.1]} position={[x, -1.3, 1.25]} />
          <CuboidCollider args={[0.1, 0.6, 0.9]} position={[x + (x < 0 ? -1.0 : 1.0), -1.3, 2.15]} />
        </group>
      ))}
    </RigidBody>
  )
}

function MachineCabinetVisuals() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.25, -0.2]} material={brushedMetalMaterial}>
        <boxGeometry args={[5.6, 0.5, 6.0]} />
      </mesh>
      <mesh position={[0, 3.08, -3.4]} material={cabinetDarkMaterial}>
        <boxGeometry args={[5.6, 5.0, 0.4]} />
      </mesh>
      <mesh position={[-2.9, 2.0, -0.85]} material={glassWallMaterial}>
        <boxGeometry args={[0.2, 4.0, 4.7]} />
      </mesh>
      <mesh position={[2.9, 2.0, -0.85]} material={glassWallMaterial}>
        <boxGeometry args={[0.2, 4.0, 4.7]} />
      </mesh>

      {[-2.85, 2.85].map((x) => (
        <mesh key={`div-vis-${x}`} position={[x, -1.05, 3.4]} material={cabinetDarkMaterial}>
          <boxGeometry args={[0.1, 2.0, 3.8]} />
        </mesh>
      ))}

      <mesh position={[0, -1.8, 4.0]} material={scoreBinBodyMaterial}>
        <boxGeometry args={[5.6, 0.2, 2.4]} />
      </mesh>
      <mesh position={[0, -1.3, 5.2]} material={scoreBinBodyMaterial}>
        <boxGeometry args={[5.6, 1.2, 0.2]} />
      </mesh>
      <mesh position={[-2.68, -1.3, 4.0]} material={scoreBinBodyMaterial}>
        <boxGeometry args={[0.24, 1.2, 2.4]} />
      </mesh>
      <mesh position={[2.68, -1.3, 4.0]} material={scoreBinBodyMaterial}>
        <boxGeometry args={[0.24, 1.2, 2.4]} />
      </mesh>

      {[-3.9, 3.9].map((x) => (
        <group key={`gutter-vis-${x}`}>
          <mesh position={[x, -1.8, 2.15]} material={gutterMaterial}>
            <boxGeometry args={[2.0, 0.2, 1.8]} />
          </mesh>
          <mesh position={[x, -1.3, 3.05]} material={gutterMaterial}>
            <boxGeometry args={[2.0, 1.2, 0.2]} />
          </mesh>
          <mesh position={[x, -1.3, 1.25]} material={gutterMaterial}>
            <boxGeometry args={[2.0, 1.2, 0.2]} />
          </mesh>
          <mesh position={[x + (x < 0 ? -1.0 : 1.0), -1.3, 2.15]} material={gutterMaterial}>
            <boxGeometry args={[0.2, 1.2, 1.8]} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 2.5, -5.8]} material={backCoverMaterial}>
        <boxGeometry args={[5.8, 5.4, 4.8]} />
      </mesh>

      {[-2.9, 2.9].map((x) => {
        const trimMat = x < 0 ? neonPinkMaterial : neonCyanMaterial
        return (
          <group key={`wall-neon-${x}`}>
            <mesh position={[x, 4.02, -0.85]} material={trimMat}>
              <boxGeometry args={[0.24, 0.08, 4.74]} />
            </mesh>
            <mesh position={[x, 0.04, -0.85]} material={trimMat}>
              <boxGeometry args={[0.24, 0.08, 4.74]} />
            </mesh>
            <mesh position={[x, 2.0, 1.5]} material={trimMat}>
              <boxGeometry args={[0.24, 4.04, 0.08]} />
            </mesh>
          </group>
        )
      })}

      <mesh position={[0, -0.68, 5.2]} material={scoreNeonTrimMaterial}>
        <boxGeometry args={[5.76, 0.1, 0.26]} />
      </mesh>
      <mesh position={[-2.74, -0.68, 4.0]} material={scoreNeonTrimMaterial}>
        <boxGeometry args={[0.14, 0.1, 2.48]} />
      </mesh>
      <mesh position={[2.74, -0.68, 4.0]} material={scoreNeonTrimMaterial}>
        <boxGeometry args={[0.14, 0.1, 2.48]} />
      </mesh>
    </group>
  )
}

const LED_ROWS = [0.6, 1.3, 2.0, 2.7, 3.4, 4.1, 4.8]

function ArcadeDecor({ elapsedRef }: { elapsedRef: MutableRefObject<number> }) {
  const bulbMaterials = useMemo(
    () =>
      LED_ROWS.map(
        (_, index) =>
          new THREE.MeshStandardMaterial({
            color: index % 2 === 0 ? '#ff3d9a' : '#00e5ff',
            emissive: index % 2 === 0 ? '#ff3d9a' : '#00e5ff',
            emissiveIntensity: 1.5,
            roughness: 0.2,
          }),
      ),
    [],
  )

  useEffect(() => {
    return () => {
      bulbMaterials.forEach((mat) => mat.dispose())
    }
  }, [bulbMaterials])

  useFrame(() => {
    const t = elapsedRef.current
    bulbMaterials.forEach((mat, index) => {
      const wave = Math.sin(t * 5.2 - index * 0.85)
      mat.emissiveIntensity = wave > 0 ? 2.8 : 0.35
    })
  })

  return (
    <group>
      {[-3.22, 3.22].map((x) => (
        <group key={`pillar-${x}`}>
          <mesh position={[x, 2.55, -3.42]} material={arcadePillarMaterial}>
            <boxGeometry args={[0.42, 6.1, 0.55]} />
          </mesh>
          <mesh position={[x, 2.55, -3.13]} material={x < 0 ? neonPinkMaterial : neonCyanMaterial}>
            <boxGeometry args={[0.08, 5.8, 0.05]} />
          </mesh>
          {LED_ROWS.map((y, index) => (
            <mesh key={`led-${x}-${index}`} position={[x + (x < 0 ? 0.14 : -0.14), y, -3.12]} material={bulbMaterials[index]}>
              <sphereGeometry args={[0.075, 10, 10]} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 5.55, -3.42]} material={arcadePillarMaterial}>
        <boxGeometry args={[6.9, 0.65, 0.6]} />
      </mesh>
      <mesh position={[0, 5.55, -3.1]} material={scoreNeonTrimMaterial}>
        <boxGeometry args={[6.2, 0.18, 0.06]} />
      </mesh>
    </group>
  )
}

function PusherBar({
  isPaused,
  pusherSpeedRef,
}: {
  isPaused: boolean
  pusherSpeedRef: MutableRefObject<number>
}) {
  const body = useRef<RapierRigidBody>(null)
  const phaseRef = useRef(0)

  useFrame((_, delta) => {
    if (!isPaused) {
      phaseRef.current += Math.min(delta, 0.05) * pusherSpeedRef.current
    }
    const z = -3.1 + Math.sin(phaseRef.current) * 1.9
    body.current?.setNextKinematicTranslation({ x: 0, y: 0.2, z })
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" position={[0, 0.2, -3.1]} friction={0.6} restitution={0.05} ccd>
      <CuboidCollider args={[2.78, 0.4, 2.7]} friction={0.6} restitution={0.05} />
      <mesh castShadow receiveShadow material={pusherMetalMaterial}>
        <boxGeometry args={[5.56, 0.8, 5.4]} />
      </mesh>
    </RigidBody>
  )
}

function DropChute({
  xRef,
  elapsedRef,
  coinScale,
}: {
  xRef: MutableRefObject<number>
  elapsedRef: MutableRefObject<number>
  coinScale: number
}) {
  const marker = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const x = Math.sin((elapsedRef.current / 3.2) * Math.PI * 2) * 2.2
    xRef.current = x
    if (marker.current) marker.current.position.x = x
  })
  return (
    <mesh
      ref={marker}
      position={[0, 2.0, -2.75]}
      rotation={[0, 0, Math.PI / 2]}
      scale={coinScale}
      geometry={coinGeometry}
      material={coinMaterial}
      castShadow={false}
      receiveShadow={false}
    />
  )
}
