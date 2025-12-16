import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GestureState } from '@/hooks/useHandTracking';

interface ModelProps {
  gesture: GestureState;
  modelType: 'torus' | 'sphere' | 'cube' | 'icosahedron' | 'car' | 'chair' | 'solar';
}

// Animated Comet Component
const Comet = ({ orbitRadius = 12, speed = 0.3, inclination = 0.5 }: { orbitRadius?: number; speed?: number; inclination?: number }) => {
  const cometRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (cometRef.current) {
      const angle = state.clock.elapsedTime * speed;
      const ellipse = 0.6; // Elliptical orbit
      cometRef.current.position.x = Math.cos(angle) * orbitRadius;
      cometRef.current.position.z = Math.sin(angle) * orbitRadius * ellipse;
      cometRef.current.position.y = Math.sin(angle * 2) * inclination;
      
      // Point tail away from sun
      const tailAngle = Math.atan2(cometRef.current.position.z, cometRef.current.position.x);
      if (tailRef.current) {
        tailRef.current.rotation.z = -tailAngle - Math.PI / 2;
      }
    }
  });

  return (
    <group ref={cometRef}>
      {/* Comet nucleus */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#aabbcc" emissive="#88aacc" emissiveIntensity={0.8} />
      </mesh>
      {/* Comet coma (glow around nucleus) */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#88ccff" transparent opacity={0.3} />
      </mesh>
      {/* Comet tail */}
      <mesh ref={tailRef} position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.12, 1.5, 8]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.08, 2, 8]} />
        <meshBasicMaterial color="#66aaff" transparent opacity={0.2} />
      </mesh>
      {/* Point light for glow effect */}
      <pointLight intensity={0.5} distance={2} color="#88ccff" />
    </group>
  );
};

// Planet Label Component - Only shows when zoomed in
const PlanetLabel = ({ name, planetRef, planetSize, visible }: { name: string; planetRef: React.RefObject<THREE.Group>; planetSize: number; visible: boolean }) => {
  const labelRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (labelRef.current && planetRef.current) {
      labelRef.current.position.copy(planetRef.current.position);
      labelRef.current.position.y += planetSize + 0.15;
    }
  });

  if (!visible) return null;

  return (
    <group ref={labelRef}>
      <Html center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div className="px-1 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/30 whitespace-nowrap animate-fade-in">
          <span className="text-[8px] font-medium text-white/90">{name}</span>
        </div>
      </Html>
    </group>
  );
};

// Asteroid Belt Component
const AsteroidBelt = ({ innerRadius, outerRadius, count }: { innerRadius: number; outerRadius: number; count: number }) => {
  const asteroids = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = innerRadius + Math.random() * (outerRadius - innerRadius);
      const size = 0.02 + Math.random() * 0.04;
      const speed = 0.05 + Math.random() * 0.1;
      const yOffset = (Math.random() - 0.5) * 0.3;
      return { angle, distance, size, speed, yOffset, id: i };
    });
  }, [innerRadius, outerRadius, count]);

  return (
    <group>
      {asteroids.map((asteroid) => (
        <Asteroid key={asteroid.id} {...asteroid} />
      ))}
    </group>
  );
};

const Asteroid = ({ angle, distance, size, speed, yOffset }: { angle: number; distance: number; size: number; speed: number; yOffset: number; id: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialAngle = useRef(angle);

  useFrame((state) => {
    if (meshRef.current) {
      const currentAngle = initialAngle.current + state.clock.elapsedTime * speed;
      meshRef.current.position.x = Math.cos(currentAngle) * distance;
      meshRef.current.position.z = Math.sin(currentAngle) * distance;
      meshRef.current.position.y = yOffset;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
    }
  });

  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#8b7355" metalness={0.4} roughness={0.8} />
    </mesh>
  );
};

// Moon Component
const Moon = ({ 
  parentRef, 
  distance, 
  size, 
  color, 
  speed,
  orbitTilt = 0
}: { 
  parentRef: React.RefObject<THREE.Group>; 
  distance: number; 
  size: number; 
  color: string; 
  speed: number;
  orbitTilt?: number;
}) => {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (moonRef.current && parentRef.current) {
      const angle = state.clock.elapsedTime * speed;
      moonRef.current.position.x = parentRef.current.position.x + Math.cos(angle) * distance;
      moonRef.current.position.z = parentRef.current.position.z + Math.sin(angle) * distance;
      moonRef.current.position.y = Math.sin(angle) * orbitTilt;
      moonRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
    </mesh>
  );
};

