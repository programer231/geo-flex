import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import land110 from 'world-atlas/land-110m.json'

export interface GlobeMarker { id: string; lat: number; lon: number; color: string; label: string; detail?: string; size?: number }
interface Props {
  markers: GlobeMarker[]
  outline?: [number, number][]
  selectionBounds?: [[number, number], [number, number]]
  selectedId?: string | null
  onSelect?: (id: string) => void
  focus?: { lat: number; lon: number }
  className?: string
}

const toVec = (lat: number, lon: number, r = 1) => {
  const phi = ((lon + 180) * Math.PI) / 180
  const la = (lat * Math.PI) / 180
  return new THREE.Vector3(-r * Math.cos(phi) * Math.cos(la), r * Math.sin(la), r * Math.sin(phi) * Math.cos(la))
}
function makeEarthTexture(outline?: [number, number][], selectionBounds?: [[number, number], [number, number]]): THREE.CanvasTexture {
  const W = 2048, H = 1024
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2])
  const path = geoPath(proj, ctx)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0d1a2e'); grad.addColorStop(0.5, '#0a1425'); grad.addColorStop(1, '#0d1a2e')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)
  ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = 'rgba(120,150,190,0.10)'; ctx.lineWidth = 1; ctx.stroke()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topo = land110 as any
  const land = feature(topo, topo.objects.land)
  ctx.beginPath(); path(land as never); ctx.fillStyle = '#1c3050'; ctx.fill()
  ctx.strokeStyle = 'rgba(120,170,230,0.45)'; ctx.lineWidth = 1.1; ctx.stroke()
  if (outline) {
    ctx.beginPath()
    outline.forEach(([lon, lat], i) => {
      const [x, y] = proj([lon, lat])!
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    })
    ctx.closePath(); ctx.fillStyle = 'rgba(54,214,232,0.22)'; ctx.fill(); ctx.strokeStyle = '#36D6E8'; ctx.lineWidth = 2; ctx.stroke()
  }
  if (selectionBounds) {
    const [[south, west], [north, east]] = selectionBounds
    const corners = [[west, south], [east, south], [east, north], [west, north]] as [number, number][]
    ctx.beginPath()
    corners.forEach(([lon, lat], index) => {
      const [x, y] = proj([lon, lat])!
      if (index) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(54,214,232,0.08)'
    ctx.fill()
    ctx.setLineDash([7, 5])
    ctx.strokeStyle = '#36D6E8'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.setLineDash([])
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Lightweight, render-on-demand 3D globe (plain three.js; no per-frame cost while idle). */
export default function GlobeScene({ markers, outline, selectionBounds, selectedId, onSelect, focus, className = '' }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ setMarkers: (m: GlobeMarker[], sel?: string | null) => void; flyTo: (lat: number, lon: number) => void } | null>(null)
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  const [tip, setTip] = useState<{ x: number; y: number; m: GlobeMarker } | null>(null)

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20)
    camera.position.set(0, 0, 3.6)
    const globe = new THREE.Group()
    scene.add(globe)

    const tex = makeEarthTexture(outline, selectionBounds)
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshBasicMaterial({ map: tex }))
    globe.add(earth)
    const atmos = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 n; void main(){ float i = pow(0.62 - dot(n, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(0.21,0.84,0.91,1.0) * i * 0.9; }',
    }))
    scene.add(atmos)

    const markerGroup = new THREE.Group()
    globe.add(markerGroup)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dirty = true
    let raf = 0
    const target = new THREE.Quaternion()
    let flying = false
    const setFocus = (lat: number, lon: number, instant = false) => {
      const q = new THREE.Quaternion().setFromUnitVectors(toVec(lat, lon).normalize(), new THREE.Vector3(0, 0, 1))
      target.copy(q)
      flying = !instant
      if (instant) globe.quaternion.copy(q)
      dirty = true
    }
    setFocus(focus?.lat ?? 30, focus?.lon ?? -7, true)

    let cur: GlobeMarker[] = []
    const build = (ms: GlobeMarker[], sel?: string | null) => {
      cur = ms
      while (markerGroup.children.length) {
        const ch = markerGroup.children.pop() as THREE.Mesh
        ch.geometry.dispose(); (ch.material as THREE.Material).dispose()
      }
      ms.forEach((m) => {
        const size = m.size ?? 0.028
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(m.color) }))
        mesh.position.copy(toVec(m.lat, m.lon, 1.012)); mesh.userData = { m }
        markerGroup.add(mesh)
        const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.5, size * (m.id === sel ? 2.4 : 1.9), 40),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(m.id === sel ? '#ffffff' : m.color), transparent: true, opacity: m.id === sel ? 0.95 : 0.4, side: THREE.DoubleSide }))
        ring.position.copy(mesh.position); ring.lookAt(mesh.position.clone().multiplyScalar(2)); ring.userData = { m }
        markerGroup.add(ring)
      })
      dirty = true
    }
    api.current = { setMarkers: build, flyTo: (la, lo) => setFocus(la, lo) }

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true
    }
    const ro = new ResizeObserver(resize); ro.observe(el); resize()

    // drag to rotate
    let drag: { x: number; y: number; moved: number } | null = null
    const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; flying = false; renderer.domElement.setPointerCapture(e.pointerId); renderer.domElement.style.cursor = 'grabbing' }
    const move = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y
        drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy)
        const k = 0.0058
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * k)
        const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * k)
        globe.quaternion.premultiply(qx.multiply(qy)); dirty = true; setTip(null)
        return
      }
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(markerGroup.children, false)[0]
      if (hit && hit.object.userData.m) {
        // hide markers on the far side of the globe
        const wp = hit.object.getWorldPosition(new THREE.Vector3())
        if (wp.z > 0.05) { setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, m: hit.object.userData.m }); renderer.domElement.style.cursor = 'pointer'; return }
      }
      setTip(null); renderer.domElement.style.cursor = 'grab'
    }
    const up = (e: PointerEvent) => {
      const wasClick = drag && drag.moved < 5
      drag = null; renderer.domElement.style.cursor = 'grab'
      if (!wasClick) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(markerGroup.children, false)[0]
      if (hit?.object.userData.m && hit.object.getWorldPosition(new THREE.Vector3()).z > 0.05) selectRef.current?.(hit.object.userData.m.id)
    }
    const wheel = (e: WheelEvent) => { e.preventDefault(); camera.position.z = Math.min(5.2, Math.max(2.1, camera.position.z + e.deltaY * 0.002)); dirty = true }
    const dom = renderer.domElement
    dom.addEventListener('pointerdown', down); dom.addEventListener('pointermove', move); dom.addEventListener('pointerup', up)
    dom.addEventListener('pointerleave', () => setTip(null)); dom.addEventListener('wheel', wheel, { passive: false })

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (flying) { globe.quaternion.slerp(target, 0.12); dirty = true; if (globe.quaternion.angleTo(target) < 0.002) flying = false }
      if (dirty) { renderer.render(scene, camera); dirty = false }
    }
    loop()
    build(cur)
    return () => {
      cancelAnimationFrame(raf); ro.disconnect()
      dom.removeEventListener('pointerdown', down); dom.removeEventListener('pointermove', move); dom.removeEventListener('pointerup', up); dom.removeEventListener('wheel', wheel)
      tex.dispose(); earth.geometry.dispose(); (earth.material as THREE.Material).dispose(); atmos.geometry.dispose(); (atmos.material as THREE.Material).dispose()
      markerGroup.children.forEach((c) => { (c as THREE.Mesh).geometry.dispose(); ((c as THREE.Mesh).material as THREE.Material).dispose() })
      renderer.dispose(); dom.remove(); api.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outline, selectionBounds])

  useEffect(() => { api.current?.setMarkers(markers, selectedId) }, [markers, selectedId])
  useEffect(() => { if (focus) api.current?.flyTo(focus.lat, focus.lon) }, [focus?.lat, focus?.lon]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative ${className}`}>
      <div ref={host} className="absolute inset-0" role="img" aria-label="Interactive 3D globe. Drag to rotate, scroll to zoom, click a marker to select a region." />
      {tip && (
        <div className="pointer-events-none absolute z-10 max-w-[240px] -translate-x-1/2 -translate-y-[115%] rounded-xl border border-line bg-bg2/95 px-3 py-2 text-xs shadow-2xl"
          style={{ left: tip.x, top: tip.y }}>
          <div className="font-semibold">{tip.m.label}</div>
          {tip.m.detail && <div className="mt-0.5 text-neutral">{tip.m.detail}</div>}
        </div>
      )}
    </div>
  )
}
