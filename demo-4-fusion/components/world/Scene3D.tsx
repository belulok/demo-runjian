"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   Self-contained plant data
   ============================================================ */
export type ScenePlantStatus = "normal" | "critical" | "offline";
export interface Plant {
  id: string;
  name: string;
  cap: string;
  capMW: number;
  status: ScenePlantStatus;
}
const PLANTS: Plant[] = [
  { id: "kedah",  name: "Kedah-Commercial",  cap: "307.44 kWp", capMW: 0.307, status: "normal"   },
  { id: "penang", name: "Penang-Commercial", cap: "2,757 kWp",  capMW: 2.757, status: "critical" },
  { id: "perak",  name: "Perak-Commercial",  cap: "2,855 kWp",  capMW: 2.855, status: "normal"   },
  { id: "melaka", name: "Melaka-Commercial", cap: "409 kWp",    capMW: 0.409, status: "normal"   },
  { id: "johor",  name: "Johor-Commercial",  cap: "1,160 kWp",  capMW: 1.160, status: "normal"   },
];

/** 5 plants laid out across the 4 quadrants of the park, with Penang
 *  (the only "critical" plant) up top so the pulse ring reads from the
 *  main camera angle. */
const PLANT_POS: Record<string, [number, number, number]> = {
  kedah:  [-60, 0, -55],
  penang: [  0, 0, -75],
  perak:  [ 60, 0, -55],
  melaka: [-60, 0,  55],
  johor:  [ 60, 0,  55],
};

interface Props {
  selectedPlantId: string | null;
  onSelectPlant: (p: Plant | null) => void;
}

export function Scene3D({ selectedPlantId, onSelectPlant }: Props) {
  return (
    <section className="stage stage-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 80, 130], fov: 36, near: 0.1, far: 600 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={["#dceaf6", "#cfd7e0", 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 80, 30]} intensity={1.6} castShadow />
        <color attach="background" args={["#e9eef6"]} />

        {/* Ground + subtle grid */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[600, 600]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[600, 60, "#cbd6e2", "#dde6f0"]} position={[0, 0.01, 0]} />

        {/* Roads first so structures sit on top of asphalt edges */}
        <RoadNetwork />

        {/* Central energy generation block — the visual heart of the park */}
        <CoolingTowers position={[-22, 0, 18]} />
        <PowerHouse    position={[ 14, 0, 18]} />
        <Substation    position={[-22, 0, -18]} />
        <OilTankFarm   position={[ 28, 0, -18]} />
        <BatteryBank   position={[  0, 0,  38]} />
        <ControlBuilding position={[ 0, 0, -38]} />
        <AdminTower    position={[-38, 0, 0]} />

        {/* Plants — one per quadrant + Penang at north */}
        {PLANTS.map((p) => (
          <PlantCluster
            key={p.id}
            plant={p}
            position={PLANT_POS[p.id]}
            selected={p.id === selectedPlantId}
            onSelect={() => onSelectPlant(p)}
          />
        ))}

        {/* Solar fields — spaced wide along the outer ring */}
        <SolarFarm origin={[-95, 0,  -8]} cols={8} rows={5} />
        <SolarFarm origin={[ 95, 0,  -8]} cols={8} rows={5} />
        <SolarFarm origin={[-30, 0,  82]} cols={10} rows={4} />
        <SolarFarm origin={[ 30, 0,  82]} cols={10} rows={4} />

        {/* Wind farms — far edges of the park */}
        <WindFarm origin={[-95, 0, -85]} count={3} />
        <WindFarm origin={[ 95, 0, -85]} count={3} />
        <WindFarm origin={[-95, 0,  85]} count={3} />
        <WindFarm origin={[ 95, 0,  85]} count={3} />

        {/* Transmission line — alternating pylons along the southern boundary */}
        {[-90, -60, -30, 0, 30, 60, 90].map((x) => (
          <TxTower key={`tx-s-${x}`} position={[x, 0, 100]} />
        ))}

        {/* Roadside trees & boundary fence */}
        <RoadsideTrees />
        <BoundaryFence radius={115} />

        <OrbitControls
          target={[0, 4, 0]}
          enableDamping
          minDistance={45}
          maxDistance={210}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate={!selectedPlantId}
          autoRotateSpeed={0.22}
        />
      </Canvas>
    </section>
  );
}

/* ============================================================
   Road network — main highways + branch loops, all just thin
   dark planes with a yellow centre stripe so they read at glance.
   ============================================================ */