// Enhanced Planet Component with Moons and Label
const Planet = ({ 
  name,
  distance, 
  size, 
  color, 
  speed, 
  hasRing,
  moons = [],
  emissive,
  emissiveIntensity = 0,
  showLabel = false
}: { 
  name: string;
  distance: number; 
  size: number; 
  color: string; 
  speed: number; 
  hasRing?: boolean;
  moons?: { distance: number; size: number; color: string; speed: number }[];
  emissive?: string;
  emissiveIntensity?: number;
  showLabel?: boolean;
}) => {
  const planetRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (planetRef.current) {
      const angle = state.clock.elapsedTime * speed * 0.08;
      planetRef.current.position.x = Math.cos(angle) * distance;
      planetRef.current.position.z = Math.sin(angle) * distance;
      planetRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      {/* Orbit line with glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.02, distance + 0.02, 256]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Planet Label - only visible when zoomed in */}
      <PlanetLabel name={name} planetRef={planetRef} planetSize={size} visible={showLabel} />

      {/* Planet */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[size, 64, 64]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.4} 
            roughness={0.6}
            emissive={emissive || color}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        
        {/* Saturn's ring with multiple layers */}
        {hasRing && (
          <group rotation={[Math.PI / 3, 0, 0]}>
            <mesh>
              <ringGeometry args={[size * 1.3, size * 1.6, 128]} />
              <meshBasicMaterial color="#d4c4a8" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <ringGeometry args={[size * 1.6, size * 1.8, 128]} />
              <meshBasicMaterial color="#c4b498" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <ringGeometry args={[size * 1.8, size * 2, 128]} />
              <meshBasicMaterial color="#b4a488" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* Moons */}
        {moons.map((moon, index) => (
          <Moon key={index} parentRef={planetRef} {...moon} />
        ))}
      </group>
    </>
  );
};

// Enhanced Solar System Component
const SolarSystem = ({ gesture }: { gesture: GestureState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const targetScale = useRef(1);
  const currentScale = useRef(0.35);
  const isFrozen = useRef(false);

  // Show labels only when zoomed in (scale > 0.6)
  const showLabels = currentScale.current > 0.6;

  const planets = useMemo(() => [
    { name: 'Mercury', distance: 1.8, size: 0.08, color: '#b5b5b5', speed: 2.0 },
    { name: 'Venus', distance: 2.4, size: 0.12, color: '#e6c87a', speed: 1.2 },
    { 
      name: 'Earth', 
      distance: 3.0, 
      size: 0.13, 
      color: '#4a90d9', 
      speed: 0.8,
      emissive: '#1a4080',
      emissiveIntensity: 0.1,
      moons: [{ distance: 0.25, size: 0.035, color: '#cccccc', speed: 3 }]
    },
    { 
      name: 'Mars', 
      distance: 3.8, 
      size: 0.09, 
      color: '#d4573b', 
      speed: 0.5,
      moons: [
        { distance: 0.15, size: 0.02, color: '#aa9988', speed: 4 },
        { distance: 0.22, size: 0.015, color: '#998877', speed: 3.5 }
      ]
    },
    { 
      name: 'Jupiter', 
      distance: 5.2, 
      size: 0.4, 
      color: '#d4a574', 
      speed: 0.15,
      moons: [
        { distance: 0.6, size: 0.05, color: '#ffcc99', speed: 2.5 },
        { distance: 0.75, size: 0.045, color: '#ddbb88', speed: 2 },
        { distance: 0.9, size: 0.06, color: '#ccaa77', speed: 1.5 },
        { distance: 1.05, size: 0.04, color: '#bbaa66', speed: 1.2 }
      ]
    },
    { 
      name: 'Saturn', 
      distance: 6.8, 
      size: 0.35, 
      color: '#e6d9a8', 
      speed: 0.08, 
      hasRing: true,
      moons: [
        { distance: 0.8, size: 0.07, color: '#ffdd99', speed: 1.8 },
        { distance: 0.95, size: 0.03, color: '#ddcc88', speed: 1.5 }
      ]
    },
    { 
      name: 'Uranus', 
      distance: 8.0, 
      size: 0.22, 
      color: '#a8e6e6', 
      speed: 0.03,
      moons: [{ distance: 0.4, size: 0.025, color: '#aadddd', speed: 2 }]
    },
    { 
      name: 'Neptune', 
      distance: 9.2, 
      size: 0.21, 
      color: '#4a7bd4', 
      speed: 0.015,
      emissive: '#2244aa',
      emissiveIntensity: 0.15,
      moons: [{ distance: 0.45, size: 0.03, color: '#7799cc', speed: 1.8 }]
    },
  ], []);

  useFrame(() => {
    if (!groupRef.current) return;

    if (gesture.isFist && !isFrozen.current) isFrozen.current = true;
    if (!gesture.isFist && (gesture.isOpenHand || gesture.isZoomIn || gesture.isZoomOut || gesture.isPeace || gesture.isReset)) {
      isFrozen.current = false;
    }

    if (gesture.isReset) {
      targetRotation.current = { x: 0, y: 0 };
      targetPosition.current = { x: 0, y: 0 };
      targetScale.current = 1;
      isFrozen.current = false;
    }

    if (!isFrozen.current) {
      if (gesture.isOpenHand) {
        targetRotation.current.x += gesture.rotation.x;
        targetRotation.current.y += gesture.rotation.y;
      }
      if (gesture.isPeace) {
        targetPosition.current.x += gesture.position.x;
        targetPosition.current.y += gesture.position.y;
        targetPosition.current.x = Math.max(-3, Math.min(3, targetPosition.current.x));
        targetPosition.current.y = Math.max(-2, Math.min(2, targetPosition.current.y));
      }
      if (gesture.isZoomIn) targetScale.current = Math.min(3, targetScale.current + 0.02);
      if (gesture.isZoomOut) targetScale.current = Math.max(0.2, targetScale.current - 0.02);
    }

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x + 0.2, 0.15);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.15);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosition.current.x, 0.15);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosition.current.y, 0.15);
    
    const prevScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(prevScale, targetScale.current, 0.1);
    groupRef.current.scale.setScalar(newScale);
    currentScale.current = newScale * 0.35;
  });

  return (
    <group ref={groupRef} scale={0.35}>
      {/* Enhanced Sun with corona effect */}
      <mesh>
        <sphereGeometry args={[0.6, 128, 128]} />
        <meshStandardMaterial
          color="#ffdd00"
          emissive="#ff8800"
          emissiveIntensity={3}
        />
      </mesh>
      {/* Sun glow layers */}
      <mesh>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.08} />
      </mesh>
      
      <pointLight position={[0, 0, 0]} intensity={4} color="#ffcc00" distance={30} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ff8800" distance={15} />

      {/* Planets - labels only show when zoomed in */}
      {planets.map((planet) => (
        <Planet key={planet.name} {...planet} showLabel={showLabels} />
      ))}

      {/* Asteroid Belt between Mars and Jupiter */}
      <AsteroidBelt innerRadius={4.3} outerRadius={4.9} count={150} />

      {/* Kuiper Belt (outer) */}
      <AsteroidBelt innerRadius={10} outerRadius={12} count={100} />

      {/* Animated Comets */}
      <Comet orbitRadius={11} speed={0.15} inclination={1.5} />
      <Comet orbitRadius={13} speed={0.1} inclination={-1} />
      <Comet orbitRadius={9} speed={0.2} inclination={0.8} />
    </group>
  );
};

