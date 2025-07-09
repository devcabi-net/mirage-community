'use client'

import { Canvas } from '@react-three/fiber'
import { 
  OrbitControls, 
  Stars, 
  Environment,
  Sparkles,
  PerspectiveCamera
} from '@react-three/drei'
import { 
  EffectComposer,
  Bloom
} from '@react-three/postprocessing'
import { Pyramid } from './Pyramid'
import { Suspense } from 'react'

function SceneContent() {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={60} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Orange lighting for black hole effect */}
      <pointLight position={[4, 0, 0]} color="#FF6B35" intensity={2} />
      <pointLight position={[6, 2, -2]} color="#FF4500" intensity={1} />
      
      {/* Single Black Hole Pyramid - positioned to the right side */}
      <Pyramid position={[4, 0, -1]} scale={1.8} />
      
      {/* Environment */}
      <Stars 
        radius={100} 
        depth={50} 
        count={8000} 
        factor={6} 
        saturation={0} 
        fade 
        speed={0.5} 
      />
      
      {/* Magical particles - sparse for space effect */}
      <Sparkles
        count={50}
        scale={20}
        size={1}
        speed={0.2}
        color="#FF6B35"
      />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2}
        minDistance={3}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.3}
      />
      
      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom 
          intensity={1.2}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.4}
        />
      </EffectComposer>
      
      {/* Environment reflections */}
      <Environment preset="night" />
    </>
  )
}

export function Scene() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black">
      <Canvas shadows>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
} 