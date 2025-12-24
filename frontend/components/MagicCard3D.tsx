'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useVideoTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { optimizeCloudinaryVideo } from '@/lib/cloudinary';
import { Role } from '@/lib/api';

interface MagicCard3DProps {
  videoSrc: string;
  role: Role;
  position?: [number, number, number];
}

export function MagicCard3D({
  videoSrc,
  role,
  position = [0, 0, 0],
}: MagicCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinnerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const fadeStartTime = useRef<number | null>(null);

  // Use gyro data from props if available, otherwise default

  // Optimize video URL for current device
  const optimizedVideoSrc = useMemo(() => optimizeCloudinaryVideo(videoSrc), [videoSrc]);

  const videoTexture = useVideoTexture(optimizedVideoSrc, {
    loop: true,
    muted: true,
    start: true,
    playsInline: true,
    crossOrigin: 'Anonymous',
    unsuspend: 'loadeddata',
  });

  // Smooth mouse tracking
  const targetRotation = useRef({ x: 0, y: 0 });

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Track video loading state and fade in
  useEffect(() => {
    if (videoTexture && videoTexture.image) {
      const video = videoTexture.image as HTMLVideoElement;

      const handleLoadedData = () => {
        setVideoLoaded(true);
      };

      const handleCanPlay = () => {
        // Start fade-in animation
        if (!fadeStartTime.current) {
          fadeStartTime.current = Date.now();
        }
      };

      if (video.readyState >= 3) {
        // Video already loaded
        handleLoadedData();
        handleCanPlay();
      } else {
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('canplay', handleCanPlay);
      }

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoTexture]);

  // Mouse tracking for desktop
  useEffect(() => {
    if (isMobile) return;

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
  }, [hovered, isMobile]);

  // Animate smooth rotation and floating
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Handle flip animation
      const targetRotationY = flipped ? Math.PI : 0;
      // Use faster lerp when flipping for snappier response
      const flipLerpSpeed = 0.15;
      const tiltLerpSpeed = 0.1;

      if (hovered && !flipped) {
        // Desktop: use mouse position
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotationY + targetRotation.current.y * 0.3,
          tiltLerpSpeed
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotation.current.x,
          tiltLerpSpeed
        );
      } else {
        // Return to neutral position or flip
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotationY,
          flipLerpSpeed
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, flipLerpSpeed);
      }

      groupRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    // Animate loading spinner
    if (spinnerRef.current && !videoLoaded) {
      spinnerRef.current.rotation.z += delta * 2; // Rotate at 2 radians per second
    }

    // Handle video fade-in
    if (fadeStartTime.current && circularMaterial && circularMaterial.uniforms.opacity) {
      const duration = 800; // 800ms fade-in
      const elapsed = Date.now() - fadeStartTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress <= 1) {
        // Ease-out curve for smooth fade
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        circularMaterial.uniforms.opacity.value = easedProgress;
      }
    }
  });

  const handlePointerOver = () => {
    if (!flipped) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleFlip = () => {
    setFlipped(!flipped);
    setHovered(false);
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
        opacity: { value: 0.0 },
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
        uniform float opacity;
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

          vec4 videoColor = texture2D(videoTexture, adjustedUv);
          gl_FragColor = vec4(videoColor.rgb, videoColor.a * opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    // Update aspect ratio when texture loads
    if (videoTexture && videoTexture.image) {
      const aspect = videoTexture.image.videoWidth / videoTexture.image.videoHeight;
      material.uniforms.textureAspect.value = aspect;
    }

    return material;
  }, [videoTexture]);

  // Gradient style configuration (deep purple-black theme)
  const gradientConfig = {
    edgeColor: 'vec3(0.08, 0.06, 0.12)', // Deep purple-black
    centerColor: 'vec3(0.0, 0.0, 0.0)',
    smoothness: '0.7',
    edgeFade: '-0.4'
  };

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

  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      if (circularMaterial) {
        circularMaterial.dispose();
      }
      if (goldenRingMaterial) {
        goldenRingMaterial.dispose();
      }
      // Don't dispose videoTexture - useVideoTexture manages its own lifecycle
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update aspect ratio dynamically
  useEffect(() => {
    if (videoTexture && videoTexture.image && circularMaterial) {
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

  // Team color mapping
  const getTeamColor = (team: string): string => {
    switch (team) {
      case 'mafia':
        return '#DC2626'; // Red
      case 'village':
        return '#3B82F6'; // Blue
      case 'independent':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  // Dynamic platinum/silver gradient colors based on mouse position
  const dynamicPlatinumColors = useMemo(() => {
    // Platinum/silver colors with slight brightness variation based on mouse position
    const brightnessShift = mousePosition.x * 0.05; // Subtle brightness change

    // Platinum/silver shades - cool metallic tones
    return {
      bright: `hsl(0, 0%, ${85 + brightnessShift}%)`,      // Bright platinum
      medium: `hsl(0, 0%, ${70 + brightnessShift}%)`,      // Medium platinum
      warm: `hsl(210, 5%, ${78 + brightnessShift}%)`,      // Cool platinum with slight blue tint
    };
  }, [mousePosition.x]);

  return (
    <group ref={groupRef} position={position}>
      {/* FRONT SIDE */}
      <group
        visible={!flipped}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleFlip}
      >
        {/* Main card background - solid black */}
        <RoundedBox
          args={[cardWidth, cardHeight, 0.15]}
          radius={0.1}
          smoothness={4}
        >
          <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
        </RoundedBox>

        {/* Multi-layer platinum frame with depth and transparency */}

        {/* Inner glow - brightest, tight to card */}
        <RoundedBox
          args={[cardWidth + 0.02, cardHeight + 0.02, 0.102]}
          radius={0.11}
          smoothness={4}
        >
          <meshBasicMaterial
            color={dynamicPlatinumColors.bright}
            transparent
            opacity={0.6}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </RoundedBox>

      {/* Black placeholder circle while video is loading */}
      {!videoLoaded && (
        <group position={[0, cardHeight / 2 - circleRadius - padding, 0]}>
          {/* Black circle background */}
          <mesh position={[0, 0, 0.15]} renderOrder={996}>
            <circleGeometry args={[circleRadius, 64]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Loading spinner ring */}
        </group>
      )}

      {/* Circular video portrait at top center with padding */}
      {videoTexture && (
        <mesh position={[0, cardHeight / 2 - circleRadius - padding, 0.16]} material={circularMaterial} renderOrder={998}>
          <planeGeometry args={[videoDisplayWidth, videoDisplayHeight]} />
        </mesh>
      )}

      {/* Golden gradient ring around video circle */}
      <mesh position={[0, cardHeight / 2 - circleRadius - padding, 0.17]} material={goldenRingMaterial} renderOrder={997}>
        <planeGeometry args={[videoDisplayWidth * 1.5, videoDisplayWidth * 1.5]} />
      </mesh>

      {/* Comic-style role name text below the video */}
      <Text
        position={[0, cardHeight / 2 - (circleRadius * 2) - padding - 0.2, 0.16]}
        fontSize={0.20}
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
        {role?.name ?  role.name.toUpperCase(): 'UNKNOWN ROLE'}
      </Text>

      {/* Team badge below role name */}
      {role?.team && (
        <group position={[0, cardHeight / 2 - (circleRadius * 2) - padding - 0.65, 0.16]}>
          {/* Badge background - flat with rounded corners */}
          <mesh>
            <shapeGeometry args={[(() => {
              const shape = new THREE.Shape();
              const width = 1.0;
              const height = 0.2;
              const radius = 0.08;
              const x = -width / 2;
              const y = -height / 2;

              shape.moveTo(x + radius, y);
              shape.lineTo(x + width - radius, y);
              shape.quadraticCurveTo(x + width, y, x + width, y + radius);
              shape.lineTo(x + width, y + height - radius);
              shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
              shape.lineTo(x + radius, y + height);
              shape.quadraticCurveTo(x, y + height, x, y + height - radius);
              shape.lineTo(x, y + radius);
              shape.quadraticCurveTo(x, y, x + radius, y);

              return shape;
            })()]} />
            <meshBasicMaterial color={getTeamColor(role.team)} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>

          {/* Team text */}
          <Text
            position={[0, 0, 0.001]}
            fontSize={0.10}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            font="/fonts/Inter_18pt-Bold.ttf"
            renderOrder={1000}
          >
            {role.team.toUpperCase()}
          </Text>
        </group>
      )}
      </group>

      {/* BACK SIDE */}
      <group
        visible={flipped}
        rotation={[0, Math.PI, 0]}
        onClick={handleFlip}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        {/* Back card background */}
        <RoundedBox
          args={[cardWidth, cardHeight, 0.15]}
          radius={0.1}
          smoothness={4}
        >
          <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
        </RoundedBox>

        {/* Inner glow - brightest, tight to card */}
        <RoundedBox
          args={[cardWidth + 0.02, cardHeight + 0.02, 0.102]}
          radius={0.11}
          smoothness={4}
        >
          <meshBasicMaterial
            color={dynamicPlatinumColors.bright}
            transparent
            opacity={0.6}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </RoundedBox>

        {/* Role name at top */}
        <Text
          position={[0, cardHeight / 2 - 0.3, 0.16]}
          fontSize={0.20}
          color="#E5E4E2"
          anchorX="center"
          anchorY="top"
          maxWidth={cardWidth - (padding * 2)}
          textAlign="center"
          letterSpacing={0.05}
          font="/fonts/Inter_18pt-Bold.ttf"
          renderOrder={999}
        >
        {role?.name ?  role.name.toUpperCase(): 'UNKNOWN ROLE'}
        </Text>

        {/* Team badge below role name */}
        {role?.team && (
          <group position={[0, cardHeight / 2 - 0.75, 0.16]}>
            {/* Badge background - flat with rounded corners */}
            <mesh>
              <shapeGeometry args={[(() => {
                const shape = new THREE.Shape();
                const width = 0.8;
                const height = 0.2;
                const radius = 0.08;
                const x = -width / 2;
                const y = -height / 2;

                shape.moveTo(x + radius, y);
                shape.lineTo(x + width - radius, y);
                shape.quadraticCurveTo(x + width, y, x + width, y + radius);
                shape.lineTo(x + width, y + height - radius);
                shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                shape.lineTo(x + radius, y + height);
                shape.quadraticCurveTo(x, y + height, x, y + height - radius);
                shape.lineTo(x, y + radius);
                shape.quadraticCurveTo(x, y, x + radius, y);

                return shape;
              })()]} />
              <meshBasicMaterial color={getTeamColor(role.team)} transparent opacity={0.9} side={THREE.DoubleSide} />
            </mesh>

            {/* Team text */}
            <Text
              position={[0, 0, 0.001]}
              fontSize={0.10}
              color="#FFFFFF"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
              font="/fonts/Inter_18pt-Bold.ttf"
              renderOrder={1000}
            >
              {role.team.toUpperCase()}
            </Text>
          </group>
        )}

        {/* Description text */}
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.13}
          color="#C0C0C0"
          anchorX="center"
          anchorY="middle"
          maxWidth={cardWidth - (padding * 3)}
          textAlign="center"
          lineHeight={1.4}
          renderOrder={999}
        >
          {role?.description ? role.description : 'UNKNOWN DESCRIPTION'}
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
