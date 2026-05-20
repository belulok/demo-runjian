import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PLANTS } from '../data';
import type { Plant } from '../types';

interface Props {
  selectedPlantId: string | null;
  onSelectPlant: (p: Plant | null) => void;
  onPeekAction?: (action: string, plantId: string) => void;
  actionBar?: React.ReactNode;
}

const PLANT_3D_POS: Record<string, [number, number, number]> = {
  kedah:  [-28, 0, -22],
  penang: [  0, 0, -30],
  perak:  [ 28, 0, -22],
  melaka: [-18, 0,  22],
  johor:  [ 18, 0,  22],
};

export function Scene3D({ selectedPlantId, onSelectPlant, actionBar }: Props) {
  return (
    <section className="stage stage-3d" id="stage">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 38, 55], fov: 38, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={['#dceaf6', '#cfd7e0', 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 60, 20]} intensity={1.6} castShadow />
        <color attach="background" args={['#e9eef6']} />

        {/* Ground — wider to accommodate the new districts */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[360, 360]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[360, 72, '#cbd6e2', '#dde6f0']} position={[0, 0.01, 0]} />

        {/* River */}
        <mesh receiveShadow position={[-44, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 180]} />
          <meshStandardMaterial color="#7da6c6" transparent opacity={.85} />
        </mesh>

        <Mountains />
        {/* MASSIVE CITY — multi-district urban environment surrounding the compound */}
        <CitySkyline />
        <CommercialDistrict />
        <HousingDistrict />
        <IndustrialZone />
        <WindFarm origin={[-38, 0, -34]} />
        <WindFarm origin={[ 38, 0, -34]} />
        <WindFarm origin={[ 60, 0,  10]} />

        {/* Forest / tree decorations */}
        <Trees />

        {/* Street lights along axes */}
        <StreetLights />

        {/* Parking lots with static parked cars */}
        <ParkingLot origin={[-32,  8]} cols={4} rows={3} />
        <ParkingLot origin={[ 32,  8]} cols={4} rows={3} />
        <ParkingLot origin={[  0,  35]} cols={6} rows={2} />

        {PLANTS.map(p => (
          <PlantCluster
            key={p.id}
            plant={p}
            position={PLANT_3D_POS[p.id]}
            selected={p.id === selectedPlantId}
            onSelect={() => onSelectPlant(p)}
          />
        ))}

        <AdminTower />
        {/* 5 solar farms */}
        <SolarFarm origin={[-12, 0, -10]} cols={8} rows={6} />
        <SolarFarm origin={[ 12, 0, -10]} cols={8} rows={6} />
        <SolarFarm origin={[  0, 0,  18]} cols={12} rows={4} />
        <SolarFarm origin={[-46, 0,   6]} cols={6} rows={4} />
        <SolarFarm origin={[ 46, 0, -10]} cols={6} rows={4} />

        {/* 8 TX towers around the perimeter */}
        <TxTower position={[-22, 0, -28]} />
        <TxTower position={[ 22, 0, -28]} />
        <TxTower position={[-22, 0,  20]} />
        <TxTower position={[ 22, 0,  20]} />
        <TxTower position={[-46, 0, -10]} />
        <TxTower position={[ 46, 0,  10]} />
        <TxTower position={[ -8, 0,  38]} />
        <TxTower position={[  8, 0,  38]} />

        {/* 3 drones + 1 helicopter — different paths */}
        <Drone radius={30} altitude={12} speed={0.18} color="#1f2937"   ringColor="#67e8f9"/>
        <Drone radius={42} altitude={16} speed={0.12} color="#374151"   ringColor="#a5f3fc" phase={1.8}/>
        <Drone radius={22} altitude={9}  speed={0.26} color="#0f172a"   ringColor="#5eead4" phase={3.2}/>
        <Helicopter />

        {/* 10 vehicles on 3 loop paths */}
        <Vehicle path="loop-a" speed={6}  color="#ffffff" phase={0}    />
        <Vehicle path="loop-a" speed={6}  color="#e5e7eb" phase={0.33} />
        <Vehicle path="loop-a" speed={6}  color="#fbbf24" phase={0.66} />
        <Vehicle path="loop-b" speed={5}  color="#fbbf24" phase={0}    />
        <Vehicle path="loop-b" speed={5}  color="#f4f4f5" phase={0.25} />
        <Vehicle path="loop-b" speed={5}  color="#3b82f6" phase={0.55} />
        <Vehicle path="loop-b" speed={5}  color="#f43f5e" phase={0.8}  />
        <Vehicle path="loop-c" speed={7}  color="#f43f5e" phase={0}    />
        <Vehicle path="loop-c" speed={7}  color="#facc15" phase={0.4}  />
        <Vehicle path="loop-c" speed={7}  color="#ffffff" phase={0.7}  />

        {/* 8 walking people on small idle loops */}
        <Person path="person-1" speed={0.35} color="#3b82f6" hat="#1e40af" />
        <Person path="person-2" speed={0.4}  color="#dc2626" hat="#7f1d1d" />
        <Person path="person-3" speed={0.32} color="#10b981" hat="#065f46" />
        <Person path="person-4" speed={0.38} color="#f59e0b" hat="#92400e" />
        <Person path="person-5" speed={0.42} color="#8b5cf6" hat="#5b21b6" />
        <Person path="person-6" speed={0.3}  color="#3b82f6" hat="#1e40af" />
        <Person path="person-7" speed={0.36} color="#ffffff" hat="#374151" />
        <Person path="person-8" speed={0.34} color="#06b6d4" hat="#0e7490" />

        <Html position={[-22, 14, -28]} center distanceFactor={20}><Poi label="TX Tower A" /></Html>
        <Html position={[ 22, 14, -28]} center distanceFactor={20}><Poi label="TX Tower B" /></Html>
        <Html position={[-38, 9, -34]} center distanceFactor={20}><Poi label="Wind Farm A" /></Html>
        <Html position={[ 38, 9, -34]} center distanceFactor={20}><Poi label="Wind Farm B" /></Html>
        <Html position={[ 60, 9,  10]} center distanceFactor={20}><Poi label="Wind Farm C" /></Html>
        <Html position={[  0,  4,  10]} center distanceFactor={20}><Poi label="Battery Bank" status="warn" /></Html>
        <Html position={[  0, 22,   0]} center distanceFactor={20}><Poi label="Admin Tower" /></Html>
        <Html position={[-32,  4,  10]} center distanceFactor={20}><Poi label="Carpark A" /></Html>
        <Html position={[ 32,  4,  10]} center distanceFactor={20}><Poi label="Carpark B" /></Html>
        <Html position={[ 50, 28, -50]} center distanceFactor={20}><Poi label="Downtown" /></Html>
        <Html position={[  0, 14,  62]} center distanceFactor={20}><Poi label="Commercial District" /></Html>
        <Html position={[-62,  5,   8]} center distanceFactor={20}><Poi label="West Housing" /></Html>
        <Html position={[ 60,  5,  36]} center distanceFactor={20}><Poi label="East Housing" /></Html>
        <Html position={[-58, 14,  34]} center distanceFactor={20}><Poi label="Warehouse Park" /></Html>
        <Html position={[ 66, 10, -16]} center distanceFactor={20}><Poi label="Container Yard" /></Html>

        <OrbitControls
          target={[0, 4, 0]}
          enableDamping
          minDistance={30}
          maxDistance={140}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {actionBar}
    </section>
  );
}

