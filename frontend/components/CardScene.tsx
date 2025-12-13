'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MagicCard3D } from './MagicCard3D';
import { Suspense } from 'react';

interface CardSceneProps {
  videoSrc: string;
  roleName: string;
  description: string;
  frameStyle?: 'cyan' | 'purple' | 'gold' | 'blue' | 'silver' | 'golden-dynamic' | 'none';
  gradientStyle?: string;
  enableOrbitControls?: boolean;
}

export function CardScene({ videoSrc, roleName, description, frameStyle = 'golden-dynamic', gradientStyle = 'option2', enableOrbitControls = false }: CardSceneProps) {
  return (
    <div className="w-full h-screen bg-gray-950">
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
          
          {/* The Magic Card */}
          <MagicCard3D 
            videoSrc={videoSrc} 
            roleName={roleName} 
            description={description}
            frameStyle={frameStyle} 
            gradientStyle={gradientStyle} 
            position={[0, 0, 0]} 
          />
          
          {/* Optional orbit controls for debugging */}
          {enableOrbitControls && <OrbitControls enableZoom={true} />}
        </Suspense>
      </Canvas>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
      </div>
    </div>
  );
}