function RoadNetwork() {
  return (
    <group>
      {/* Main E-W highway (z=0) */}
      <Road x={0} z={0} length={240} width={12} horizontal />
      {/* Main N-S highway (x=0) */}
      <Road x={0} z={0} length={210} width={12} horizontal={false} />
      {/* Inner ring — N branch (along z=-40) */}
      <Road x={0} z={-40} length={190} width={7} horizontal />
      {/* Inner ring — S branch (along z=40) */}
      <Road x={0} z={40} length={190} width={7} horizontal />
      {/* Inner ring — W branch (along x=-40) */}
      <Road x={-40} z={0} length={150} width={7} horizontal={false} />
      {/* Inner ring — E branch (along x=40) */}
      <Road x={40} z={0} length={150} width={7} horizontal={false} />
      {/* Outer perimeter loop — south + north service road */}
      <Road x={0} z={ 95} length={220} width={6} horizontal />
      <Road x={0} z={-95} length={220} width={6} horizontal />
    </group>
  );
}

function Road({ x, z, length, width, horizontal }: {
  x: number; z: number; length: number; width: number; horizontal: boolean;
}) {
  const w = horizontal ? length : width;
  const d = horizontal ? width : length;
  return (
    <group position={[x, 0.04, z]}>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#2d333f" roughness={0.96} />
      </mesh>
      {/* centre stripe */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[horizontal ? w * 0.985 : 0.2, horizontal ? 0.2 : d * 0.985]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {/* shoulder lines */}
      <mesh
        position={[0, 0.005, horizontal ? d / 2 - 0.4 : 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[horizontal ? w * 0.985 : 0.1, horizontal ? 0.1 : d * 0.985]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <mesh
        position={[horizontal ? 0 : w / 2 - 0.4, 0.005, horizontal ? -d / 2 + 0.4 : 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[horizontal ? w * 0.985 : 0.1, horizontal ? 0.1 : d * 0.985]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
    </group>
  );
}

/* ============================================================
   PlantCluster — the canonical solar plant "card":
   round paved pad, PV array, inverter hut, control hut, pin.
   ============================================================ */
function PlantCluster({ plant, position, selected, onSelect }: {
  plant: Plant; position: [number, number, number]; selected: boolean; onSelect: () => void;
}) {
  const isAlert = plant.status === "critical";
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* pad */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[9, 9, 0.12, 36]} />
        <meshStandardMaterial color={isAlert ? "#fde2e7" : "#dbe7f3"} roughness={1} />
      </mesh>
      {/* a 4×4 mini PV array taking up the front of the pad */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[(col - 1.5) * 1.6, 0.2, (row - 1.5) * 1.6 + 2]}
            rotation={[-Math.PI / 4, 0, 0]}
            castShadow
          >
            <boxGeometry args={[1.4, 0.04, 1.4]} />
            <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.3} />
          </mesh>
        ))
      )}
      {/* inverter station */}
      <mesh position={[-4, 1.1, -4]} castShadow>
        <boxGeometry args={[2.0, 2.2, 1.6]} />
        <meshStandardMaterial color="#e3ecf6" roughness={0.85} />
      </mesh>
      {/* control hut */}
      <mesh position={[4, 1.0, -4]} castShadow>
        <boxGeometry args={[1.8, 2.0, 1.5]} />
        <meshStandardMaterial color={isAlert ? "#f3b9c1" : "#cfdaea"} roughness={0.85} />
      </mesh>
      {/* selected ring */}
      {selected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.2, 9.6, 64]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      )}
      {isAlert && <PulseRing />}
      <Html position={[0, 6, 0]} center distanceFactor={20}>
        <div className={`plant-poi ${isAlert ? "crit" : "ok"}`} onClick={onSelect}>
          <div className="plant-poi-dot" />
          <div className="plant-poi-card">
            <div className="plant-poi-name">{plant.name.split("-")[0]}</div>
            <div className="plant-poi-pwr">
              {plant.capMW < 1
                ? `${Math.round(plant.capMW * 1000)} kWp`
                : `${plant.capMW.toFixed(2)} MWp`}
            </div>
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
    <mesh ref={ref} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[8.8, 9.2, 64]} />
      <meshBasicMaterial color="#f43f5e" transparent opacity={0.8} />
    </mesh>
  );
}

/* ============================================================
   Power-station primitives
   ============================================================ */

/** Two cooling towers — hyperboloid silhouette via latheGeometry. */
function CoolingTowers({ position }: { position: [number, number, number] }) {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(3.8, 0.0));
    pts.push(new THREE.Vector2(3.3, 1.6));
    pts.push(new THREE.Vector2(2.7, 3.6));
    pts.push(new THREE.Vector2(2.4, 6.0));
    pts.push(new THREE.Vector2(2.5, 8.4));
    pts.push(new THREE.Vector2(2.8, 10.6));
    pts.push(new THREE.Vector2(3.1, 12.4));
    return pts;
  }, []);
  return (
    <group position={position}>
      {/* concrete pad */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#9aa6b4" roughness={1} />
      </mesh>
      {[-5, 5].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <mesh castShadow receiveShadow>
            <latheGeometry args={[profile, 32]} />
            <meshStandardMaterial color="#d6deeb" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* steam wisp */}
          <mesh position={[0, 13.6, 0]}>
            <sphereGeometry args={[1.5, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} roughness={1} />
          </mesh>
          <mesh position={[0.7, 14.6, 0.3]}>
            <sphereGeometry args={[1.1, 10, 10]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.4} roughness={1} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 15.5, 0]} center distanceFactor={22}>
        <SceneLabel>Cooling Towers</SceneLabel>
      </Html>
    </group>
  );
}

