'use client';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { MagicCard3D } from './MagicCard3D';
import { Suspense, useEffect, useState } from 'react';
import {Role} from "@/lib/api";

interface CardSceneProps {
  videoSrc: string;
  role: Role;
}

export function CardScene({ videoSrc, role}: CardSceneProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-screen">
      <Canvas>
        <Suspense
          fallback={
            <mesh>
            </mesh>
          }
        >
          {/* Camera - zoomed out more on mobile for better margins */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={isMobile ? 55 : 50} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* The Magic Card */}
          <MagicCard3D
            videoSrc={videoSrc}
            role={role}
            position={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
