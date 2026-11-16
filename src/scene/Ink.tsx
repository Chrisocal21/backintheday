import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'

export const INK = '#1a130e'

// Style knobs. The room is mostly realistic (PBR shading); the comic feel is only a hint:
// thin outlines and a faint halftone that shows up in the darkest areas.
export const STYLE = {
  outline: 0.0025, // default outline thickness, meters
  halftone: 0.025, // faint comic texture, concentrated in deep shadows
}

// Realistic matte material with a faint screen-space halftone in the shadows.
export function useInkMaterial(color: string, roughness = 0.85) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    if (STYLE.halftone > 0) {
      m.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
          float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
          vec2 cell = mod(gl_FragCoord.xy, 5.0) - 2.5;
          float dotR = (1.0 - smoothstep(0.0, 0.3, lum)) * 2.0;
          float inDot = 1.0 - smoothstep(dotR - 0.5, dotR + 0.5, length(cell));
          gl_FragColor.rgb *= 1.0 - inDot * ${STYLE.halftone.toFixed(3)};`,
        )
      }
    }
    return m
  }, [color, roughness])
}

type BoxProps = {
  size: [number, number, number]
  position?: [number, number, number]
  rotation?: [number, number, number]
  color: string
  roughness?: number
  /** Outline thickness in meters. 0 = none. */
  outline?: number
}

export function InkBox({ size, position, rotation, color, roughness, outline = STYLE.outline }: BoxProps) {
  const mat = useInkMaterial(color, roughness)
  return (
    <mesh position={position} rotation={rotation} material={mat} castShadow receiveShadow>
      <boxGeometry args={size} />
      {outline > 0 && <Outlines thickness={outline} color={INK} transparent opacity={0.85} />}
    </mesh>
  )
}

// Any geometry (pass it as a child) with the same material + outline treatment.
export function Ink({
  children,
  color,
  roughness,
  outline = STYLE.outline,
  ...rest
}: {
  children: ReactNode
  color: string
  roughness?: number
  outline?: number
} & Omit<JSX.IntrinsicElements['mesh'], 'children'>) {
  const mat = useInkMaterial(color, roughness)
  return (
    <mesh material={mat} castShadow receiveShadow {...rest}>
      {children}
      {outline > 0 && <Outlines thickness={outline} color={INK} transparent opacity={0.85} />}
    </mesh>
  )
}

// Thin dark seam line (room corners), subtle rather than a hard ink stroke.
export function InkLine({ size, position }: { size: [number, number, number]; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={INK} transparent opacity={0.35} />
    </mesh>
  )
}
