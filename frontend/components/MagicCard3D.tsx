'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useVideoTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MagicCard3DProps {
  videoSrc: string;
  roleName: string;
  description: string;
  position?: [number, number, number];
  onHover?: (hovered: boolean) => void;
  frameStyle?: 'cyan' | 'purple' | 'gold' | 'blue' | 'silver' | 'golden-dynamic' | 'none';
  gradientStyle?: string;
}

export function MagicCard3D({ 
  videoSrc, 
  roleName, 
  description,
  position = [0, 0, 0], 
  onHover, 
  frameStyle = 'golden-dynamic',
  gradientStyle = 'option2'
}: MagicCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const videoTexture = useVideoTexture(videoSrc, {
    loop: true,
    muted: true,
    start: true,
  });

  // Ensure videoTexture is loaded
  if (!videoTexture) {
    console.log('Video texture not loaded yet for:', videoSrc);
    return null;
  }

  // Smooth mouse tracking
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition({ x, y });
      
      if (hovered) {
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
      // Handle flip animation
      const targetRotationY = flipped ? Math.PI : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY + (hovered && !flipped ? targetRotation.current.y * 0.3 : 0),
        0.1
      );
      
      groupRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // Smooth rotation interpolation for X axis
      if (hovered && !flipped) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotation.current.x,
          0.1
        );
        
        // Subtle floating when hovered
      } else {
        // Return to neutral position
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
        // groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.1);
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
  const padding = 0.25; // Padding from card edges
  const circleRadius = (cardWidth / 2) - padding; // Circle with padding
  
  // Video display dimensions matching 2:3 aspect ratio (narrower for better head framing)
  const videoTargetAspect = 1; // 2:3 ratio
  const videoDisplayWidth = circleRadius * 2;
  const videoDisplayHeight = videoDisplayWidth / videoTargetAspect; // Make it 2:3

  // Create shader material for circular video mask
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
          if (dist > 0.5 ) {
            discard;
          }
          
          // Crop a 2:3 (width:height) ratio from the top of the video
          vec2 adjustedUv = vUv;
          
          // Target aspect ratio 2:3 = 0.667 (narrower for better head framing)
          float targetAspect = 1.0;
          
          if (textureAspect < targetAspect) {
            // Video is narrower than 2:3 (like portrait videos)
            // Take full width, crop from bottom
            float heightRatio = textureAspect / targetAspect;
            adjustedUv.y = vUv.y * heightRatio + (1.0 - heightRatio);
          } else if (textureAspect > targetAspect) {
            // Video is wider than 2:3 (landscape or square)
            // Take from bottom, crop sides
            float widthRatio = targetAspect / textureAspect;
            adjustedUv.x = (vUv.x - 0.5) * widthRatio + 0.5;
          }
          // If textureAspect == targetAspect, no adjustment needed
          
          gl_FragColor = texture2D(videoTexture, adjustedUv);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    // Update aspect ratio when texture loads
    if (videoTexture.image) {
      const aspect = videoTexture.image.videoWidth / videoTexture.image.videoHeight;
      material.uniforms.textureAspect.value = aspect;
    }

    return material;
  }, [videoTexture]);

  // Gradient style configurations
  const gradientStyles = {
    option1: {
      edgeColor: 'vec3(0.12, 0.12, 0.13)', // Very dark gray
      centerColor: 'vec3(0.0, 0.0, 0.0)',
      smoothness: '0.8',
      edgeFade: '-0.35'
    },
    option2: {
      edgeColor: 'vec3(0.08, 0.06, 0.12)', // Deep purple-black
      centerColor: 'vec3(0.0, 0.0, 0.0)',
      smoothness: '0.7',
      edgeFade: '-0.4'
    },
    option3: {
      edgeColor: 'vec3(0.15, 0.12, 0.08)', // Warm bronze-black
      centerColor: 'vec3(0.0, 0.0, 0.0)',
      smoothness: '0.9',
      edgeFade: '-0.3'
    },
    option4: {
      edgeColor: 'vec3(0.1, 0.12, 0.15)', // Cool steel-blue
      centerColor: 'vec3(0.0, 0.0, 0.0)',
      smoothness: '0.75',
      edgeFade: '-0.38'
    },
    option5: {
      edgeColor: 'vec3(0.18, 0.15, 0.12)', // Lighter warm brown
      centerColor: 'vec3(0.02, 0.02, 0.02)', // Slightly lighter center
      smoothness: '0.65',
      edgeFade: '-0.42'
    }
  };

  const currentGradient = useMemo(() => {
    return gradientStyles[gradientStyle as keyof typeof gradientStyles] || gradientStyles.option2;
  }, [gradientStyle]);

  // Create gradient shader material
  const gradientMaterial = useMemo(() => {
    const gradient = currentGradient;
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        
        // Signed distance function for rounded rectangle
        float sdRoundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }
        
        void main() {
          // Calculate distance from center-top point (0.5, 1.0) in UV space
          vec2 centerTop = vec2(0.5, 1.0);
          float distFromCenterTop = distance(vUv, centerTop);
          
          // Convert UV to centered coordinates (-0.5 to 0.5)
          vec2 centeredUV = vUv - vec2(0.5, 0.5);
          
          // Calculate distance to edge of rounded rectangle
          vec2 cardSize = vec2(0.5, 0.5);
          float cornerRadius = 0.04;
          float distToEdge = sdRoundedBox(centeredUV, cardSize, cornerRadius);
          
          // Create gradient based on distance to edge
          float edgeFactor = smoothstep(${gradient.edgeFade}, 0.0, distToEdge);
          
          // Combine with radial gradient from center-top
          float radialGradient = smoothstep(0.0, ${gradient.smoothness}, distFromCenterTop);
          
          // Final gradient considers both edge proximity and center-top distance
          float gradientVal = max(radialGradient, edgeFactor);
          
          vec3 edgeColor = ${gradient.edgeColor};
          vec3 centerColor = ${gradient.centerColor};
          
          vec3 finalColor = mix(centerColor, edgeColor, gradientVal);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: false,
      side: THREE.FrontSide,
    });
  }, [currentGradient]);
  const goldenRingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        innerRadius: { value: 0.32 },
        outerRadius: { value: 0.35 },
        mouseX: { value: mousePosition.x },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float innerRadius;
        uniform float outerRadius;
        uniform float mouseX;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          
          // Create ellipse: squish top part down for "emerging" effect
          vec2 toCenter = vUv - center;
          
          // We want to make the ring SMALLER at the top (squish it down)
          // By DIVIDING (not multiplying), we EXPAND the effective distance at top
          // which makes the ring appear SMALLER/narrower at top
          if (vUv.y > 0.5) {
            // Top half: divide by 0.95 to make ring appear smaller at top
            toCenter.y /= 0.95;
          }
          
          // Calculate elliptical distance
          float dist = length(toCenter);
          
          // Only render the ring area
          if (dist < innerRadius || dist > outerRadius) {
            discard;
          }
          
          // Calculate vertical position (0 = bottom, 1 = top in UV space)
          // Note: UV coordinates might be flipped depending on texture orientation
          float verticalPos = vUv.y;
          
          // We want: TOP transparent, BOTTOM visible
          // If top has more color, it means top has higher alpha value
          // So we need to INVERT: when vUv.y is high (top), make alpha LOW
          float verticalGradient = 1.0 - verticalPos; // Invert: top becomes 0, bottom becomes 1
          verticalGradient = pow(verticalGradient, 0.6); // Gentle curve for smooth fade
          
          // Create radial gradient: fade from inner edge to outer edge
          float ringPosition = (dist - innerRadius) / (outerRadius - innerRadius);
          ringPosition = clamp(ringPosition, 0.0, 1.0);
          
          // Fade outward with much softer curve
          float radialGradient = 1.0 - ringPosition;
          radialGradient = pow(radialGradient, 0.5); // Very gentle fade
          
          // Combine gradients
          float combinedGradient = verticalGradient * radialGradient;
          
          // Ring thickness fade with much softer edges for smoother look
          float ringFade = smoothstep(innerRadius, innerRadius + 0.02, dist) * 
                           (1.0 - smoothstep(outerRadius - 0.02, outerRadius, dist));
          
          // Silver/platinum color instead of golden
          float brightness = 0.75 + combinedGradient * 0.25;
          vec3 silverColor = vec3(
            brightness * 0.95,
            brightness * 0.96,
            brightness
          );
          
          // Apply combined gradient with softer alpha for subtle appearance
          float finalAlpha = combinedGradient * ringFade * 0.7;
          
          gl_FragColor = vec4(silverColor, finalAlpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [mousePosition.x]);

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

  // Frame color options
  const frameColors = {
    cyan: '#00ffff',      // Bright cyan - futuristic
    purple: '#a855f7',    // Purple - magical/mystical
    gold: '#fbbf24',      // Gold - premium/elegant
    blue: '#3b82f6',      // Blue - cool/calm
    silver: '#C0C0C0',    // Silver - premium metallic
    'golden-dynamic': '#C0C0C0', // Dynamic silver with reflections
    none: '#000000'       // No frame
  };

  const frameColor = frameColors[frameStyle];
  const showFrame = frameStyle !== 'none';
  const isDynamicGolden = frameStyle === 'golden-dynamic';

  // Calculate dynamic golden glow based on mouse position
  const goldenGlowIntensity = useMemo(() => {
    if (!isDynamicGolden) return { top: 0.15, middle: 0.1, outer: 0.05 };
    
    // Create varying intensities based on mouse position
    const baseIntensity = 0.2;
    const variation = (Math.sin(mousePosition.x * Math.PI) + 1) * 0.15;
    
    return {
      top: baseIntensity + variation,
      middle: (baseIntensity + variation) * 0.7,
      outer: (baseIntensity + variation) * 0.4,
    };
  }, [isDynamicGolden, mousePosition.x, mousePosition.y]);

  // Dynamic platinum/silver gradient colors
  const dynamicGoldenColors = useMemo(() => {
    if (!isDynamicGolden) return null;
    
    // Platinum/silver colors with slight brightness variation based on mouse position
    const brightnessShift = mousePosition.x * 0.05; // Subtle brightness change
    
    // Platinum/silver shades - cool metallic tones
    const platinumShades = {
      bright: `hsl(0, 0%, ${85 + brightnessShift}%)`,      // Bright platinum
      medium: `hsl(0, 0%, ${70 + brightnessShift}%)`,      // Medium platinum
      warm: `hsl(210, 5%, ${78 + brightnessShift}%)`,      // Cool platinum with slight blue tint
    };
    
    return platinumShades;
  }, [isDynamicGolden, mousePosition.x]);

  return (
    <group ref={groupRef} position={position}>
      {/* FRONT SIDE */}
      <group visible={!flipped}>
        {/* Main card background - solid black */}
        <RoundedBox
          args={[cardWidth, cardHeight, 0.15]}
          radius={0.1}
          smoothness={4}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={() => setFlipped(true)}
        >
          <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
        </RoundedBox>

      {/* Gradient overlay - fades from edges to black at center top */}

      {showFrame && !isDynamicGolden && (
        <>
          {/* Static neon frame - outer glow */}
          <RoundedBox
            args={[cardWidth + 0.02, cardHeight + 0.02, 0.11]}
            radius={0.12}
            smoothness={4}
          >
            <meshBasicMaterial
              color={frameColor}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </RoundedBox>

          {/* Static neon frame - middle glow */}
          <RoundedBox
            args={[cardWidth + 0.04, cardHeight + 0.04, 0.12]}
            radius={0.13}
            smoothness={4}
          >
            <meshBasicMaterial
              color={frameColor}
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </RoundedBox>

          {/* Static neon frame - outer most glow for depth */}
          <RoundedBox
            args={[cardWidth + 0.08, cardHeight + 0.08, 0.13]}
            radius={0.14}
            smoothness={4}
          >
            <meshBasicMaterial
              color={frameColor}
              transparent
              opacity={0.05}
              side={THREE.BackSide}
            />
          </RoundedBox>
        </>
      )}

      {isDynamicGolden && dynamicGoldenColors && (
        <>
          {/* Multi-layer golden frame with depth and transparency */}
          
          {/* Inner glow - brightest, tight to card */}
          <RoundedBox
            args={[cardWidth + 0.02, cardHeight + 0.02, 0.102]}
            radius={0.11}
            smoothness={4}
          >
            <meshBasicMaterial
              color={dynamicGoldenColors.bright}
              transparent
              opacity={0.6}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </RoundedBox>

          {/* Middle layer - warm glow */}
          <RoundedBox
            args={[cardWidth + 0.05, cardHeight + 0.05, 0.104]}
            radius={0.12}
            smoothness={4}
          >
            <meshBasicMaterial
              color={dynamicGoldenColors.warm}
              transparent
              opacity={0.35}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </RoundedBox>

          {/* Outer layer - soft diffusion */}
          <RoundedBox
            args={[cardWidth + 0.1, cardHeight + 0.1, 0.106]}
            radius={0.13}
            smoothness={4}
          >
            <meshBasicMaterial
              color={dynamicGoldenColors.medium}
              transparent
              opacity={0.2}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </RoundedBox>

          {/* Far outer shimmer - very subtle */}
          <RoundedBox
            args={[cardWidth + 0.15, cardHeight + 0.15, 0.108]}
            radius={0.14}
            smoothness={4}
          >
            <meshBasicMaterial
              color={dynamicGoldenColors.bright}
              transparent
              opacity={0.08}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </RoundedBox>
        </>
      )}

      {/* Circular video portrait at top center with padding */}
      <mesh position={[0, cardHeight / 2 - circleRadius - padding, 0.16]} material={circularMaterial} renderOrder={998}>
        <planeGeometry args={[videoDisplayWidth, videoDisplayHeight]} />
      </mesh>

      {/* Golden gradient ring around video circle */}
      <mesh position={[0, cardHeight / 2 - circleRadius - padding, 0.17]} material={goldenRingMaterial} renderOrder={997}>
        <planeGeometry args={[videoDisplayWidth * 1.5, videoDisplayWidth * 1.5]} />
      </mesh>

      {/* Comic-style role name text below the video */}
      <Text
        position={[0, cardHeight / 2 - (circleRadius * 2) - padding - 0.2, 0.16]}
        fontSize={0.28}
        color="#E5E4E2"
        anchorX="center"
        anchorY="top"
        maxWidth={cardWidth - (padding * 2)}
        textAlign="center"
        letterSpacing={0.05}
        outlineWidth={0}
        outlineColor="#000000"
        renderOrder={999}
      >
        {roleName.toUpperCase()}
      </Text>
      </group>

      {/* BACK SIDE */}
      <group visible={flipped} rotation={[0, Math.PI, 0]}>
        {/* Back card background */}
        <RoundedBox
          args={[cardWidth, cardHeight, 0.15]}
          radius={0.1}
          smoothness={4}
          onClick={() => setFlipped(false)}
        >
          <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
        </RoundedBox>

        {/* Back gradient overlay */}
        <RoundedBox
          args={[cardWidth, cardHeight, 0.151]}
          radius={0.1}
          smoothness={4}
        >
          <primitive object={gradientMaterial} attach="material" />
        </RoundedBox>

        {/* Role name at top */}
        <Text
          position={[0, cardHeight / 2 - 0.3, 0.16]}
          fontSize={0.35}
          color="#E5E4E2"
          anchorX="center"
          anchorY="top"
          maxWidth={cardWidth - (padding * 2)}
          textAlign="center"
          letterSpacing={0.05}
          font="/fonts/Inter_18pt-Bold.ttf"
          renderOrder={999}
        >
          {roleName.toUpperCase()}
        </Text>

        {/* Description text */}
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.18}
          color="#C0C0C0"
          anchorX="center"
          anchorY="middle"
          maxWidth={cardWidth - (padding * 3)}
          textAlign="center"
          lineHeight={1.4}
          renderOrder={999}
        >
          {description}
        </Text>

        {/* "Click to flip back" hint */}
        <Text
          position={[0, -cardHeight / 2 + 0.3, 0.16]}
          fontSize={0.12}
          color="#888888"
          anchorX="center"
          anchorY="bottom"
          renderOrder={999}
        >
          Click to flip back
        </Text>
      </group>
    </group>
  );
}