// Enhanced Lamborghini-style Car
const CarModel = ({ gesture }: { gesture: GestureState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const targetScale = useRef(1);
  const isFrozen = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;

    if (gesture.isFist && !isFrozen.current) isFrozen.current = true;
    if (!gesture.isFist && (gesture.isOpenHand || gesture.isZoomIn || gesture.isZoomOut || gesture.isPeace || gesture.isReset)) {
      isFrozen.current = false;
    }

    if (gesture.isReset) {
      targetRotation.current = { x: 0, y: 0 };
      targetPosition.current = { x: 0, y: 0 };
      targetScale.current = 1;
      isFrozen.current = false;
    }

    if (!isFrozen.current) {
      if (gesture.isOpenHand) {
        targetRotation.current.x += gesture.rotation.x;
        targetRotation.current.y += gesture.rotation.y;
      }
      if (gesture.isPeace) {
        targetPosition.current.x += gesture.position.x;
        targetPosition.current.y += gesture.position.y;
        targetPosition.current.x = Math.max(-3, Math.min(3, targetPosition.current.x));
        targetPosition.current.y = Math.max(-2, Math.min(2, targetPosition.current.y));
      }
      if (gesture.isZoomIn) targetScale.current = Math.min(3, targetScale.current + 0.02);
      if (gesture.isZoomOut) targetScale.current = Math.max(0.3, targetScale.current - 0.02);
    }

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.15);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.15);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosition.current.x, 0.15);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosition.current.y, 0.15);
    
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale.current, 0.1);
    groupRef.current.scale.setScalar(newScale);
  });

  return (
    <group ref={groupRef}>
      <Float speed={isFrozen.current ? 0 : 1} rotationIntensity={0} floatIntensity={isFrozen.current ? 0 : 0.2}>
        <group>
          {/* Main Body - Sleek Lamborghini shape */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[2.8, 0.35, 1.2]} />
            <meshStandardMaterial color="#ffcc00" metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Hood - Aggressive low profile */}
          <mesh position={[-0.8, 0.4, 0]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[1.2, 0.2, 1.15]} />
            <meshStandardMaterial color="#ffcc00" metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Cabin - Angular design */}
          <mesh position={[0.3, 0.65, 0]}>
            <boxGeometry args={[1.0, 0.4, 1.0]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Front windshield */}
          <mesh position={[-0.15, 0.65, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.5, 0.35, 0.95]} />
            <meshStandardMaterial color="#1a3344" metalness={0.2} roughness={0} transparent opacity={0.6} />
          </mesh>
          
          {/* Rear */}
          <mesh position={[1.1, 0.45, 0]}>
            <boxGeometry args={[0.6, 0.3, 1.15]} />
            <meshStandardMaterial color="#ffcc00" metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Spoiler */}
          <mesh position={[1.35, 0.7, 0]}>
            <boxGeometry args={[0.1, 0.05, 1.3]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[1.25, 0.65, 0.5]}>
            <boxGeometry args={[0.15, 0.1, 0.05]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[1.25, 0.65, -0.5]}>
            <boxGeometry args={[0.15, 0.1, 0.05]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Side air intakes */}
          <mesh position={[0, 0.35, 0.62]}>
            <boxGeometry args={[0.8, 0.15, 0.05]} />
            <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.35, -0.62]}>
            <boxGeometry args={[0.8, 0.15, 0.05]} />
            <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* Wheels - Low profile sport wheels */}
          {[[-0.85, 0.18, 0.6], [-0.85, 0.18, -0.6], [0.85, 0.18, 0.6], [0.85, 0.18, -0.6]].map((pos, i) => (
            <group key={i} position={pos as [number, number, number]}>
              {/* Tire */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.18, 32]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.9} />
              </mesh>
              {/* Rim */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.19, 8]} />
                <meshStandardMaterial color="#333333" metalness={0.95} roughness={0.05} />
              </mesh>
              {/* Center cap */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, i < 2 ? 0.1 : -0.1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
                <meshStandardMaterial color="#ffcc00" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          ))}
          
          {/* Headlights - Angular LED style */}
          <mesh position={[-1.38, 0.4, 0.4]}>
            <boxGeometry args={[0.05, 0.08, 0.25]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-1.38, 0.4, -0.4]}>
            <boxGeometry args={[0.05, 0.08, 0.25]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
          </mesh>
          
          {/* Taillights - Line style */}
          <mesh position={[1.38, 0.45, 0]}>
            <boxGeometry args={[0.05, 0.06, 1.0]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

// Colorful Modern Chair
const ChairModel = ({ gesture }: { gesture: GestureState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const targetScale = useRef(1);
  const isFrozen = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;

    if (gesture.isFist && !isFrozen.current) isFrozen.current = true;
    if (!gesture.isFist && (gesture.isOpenHand || gesture.isZoomIn || gesture.isZoomOut || gesture.isPeace || gesture.isReset)) {
      isFrozen.current = false;
    }

    if (gesture.isReset) {
      targetRotation.current = { x: 0, y: 0 };
      targetPosition.current = { x: 0, y: 0 };
      targetScale.current = 1;
      isFrozen.current = false;
    }

    if (!isFrozen.current) {
      if (gesture.isOpenHand) {
        targetRotation.current.x += gesture.rotation.x;
        targetRotation.current.y += gesture.rotation.y;
      }
      if (gesture.isPeace) {
        targetPosition.current.x += gesture.position.x;
        targetPosition.current.y += gesture.position.y;
        targetPosition.current.x = Math.max(-3, Math.min(3, targetPosition.current.x));
        targetPosition.current.y = Math.max(-2, Math.min(2, targetPosition.current.y));
      }
      if (gesture.isZoomIn) targetScale.current = Math.min(3, targetScale.current + 0.02);
      if (gesture.isZoomOut) targetScale.current = Math.max(0.3, targetScale.current - 0.02);
    }

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.15);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.15);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosition.current.x, 0.15);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosition.current.y, 0.15);
    
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale.current, 0.1);
    groupRef.current.scale.setScalar(newScale);
  });

  const frameColor = '#c0c0c0'; // Chrome
  const seatColor = '#ff4444'; // Vibrant red
  const cushionColor = '#ff6666'; // Lighter red

  return (
    <group ref={groupRef}>
      <Float speed={isFrozen.current ? 0 : 1} rotationIntensity={0} floatIntensity={isFrozen.current ? 0 : 0.2}>
        <group>
          {/* Modern curved seat shell */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={seatColor} metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Seat cushion */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 32]} />
            <meshStandardMaterial color={cushionColor} metalness={0.1} roughness={0.8} />
          </mesh>
          
          {/* Backrest - curved */}
          <mesh position={[0, 0.6, -0.35]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.9, 0.8, 0.08]} />
            <meshStandardMaterial color={seatColor} metalness={0.3} roughness={0.4} />
          </mesh>
          
          {/* Back cushion */}
          <mesh position={[0, 0.6, -0.3]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.75, 0.65, 0.08]} />
            <meshStandardMaterial color={cushionColor} metalness={0.1} roughness={0.8} />
          </mesh>
          
          {/* Chrome base - star shape */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <mesh key={i} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, (angle * Math.PI) / 180]}>
              <capsuleGeometry args={[0.03, 0.5, 8, 16]} />
              <meshStandardMaterial color={frameColor} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
          
          {/* Central column */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 32]} />
            <meshStandardMaterial color={frameColor} metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Gas lift cover */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.08, 0.15, 32]} />
            <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Caster wheels */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.sin(rad) * 0.4;
            const z = Math.cos(rad) * 0.4;
            return (
              <group key={i} position={[x, -0.55, z]}>
                <mesh>
                  <sphereGeometry args={[0.05, 16, 16]} />
                  <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
            );
          })}
          
          {/* Armrests */}
          <mesh position={[-0.5, 0.35, 0]}>
            <capsuleGeometry args={[0.04, 0.3, 8, 16]} />
            <meshStandardMaterial color={frameColor} metalness={0.95} roughness={0.05} />
          </mesh>
          <mesh position={[0.5, 0.35, 0]}>
            <capsuleGeometry args={[0.04, 0.3, 8, 16]} />
            <meshStandardMaterial color={frameColor} metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Armrest pads */}
          <mesh position={[-0.5, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.03, 0.2, 8, 16]} />
            <meshStandardMaterial color={seatColor} metalness={0.2} roughness={0.6} />
          </mesh>
          <mesh position={[0.5, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.03, 0.2, 8, 16]} />
            <meshStandardMaterial color={seatColor} metalness={0.2} roughness={0.6} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

