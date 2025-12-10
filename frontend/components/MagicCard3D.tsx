'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useVideoTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MagicCard3DProps {
  videoSrc: string;
  roleName: string;
  position?: [number, number, number];
  onHover?: (hovered: boolean) => void;
}

export function MagicCard3D({ videoSrc, roleName, position = [0, 0, 0], onHover }: MagicCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const videoTexture = useVideoTexture(videoSrc, {
    loop: true,
    muted: true,
    start: true,
  });

  // Smooth mouse tracking
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hovered) {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        targetRotation.current = {
          x: y * 0.3,
          y: x * 0.3,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hovered]);

  // Animate smooth rotation and floating
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth rotation interpolation
      if (hovered) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotation.current.x,
          0.1
        );
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation.current.y,
          0.1
        );
        
        // Subtle floating when hovered
        groupRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
        // Return to neutral position
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.1);
      }
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'default';
  };

  // Card dimensions
  const cardWidth = 2.5;
  const cardHeight = 3.5;
  const padding = 0.15; // Padding from card edges
  const circleRadius = (cardWidth / 2) - padding; // Circle with padding
  
  // Video display dimensions matching 3:4 aspect ratio
  const videoTargetAspect = 0.75; // 3:4 ratio
  const videoDisplayWidth = circleRadius * 2;
  const videoDisplayHeight = videoDisplayWidth / videoTargetAspect; // Make it 3:4

  // Create shader material that preserves aspect ratio and crops to circle
  const circularMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        videoTexture: { value: videoTexture },
        textureAspect: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D videoTexture;
        uniform float textureAspect;
        varying vec2 vUv;
        
        void main() {
          // Center point of the circle
          vec2 center = vec2(0.5, 0.5);
          
          // Calculate distance from center for circular mask
          float dist = distance(vUv, center);
          
          // Discard fragments outside the circle
          if (dist > 0.5) {
            discard;
          }
          
          // Crop a 3:4 (width:height) ratio from the top of the video
          vec2 adjustedUv = vUv;
          
          // Target aspect ratio 3:4 = 0.75
          float targetAspect = 0.75;
          
          if (textureAspect < targetAspect) {
            // Video is narrower than 3:4 (like 864x1280 = 0.675)
            // Take full width, crop from bottom
            float heightRatio = textureAspect / targetAspect;
            adjustedUv.y = vUv.y * heightRatio;
          } else if (textureAspect > targetAspect) {
            // Video is wider than 3:4 (landscape or square like 1280x1280 = 1.0)
            // Take from top, crop sides
            float widthRatio = targetAspect / textureAspect;
            adjustedUv.x = (vUv.x - 0.5) * widthRatio + 0.5;
          }
          // If textureAspect == targetAspect, no adjustment needed
          
          gl_FragColor = texture2D(videoTexture, adjustedUv);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    });

    // Update aspect ratio when texture loads
    if (videoTexture.image) {
      const aspect = videoTexture.image.videoWidth / videoTexture.image.videoHeight;
      material.uniforms.textureAspect.value = aspect;
    }

    return material;
  }, [videoTexture]);

  // Update aspect ratio dynamically
  useEffect(() => {
    if (videoTexture.image && circularMaterial) {
      const updateAspect = () => {
        const aspect = videoTexture.image.videoWidth / videoTexture.image.videoHeight;
        if (circularMaterial.uniforms.textureAspect) {
          circularMaterial.uniforms.textureAspect.value = aspect;
        }
      };
      
      if (videoTexture.image.videoWidth) {
        updateAspect();
      } else {
        videoTexture.image.addEventListener('loadedmetadata', updateAspect);
        return () => videoTexture.image?.removeEventListener('loadedmetadata', updateAspect);
      }
    }
  }, [videoTexture, circularMaterial]);

  return (
    <group ref={groupRef} position={position}>
      {/* Main card background */}
      <RoundedBox
        args={[cardWidth, cardHeight, 0.1]}
        radius={0.1}
        smoothness={4}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
      </RoundedBox>

      {/* Circular video portrait at top center with padding */}
      <mesh position={[0, cardHeight / 2 - circleRadius - padding, 0.06]} material={circularMaterial}>
        <planeGeometry args={[videoDisplayWidth, videoDisplayWidth]} />
      </mesh>

      {/* Role name text below the video */}
      <Text
        position={[0, cardHeight / 2 - (circleRadius * 2) - padding - 0.3, 0.06]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="top"
        maxWidth={cardWidth - (padding * 2)}
        textAlign="center"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {roleName}
      </Text>
    </group>
  );
}