function Poi({ label, status = 'ok' }: { label: string; status?: 'ok' | 'warn' | 'crit' }) {
  return (
    <div className={`scene-poi scene-poi-${status}`}>
      <div className="scene-poi-dot"/>
      <div className="scene-poi-label">{label}</div>
    </div>
  );
}

function PlantCluster({ plant, position, selected, onSelect }:
  { plant: Plant; position: [number, number, number]; selected: boolean; onSelect: () => void }) {
  const isAlert = plant.status === 'critical';
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[5.6, 5.6, 0.1, 36]} />
        <meshStandardMaterial color={isAlert ? '#fde2e7' : '#dbe7f3'} roughness={1} />
      </mesh>
      <mesh position={[-1.6, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 2.6]} />
        <meshStandardMaterial color="#e3ecf6" roughness={.9} />
      </mesh>
      <mesh position={[1.6, 1.35, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.6, 2.4]} />
        <meshStandardMaterial color={isAlert ? '#f3b9c1' : '#cfdaea'} roughness={.85} />
      </mesh>
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * 1.1, 0.08, 2.4]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1, 0.04, 1.4]} />
          <meshStandardMaterial color="#1e3a5f" metalness={.4} roughness={.35} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.0, 6.4, 64]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={.85}/>
        </mesh>
      )}
      {isAlert && <PulseRing />}
      <Html position={[0, 5.5, 0]} center distanceFactor={18}>
        <div className={`plant-poi ${isAlert ? 'crit' : 'ok'}`} onClick={onSelect}>
          <div className="plant-poi-dot" />
          <div className="plant-poi-card">
            <div className="plant-poi-name">{plant.name.split('-')[0]}</div>
            <div className="plant-poi-pwr">{plant.capMW < 1 ? `${Math.round(plant.capMW * 1000)} kWp` : `${plant.capMW.toFixed(2)} MWp`}</div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function PulseRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime % 1.6) / 1.6;
    ref.current.scale.set(1 + t * 0.8, 1 + t * 0.8, 1 + t * 0.8);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[5.8, 6.2, 64]} />
      <meshBasicMaterial color="#f43f5e" transparent opacity={.8}/>
    </mesh>
  );
}