const InteractiveModel = ({ gesture, modelType }: ModelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const targetScale = useRef(1);
  const isFrozen = useRef(false);

  useFrame(() => {
    if (!meshRef.current || !groupRef.current) return;

    if (gesture.isFist && !isFrozen.current) isFrozen.current = true;
    if (!gesture.isFist && (gesture.isOpenHand || gesture.isZoomIn || gesture.isZoomOut || gesture.isPeace || gesture.isReset)) {
      isFrozen.current = false;
    }

    if (gesture.isReset) {
      targetRotation.current = { x: 0, y: 0 };
      targetPosition.current = { x: 0, y: 0 };
      targetScale.current = 1;
      isFrozen.current = false;
    }

    if (!isFrozen.current) {
      if (gesture.isOpenHand) {
        targetRotation.current.x += gesture.rotation.x;
        targetRotation.current.y += gesture.rotation.y;
      }
      if (gesture.isPeace) {
        targetPosition.current.x += gesture.position.x;
        targetPosition.current.y += gesture.position.y;
        targetPosition.current.x = Math.max(-3, Math.min(3, targetPosition.current.x));
        targetPosition.current.y = Math.max(-2, Math.min(2, targetPosition.current.y));
      }
      if (gesture.isZoomIn) targetScale.current = Math.min(3, targetScale.current + 0.02);
      if (gesture.isZoomOut) targetScale.current = Math.max(0.3, targetScale.current - 0.02);
    }

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current.x, 0.15);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current.y, 0.15);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosition.current.x, 0.15);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosition.current.y, 0.15);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale.current, 0.1));
  });

  const getGeometry = () => {
    switch (modelType) {
      case 'torus':
        return <torusKnotGeometry args={[1, 0.35, 200, 40]} />;
      case 'sphere':
        return <sphereGeometry args={[1.3, 128, 128]} />;
      case 'cube':
        return <boxGeometry args={[1.6, 1.6, 1.6]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1.3, 2]} />;
      default:
        return <torusKnotGeometry args={[1, 0.35, 200, 40]} />;
    }
  };

  const distortAmount = gesture.isZoomIn ? 0.5 : gesture.isZoomOut ? 0.3 : gesture.isOpenHand ? 0.25 : isFrozen.current ? 0 : 0.15;

  return (
    <group ref={groupRef}>
      <Float speed={isFrozen.current ? 0 : 2} rotationIntensity={isFrozen.current ? 0 : 0.15} floatIntensity={isFrozen.current ? 0 : 0.4}>
        <mesh ref={meshRef}>
          {getGeometry()}
          <MeshDistortMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={isFrozen.current ? 0.1 : gesture.isZoomIn ? 0.5 : gesture.isZoomOut ? 0.4 : 0.25}
            metalness={0.95}
            roughness={0.05}
            distort={distortAmount}
            speed={isFrozen.current ? 0 : 3}
          />
        </mesh>
      </Float>
    </group>
  );
};

