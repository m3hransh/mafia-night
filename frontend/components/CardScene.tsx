'use client';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { MagicCard3D } from './MagicCard3D';
import { Suspense, useEffect, useState } from 'react';

interface CardSceneProps {
  videoSrc: string;
  roleName: string;
  description: string;
}

export function CardScene({ videoSrc, roleName, description }: CardSceneProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [gyroDebug, setGyroDebug] = useState({ beta: 0, gamma: 0 });
  const [needsPermission, setNeedsPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if permission is needed (iOS 13+)
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setNeedsPermission(true);
    }
  }, []);

  // Request permission handler
  const requestGyroPermission = async () => {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        setNeedsPermission(false);
      }
    } catch (error) {
      console.error('Error requesting gyroscope permission:', error);
    }
  };

  // Debug gyroscope with throttling for smoother animation
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 500; // Sample every half second

    // Listen to orientation events even on desktop for testing in Chrome DevTools
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      
      // Throttle: only update if enough time has passed
      if (now - lastUpdate < throttleMs) return;
      
      if (event.beta !== null && event.gamma !== null) {
        setGyroDebug({ beta: event.beta, gamma: event.gamma });
        lastUpdate = now;
      }
    };

    // Check if we need permission first (iOS 13+)
    if (needsPermission && !permissionGranted) return;

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [needsPermission, permissionGranted]);

  return (
    <div className="w-full h-screen bg-gray-950">
      {/* iOS Permission Button */}
      {needsPermission && !permissionGranted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <button
            onClick={requestGyroPermission}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all"
          >
            Enable Gyroscope
          </button>
        </div>
      )}

      {/* Debug overlay for mobile 
      // {isMobile && (
      //   <div className="absolute top-20 right-4 z-50 bg-black/70 text-white p-3 rounded text-xs">
      //     <div>Beta: {gyroDebug.beta.toFixed(1)}°</div>
      //     <div>Gamma: {gyroDebug.gamma.toFixed(1)}°</div>
      //     <div className="text-[10px] mt-1 text-gray-400">Tilt phone to test</div>
      //   </div>
      // )}
      */}
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera - zoomed out more on mobile for better margins */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={isMobile ? 55 : 50} />
          
          {/* The Magic Card */}
          <MagicCard3D
            videoSrc={videoSrc}
            roleName={roleName}
            description={description}
            position={[0, 0, 0]}
            gyroData={gyroDebug}
            gyroEnabled={isMobile && (!needsPermission || permissionGranted)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