function AdminTower() {
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[6, 6, 0.8, 32]} />
        <meshStandardMaterial color="#dde6f0" roughness={.95} />
      </mesh>
      <mesh position={[0, 9.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 18, 5]} />
        <meshStandardMaterial color="#cfd9e6" metalness={.45} roughness={.18} />
      </mesh>
      {[2, 5.5, 9, 12.5, 16].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[5.05, .35, 5.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={.35} />
        </mesh>
      ))}
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
}

function SolarFarm({ origin, cols, rows }: { origin: [number, number, number]; cols: number; rows: number }) {
  const positions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    const sp = 1.4;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        out.push([origin[0] + (i - cols / 2) * sp, 0.05, origin[2] + (j - rows / 2) * sp]);
    return out;
  }, [origin, cols, rows]);
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p} rotation={[-Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1.0, 0.04, 1.2]} />
          <meshStandardMaterial color="#1e3a5f" metalness={.5} roughness={.25} />
        </mesh>
      ))}
    </group>
  );
}

function WindFarm({ origin }: { origin: [number, number, number] }) {
  const [ox, oy, oz] = origin;
  return (
    <group position={[ox, oy, oz]}>
      {[-6, 0, 6].map((dx, i) => <WindTurbine key={i} position={[dx, 0, (i % 2 ? -2 : 0)]} phase={i * 0.4} />)}
    </group>
  );
}

function WindTurbine({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bladesRef.current) bladesRef.current.rotation.z = clock.elapsedTime * 1.4 + phase;
  });
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 9, 12]} />
        <meshStandardMaterial color="#f4f6f8" roughness={.9}/>
      </mesh>
      <mesh position={[0, 9.1, 0.2]}>
        <boxGeometry args={[0.6, 0.5, 1]} />
        <meshStandardMaterial color="#e4ebf3" />
      </mesh>
      <group ref={bladesRef} position={[0, 9.1, 0.8]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.15, 4, 0.05]} />
            <meshStandardMaterial color="#f4f6f8" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TxTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 9, 8]} />
        <meshStandardMaterial color="#5c6877" />
      </mesh>
      {[1, 3.5, 6, 8].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.4, .07, .07]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
    </group>
  );
}

