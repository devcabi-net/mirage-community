'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float, Sphere } from '@react-three/drei'
import * as THREE from 'three'

type BlackHolePyramidProps = {
  position?: [number, number, number]
  scale?: number
}

export function Pyramid({ position = [0, 0, 0], scale = 1 }: BlackHolePyramidProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const outlineRef = useRef<THREE.Mesh>(null)
  const shineRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current || !outlineRef.current || !shineRef.current) return
    
    // Black hole rotation - slow for the main pyramid
    meshRef.current.rotation.y += 0.005
    
    // Fast spinning outline effect
    outlineRef.current.rotation.y += 0.02
    
    // Even faster spinning shine gradient
    shineRef.current.rotation.y += 0.04
    
    // Subtle floating effect
    const yOffset = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    meshRef.current.position.y = position[1] + yOffset
    outlineRef.current.position.y = position[1] + yOffset
    shineRef.current.position.y = position[1] + yOffset
  })

  return (
    <Float
      speed={1}
      rotationIntensity={0.2}
      floatIntensity={0.2}
    >
      <group position={position}>
        {/* Fast spinning shine gradient - outermost layer */}
        <mesh
          ref={shineRef}
          scale={scale * 1.05}
        >
          <coneGeometry args={[1.05, 2.1, 4]} />
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF4500"
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
            wireframe={false}
          />
        </mesh>
        
        {/* Orange outline - middle layer */}
        <mesh
          ref={outlineRef}
          scale={scale * 1.02}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <coneGeometry args={[1.02, 2.04, 4]} />
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={hovered ? 0.8 : 0.5}
            transparent
            opacity={0.6}
            wireframe={true}
          />
        </mesh>
        
        {/* Main Black Hole Pyramid - inner core */}
        <mesh
          ref={meshRef}
          scale={scale}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[1, 2, 4]} />
          <MeshDistortMaterial
            color="#000000"
            emissive="#111111"
            emissiveIntensity={0.1}
            metalness={1}
            roughness={0}
            distort={0.8}
            speed={2}
            transparent
            opacity={0.95}
          />
        </mesh>
        
        {/* Accretion disk particles */}
        <Sphere args={[0.01]} position={[1.5, 0, 0]}>
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={0.5}
          />
        </Sphere>
        <Sphere args={[0.01]} position={[-1.5, 0, 0]}>
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={0.5}
          />
        </Sphere>
        <Sphere args={[0.01]} position={[0, 0, 1.5]}>
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={0.5}
          />
        </Sphere>
        <Sphere args={[0.01]} position={[0, 0, -1.5]}>
          <meshStandardMaterial
            color="#FF6B35"
            emissive="#FF6B35"
            emissiveIntensity={0.5}
          />
        </Sphere>
      </group>
    </Float>
  )
} 