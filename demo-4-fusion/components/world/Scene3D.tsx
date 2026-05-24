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

/* ─── World grid ──────────────────────────────────────────────
   Road network — a 3-ring grid:
     • Main highway cross  (x=0, z=0; width 12)
     • Inner ring          (x=±45, z=±45; width 7)
     • Mid ring            (x=±90, z=±90; width 6)

   Each structure lives inside ONE block with ≥7m of green
   setback to the nearest road edge. Block centres are:
     - Inner blocks:        x=±25,  z=±25
     - Mid-N/S blocks:      x=±25,  z=±67   (and ±25, ±67)
     - Mid-W/E blocks:      x=±67,  z=±25
     - Outer corners:       x=±125, z=±125
*/

/** 5 plants spread one per mid-outer block. Penang is mid-N (critical). */
const PLANT_POS: Record<string, [number, number, number]> = {
  kedah:  [-67, 0, -25],   // M-W-N
  penang: [ 25, 0, -67],   // M-N-NE  (critical — visible from default camera)
  perak:  [ 67, 0, -25],   // M-E-N
  melaka: [-67, 0,  25],   // M-W-S
  johor:  [ 67, 0,  25],   // M-E-S
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
        camera={{ position: [0, 105, 160], fov: 36, near: 0.1, far: 700 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={["#dceaf6", "#cfd7e0", 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 90, 30]} intensity={1.6} castShadow />
        <color attach="background" args={["#e9eef6"]} />

        {/* Ground + subtle grid */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[700, 700]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[700, 70, "#cbd6e2", "#dde6f0"]} position={[0, 0.01, 0]} />

        {/* Road grid (laid down first so structures clearly sit inside blocks) */}
        <RoadNetwork />

        {/* ─── Inner ring (4 blocks, central energy facility) ─── */}
        <Substation     position={[-25, 0, -25]} />   {/* I-NW */}
        <OilTankFarm    position={[ 25, 0, -25]} />   {/* I-NE */}
        <AdminTower     position={[-25, 0,  25]} />   {/* I-SW */}
        <PowerHouse     position={[ 25, 0,  25]} />   {/* I-SE */}

        {/* ─── Mid ring (8 blocks: 4 plants on W/E, plus auxiliaries N/S) ─── */}
        <CoolingTowers   position={[-25, 0, -67]} />  {/* M-N-NW */}
        <BatteryBank     position={[-25, 0,  67]} />  {/* M-S-SW */}
        <ControlBuilding position={[ 25, 0,  67]} />  {/* M-S-SE */}

        {/* Plants — one per remaining mid-outer block */}
        {PLANTS.map((p) => (
          <PlantCluster
            key={p.id}
            plant={p}
            position={PLANT_POS[p.id]}
            selected={p.id === selectedPlantId}
            onSelect={() => onSelectPlant(p)}
          />
        ))}

        {/* ─── Solar fields (well beyond the mid ring) ─── */}
        <SolarFarm origin={[-50, 0, -130]} cols={10} rows={4} />
        <SolarFarm origin={[ 50, 0, -130]} cols={10} rows={4} />
        <SolarFarm origin={[-50, 0,  130]} cols={10} rows={4} />
        <SolarFarm origin={[ 50, 0,  130]} cols={10} rows={4} />
        <SolarFarm origin={[-135, 0, -50]} cols={6} rows={8} />
        <SolarFarm origin={[ 135, 0, -50]} cols={6} rows={8} />
        <SolarFarm origin={[-135, 0,  50]} cols={6} rows={8} />
        <SolarFarm origin={[ 135, 0,  50]} cols={6} rows={8} />

        {/* ─── Wind farms (extreme corners) ─── */}
        <WindFarm origin={[-145, 0, -145]} count={3} />
        <WindFarm origin={[ 145, 0, -145]} count={3} />
        <WindFarm origin={[-145, 0,  145]} count={3} />
        <WindFarm origin={[ 145, 0,  145]} count={3} />

        {/* ─── Transmission line — south edge ─── */}
        {[-130, -90, -50, -10, 30, 70, 110].map((x) => (
          <TxTower key={`tx-s-${x}`} position={[x, 0, 110]} />
        ))}
        {/* and another row along the north edge */}
        {[-130, -90, -50, -10, 30, 70, 110].map((x) => (
          <TxTower key={`tx-n-${x}`} position={[x, 0, -110]} />
        ))}

        {/* Landscaping */}
        <RoadsideTrees />
        <BoundaryFence radius={170} />

        <OrbitControls
          target={[0, 4, 0]}
          enableDamping
          minDistance={55}
          maxDistance={260}
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
   Road network — 3 concentric rings of asphalt with centre stripes
   ============================================================ */
function RoadNetwork() {
  return (
    <group>
      {/* Main highway cross */}
      <Road x={0}   z={0}   length={260} width={12} horizontal />
      <Road x={0}   z={0}   length={260} width={12} horizontal={false} />
      {/* Inner ring */}
      <Road x={0}   z={-45} length={220} width={7}  horizontal />
      <Road x={0}   z={ 45} length={220} width={7}  horizontal />
      <Road x={-45} z={0}   length={220} width={7}  horizontal={false} />
      <Road x={ 45} z={0}   length={220} width={7}  horizontal={false} />
      {/* Mid ring */}
      <Road x={0}   z={-90} length={260} width={6}  horizontal />
      <Road x={0}   z={ 90} length={260} width={6}  horizontal />
      <Road x={-90} z={0}   length={260} width={6}  horizontal={false} />
      <Road x={ 90} z={0}   length={260} width={6}  horizontal={false} />
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
      {horizontal ? (
        <>
          <mesh position={[0, 0.005,  d / 2 - 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w * 0.985, 0.1]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[0, 0.005, -d / 2 + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w * 0.985, 0.1]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[ w / 2 - 0.4, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, d * 0.985]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[-w / 2 + 0.4, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, d * 0.985]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ============================================================
   PlantCluster — round paved pad + mini PV array + huts + pin
   (Pad radius 9, so a 25-unit-from-axis centre clears any
    width-7 inner-ring road by 11.5m and any width-6 mid road by 9m.)
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
   Power-station primitives — every footprint ≤ 22×14 so a
   25-unit-from-axis centre clears every road in the grid.
   ============================================================ */

/** Two cooling towers — hyperboloid silhouette via latheGeometry. */
function CoolingTowers({ position }: { position: [number, number, number] }) {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(3.6, 0.0));
    pts.push(new THREE.Vector2(3.1, 1.6));
    pts.push(new THREE.Vector2(2.6, 3.6));
    pts.push(new THREE.Vector2(2.3, 6.0));
    pts.push(new THREE.Vector2(2.4, 8.4));
    pts.push(new THREE.Vector2(2.7, 10.6));
    pts.push(new THREE.Vector2(3.0, 12.2));
    return pts;
  }, []);
  return (
    <group position={position}>
      {/* concrete pad */}
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 11]} />
        <meshStandardMaterial color="#9aa6b4" roughness={1} />
      </mesh>
      {[-4.2, 4.2].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <mesh castShadow receiveShadow>
            <latheGeometry args={[profile, 32]} />
            <meshStandardMaterial color="#d6deeb" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* steam wisp */}
          <mesh position={[0, 13.4, 0]}>
            <sphereGeometry args={[1.4, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} roughness={1} />
          </mesh>
          <mesh position={[0.7, 14.4, 0.3]}>
            <sphereGeometry args={[1.0, 10, 10]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.4} roughness={1} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 15.2, 0]} center distanceFactor={22}>
        <SceneLabel>Cooling Towers</SceneLabel>
      </Html>
    </group>
  );
}

/** Powerhouse block — turbine hall with two smokestacks. */
function PowerHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 13]} />
        <meshStandardMaterial color="#9aa6b4" roughness={1} />
      </mesh>
      {/* turbine hall */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 7, 9]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      {/* roof ridge */}
      <mesh position={[0, 7.2, 0]}>
        <boxGeometry args={[16.2, 0.4, 9.2]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {/* window strip */}
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[16.05, 0.6, 9.05]} />
        <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
      </mesh>
      {/* two smokestacks behind the hall */}
      {[-5, 5].map((dx, i) => (
        <group key={i} position={[dx, 0, -2.8]}>
          <mesh position={[0, 8, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.9, 16, 14]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.95} />
          </mesh>
          <mesh position={[0, 14.5, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.8, 14]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          <mesh position={[0, 16.3, 0]}>
            <sphereGeometry args={[1.0, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 9.5, 0]} center distanceFactor={22}>
        <SceneLabel>Powerhouse</SceneLabel>
      </Html>
    </group>
  );
}

/** Substation — gravel pad with transformer banks + bus-bar pylons. */
function Substation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {/* fence posts around the perimeter */}
      {[[-9.5, -5.5], [-9.5, 5.5], [9.5, -5.5], [9.5, 5.5], [0, -5.5], [0, 5.5]].map(
        ([x, z], i) => (
          <mesh key={i} position={[x, 1.1, z]}>
            <cylinderGeometry args={[0.1, 0.1, 2.2, 6]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
        ),
      )}
      {/* transformer banks */}
      {[-5, 0, 5].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 2.4, 2.6]} />
            <meshStandardMaterial color="#475569" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[1.55, 1.2, 0]}>
            <boxGeometry args={[0.4, 2, 2.2]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[-1.55, 1.2, 0]}>
            <boxGeometry args={[0.4, 2, 2.2]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* insulator stack */}
          {[-0.8, 0, 0.8].map((dx, j) => (
            <group key={j} position={[dx, 2.4, 0]}>
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 1.8, 8]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
              {[0.4, 0.9, 1.4].map((y, k) => (
                <mesh key={k} position={[0, y, 0]}>
                  <torusGeometry args={[0.19, 0.05, 6, 16]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* a pair of mini lattice pylons feeding the bus bars */}
      {[-8, 8].map((x, i) => (
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

/** Oil/fuel tank farm — 5 cylindrical tanks with domed caps. */
function OilTankFarm({ position }: { position: [number, number, number] }) {
  const tanks: [number, number][] = [
    [-6, -3], [0, -3], [6, -3],
    [-3,  3], [3,  3],
  ];
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 13]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {tanks.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.0, 2.0, 4.8, 24]} />
            <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[0, 4.8, 0]} castShadow>
            <sphereGeometry args={[2.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cdd5e0" metalness={0.4} roughness={0.55} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[2.01, 2.01, 0.18, 24]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[2.0, 2.4, 0]}>
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

/** Battery storage — row of container-style BESS units. */
function BatteryBank({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#a8b1c0" roughness={1} />
      </mesh>
      {[-7, -2.5, 2.5, 7].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[3.6, 2.6, 2.2]} />
            <meshStandardMaterial color={i % 2 ? "#cbd6e2" : "#4f76a5"} metalness={0.35} roughness={0.55} />
          </mesh>
          <mesh position={[0, 2.75, 0]}>
            <boxGeometry args={[1.4, 0.3, 1.4]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
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
      {/* pad */}
      <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial color="#c5cdd9" roughness={1} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 5.2, 7]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[11.2, 0.4, 7.2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[1.3, 3.7].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[11.05, 0.55, 7.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* entrance canopy */}
      <mesh position={[5.9, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 3]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <Html position={[0, 6.5, 0]} center distanceFactor={22}>
        <SceneLabel>Operations Control</SceneLabel>
      </Html>
    </group>
  );
}

/** Admin tower — slim glass tower with a circular plaza pad. */
function AdminTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[6, 6, 0.6, 32]} />
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
   Reusables — solar/wind/tx
   ============================================================ */
function SolarFarm({ origin, cols, rows }: { origin: [number, number, number]; cols: number; rows: number }) {
  const sp = 1.4;
  return (
    <group position={origin}>
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

/** Sparse tree avenue along every road in the grid — but ONLY where
 *  trees won't collide with a block's pad. Trees sit on the verge
 *  ~5m off the road centre, every ~22m. */
function RoadsideTrees() {
  const positions = useMemo<[number, number][]>(() => {
    const out: [number, number][] = [];
    const ROADS_H = [0, -45, 45, -90, 90];     // horizontal roads
    const ROADS_V = [0, -45, 45, -90, 90];     // vertical roads
    const verge = 7;

    for (const zRoad of ROADS_H) {
      for (let x = -135; x <= 135; x += 22) {
        // skip intersections
        if (ROADS_V.some((v) => Math.abs(x - v) < 9)) continue;
        // skip block centres where structures live
        if (isBlockOccupied(x, zRoad - verge) === false) out.push([x, zRoad - verge]);
        if (isBlockOccupied(x, zRoad + verge) === false) out.push([x, zRoad + verge]);
      }
    }
    for (const xRoad of ROADS_V) {
      for (let z = -135; z <= 135; z += 22) {
        if (ROADS_H.some((h) => Math.abs(z - h) < 9)) continue;
        if (isBlockOccupied(xRoad - verge, z) === false) out.push([xRoad - verge, z]);
        if (isBlockOccupied(xRoad + verge, z) === false) out.push([xRoad + verge, z]);
      }
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

/** Returns true when (x,z) is inside one of the structure pads so a
 *  roadside tree wouldn't make sense there. */
function isBlockOccupied(x: number, z: number): boolean {
  const pads: { cx: number; cz: number; w: number; d: number }[] = [
    // inner ring
    { cx: -25, cz: -25, w: 20, d: 12 }, // substation
    { cx:  25, cz: -25, w: 20, d: 13 }, // oil tanks
    { cx: -25, cz:  25, w: 12, d: 12 }, // admin tower
    { cx:  25, cz:  25, w: 20, d: 13 }, // powerhouse
    // mid ring auxiliaries
    { cx: -25, cz: -67, w: 18, d: 11 }, // cooling
    { cx: -25, cz:  67, w: 20, d:  8 }, // battery
    { cx:  25, cz:  67, w: 16, d: 11 }, // control
    // plants (radius 9)
    { cx: -67, cz: -25, w: 18, d: 18 },
    { cx:  25, cz: -67, w: 18, d: 18 },
    { cx:  67, cz: -25, w: 18, d: 18 },
    { cx: -67, cz:  25, w: 18, d: 18 },
    { cx:  67, cz:  25, w: 18, d: 18 },
  ];
  return pads.some(
    (p) => Math.abs(x - p.cx) < p.w / 2 + 1 && Math.abs(z - p.cz) < p.d / 2 + 1,
  );
}

/** Subtle boundary fence so the park has a perimeter feel. */
function BoundaryFence({ radius }: { radius: number }) {
  const posts = useMemo(() => {
    const out: [number, number][] = [];
    const step = (Math.PI * 2) / 96;
    for (let i = 0; i < 96; i++) {
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