function Drone({
  radius = 30, altitude = 12, speed = 0.18, color = '#1f2937',
  ringColor = '#67e8f9', phase = 0,
}: {
  radius?: number; altitude?: number; speed?: number;
  color?: string; ringColor?: string; phase?: number;
}) {
  const drone = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    const r = radius + Math.sin(t * 0.7) * 4;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    const y = altitude + Math.sin(t * 1.6) * 1.2;
    if (drone.current) drone.current.position.set(x, y, z);
    if (shadow.current) shadow.current.position.set(x, 0.05, z);
  });
  return (
    <>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.3}>
        <group ref={drone}>
          <mesh castShadow>
            <boxGeometry args={[1, .3, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[[-0.7, 0, -0.7], [0.7, 0, -0.7], [-0.7, 0, 0.7], [0.7, 0, 0.7]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.5, 24]} />
              <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={.7} transparent opacity={.55} />
            </mesh>
          ))}
        </group>
      </Float>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={.32}/>
      </mesh>
    </>
  );
}

function Helicopter() {
  const heli = useRef<THREE.Group>(null);
  const blades = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.12;
    const r = 55;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    const y = 22 + Math.sin(t * 2) * 1.5;
    if (heli.current) {
      heli.current.position.set(x, y, z);
      heli.current.rotation.y = -t + Math.PI / 2;
    }
    if (blades.current) blades.current.rotation.y = clock.elapsedTime * 24;
    if (tail.current)   tail.current.rotation.x = clock.elapsedTime * 30;
    if (shadow.current) shadow.current.position.set(x, 0.05, z);
  });
  return (
    <>
      <group ref={heli}>
        {/* body */}
        <mesh castShadow>
          <capsuleGeometry args={[0.6, 1.6, 6, 12]} />
          <meshStandardMaterial color="#fb923c" metalness={.4} roughness={.5}/>
        </mesh>
        {/* cockpit window */}
        <mesh position={[0.6, 0.05, 0]}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial color="#0c4a6e" metalness={.7} roughness={.15} />
        </mesh>
        {/* tail boom */}
        <mesh position={[-1.4, 0.15, 0]}>
          <boxGeometry args={[1.5, 0.18, 0.18]} />
          <meshStandardMaterial color="#fb923c" />
        </mesh>
        {/* tail rotor */}
        <group ref={tail} position={[-2.1, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.05, 0.8, 0.05]} />
            <meshStandardMaterial color="#e5e7eb" transparent opacity={.45} />
          </mesh>
        </group>
        {/* main rotor */}
        <group ref={blades} position={[0, 0.85, 0]}>
          {[0, 1, 2].map(i => (
            <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
              <boxGeometry args={[3.6, 0.05, 0.15]} />
              <meshStandardMaterial color="#e5e7eb" transparent opacity={.55} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={.28}/>
      </mesh>
    </>
  );
}

function Vehicle({ path, speed, color, phase = 0 }: {
  path: 'loop-a' | 'loop-b' | 'loop-c'; speed: number; color: string; phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    if (path === 'loop-a') {
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * 30, 0.4, Math.sin(a) * 30));
      }
    } else if (path === 'loop-b') {
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const r = 18 + Math.sin(a * 2) * 4;
        points.push(new THREE.Vector3(Math.cos(a) * r, 0.4, Math.sin(a) * r));
      }
    } else {
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * 12, 0.4, Math.sin(a) * 22));
      }
    }
    return new THREE.CatmullRomCurve3(points, true, 'centripetal');
  }, [path]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * speed * 0.01 + phase) % 1;
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ref.current.position.copy(pos);
    ref.current.lookAt(pos.x + tan.x, pos.y + tan.y, pos.z + tan.z);
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.7, 0.9]} />
        <meshStandardMaterial color={color} metalness={.5} roughness={.4}/>
      </mesh>
      <mesh position={[-0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.85]} />
        <meshStandardMaterial color={color} metalness={.4} roughness={.5}/>
      </mesh>
    </group>
  );
}

