'use client'

import { useEffect, useRef } from 'react'

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aPhase;
  varying float vAlpha;
  varying float vMix;

  void main() {
    vec3 p = position;
    // Two slow, crossing swells: a field of light breathing like a gathered crowd.
    p.y += sin(p.x * 0.55 + uTime * 0.45 + aPhase) * 0.32 + cos(p.z * 0.45 + uTime * 0.35) * 0.28;
    p.x += sin(uTime * 0.12 + aPhase) * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
    vAlpha = clamp(1.2 - (-mv.z - 4.0) / 14.0, 0.15, 1.0);
    vMix = aPhase / 6.2831;
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uLight;
  varying float vAlpha;
  varying float vMix;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(uDeep, uLight, vMix), disc * vAlpha * 0.65);
  }
`

/**
 * A slow-moving field of soft points behind the home hero. Three.js is imported on demand so it never
 * weighs on other pages; the loop pauses off screen and in background tabs, and visitors who prefer
 * reduced motion get a single still frame.
 */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = host.current
    if (!container) return
    let disposed = false
    let cleanup = () => {}

    import('three').then((THREE) => {
      if (disposed) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const small = window.innerWidth < 700

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
      } catch {
        return // No WebGL: the hero looks exactly as it did before.
      }
      const ratio = Math.min(window.devicePixelRatio, 2)
      renderer.setPixelRatio(ratio)
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.setAttribute('aria-hidden', 'true')
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60)
      camera.position.set(0, 2.2, 9)
      camera.lookAt(0, 0, -2)

      // Points on a wide, gently curved plane.
      const count = small ? 900 : 2200
      const positions = new Float32Array(count * 3)
      const scales = new Float32Array(count)
      const phases = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 26
        const z = -Math.random() * 16 - 1
        positions.set([x, -1.6 + x * x * 0.008 + (Math.random() - 0.5) * 0.6, z], i * 3)
        scales[i] = 0.4 + Math.random() * 1.1
        phases[i] = Math.random() * Math.PI * 2
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
      geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: small ? 48 : 60 },
          uPixelRatio: { value: ratio },
          uDeep: { value: new THREE.Color('#2869ad') },
          uLight: { value: new THREE.Color('#9fc3ee') },
        },
      })
      const field = new THREE.Points(geometry, material)
      scene.add(field)

      // Three thin halos, echoing the concentric circles used across the site.
      const rings = [3.2, 4.4, 5.6].map((radius, index) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.008, 6, 160),
          new THREE.MeshBasicMaterial({ color: '#2869ad', transparent: true, opacity: 0.22 - index * 0.05 }),
        )
        ring.position.set(small ? 0 : 4.2, 2.4, -4)
        ring.rotation.x = 1.15
        scene.add(ring)
        return ring
      })

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = container
        renderer.setSize(w, h, false)
        camera.aspect = w / Math.max(h, 1)
        camera.updateProjectionMatrix()
      }
      resize()
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)

      // Gentle parallax towards the pointer.
      const pointer = { x: 0, y: 0 }
      const onPointer = (event: PointerEvent) => {
        pointer.x = event.clientX / window.innerWidth - 0.5
        pointer.y = event.clientY / window.innerHeight - 0.5
      }
      window.addEventListener('pointermove', onPointer, { passive: true })

      const clock = new THREE.Clock()
      let frame = 0
      let visible = true
      const render = () => {
        const t = clock.getElapsedTime()
        material.uniforms.uTime.value = t
        rings.forEach((ring, index) => { ring.rotation.z = t * (0.04 + index * 0.015) * (index % 2 ? -1 : 1) })
        camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.03
        camera.position.y += (2.2 - pointer.y * 0.8 - camera.position.y) * 0.03
        camera.lookAt(0, 0, -2)
        renderer.render(scene, camera)
      }
      const loop = () => {
        render()
        frame = requestAnimationFrame(loop)
      }
      const start = () => { if (!frame && visible && !document.hidden && !reduced) loop() }
      const stop = () => { cancelAnimationFrame(frame); frame = 0 }

      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
        else stop()
      })
      intersection.observe(container)
      const onVisibility = () => (document.hidden ? stop() : start())
      document.addEventListener('visibilitychange', onVisibility)

      if (reduced) render()
      else start()
      container.classList.add('is-ready')

      cleanup = () => {
        stop()
        intersection.disconnect()
        resizeObserver.disconnect()
        window.removeEventListener('pointermove', onPointer)
        document.removeEventListener('visibilitychange', onVisibility)
        geometry.dispose()
        material.dispose()
        rings.forEach((ring) => { ring.geometry.dispose(); (ring.material as InstanceType<typeof THREE.Material>).dispose() })
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return <div ref={host} className="hero-scene" aria-hidden="true" />
}
