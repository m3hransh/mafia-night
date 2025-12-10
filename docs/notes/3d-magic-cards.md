# 3D Magic Card Implementation

## Overview
Implemented a 3D card system with animated video portraits inspired by Harry Potter's moving photographs. The cards react to mouse movement with smooth 3D transformations.

## Technology Stack
- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components and utilities
- **Next.js**: React framework with App Router
- **Custom GLSL Shaders**: For aspect-ratio preserving circular video masks

## Component Architecture

### 1. MagicCard3D Component
**Location**: `/frontend/components/MagicCard3D.tsx`

**Key Features**:
- 3D card with rounded corners using `RoundedBox` from drei
- Circular video portrait with custom shader material
- Mouse-reactive tilting with smooth interpolation
- Floating animation on hover
- 3D text for role names

**Props**:
```typescript
interface MagicCard3DProps {
  videoSrc: string;      // Path to video file
  roleName: string;      // Character role name
  position?: [number, number, number];  // 3D position
  onHover?: (hovered: boolean) => void; // Hover callback
}
```

**Dimensions**:
- Card: 2.5 x 3.5 units (width x height)
- Padding: 0.15 units from edges
- Circle radius: (cardWidth / 2) - padding
- Video aspect ratio: 3:4 (width:height)

**Animation Logic**:
- Uses `useFrame` hook for 60fps animations
- `THREE.MathUtils.lerp()` for smooth transitions
- Mouse position converted to rotation angles (max ±0.3 radians)
- Floating effect: `sin(time * 2) * 0.05` units on Z-axis

### 2. Custom Shader Material
**Purpose**: Display videos in circular frame without stretching

**Shader Pipeline**:
1. **Vertex Shader**: Passes UV coordinates to fragment shader
2. **Fragment Shader**:
   - Calculates distance from center for circular mask
   - Discards fragments outside 0.5 radius (creates circle)
   - Adjusts UV coordinates based on video aspect ratio
   - Crops to 3:4 target aspect ratio from top of video

**Aspect Ratio Logic**:
```glsl
targetAspect = 0.75 // 3:4 ratio

if (textureAspect < targetAspect) {
  // Portrait video (e.g., 864x1280 = 0.675)
  // Take full width, crop bottom
  heightRatio = textureAspect / targetAspect
  adjustedUv.y = vUv.y * heightRatio
  
} else if (textureAspect > targetAspect) {
  // Landscape/Square video (e.g., 1280x1280 = 1.0)
  // Take full height, crop sides
  widthRatio = targetAspect / textureAspect
  adjustedUv.x = (vUv.x - 0.5) * widthRatio + 0.5
}
```

**Result**: Videos display with correct proportions, showing top portion of character (head + shoulders), no stretching.

### 3. CardScene Component
**Location**: `/frontend/components/CardScene.tsx`

**Responsibilities**:
- Sets up Three.js Canvas
- Configures camera (position: [0, 0, 6], FOV: 50°)
- Renders MagicCard3D
- Optional OrbitControls for debugging

**Props**:
```typescript
interface CardSceneProps {
  videoSrc: string;
  roleName: string;
  enableOrbitControls?: boolean;
}
```

### 4. Main Page
**Location**: `/frontend/app/page.tsx`

**Features**:
- Role selector buttons (top center)
- Dynamic card switching
- Glassmorphism UI overlays
- Dark gray background (#1f2937)

## Video Processing

### Supported Formats
- WebM (preferred for web)
- Portrait ratios like 864x1280
- Square ratios like 1280x1280
- All ratios handled without stretching

### Video Location
- Source: `/home/mehranshahidi/Pictures/Mafia/Mafia/*.webm`
- Public: `/frontend/public/roles/*.webm`

### Current Roles
1. Sherlock (sherlock.webm)
2. Mafia (Mafia.webm)
3. Doctor Watson (Doctor Watson.webm)

## Styling Decisions

### Card Design
- **Background**: Pure black (#000000)
- **Shape**: Rounded corners (radius: 0.1)
- **Depth**: 0.1 units thick
- **Material**: `meshBasicMaterial` (no lighting needed)

### Text Rendering
- **Component**: `Text` from drei (uses Troika)
- **Font Size**: 0.25 units
- **Color**: White (#ffffff)
- **Outline**: 0.01 units black for readability
- **Position**: Below circle with 0.3 units padding
- **Alignment**: Center, top-anchored

### Background
- Changed from purple gradient to solid dark gray
- Tailwind class: `bg-gray-900` (#1f2937)

## Performance Considerations

### Video Texture Loading
- Uses `useVideoTexture` hook from drei
- Automatically handles video element creation
- Loop enabled, muted, autoplay
- Aspect ratio detected dynamically via `loadedmetadata` event

### Animation Optimization
- Lerp factor: 0.1 (smooth but responsive)
- Only animates when hovered
- Returns to neutral position when not hovered
- Frame-independent with delta time

### Shader Efficiency
- Simple distance calculation for circle mask
- Minimal UV transformations
- Early discard for pixels outside circle
- No expensive operations

## Development Notes

### Issues Resolved
1. **Initial stretching**: Fixed by implementing custom shader with aspect ratio preservation
2. **Font 404 error**: Removed custom font, using default Roboto
3. **Aspect ratio confusion**: Clarified that padding doesn't affect video display, only card positioning
4. **Multiple video ratios**: Generic shader handles portrait, landscape, and square videos

### Future Enhancements (Potential)
- Card flip animation to reveal role
- Multiple cards in gallery layout
- Per-role particle effects
- Custom shaders for special effects (glowing eyes, smoke)
- Card selection/dealing mechanics
- Sound effects on hover/selection
- Mobile touch support for tilting

## File Structure
```
frontend/
├── app/
│   ├── page.tsx              # Main page with role selector
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── MagicCard3D.tsx       # 3D card with video
│   ├── CardScene.tsx         # Three.js scene setup
│   └── index.ts              # Component exports
└── public/
    └── roles/                # Video files
        ├── sherlock.webm
        ├── Mafia.webm
        └── Doctor Watson.webm
```

## Key Dependencies
```json
{
  "three": "^0.x.x",
  "@react-three/fiber": "^8.x.x",
  "@react-three/drei": "^9.x.x",
  "next": "^16.0.5",
  "react": "^19.2.0"
}
```

## Mathematics Reference

### Mouse to Rotation Conversion
```typescript
// Normalize mouse position to [-1, 1]
x = (clientX / window.width) * 2 - 1
y = -(clientY / window.height) * 2 + 1

// Convert to rotation (0.3 rad ≈ 17 degrees max tilt)
targetRotation.x = y * 0.3
targetRotation.y = x * 0.3
```

### Circle Position Calculation
```typescript
// Position circle at top with padding
y = (cardHeight / 2) - circleRadius - padding
// For card height 3.5, radius 1.1, padding 0.15:
// y = 1.75 - 1.1 - 0.15 = 0.5
```

### Lerp Formula
```typescript
// Linear interpolation for smooth animation
current = current + (target - current) * 0.1
// Same as: THREE.MathUtils.lerp(current, target, 0.1)
```

## Testing
- Tested with portrait videos (864x1280)
- Tested with square videos (1280x1280)
- Verified no stretching across different aspect ratios
- Confirmed smooth mouse interaction
- Validated text rendering without custom fonts

---

*Last Updated: 2025-12-10*
*Author: AI Assistant (GitHub Copilot CLI)*