/* -------- Walking person — small capsule body, sphere head + step animation -------- */
function Person({ path, speed, color, hat }: {
  path: string; speed: number; color: string; hat: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    // Each path is a small loop near a different landmark.
    const points: THREE.Vector3[] = [];
    const PATHS: Record<string, [number, number][]> = {
      'person-1': [[-22, -22], [-18, -20], [-22, -18], [-26, -20]],  // Kedah
      'person-2': [[  0, -30], [  4, -28], [  0, -26], [ -4, -28]],  // Penang
      'person-3': [[ 22, -22], [ 26, -20], [ 22, -18], [ 18, -20]],  // Perak
      'person-4': [[-18,  22], [-14,  24], [-18,  26], [-22,  24]],  // Melaka
      'person-5': [[ 18,  22], [ 22,  24], [ 18,  26], [ 14,  24]],  // Johor
      'person-6': [[  0,   3], [  4,   5], [  0,   7], [ -4,   5]],  // Admin tower
      'person-7': [[-32,   8], [-28,  10], [-32,  12], [-36,  10]],  // Carpark A
      'person-8': [[ 32,   8], [ 36,  10], [ 32,  12], [ 28,  10]],  // Carpark B
    };
    const pts = PATHS[path] ?? PATHS['person-1'];
    pts.forEach(([x, z]) => points.push(new THREE.Vector3(x, 0, z)));
    return new THREE.CatmullRomCurve3(points, true, 'centripetal');
  }, [path]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * speed * 0.01) % 1;
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ref.current.position.copy(pos);
    ref.current.lookAt(pos.x + tan.x, pos.y + tan.y, pos.z + tan.z);
    // bob step
    if (torsoRef.current) {
      torsoRef.current.position.y = 0.5 + Math.abs(Math.sin(clock.elapsedTime * 5)) * 0.08;
    }
  });

  return (
    <group ref={ref}>
      <group ref={torsoRef} position={[0, 0.5, 0]}>
        {/* torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#fde2c2" />
        </mesh>
        {/* hard hat */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hat} />
        </mesh>
      </group>
    </group>
  );
}

/* -------- Massive downtown skyline behind the compound (4 dense rows) -------- */
function CitySkyline() {
  const buildings = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; tint: number }[] = [];
    let s = 12345;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // 4 staggered rows of tall skyscrapers, each row further back + slightly smaller
    const ROWS = [
      { z: -52, count: 16, hMin: 22, hMax: 52, wMin: 4.5, wMax: 7.5 },  // tallest, frontmost
      { z: -64, count: 14, hMin: 26, hMax: 58, wMin: 5,   wMax: 8   },  // signature towers
      { z: -76, count: 12, hMin: 16, hMax: 36, wMin: 4,   wMax: 6.5 },
      { z: -88, count: 10, hMin: 12, hMax: 28, wMin: 3.5, wMax: 5.5 },
    ];
    for (const row of ROWS) {
      for (let i = 0; i < row.count; i++) {
        const x = -row.count * 4 + i * 8 + (rand() - .5) * 2.5;
        const z = row.z - (rand() - .5) * 6;
        const w = row.wMin + rand() * (row.wMax - row.wMin);
        const d = row.wMin + rand() * (row.wMax - row.wMin);
        const h = row.hMin + rand() * (row.hMax - row.hMin);
        out.push({ x, z, w, d, h, tint: rand() });
      }
    }
    // Side wings (east + west)
    for (let i = 0; i < 8; i++) {
      const z = -40 + i * 8 + (rand() - .5) * 3;
      const h = 14 + rand() * 24;
      out.push({ x: -68 - rand() * 6, z, w: 4 + rand() * 3, d: 4 + rand() * 3, h, tint: rand() });
      out.push({ x:  68 + rand() * 6, z, w: 4 + rand() * 3, d: 4 + rand() * 3, h, tint: rand() });
    }
    return out;
  }, []);
  return (
    <group>
      {buildings.map((b, i) => <Skyscraper key={i} {...b} />)}
    </group>
  );
}