/** Powerhouse block — main turbine hall with two smokestacks. */
function PowerHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#9aa6b4" roughness={1} />
      </mesh>
      {/* turbine hall */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 7, 10]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      {/* roof ridge */}
      <mesh position={[0, 7.2, 0]}>
        <boxGeometry args={[16.2, 0.4, 10.2]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {/* window strip */}
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[16.05, 0.6, 10.05]} />
        <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
      </mesh>
      {/* two smokestacks */}
      {[-5, 5].map((dx, i) => (
        <group key={i} position={[dx, 0, -3]}>
          <mesh position={[0, 8, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.9, 16, 14]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.95} />
          </mesh>
          {/* red safety band near top */}
          <mesh position={[0, 14.5, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.8, 14]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          {/* lazy steam */}
          <mesh position={[0, 16.4, 0]}>
            <sphereGeometry args={[1.0, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Substation — pad with transformer banks and bus-bar pylons. */
function Substation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* gravel pad */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {/* fence posts */}
      {[[-10.5, -6.5], [-10.5, 6.5], [10.5, -6.5], [10.5, 6.5], [0, -6.5], [0, 6.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <cylinderGeometry args={[0.1, 0.1, 2.2, 6]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
      {/* transformer banks */}
      {[-6, 0, 6].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, 2.4, 3]} />
            <meshStandardMaterial color="#475569" metalness={0.45} roughness={0.5} />
          </mesh>
          {/* cooling fins on the side */}
          <mesh position={[1.7, 1.2, 0]}>
            <boxGeometry args={[0.4, 2, 2.5]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[-1.7, 1.2, 0]}>
            <boxGeometry args={[0.4, 2, 2.5]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* insulator stack */}
          {[-0.9, 0, 0.9].map((dx, j) => (
            <group key={j} position={[dx, 2.4, 0]}>
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.14, 0.14, 1.8, 8]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
              {[0.4, 0.9, 1.4].map((y, k) => (
                <mesh key={k} position={[0, y, 0]}>
                  <torusGeometry args={[0.2, 0.05, 6, 16]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* a pair of bus-bar pylons (mini lattice) */}
      {[-9, 9].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 6, 6]} />
            <meshStandardMaterial color="#5c6877" />
          </mesh>
          {[1.5, 3.5, 5].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <boxGeometry args={[1.6, 0.06, 0.06]} />
              <meshStandardMaterial color="#5c6877" />
            </mesh>
          ))}
        </group>
      ))}
      <Html position={[0, 6.5, 0]} center distanceFactor={22}>
        <SceneLabel>Main Substation</SceneLabel>
      </Html>
    </group>
  );
}

/** Oil/fuel tank farm — five cylindrical white tanks with domed caps. */
function OilTankFarm({ position }: { position: [number, number, number] }) {
  const tanks: [number, number][] = [
    [-6, -3], [0, -3], [6, -3],
    [-3,  3], [3,  3],
  ];
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {tanks.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.1, 2.1, 4.8, 24]} />
            <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
          </mesh>
          {/* dome cap */}
          <mesh position={[0, 4.8, 0]} castShadow>
            <sphereGeometry args={[2.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cdd5e0" metalness={0.4} roughness={0.55} />
          </mesh>
          {/* horizontal seam */}
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[2.11, 2.11, 0.18, 24]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* ladder */}
          <mesh position={[2.1, 2.4, 0]}>
            <boxGeometry args={[0.05, 4.8, 0.25]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
      <Html position={[0, 6, 0]} center distanceFactor={22}>
        <SceneLabel>Fuel Storage</SceneLabel>
      </Html>
    </group>
  );
}

/** Battery storage — a row of container-style BESS units. */
function BatteryBank({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {[-7, -2.5, 2.5, 7].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[3.6, 2.6, 2.2]} />
            <meshStandardMaterial color={i % 2 ? "#cbd6e2" : "#4f76a5"} metalness={0.35} roughness={0.55} />
          </mesh>
          {/* HVAC roof unit */}
          <mesh position={[0, 2.75, 0]}>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* door panel */}
          <mesh position={[0, 1.2, 1.11]}>
            <boxGeometry args={[1.4, 1.6, 0.02]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
      <Html position={[0, 4, 0]} center distanceFactor={22}>
        <SceneLabel>Battery Bank · 12 MWh</SceneLabel>
      </Html>
    </group>
  );
}

/** Control building — 2-storey operations HQ with window bands. */
function ControlBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 5.2, 7]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[12.2, 0.4, 7.2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[1.3, 3.7].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[12.05, 0.55, 7.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* entrance canopy */}
      <mesh position={[6.4, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 3]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <Html position={[0, 6.5, 0]} center distanceFactor={22}>
        <SceneLabel>Operations Control</SceneLabel>
      </Html>
    </group>
  );
}

/** Admin tower — slim glass tower for the central HQ. */
function AdminTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[5, 5, 0.6, 32]} />
        <meshStandardMaterial color="#dde6f0" roughness={0.95} />
      </mesh>
      <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 14.5, 4.2]} />
        <meshStandardMaterial color="#cfd9e6" metalness={0.45} roughness={0.18} />
      </mesh>
      {[2, 5, 8, 11, 13.6].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[4.25, 0.32, 4.25]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 16, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <Html position={[0, 17.5, 0]} center distanceFactor={22}>
        <SceneLabel>Admin Tower</SceneLabel>
      </Html>
    </group>
  );
}

/* ============================================================
   Reusables (kept from the previous scene, simplified)
   ============================================================ */

function SolarFarm({ origin, cols, rows }: { origin: [number, number, number]; cols: number; rows: number }) {
  const sp = 1.4;
  return (
    <group position={origin}>
      {/* base pad slightly darker than ground */}
      <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cols * sp + 1.5, rows * sp + 1.5]} />
        <meshStandardMaterial color="#dde6f0" roughness={1} />
      </mesh>
      {Array.from({ length: cols }).flatMap((_, i) =>
        Array.from({ length: rows }).map((_, j) => (
          <mesh
            key={`${i}-${j}`}
            position={[(i - cols / 2) * sp + sp / 2, 0.15, (j - rows / 2) * sp + sp / 2]}
            rotation={[-Math.PI / 4, 0, 0]}
            castShadow
          >
            <boxGeometry args={[1.0, 0.04, 1.2]} />
            <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.25} />
          </mesh>
        ))
      )}
    </group>
  );
}

