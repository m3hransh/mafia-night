'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MagicCard3D } from './MagicCard3D';
import { Suspense } from 'react';

interface CardSceneProps {
  videoSrc: string;
  roleName: string;
  frameStyle?: 'cyan' | 'purple' | 'gold' | 'blue' | 'green' | 'golden-dynamic' | 'none';
  gradientStyle?: string;
  enableOrbitControls?: boolean;
}

export function CardScene({ videoSrc, roleName, frameStyle = 'golden-dynamic', gradientStyle = 'option2', enableOrbitControls = false }: CardSceneProps) {
  return (
    <div className="w-full h-screen bg-gray-950">
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
          
          {/* The Magic Card */}
          <MagicCard3D videoSrc={videoSrc} roleName={roleName} frameStyle={frameStyle} gradientStyle={gradientStyle} position={[0, 0, 0]} />
          
          {/* Optional orbit controls for debugging */}
          {enableOrbitControls && <OrbitControls enableZoom={true} />}
        </Suspense>
      </Canvas>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-lg font-semibold mb-2">Move your mouse to interact with the card</p>
        <p className="text-sm opacity-75">Hover over the card to see magical effects</p>
      </div>
    </div>
  );
}