/* -------- Mid-rise commercial district (south of the compound) -------- */
function CommercialDistrict() {
  const buildings = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; tint: number }[] = [];
    let s = 33333;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // Two rows of mid-rises behind the housing area to the south
    for (let i = 0; i < 18; i++) {
      const x = -50 + i * 5.6 + (rand() - .5) * 1.6;
      const z = 56 + (rand() - .5) * 3;
      const h = 8 + rand() * 14;
      out.push({ x, z, w: 3.4 + rand() * 2.4, d: 3.4 + rand() * 2.4, h, tint: rand() });
    }
    for (let i = 0; i < 15; i++) {
      const x = -42 + i * 5.6 + (rand() - .5) * 1.6;
      const z = 66 + (rand() - .5) * 3;
      const h = 6 + rand() * 12;
      out.push({ x, z, w: 3.2 + rand() * 2, d: 3.2 + rand() * 2, h, tint: rand() });
    }
    return out;
  }, []);
  return (
    <group>
      {buildings.map((b, i) => <Skyscraper key={`com-${i}`} {...b} />)}
    </group>
  );
}

/* -------- Housing district (small residential blocks with pitched-roof tint) -------- */
function HousingDistrict() {
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string }[] = [];
    let s = 77777;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ROOFS = ['#b91c1c', '#92400e', '#0e7490', '#475569', '#7c2d12', '#1d4ed8'];
    const WALLS = ['#fef3c7', '#fde68a', '#e7e5e4', '#fff7ed', '#f1f5f9', '#fafaf9'];
    // 3 rows along the WEST side (negative X), away from the river
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const x = -76 + col * 3.6 + (rand() - .5) * 0.4;
        const z = 0 + row * 4 + (rand() - .5) * 0.4;
        const w = 2.6 + rand() * 0.8;
        const d = 3.0 + rand() * 0.6;
        const h = 1.8 + rand() * 1.4;
        out.push({ x, z, w, d, h, roof: ROOFS[Math.floor(rand() * ROOFS.length)], wall: WALLS[Math.floor(rand() * WALLS.length)] });
      }
    }
    // Sister neighborhood on the EAST
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const x = 50 + col * 3.6 + (rand() - .5) * 0.4;
        const z = 30 + row * 4 + (rand() - .5) * 0.4;
        const w = 2.6 + rand() * 0.8;
        const d = 3.0 + rand() * 0.6;
        const h = 1.8 + rand() * 1.4;
        out.push({ x, z, w, d, h, roof: ROOFS[Math.floor(rand() * ROOFS.length)], wall: WALLS[Math.floor(rand() * WALLS.length)] });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {houses.map((h, i) => <House key={i} {...h} />)}
    </group>
  );
}

function House({ x, z, w, d, h, roof, wall }: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* walls */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wall} roughness={.95} />
      </mesh>
      {/* pitched roof (a wider, flatter box) */}
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.75, 1.0, 4]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.45, d / 2 + 0.02]}>
        <boxGeometry args={[0.4, 0.9, 0.04]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
    </group>
  );
}