// Enhanced Nebula Component - Beautiful multi-layered space clouds
const Nebula = ({ position, color, size, opacity = 0.15 }: { position: [number, number, number]; color: string; size: number; opacity?: number }) => {
  const nebulaRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z = state.clock.elapsedTime * 0.008;
      nebulaRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.15;
      nebulaRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.012) * 0.1;
    }
  });

  return (
    <group ref={nebulaRef} position={position}>
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[size * 0.3, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 2} />
      </mesh>
      {/* Inner layer */}
      <mesh>
        <sphereGeometry args={[size * 0.6, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 1.2} side={THREE.BackSide} />
      </mesh>
      {/* Middle layer */}
      <mesh rotation={[0.3, 0.5, 0]}>
        <sphereGeometry args={[size * 0.8, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.8} side={THREE.BackSide} />
      </mesh>
      {/* Outer layer */}
      <mesh rotation={[0.5, 0.2, 0.3]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.5} side={THREE.BackSide} />
      </mesh>
      {/* Dust clouds */}
      <mesh rotation={[1, 0.5, 0]}>
        <torusGeometry args={[size * 0.7, size * 0.3, 16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Enhanced Space Nebula Cluster with more vivid colors
const NebulaCluster = () => {
  const nebulas = useMemo(() => [
    // Main colorful nebulas
    { position: [-25, 12, -35] as [number, number, number], color: '#ff2266', size: 30, opacity: 0.12 },
    { position: [35, -8, -30] as [number, number, number], color: '#2288ff', size: 35, opacity: 0.1 },
    { position: [-18, -20, -45] as [number, number, number], color: '#44ff88', size: 25, opacity: 0.09 },
    { position: [22, 28, -40] as [number, number, number], color: '#ff6622', size: 32, opacity: 0.11 },
    { position: [0, -30, -55] as [number, number, number], color: '#aa44ff', size: 40, opacity: 0.08 },
    { position: [-40, 3, -50] as [number, number, number], color: '#22ffff', size: 28, opacity: 0.1 },
    { position: [30, -18, -38] as [number, number, number], color: '#ff44cc', size: 22, opacity: 0.12 },
    // Additional distant nebulas
    { position: [-55, 25, -70] as [number, number, number], color: '#ffaa22', size: 45, opacity: 0.06 },
    { position: [50, -30, -65] as [number, number, number], color: '#22aaff', size: 38, opacity: 0.07 },
    { position: [0, 40, -80] as [number, number, number], color: '#ff22aa', size: 50, opacity: 0.05 },
  ], []);

  return (
    <group>
      {nebulas.map((nebula, i) => (
        <Nebula key={i} {...nebula} />
      ))}
      {/* Distant spiral galaxies */}
      <group position={[50, 20, -80]} rotation={[0.5, 0, 0.3]}>
        <mesh>
          <ringGeometry args={[8, 15, 64]} />
          <meshBasicMaterial color="#8866cc" transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[5, 9, 64]} />
          <meshBasicMaterial color="#aa88ee" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#ccaaff" transparent opacity={0.1} />
        </mesh>
      </group>
      <group position={[-60, -15, -90]} rotation={[0.3, 0.5, 0]}>
        <mesh>
          <ringGeometry args={[10, 18, 64]} />
          <meshBasicMaterial color="#cc6688" transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[6, 11, 64]} />
          <meshBasicMaterial color="#ee88aa" transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[4, 16, 16]} />
          <meshBasicMaterial color="#ffaacc" transparent opacity={0.08} />
        </mesh>
      </group>
      {/* Cosmic dust lanes */}
      <mesh position={[0, 0, -100]} rotation={[0.2, 0, 0.1]}>
        <planeGeometry args={[200, 30]} />
        <meshBasicMaterial color="#443366" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Enhanced starfield with twinkling
const TwinklingStars = () => {
  const starsRef = useRef<THREE.Points>(null);
  const count = 8000;
  
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);
      
      // Star colors: white, blue, yellow, orange, red
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        col[i3] = 1; col[i3 + 1] = 1; col[i3 + 2] = 1;
      } else if (colorChoice < 0.7) {
        col[i3] = 0.7; col[i3 + 1] = 0.85; col[i3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        col[i3] = 1; col[i3 + 1] = 1; col[i3 + 2] = 0.7;
      } else if (colorChoice < 0.95) {
        col[i3] = 1; col[i3 + 1] = 0.7; col[i3 + 2] = 0.4;
      } else {
        col[i3] = 1; col[i3 + 1] = 0.4; col[i3 + 2] = 0.4;
      }
      
      siz[i] = 0.3 + Math.random() * 2.5;
    }
    
    return [pos, col, siz];
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.001;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.1} vertexColors transparent opacity={0.95} sizeAttenuation />
    </points>
  );
};

