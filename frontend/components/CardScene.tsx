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
        lastUpdate = now;
      }
    };

    // Check if we need permission first (iOS 13+)
    if (needsPermission && !permissionGranted) return;

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [needsPermission, permissionGranted]);

  return (
    <div className="w-full h-screen">
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
            gyroEnabled={isMobile && (!needsPermission || permissionGranted)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