/* -------- Industrial zone (warehouses + chimneys) east of the compound -------- */
function IndustrialZone() {
  const ware = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; color: string }[] = [];
    let s = 55555;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const COLORS = ['#cbd5e1', '#9ca3af', '#94a3b8', '#a8a29e', '#e2e8f0'];
    // Long warehouses to the SOUTH-WEST
    for (let i = 0; i < 6; i++) {
      const x = -68 + i * 9 + (rand() - .5);
      const z = 32 + (rand() - .5) * 2;
      out.push({ x, z, w: 7 + rand() * 1.5, d: 4.5 + rand(), h: 3.5 + rand() * 1.5, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    // Container-like blocks far north-east
    for (let i = 0; i < 8; i++) {
      const x = 60 + (i % 4) * 4.5 + (rand() - .5);
      const z = -16 + Math.floor(i / 4) * 5 + (rand() - .5);
      out.push({ x, z, w: 3.4, d: 3.6, h: 2.4 + rand() * 1.5, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    return out;
  }, []);
  const chimneys: { x: number; z: number; h: number }[] = [
    { x: -62, z: 30, h: 14 },
    { x: -55, z: 36, h: 16 },
    { x:  72, z: 36, h: 12 },
  ];
  return (
    <group>
      {/* warehouses */}
      {ware.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={.95} />
          </mesh>
          {/* roof ridge stripe */}
          <mesh position={[0, b.h + 0.08, 0]}>
            <boxGeometry args={[b.w + 0.04, 0.16, b.d + 0.04]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
      {/* industrial chimneys with steam plume marker */}
      {chimneys.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.8, c.h, 12]} />
            <meshStandardMaterial color="#a8a29e" />
          </mesh>
          <mesh position={[0, c.h - 0.4, 0]}>
            <cylinderGeometry args={[0.75, 0.6, 0.6, 12]} />
            <meshStandardMaterial color="#525258" />
          </mesh>
          {/* fake steam puff */}
          <mesh position={[0, c.h + 1.6, 0]}>
            <sphereGeometry args={[1.0, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={.6} roughness={1} />
          </mesh>
          <mesh position={[0.6, c.h + 2.6, 0.3]}>
            <sphereGeometry args={[0.7, 10, 10]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={.45} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Skyscraper({ x, z, w, d, h, tint }: { x: number; z: number; w: number; d: number; h: number; tint: number }) {
  // Pale-blue/white palette
  const base = tint < 0.33 ? '#d6e1ef' : tint < 0.66 ? '#cfd9e6' : '#e3ecf6';
  const emi  = tint < 0.5 ? '#7fa6d6' : '#83b3e4';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={base} metalness={.45} roughness={.2}/>
      </mesh>
      {/* window stripes */}
      {Array.from({ length: Math.floor(h / 3) }).map((_, i) => (
        <mesh key={i} position={[0, 2 + i * 3, 0]}>
          <boxGeometry args={[w + 0.02, 0.4, d + 0.02]} />
          <meshStandardMaterial color={emi} emissive={emi} emissiveIntensity={.3}/>
        </mesh>
      ))}
      {/* rooftop AC unit */}
      <mesh position={[0, h + 0.4, 0]}>
        <boxGeometry args={[w * 0.5, 0.6, d * 0.5]} />
        <meshStandardMaterial color="#a1a8b3" />
      </mesh>
    </group>
  );
}

/* -------- Tree decorations (scatter conifers) -------- */
function Trees() {
  const positions = useMemo(() => {
    const out: [number, number][] = [];
    let s = 9876;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // place trees in 4 quadrants but away from solar farms / plant pads / city
    const candidate: [number, number][] = [];
    for (let i = 0; i < 60; i++) {
      const x = -80 + rand() * 160;
      const z = -45 + rand() * 90;
      // exclude footprint of major structures
      const tooClose =
        (Math.abs(x) < 14 && Math.abs(z) < 14) ||                       // center admin
        ([-28, 0, 28].some(px => Math.hypot(x - px, z - (-22)) < 8)) || // plant top row
        ([-18, 18].some(px => Math.hypot(x - px, z - 22) < 8))   ||     // plant bottom row
        ([-12, 12, 0].some(px => Math.hypot(x - px, z - (-10)) < 10)) ||
        (Math.abs(z - 18) < 5 && Math.abs(x) < 9) ||                    // bottom solar farm
        (z < -42)                              ||                       // downtown skyline
        (z > 54)                               ||                       // commercial district
        (x < -50 && z >= -2 && z <= 18)        ||                       // west housing
        (x >  46 && z >= 28 && z <= 50)        ||                       // east housing
        (x < -45 && z >= 28 && z <= 40)        ||                       // SW warehouses
        (x >  55 && z >= -22 && z <= -8);                               // NE container blocks
      if (!tooClose) candidate.push([x, z]);
    }
    out.push(...candidate.slice(0, 36));
    return out;
  }, []);
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* trunk */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.0, 6]} />
            <meshStandardMaterial color="#6b4f2a" roughness={1}/>
          </mesh>
          {/* foliage cone */}
          <mesh position={[0, 1.6, 0]} castShadow>
            <coneGeometry args={[0.9, 2.4, 10]} />
            <meshStandardMaterial color="#3d8b5e" roughness={.95}/>
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* -------- Street lights along main roads -------- */
function StreetLights() {
  const positions: [number, number][] = [
    [-30,  0], [30, 0], [-10, 0], [10, 0],
    [-30, 30], [30, 30], [-30, -30], [30, -30],
    [  0, 15], [  0, -15],
  ];
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* pole */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 2.6, 6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* arm */}
          <mesh position={[0.5, 2.55, 0]}>
            <boxGeometry args={[1.0, 0.08, 0.08]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* lamp */}
          <mesh position={[1.0, 2.5, 0]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#fefce8" emissive="#fde68a" emissiveIntensity={.85}/>
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* -------- Parking lot with static cars -------- */
function ParkingLot({ origin, cols, rows }: { origin: [number, number]; cols: number; rows: number }) {
  const [ox, oz] = origin;
  const colors = ['#ffffff', '#fbbf24', '#3b82f6', '#f43f5e', '#facc15', '#0ea5e9', '#e5e7eb', '#1f2937'];
  const slots = useMemo(() => {
    const out: { x: number; z: number; c: string; r: number }[] = [];
    let s = 4242;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        out.push({
          x: ox + (i - cols / 2) * 2.4,
          z: oz + (j - rows / 2) * 4.4,
          c: colors[Math.floor(rand() * colors.length)],
          r: rand() > .5 ? 0 : Math.PI,
        });
    return out;
  }, [ox, oz, cols, rows]);
  return (
    <group>
      {/* lot pavement */}
      <mesh receiveShadow position={[ox, 0.02, oz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cols * 2.5 + 1, rows * 4.5 + 1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={1}/>
      </mesh>
      {/* white stripe markings */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh key={i} position={[ox + (i - cols / 2) * 2.4 - 1.2, 0.04, oz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, rows * 4.5]} />
          <meshStandardMaterial color="#f8fafc"/>
        </mesh>
      ))}
      {/* parked cars */}
      {slots.map((s, i) => (
        <group key={i} position={[s.x, 0.35, s.z]} rotation={[0, s.r, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.6, 0.9]} />
            <meshStandardMaterial color={s.c} metalness={.5} roughness={.4}/>
          </mesh>
          <mesh position={[-0.3, 0.45, 0]}>
            <boxGeometry args={[0.55, 0.35, 0.8]} />
            <meshStandardMaterial color={s.c} metalness={.4} roughness={.5}/>
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Mountains() {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number }[] = [];
    for (let i = -7; i <= 7; i++) {
      const x = i * 9 + (Math.random() * 4 - 2);
      const z = -78 + Math.random() * 6;
      const s = 10 + Math.random() * 14;
      out.push({ p: [x, s / 2, z], s });
    }
    return out;
  }, []);
  return (
    <>
      {peaks.map((m, i) => (
        <mesh key={i} position={m.p} castShadow>
          <coneGeometry args={[m.s * .55, m.s, 14]} />
          <meshStandardMaterial color="#dde6f0" roughness={1} />
        </mesh>
      ))}
    </>
  );
}