const ParticleField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 800;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 25;
      pos[i + 1] = (Math.random() - 0.5) * 25;
      pos[i + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#00ffff" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

interface Scene3DProps {
  gesture: GestureState;
  modelType: 'torus' | 'sphere' | 'cube' | 'icosahedron' | 'car' | 'chair' | 'solar';
}

const Scene3D = ({ gesture, modelType }: Scene3DProps) => {
  const renderModel = () => {
    switch (modelType) {
      case 'car':
        return <CarModel gesture={gesture} />;
      case 'chair':
        return <ChairModel gesture={gesture} />;
      case 'solar':
        return <SolarSystem gesture={gesture} />;
      default:
        return <InteractiveModel gesture={gesture} modelType={modelType} />;
    }
  };

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, modelType === 'solar' ? 10 : 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#020408']} />
        <fog attach="fog" args={['#020408', 8, 50]} />
        
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#ff00ff" />
        <pointLight position={[0, -10, 5]} intensity={0.4} color="#00ff88" />
        <spotLight position={[0, 8, 0]} intensity={1} angle={0.4} penumbra={1} color="#ffffff" />

        {renderModel()}
        
        {modelType === 'solar' ? (
          <>
            <NebulaCluster />
            <TwinklingStars />
            <Stars radius={200} depth={100} count={10000} factor={8} saturation={0.4} fade speed={0.3} />
          </>
        ) : (
          <ParticleField />
        )}

        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default Scene3D;
