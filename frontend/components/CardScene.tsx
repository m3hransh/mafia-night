'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MagicCard3D } from './MagicCard3D';
import { Suspense, useEffect, useState } from 'react';

interface CardSceneProps {
  videoSrc: string;
  roleName: string;
  description: string;
  frameStyle?: 'cyan' | 'purple' | 'gold' | 'blue' | 'silver' | 'golden-dynamic' | 'none';
  gradientStyle?: string;
  enableOrbitControls?: boolean;
}

export function CardScene({ videoSrc, roleName, description, frameStyle = 'golden-dynamic', gradientStyle = 'option2', enableOrbitControls = false }: CardSceneProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [gyroDebug, setGyroDebug] = useState({ beta: 0, gamma: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug gyroscope
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setGyroDebug({ beta: event.beta, gamma: event.gamma });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isMobile]);

  return (
    <div className="w-full h-screen bg-gray-950">
      {/* Debug overlay for mobile */}
      {isMobile && (
        <div className="absolute top-20 right-4 z-50 bg-black/70 text-white p-3 rounded text-xs">
          <div>Beta: {gyroDebug.beta.toFixed(1)}°</div>
          <div>Gamma: {gyroDebug.gamma.toFixed(1)}°</div>
          <div className="text-[10px] mt-1 text-gray-400">Tilt phone to test</div>
        </div>
      )}
      
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera - zoomed out more on mobile for better margins */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={isMobile ? 55 : 50} />
          
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