function WindFarm({ origin, count = 3 }: { origin: [number, number, number]; count?: number }) {
  return (
    <group position={origin}>
      {Array.from({ length: count }).map((_, i) => (
        <WindTurbine key={i} position={[(i - (count - 1) / 2) * 9, 0, (i % 2 ? -2 : 0)]} phase={i * 0.4} />
      ))}
    </group>
  );
}

function WindTurbine({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const blades = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (blades.current) blades.current.rotation.z = clock.elapsedTime * 1.4 + phase;
  });
  return (
    <group position={position}>
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 10, 12]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 10.1, 0.2]}>
        <boxGeometry args={[0.7, 0.55, 1.1]} />
        <meshStandardMaterial color="#e4ebf3" />
      </mesh>
      <group ref={blades} position={[0, 10.1, 0.85]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.16, 4.5, 0.05]} />
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
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 10, 8]} />
        <meshStandardMaterial color="#5c6877" />
      </mesh>
      {[1, 3.5, 6.5, 9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.6, 0.07, 0.07]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
    </group>
  );
}

/* Thin tree avenue along the main highways — sparse, just enough
   to read as landscaping. */
function RoadsideTrees() {
  const positions = useMemo<[number, number][]>(() => {
    const out: [number, number][] = [];
    // along main E-W highway (z=0), trees at z=±9, every 22m
    for (let x = -110; x <= 110; x += 22) {
      if (Math.abs(x) < 14) continue;
      out.push([x, -9]);
      out.push([x,  9]);
    }
    // along main N-S highway (x=0)
    for (let z = -95; z <= 95; z += 22) {
      if (Math.abs(z) < 14) continue;
      out.push([-9, z]);
      out.push([ 9, z]);
    }
    return out;
  }, []);
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.0, 6]} />
            <meshStandardMaterial color="#6b4f2a" roughness={1} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <coneGeometry args={[0.75, 2.1, 10]} />
            <meshStandardMaterial color="#3d8b5e" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Subtle boundary fence so the park has a perimeter feel. */
function BoundaryFence({ radius }: { radius: number }) {
  const posts = useMemo(() => {
    const out: [number, number][] = [];
    const step = (Math.PI * 2) / 80;
    for (let i = 0; i < 80; i++) {
      const a = i * step;
      out.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    return out;
  }, [radius]);
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]}>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
          <meshStandardMaterial color="#9aa6b4" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   Small label component re-used for non-plant POIs
   ============================================================ */
function SceneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="scene-poi">
      <div className="scene-poi-dot" />
      <div className="scene-poi-label">{children}</div>
    </div>
  );
}
