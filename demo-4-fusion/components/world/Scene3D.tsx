"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   SOHAR-style 1000 MW Combined-Cycle Power Plant site (top-view)
   Site is a fenced rectangle ~260m × 165m. 22 numbered facilities
   are arranged in 4 rows separated by internal roads. The 5 demo
   plants are mapped onto major facilities so the HUD DetailPanel
   keeps working when you click a structure.
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

/** Each demo plant is pinned above a major facility so clicks still
 *  populate the HUD DetailPanel. Penang (critical) sits over HRSG —
 *  the iconic red/white smokestack — so the alarm reads at a glance. */
const PLANT_PIN: Record<string, { pos: [number, number, number]; label: string }> = {
  kedah:  { pos: [-102.5,  9,    57.5], label: "Admin"     },
  penang: { pos: [-110.5, 30,   -27.5], label: "HRSG"      },
  perak:  { pos: [   0,   16,   -27.5], label: "Cooling"   },
  melaka: { pos: [ -50,   13,    10  ], label: "Turbine"   },
  johor:  { pos: [  52.5, 13,    10  ], label: "Switchyard"},
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
        camera={{ position: [10, 140, 175], fov: 36, near: 1, far: 800 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={["#dceaf6", "#cfd7e0", 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[60, 120, 40]} intensity={1.6} castShadow />
        <color attach="background" args={["#e9eef6"]} />

        {/* Ground + plant base pad (sand colour to match the Sohar plan) */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[800, 800]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[800, 80, "#cbd6e2", "#dde6f0"]} position={[0, 0.01, 0]} />
        {/* Plant pad — sandy yellow, matches the reference plot colour */}
        <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[275, 185]} />
          <meshStandardMaterial color="#e3dac1" roughness={1} />
        </mesh>

        {/* ── Roads — south access + internal grid + gate connector ── */}
        <PlantAccessRoad />
        <InternalRoadGrid />
        <GateConnector />

        {/* Tunnel portals where the access road enters the east + west mountain ranges */}
        <TunnelPortal position={[ 320, 0, 110]} dir={1}  />
        <TunnelPortal position={[-320, 0, 110]} dir={-1} />

        {/* ── Site boundary (tree-lined fence with a gap at the gate) ── */}
        <SiteBoundary halfW={137} halfD={92.5} gateX={-5} gateGap={8} />

        {/* ── 22 numbered facilities — every pad sits cleanly inside a cell ── */}
        {/* Row 0 (z=-65) — north strip */}
        <ParkingArea     position={[-102.5, 0, -65]} cols={6} rows={3} />
        <GISBuilding     position={[ -50,   0, -65]} />
        <DemineralizedWaterPlant position={[ 0, 0, -65]} />
        <FuelOilTankSmall position={[ 52.5, 0, -65]} />
        <RawWaterTank    position={[105,   0, -65]} colour="#7a8f7e" />

        {/* Row 1 (z=-27.5) — generation row */}
        <HRSG            position={[-102.5, 0, -27.5]} />
        <GasTurbineArea  position={[ -50,   0, -27.5]} />
        <CoolingTowers   position={[   0,   0, -27.5]} />
        <CondenserFanArray position={[ 52.5, 0, -27.5]} />
        <RawWaterTank    position={[105,   0, -27.5]} colour="#8aa18e" />

        {/* Row 2 (z=10) — turbine + switchyard row */}
        <WorkshopMaintenance position={[-102.5, 0, 10]} />
        <SteamTurbineBuilding position={[ -50, 0, 10]} />
        <CirculatingWaterPumps position={[  0, 0, 10]} />
        <Switchyard      position={[ 52.5, 0, 10]} />
        <AuxiliaryBuilding position={[ 92, 0, 10]} />
        <CondenserTriple position={[115,  0, 10]} />

        {/* Row 3 (z=57.5) — admin / services row */}
        <AdminBuilding   position={[-102.5, 0, 57.5]} />
        <SolidWasteArea  position={[ -50,   0, 57.5]} />
        <Warehouse       position={[   0,   0, 57.5]} />
        <WastewaterTreatment position={[ 52.5, 0, 57.5]} />
        <FuelOilTanksLarge position={[105, 0, 50]} />
        <RawWaterTank    position={[105, 0, 72]} colour="#7a8f7e" />

        {/* Gas pipeline (item 15) — yellow vertical pipe stub on the north fence */}
        <GasPipeline position={[0, 0, -90]} />

        {/* Main gate (item 2) — sits in the gap in the south fence, on the connector */}
        <MainGate position={[-5, 0, 92]} />

        {/* ── Moving vehicles on the road network ── */}
        <Vehicles />

        {/* ── 5 demo plants — POI pins floating above mapped facilities ── */}
        {PLANTS.map((p) => (
          <PlantPin
            key={p.id}
            plant={p}
            anchor={PLANT_PIN[p.id].pos}
            selected={p.id === selectedPlantId}
            onSelect={() => onSelectPlant(p)}
          />
        ))}

        {/* ── Surrounding landscape (mountains/housing/farms/trees) ── */}
        <Farmland />
        <ResidentialEstates />
        <DistantTrees />
        <Mountains />

        <OrbitControls
          target={[0, 6, 0]}
          enableDamping
          minDistance={75}
          maxDistance={360}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate={!selectedPlantId}
          autoRotateSpeed={0.18}
        />
      </Canvas>
    </section>
  );
}

/* ============================================================
   ROADS
   ============================================================ */

/** Big east-west "Plant Main Access Road" just south of the site fence.
 *  Extends all the way through the east and west mountain ranges via
 *  tunnel portals. */
function PlantAccessRoad() {
  const ROAD_LEN = 700;
  const DASH_COUNT = 116;
  return (
    <group position={[0, 0.10, 110]}>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_LEN, 14]} />
        <meshStandardMaterial color="#2d333f" roughness={0.96} />
      </mesh>
      {/* dashed centre line — lifted clear of the asphalt */}
      {Array.from({ length: DASH_COUNT }).map((_, i) => (
        <mesh
          key={i}
          position={[-ROAD_LEN / 2 + 5 + i * 6, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[3, 0.25]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}
      {/* shoulder lines */}
      {[6.5, -6.5].map((z) => (
        <mesh key={z} position={[0, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ROAD_LEN - 2, 0.18]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
    </group>
  );
}

/** Concrete tunnel portal — sits where the access road enters a
 *  mountain. Has a chunky concrete archway frame and a dark interior
 *  that extends back into the mountain mass. */
function TunnelPortal({ position, dir }: {
  position: [number, number, number];
  /** +1 → tunnel extends in +x direction; -1 → in -x direction. */
  dir: 1 | -1;
}) {
  const PW = 18;   // portal width  (z axis)
  const PH = 7.5;  // portal height (y axis)
  const PD = 22;   // tunnel depth  (x axis)
  return (
    <group position={position}>
      {/* Concrete header beam */}
      <mesh position={[dir * 0.6, PH + 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.8, PW + 2.6]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.95} />
      </mesh>
      {/* Decorative ridge cap on top */}
      <mesh position={[dir * 0.4, PH + 1.95, 0]}>
        <boxGeometry args={[2.0, 0.4, PW + 1.4]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {/* Side pillars */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[dir * 0.6, PH / 2, side * (PW / 2 + 0.7)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.4, PH, 1.4]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.95} />
        </mesh>
      ))}
      {/* Plinth at the bottom of each pillar */}
      {[-1, 1].map((side) => (
        <mesh
          key={`plinth-${side}`}
          position={[dir * 0.6, 0.6, side * (PW / 2 + 0.7)]}
        >
          <boxGeometry args={[2.6, 1.2, 1.6]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
      {/* Dark tunnel interior — extends back into the mountain */}
      <mesh position={[dir * (PD / 2 + 1.5), PH / 2 - 0.4, 0]}>
        <boxGeometry args={[PD, PH - 0.8, PW - 0.5]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Warm interior light strip suggesting tunnel lighting */}
      <mesh position={[dir * 5, PH - 0.6, 0]}>
        <boxGeometry args={[0.3, 0.3, PW - 1]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[dir * 12, PH - 0.6, 0]}>
        <boxGeometry args={[0.3, 0.3, PW - 1]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.85} />
      </mesh>
    </group>
  );
}

/** Short north-south connector road through the south fence at the gate.
 *  Bridges the external Plant Main Access Road (z=110) to the internal
 *  south perimeter road (z=85). */
function GateConnector() {
  return (
    <Road x={-5} z={98.5} length={31} width={9} horizontal={false} />
  );
}

/** Internal road grid — perimeter loop just inside the tree fence,
 *  plus three horizontal cross-streets and four vertical lanes that
 *  carve the site into a 5×4 cell layout for the 22 facilities. */
function InternalRoadGrid() {
  return (
    <group>
      {/* Perimeter loop (inside the boundary fence) */}
      <Road x={0}    z={-85} length={260} width={5} horizontal />
      <Road x={0}    z={ 85} length={260} width={5} horizontal />
      <Road x={-130} z={0}   length={170} width={5} horizontal={false} />
      <Road x={ 130} z={0}   length={170} width={5} horizontal={false} />

      {/* Internal horizontal cross-streets */}
      <Road x={0} z={-45} length={260} width={5} horizontal />
      <Road x={0} z={-10} length={260} width={5} horizontal />
      <Road x={0} z={ 30} length={260} width={5} horizontal />

      {/* Internal vertical lanes */}
      <Road x={-75} z={0} length={170} width={5} horizontal={false} />
      <Road x={-25} z={0} length={170} width={5} horizontal={false} />
      <Road x={ 25} z={0} length={170} width={5} horizontal={false} />
      <Road x={ 80} z={0} length={170} width={5} horizontal={false} />
    </group>
  );
}

function Road({ x, z, length, width, horizontal }: {
  x: number; z: number; length: number; width: number; horizontal: boolean;
}) {
  const w = horizontal ? length : width;
  const d = horizontal ? width : length;
  // Vertical roads sit a hair higher than horizontal so they don't z-fight at intersections.
  const baseY = horizontal ? 0.10 : 0.11;
  return (
    <group position={[x, baseY, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.96} />
      </mesh>
      {/* edge curb stripes (white) — well above the asphalt to avoid z-fighting */}
      {horizontal ? (
        <>
          <mesh position={[0, 0.06,  d / 2 - 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w * 0.985, 0.08]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[0, 0.06, -d / 2 + 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w * 0.985, 0.08]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[ w / 2 - 0.25, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, d * 0.985]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[-w / 2 + 0.25, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, d * 0.985]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ============================================================
   SITE BOUNDARY — perimeter tree row matching the Sohar plan
   ============================================================ */
function SiteBoundary({ halfW, halfD, gateX = -5, gateGap = 8 }: {
  halfW: number; halfD: number; gateX?: number; gateGap?: number;
}) {
  const trees = useMemo(() => {
    const out: [number, number][] = [];
    const step = 4;
    for (let x = -halfW; x <= halfW; x += step) {
      out.push([x, -halfD]);
      // South fence — leave a gap centred on gateX for the gate connector.
      if (Math.abs(x - gateX) > gateGap) {
        out.push([x, halfD]);
      }
    }
    for (let z = -halfD + step; z < halfD; z += step) {
      out.push([-halfW, z]);
      out.push([ halfW, z]);
    }
    return out;
  }, [halfW, halfD, gateX, gateGap]);
  return (
    <group>
      {trees.map(([x, z], i) => (
        <BoundaryTree key={i} x={x} z={z} />
      ))}
    </group>
  );
}

function BoundaryTree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.8, 6]} />
        <meshStandardMaterial color="#6b4f2a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.85, 10, 10]} />
        <meshStandardMaterial color="#3d8b5e" roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ============================================================
   FACILITY PRIMITIVES (22 numbered items)
   ============================================================ */

/** 1 — Main Administrative Building (small office, low-rise) */
function AdminBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={22} d={26} />
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 6, 9]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.75} />
      </mesh>
      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[14.2, 0.4, 9.2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[1.5, 4.3].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[14.05, 0.6, 9.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* flagpole */}
      <mesh position={[7, 4, 5.5]}>
        <cylinderGeometry args={[0.08, 0.08, 8, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <FacilityNumber n={1} position={[0, 7.2, 0]} />
    </group>
  );
}

/** 2 — Main Gate / Security */
function MainGate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* gate booth */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.5, 2.6, 2.5]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.8, 0.2, 2.8]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* barrier arms */}
      <mesh position={[-3, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh position={[3, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <FacilityNumber n={2} position={[0, 3.6, 0]} />
    </group>
  );
}

/** 3 — Parking Area */
function ParkingArea({ position, cols, rows }: {
  position: [number, number, number]; cols: number; rows: number;
}) {
  const colors = ["#ffffff", "#fbbf24", "#3b82f6", "#f43f5e", "#facc15", "#0ea5e9", "#e5e7eb", "#1f2937", "#10b981"];
  const slots = useMemo(() => {
    const out: { x: number; z: number; c: string; r: number }[] = [];
    let s = 4242;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        out.push({
          x: (i - cols / 2) * 2.4 + 1.2,
          z: (j - rows / 2) * 4.4 + 2.2,
          c: colors[Math.floor(rand() * colors.length)],
          r: rand() > 0.5 ? 0 : Math.PI,
        });
    return out;
  }, [cols, rows]);
  const padW = cols * 2.4 + 3;
  const padD = rows * 4.4 + 3;
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[padW, padD]} />
        <meshStandardMaterial color="#cbd5e1" roughness={1} />
      </mesh>
      {/* white stripe markings between columns */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh
          key={i}
          position={[(i - cols / 2) * 2.4, 0.26, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.1, padD - 1.5]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      {slots.map((s, i) => (
        <group key={i} position={[s.x, 0.35, s.z]} rotation={[0, s.r, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.6, 0.9]} />
            <meshStandardMaterial color={s.c} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.3, 0.45, 0]}>
            <boxGeometry args={[0.55, 0.35, 0.8]} />
            <meshStandardMaterial color={s.c} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={3} position={[0, 5, 0]} />
    </group>
  );
}

/** 4 — Switchyard (fenced area with lattice TX towers + bus bars) */
function Switchyard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={38} d={26} colour="#b3a880" />
      {/* lattice TX towers - 4 across, 2 deep */}
      {[-13, -4, 5, 14].map((x, i) => (
        <LatticeTxTower key={`a-${i}`} position={[x, 0, -7]} />
      ))}
      {[-13, -4, 5, 14].map((x, i) => (
        <LatticeTxTower key={`b-${i}`} position={[x, 0, 7]} />
      ))}
      {/* bus bars (thin grey rectangles running across) */}
      {[-9, -3, 3, 9].map((z, i) => (
        <mesh key={i} position={[0, 7, z]}>
          <boxGeometry args={[34, 0.05, 0.05]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
      {/* fence posts */}
      {[[-19, -13], [19, -13], [-19, 13], [19, 13], [0, -13], [0, 13]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.8, z]}>
          <cylinderGeometry args={[0.1, 0.1, 1.6, 6]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
      <FacilityNumber n={4} position={[0, 12, 0]} />
    </group>
  );
}

function LatticeTxTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 4 lattice legs */}
      {[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 5.5, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 11, 6]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
      {/* horizontal cross arms */}
      {[3, 6, 9, 11].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[2.4, 0.08, 2.4]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
      {/* pyramidal tip */}
      <mesh position={[0, 11.7, 0]}>
        <cylinderGeometry args={[0, 0.3, 1.4, 4]} />
        <meshStandardMaterial color="#5c6877" />
      </mesh>
    </group>
  );
}

/** 5 — 400kV GIS Building (long bldg + transformer rows) */
function GISBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={40} d={22} />
      {/* main building */}
      <mesh position={[-7, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 13]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[-7, 4.2, 0]}>
        <boxGeometry args={[16.2, 0.3, 13.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* transformer cubicles outside (3 cubicle rows × 3 columns, tighter) */}
      {[5, 10, 15].map((x, i) =>
        [-4, 0, 4].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 0, z]}>
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[2.2, 2, 2.2]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 1.6, 8]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
          </group>
        ))
      )}
      <FacilityNumber n={5} position={[0, 5.5, 0]} />
    </group>
  );
}

/** 6 — Gas Turbine Area (two cylindrical turbines + pipe rack) */
function GasTurbineArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={26} d={14} colour="#b3a880" />
      {/* two horizontal cylindrical gas turbines */}
      {[-5, 5].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[1.4, 1.4, 6, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* generator skid */}
          <mesh position={[0, 1.0, 3.6]} castShadow>
            <boxGeometry args={[3, 2, 2]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* pipe rack */}
      {[-3, 0, 3].map((z) => (
        <mesh key={z} position={[0, 3.4, z]}>
          <cylinderGeometry args={[0.2, 0.2, 22, 10]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}
      <FacilityNumber n={6} position={[0, 5, 0]} />
    </group>
  );
}

/** 7 — Heat Recovery Steam Generator (HRSG) — the iconic red/white smokestack */
function HRSG({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={24} d={26} colour="#b3a880" />
      {/* boiler box (blue) */}
      <mesh position={[3, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 10, 16]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* internal ductwork pattern (lighter blue stripes) */}
      {[-2, 2, 6].map((y) => (
        <mesh key={y} position={[3, 5 + y, 0]}>
          <boxGeometry args={[12.1, 0.3, 16.1]} />
          <meshStandardMaterial color="#3b82f6" emissive="#60a5fa" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {/* HUGE red/white smokestack */}
      <RedWhiteSmokestack position={[-8, 0, 0]} height={28} radius={1.4} />
      {/* steam wisp */}
      <mesh position={[-8, 29.5, 0]}>
        <sphereGeometry args={[1.3, 12, 12]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} />
      </mesh>
      <mesh position={[-7.4, 30.6, 0.4]}>
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.4} />
      </mesh>
      {/* auxiliary blue box on side */}
      <mesh position={[10, 2, 5]} castShadow>
        <boxGeometry args={[4, 4, 6]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      <FacilityNumber n={7} position={[0, 11, 0]} />
    </group>
  );
}

function RedWhiteSmokestack({ position, height, radius }: {
  position: [number, number, number]; height: number; radius: number;
}) {
  const bands = 8;
  const segH = height / bands;
  return (
    <group position={position}>
      {Array.from({ length: bands }).map((_, i) => (
        <mesh key={i} position={[0, i * segH + segH / 2, 0]} castShadow>
          <cylinderGeometry args={[radius * (1 - i * 0.02), radius * (1 - (i - 1) * 0.02), segH, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#f8fafc" : "#dc2626"} roughness={0.7} />
        </mesh>
      ))}
      {/* cap */}
      <mesh position={[0, height + 0.4, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius * 0.86, 0.6, 16]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}

/** 8 — Steam Turbine Building (huge blue-roofed industrial hall) */
function SteamTurbineBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={36} d={26} />
      {/* main body */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 8, 18]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* iconic blue roof */}
      <mesh position={[0, 8.5, 0]} castShadow>
        <boxGeometry args={[28.5, 1.0, 18.5]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* raised crane gantry along the centre */}
      <mesh position={[0, 9.5, 0]}>
        <boxGeometry args={[28, 0.4, 1.2]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      {/* louvers on the side */}
      {[-12, -6, 0, 6, 12].map((x) => (
        <mesh key={x} position={[x, 4, 9.1]}>
          <boxGeometry args={[1, 6, 0.1]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      <FacilityNumber n={8} position={[0, 9, 0]} />
    </group>
  );
}

/** 9a — Condenser (fan-array building, two big roof fans) */
function CondenserFanArray({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={28} d={24} />
      {/* base block */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 5, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>
      {/* two fan roof units */}
      {[-5, 5].map((x, i) => (
        <CondenserFan key={i} position={[x, 5, 0]} radius={2.8} />
      ))}
      <FacilityNumber n={9} position={[0, 9, 0]} />
    </group>
  );
}

/** 9b — Condenser (triple small fan cluster at the SE corner) */
function CondenserTriple({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={18} d={16} />
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[14, 1.6, 10]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {[-4.5, 0, 4.5].map((x, i) => (
        <CondenserFan key={i} position={[x, 1.6, 0]} radius={1.8} />
      ))}
      <FacilityNumber n={9} position={[0, 5, 0]} />
    </group>
  );
}

function CondenserFan({ position, radius }: { position: [number, number, number]; radius: number }) {
  const blades = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (blades.current) blades.current.rotation.y = clock.elapsedTime * 1.8;
  });
  return (
    <group position={position}>
      {/* housing */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.6, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
      </mesh>
      <group ref={blades} position={[0, 0.7, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
            <boxGeometry args={[radius * 1.7, 0.08, radius * 0.45]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}

/** 10 — Cooling Towers (twin mechanical-draft with rooftop fans) */
function CoolingTowers({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={34} d={24} />
      {[-8, 8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* louvered side intake — block with vertical slats */}
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 8, 16]} />
            <meshStandardMaterial color="#dbe1e8" roughness={0.7} />
          </mesh>
          {/* louvers */}
          {[-5, -2, 2, 5].map((dx) => (
            <mesh key={dx} position={[dx, 4, 8.05]}>
              <boxGeometry args={[1, 7, 0.15]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          ))}
          {/* rooftop fan with cowling */}
          <mesh position={[0, 8.5, 0]}>
            <cylinderGeometry args={[4.4, 4.4, 1.0, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
          </mesh>
          <CondenserFan position={[0, 9.1, 0]} radius={3.6} />
          {/* steam wisp */}
          <mesh position={[0, 11.5, 0]}>
            <sphereGeometry args={[1.5, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={10} position={[0, 13, 0]} />
    </group>
  );
}

/** 11 — Circulating Water Pumps */
function CirculatingWaterPumps({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={14} d={10} colour="#b3a880" />
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* pump motor */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 2, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          {/* base */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.8, 0.6, 1.8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={11} position={[0, 3, 0]} />
    </group>
  );
}

/** 12 — Demineralized Water Plant (blue-roofed building + small tank) */
function DemineralizedWaterPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={28} d={20} />
      {/* main building */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 5, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[20.2, 0.4, 12.2]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* roof louvers (blue stripes) — clearly above the roof skin */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} position={[x, 5.55, 0]}>
          <boxGeometry args={[2.4, 0.15, 11.5]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>
      ))}
      {/* skid in front */}
      <mesh position={[-7, 1, 7]} castShadow>
        <boxGeometry args={[3, 2, 2.4]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <FacilityNumber n={12} position={[0, 7, 0]} />
    </group>
  );
}

/** 13 — Raw Water Tank (big round tank with green-tinted top) */
function RawWaterTank({ position, colour = "#7a8f7e" }: {
  position: [number, number, number]; colour?: string;
}) {
  return (
    <group position={position}>
      <FacilityPad w={22} d={22} colour="#b3a880" />
      {/* tank body */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7.5, 7.5, 6, 32]} />
        <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
      </mesh>
      {/* green water surface */}
      <mesh position={[0, 6.18, 0]}>
        <cylinderGeometry args={[7.45, 7.45, 0.1, 32]} />
        <meshStandardMaterial color={colour} roughness={0.95} />
      </mesh>
      {/* seam stripes — radius slightly larger than tank so they don't z-fight */}
      {[1.8, 4.2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[7.6, 7.6, 0.18, 32]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      {/* ladder */}
      <mesh position={[7.5, 3, 0]}>
        <boxGeometry args={[0.06, 6, 0.3]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <FacilityNumber n={13} position={[0, 8, 0]} />
    </group>
  );
}

/** 15 — Natural Gas Pipeline Incoming (vertical yellow pipe) */
function GasPipeline({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* vertical pipe coming down from the sky */}
      <mesh position={[0, 8, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 16, 16]} />
        <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* support */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.2, 2, 2.2]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      {/* arrow/cap */}
      <mesh position={[0, 16.4, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.5, 16]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <FacilityNumber n={15} position={[0, 17.5, 0]} />
    </group>
  );
}

/** 16a — Fuel Oil Storage (small cluster: 3 small tanks) */
function FuelOilTankSmall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={20} d={16} colour="#b3a880" />
      {[[-4, -2], [4, -2], [0, 4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[2.0, 2.0, 3.6, 20]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 3.6, 0]}>
            <sphereGeometry args={[2.0, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={16} position={[0, 5, 0]} />
    </group>
  );
}

/** 16b — Fuel Oil Storage Tanks (large: 2 big tanks in containment) */
function FuelOilTanksLarge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={30} d={20} colour="#b3a880" />
      {[[-6, 0], [6, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[5, 5, 7, 32]} />
            <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[0, 7.18, 0]}>
            <cylinderGeometry args={[4.95, 4.95, 0.1, 32]} />
            <meshStandardMaterial color="#7a8f7e" roughness={0.95} />
          </mesh>
          <mesh position={[0, 3.62, 0]}>
            <cylinderGeometry args={[5.05, 5.05, 0.2, 32]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[5, 3.5, 0]}>
            <boxGeometry args={[0.06, 7, 0.3]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={16} position={[0, 9, 0]} />
    </group>
  );
}

/** 18 — Workshop / Maintenance Building */
function WorkshopMaintenance({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={22} d={18} />
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 5, 12]} />
        <meshStandardMaterial color="#dbe1e8" roughness={0.85} />
      </mesh>
      {/* roof ridge */}
      <mesh position={[0, 5.4, 0]}>
        <boxGeometry args={[16.2, 0.4, 12.2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* roller door (slightly darker square on the front) */}
      <mesh position={[0, 2, 6.05]}>
        <boxGeometry args={[5, 4, 0.05]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <FacilityNumber n={18} position={[0, 6.5, 0]} />
    </group>
  );
}

/** 19 — Warehouse (long blank box, lighter colour) */
function Warehouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={32} d={18} />
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, 5.6, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.8, 0]}>
        <boxGeometry args={[24.2, 0.3, 12.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* bay doors */}
      {[-7, 0, 7].map((x) => (
        <mesh key={x} position={[x, 2, 6.05]}>
          <boxGeometry args={[3.6, 3.5, 0.05]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
      <FacilityNumber n={19} position={[0, 7, 0]} />
    </group>
  );
}

/** 20 — Wastewater Treatment Plant (rectangular ponds) */
function WastewaterTreatment({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={32} d={22} colour="#b3a880" />
      {/* two big square clarifiers */}
      {[[-9, -3], [-2, -3]].map(([x, z], i) => (
        <group key={`p-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[6, 1, 6]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[5.4, 0.1, 5.4]} />
            <meshStandardMaterial color="#1e8fb5" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* multiple round tanks */}
      {[[6, -3], [10.5, -3], [6, 3], [10.5, 3]].map(([x, z], i) => (
        <group key={`r-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[1.8, 1.8, 1.2, 20]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, 1.32, 0]}>
            <cylinderGeometry args={[1.7, 1.7, 0.05, 20]} />
            <meshStandardMaterial color="#10b981" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* aerator strip */}
      <mesh position={[-9, 0.5, 4]}>
        <boxGeometry args={[13, 1, 1.8]} />
        <meshStandardMaterial color="#1e8fb5" />
      </mesh>
      <FacilityNumber n={20} position={[0, 4, 0]} />
    </group>
  );
}

/** 21 — Solid Waste Area (small fenced compound with bins) */
function SolidWasteArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={20} d={14} colour="#b3a880" />
      {/* fence posts */}
      {[[-9.5, -6.5], [9.5, -6.5], [-9.5, 6.5], [9.5, 6.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.8, z]}>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
      {/* a few skips/bins */}
      {[[-5, -2], [-1, -2], [3, -2], [-3, 2], [1, 2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} castShadow>
          <boxGeometry args={[2.2, 1.2, 2]} />
          <meshStandardMaterial color={i % 2 ? "#1e40af" : "#16a34a"} />
        </mesh>
      ))}
      <FacilityNumber n={21} position={[0, 3.5, 0]} />
    </group>
  );
}

/** 22 — Auxiliary / Utilities Building (small blue building) */
function AuxiliaryBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={18} d={18} />
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 3.6, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[12.2, 0.3, 12.2]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {/* exterior skid units */}
      {[[-3.5, -4.5], [0, -4.5], [3.5, -4.5], [-3.5, 4.5], [0, 4.5], [3.5, 4.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[2.0, 1.4, 1.4]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={22} position={[0, 5, 0]} />
    </group>
  );
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */

/** Sand-coloured paved pad with a thin curb border. Each facility
 *  sits on one of these — matches the Sohar plan's beige paving. */
function FacilityPad({ w, d, colour = "#d6cca8" }: {
  w: number; d: number; colour?: string;
}) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={colour} roughness={1} />
      </mesh>
      {/* curb border (thin darker rectangle outline) — clearly above the pad */}
      <mesh position={[0, 0.26,  d / 2 - 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 0.3]} />
        <meshStandardMaterial color="#8a8068" />
      </mesh>
      <mesh position={[0, 0.26, -d / 2 + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 0.3]} />
        <meshStandardMaterial color="#8a8068" />
      </mesh>
      <mesh position={[ w / 2 - 0.15, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, d]} />
        <meshStandardMaterial color="#8a8068" />
      </mesh>
      <mesh position={[-w / 2 + 0.15, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, d]} />
        <meshStandardMaterial color="#8a8068" />
      </mesh>
    </group>
  );
}

/** Floating circular number tag above each facility. */
function FacilityNumber({ n, position }: { n: number; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={22}>
      <div className="facility-tag">{n}</div>
    </Html>
  );
}

/* ============================================================
   Plant POI pin — floats above one of the mapped facilities
   ============================================================ */
function PlantPin({ plant, anchor, selected, onSelect }: {
  plant: Plant; anchor: [number, number, number]; selected: boolean; onSelect: () => void;
}) {
  const isAlert = plant.status === "critical";
  return (
    <group position={anchor} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isAlert && <PulseRing />}
      {selected && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.6, 2.95, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      )}
      <Html position={[0, 2.5, 0]} center distanceFactor={18}>
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
    ref.current.scale.set(1 + t * 1.4, 1 + t * 1.4, 1 + t * 1.4);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.4, 2.7, 48]} />
      <meshBasicMaterial color="#f43f5e" transparent opacity={0.8} />
    </mesh>
  );
}

/* ============================================================
   MOVING VEHICLES
   Each vehicle follows a closed CatmullRomCurve3 of waypoints
   aligned with the road grid. Mix of cars, vans, and a truck for
   variety. Speeds and phases vary so traffic doesn't look
   synchronised.
   ============================================================ */

/** Lane-offset paths so opposing traffic doesn't share the centreline.
 *  All values were chosen to sit inside the asphalt lanes drawn by
 *  InternalRoadGrid + PlantAccessRoad + GateConnector. */

/** External access road — closed loop spanning both tunnel mouths.
 *  Eastbound lane at z=107 (heading east from west tunnel toward east tunnel),
 *  westbound lane at z=113. Vehicles are hidden once they cross into the
 *  tunnel interior (|x| > 318) so they appear to enter/exit the mountain. */
const ACCESS_LOOP: [number, number][] = [
  [-340, 107], [-200, 107], [-100, 107], [0, 107], [100, 107], [200, 107], [340, 107],
  [340, 113], [200, 113], [100, 113], [0, 113], [-100, 113], [-200, 113], [-340, 113],
];

/** Arrival loop — appears from west tunnel → eastbound on access road
 *  → in through gate → clockwise inside-perimeter loop → out through
 *  gate → westbound back to west tunnel. */
const GATE_TOUR_W: [number, number][] = [
  [-340, 107], [-200, 107], [-100, 107], [-30, 107],
  // Inbound through gate
  [-7, 105], [-7, 95], [-7, 85],
  // South perimeter eastbound
  [25, 85], [80, 85], [126, 85],
  // East perimeter northbound
  [126, 45], [126, 0], [126, -45], [126, -85],
  // North perimeter westbound
  [80, -85], [25, -85], [-25, -85], [-75, -85], [-126, -85],
  // West perimeter southbound
  [-126, -45], [-126, 0], [-126, 45], [-126, 85],
  // South perimeter back to gate
  [-75, 85], [-25, 85],
  // Outbound through gate
  [-3, 85], [-3, 95], [-3, 105],
  // Westbound back along access road, into west tunnel
  [-30, 113], [-100, 113], [-200, 113], [-340, 113],
];

/** Mirror of GATE_TOUR_W coming from the east tunnel — appears from
 *  east tunnel → westbound → into gate → counter-clockwise inner loop
 *  → out gate → eastbound back into east tunnel. */
const GATE_TOUR_E: [number, number][] = [
  [340, 113], [200, 113], [100, 113], [30, 113],
  // Inbound through gate (using lane closer to centre when arriving from east)
  [-3, 111], [-3, 95], [-3, 85],
  // South perimeter westbound
  [-25, 85], [-75, 85], [-126, 85],
  // West perimeter northbound
  [-126, 45], [-126, 0], [-126, -45], [-126, -85],
  // North perimeter eastbound
  [-75, -85], [-25, -85], [25, -85], [80, -85], [126, -85],
  // East perimeter southbound
  [126, -45], [126, 0], [126, 45], [126, 85],
  // South perimeter back to gate
  [80, 85], [25, 85],
  // Outbound through gate
  [-7, 85], [-7, 95], [-7, 109],
  // Eastbound back along access road, into east tunnel
  [30, 107], [100, 107], [200, 107], [340, 107],
];

/** A short in-and-out — arrives via west tunnel, drops by the warehouse
 *  area, leaves via west tunnel. Used by service trucks. */
const DELIVERY_LOOP: [number, number][] = [
  [-340, 107], [-200, 107], [-100, 107], [-30, 107],
  [-7, 105], [-7, 95], [-7, 85],
  // Visit the warehouse / wastewater area
  [-25, 85], [-25, 55], [25, 55], [25, 85],
  // Exit
  [-3, 85], [-3, 95], [-3, 105],
  [-30, 113], [-100, 113], [-200, 113], [-340, 113],
];

/** Inner perimeter loop, clockwise. Lane offset 2 from road centreline. */
const PERIMETER_CW: [number, number][] = [
  [-126, -85], [-75, -85], [-25, -85], [25, -85], [80, -85], [126, -85],
  [126, -45], [126, 0],  [126, 45],  [126, 85],
  [80, 85],   [25, 85],  [-25, 85],  [-75, 85], [-126, 85],
  [-126, 45], [-126, 0], [-126, -45],
];

/** Inner perimeter loop, counter-clockwise (other lane). */
const PERIMETER_CCW: [number, number][] = [
  [-122, -83], [-122, -45], [-122, 0], [-122, 45], [-122, 83],
  [-75, 83], [-25, 83], [25, 83], [80, 83], [122, 83],
  [122, 45], [122, 0], [122, -45], [122, -83],
  [80, -83], [25, -83], [-25, -83], [-75, -83],
];

/** Cross-street z=-10 loop — bounce east/west using offset lanes. */
const CROSS_NEG10: [number, number][] = [
  [-126, -8], [-75, -8], [-25, -8], [25, -8], [80, -8], [126, -8],
  [126, -12], [80, -12], [25, -12], [-25, -12], [-75, -12], [-126, -12],
];

/** Cross-street z=30 loop. */
const CROSS_30: [number, number][] = [
  [-126, 28], [-75, 28], [-25, 28], [25, 28], [80, 28], [126, 28],
  [126, 32], [80, 32], [25, 32], [-25, 32], [-75, 32], [-126, 32],
];

/** Maintenance van — small inner loop visiting several block corners. */
const MAINT_LOOP: [number, number][] = [
  [-75, -43], [-25, -43], [25, -43], [80, -43],
  [80, -10], [80, 30],
  [25, 30], [-25, 30], [-75, 30],
  [-75, -10],
];

function Vehicles() {
  return (
    <>
      {/* External through-traffic on the access road — enters one tunnel,
       *  drives across, exits the other. tunnelHide=true makes the car
       *  invisible while inside the mountain. */}
      <Vehicle path={ACCESS_LOOP} speed={0.0055} color="#f8fafc" kind="car" phase={0.00} tunnelHide />
      <Vehicle path={ACCESS_LOOP} speed={0.0055} color="#3b82f6" kind="car" phase={0.18} tunnelHide />
      <Vehicle path={ACCESS_LOOP} speed={0.0055} color="#dc2626" kind="car" phase={0.36} tunnelHide />
      <Vehicle path={ACCESS_LOOP} speed={0.0055} color="#10b981" kind="van" phase={0.54} tunnelHide />
      <Vehicle path={ACCESS_LOOP} speed={0.0055} color="#1f2937" kind="car" phase={0.72} tunnelHide />

      {/* Arriving from west tunnel — through gate, clockwise inside, out west */}
      <Vehicle path={GATE_TOUR_W} speed={0.0025} color="#fbbf24" kind="truck" phase={0.00} tunnelHide />
      <Vehicle path={GATE_TOUR_W} speed={0.0025} color="#06b6d4" kind="van"   phase={0.50} tunnelHide />

      {/* Arriving from east tunnel — through gate, counter-clockwise inside, out east */}
      <Vehicle path={GATE_TOUR_E} speed={0.0025} color="#f97316" kind="van"   phase={0.25} tunnelHide />
      <Vehicle path={GATE_TOUR_E} speed={0.0025} color="#a855f7" kind="car"   phase={0.75} tunnelHide />

      {/* Delivery truck — quick warehouse visit and out */}
      <Vehicle path={DELIVERY_LOOP} speed={0.0042} color="#dc2626" kind="truck" phase={0.30} tunnelHide />

      {/* Inside perimeter patrol — opposite directions */}
      <Vehicle path={PERIMETER_CW}  speed={0.007} color="#10b981" kind="van" phase={0.10} />
      <Vehicle path={PERIMETER_CCW} speed={0.007} color="#ffffff" kind="car" phase={0.50} />

      {/* Cross-street traffic */}
      <Vehicle path={CROSS_NEG10} speed={0.011} color="#1f2937" kind="car" phase={0.00} />
      <Vehicle path={CROSS_30}    speed={0.011} color="#f97316" kind="van" phase={0.30} />

      {/* Maintenance van between facilities */}
      <Vehicle path={MAINT_LOOP} speed={0.009} color="#facc15" kind="van" phase={0.00} />
    </>
  );
}

type VehicleKind = "car" | "van" | "truck";

function Vehicle({ path, speed, color, kind = "car", phase = 0, tunnelHide = false }: {
  path: [number, number][];
  speed: number;
  color: string;
  kind?: VehicleKind;
  phase?: number;
  /** Hide the vehicle when it crosses into the mountain tunnel
   *  (|x| > 318), so it visually disappears into the portal. */
  tunnelHide?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const points = path.map(([x, z]) => new THREE.Vector3(x, 0.16, z));
    return new THREE.CatmullRomCurve3(points, true, "centripetal");
  }, [path]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * speed + phase) % 1;
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ref.current.position.copy(pos);
    // lookAt aligns the object's local -Z with the tangent, so build
    // each vehicle body with its "front" at -Z.
    ref.current.lookAt(pos.x + tan.x, pos.y, pos.z + tan.z);
    if (tunnelHide) {
      ref.current.visible = Math.abs(pos.x) < 318;
    }
  });

  return (
    <group ref={ref}>
      <VehicleBody kind={kind} color={color} />
    </group>
  );
}

function VehicleBody({ kind, color }: { kind: VehicleKind; color: string }) {
  if (kind === "truck") {
    return (
      <>
        {/* trailer (behind) */}
        <mesh position={[0, 0.95, 1.1]} castShadow>
          <boxGeometry args={[1.7, 1.7, 3.0]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        </mesh>
        {/* cab (front, -Z direction) */}
        <mesh position={[0, 0.7, -0.9]} castShadow>
          <boxGeometry args={[1.7, 1.2, 1.4]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* cab roof step */}
        <mesh position={[0, 1.4, -0.95]} castShadow>
          <boxGeometry args={[1.65, 0.4, 1.2]} />
          <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
        </mesh>
        {/* windshield (front) */}
        <mesh position={[0, 1.05, -1.55]}>
          <boxGeometry args={[1.55, 0.55, 0.05]} />
          <meshStandardMaterial color="#0c4a6e" metalness={0.5} roughness={0.2} />
        </mesh>
        <Wheels positions={[
          [-0.75, 0.25, -1.5], [0.75, 0.25, -1.5],
          [-0.75, 0.25, 0.2],  [0.75, 0.25, 0.2],
          [-0.75, 0.25, 2.0],  [0.75, 0.25, 2.0],
        ]} />
      </>
    );
  }

  if (kind === "van") {
    return (
      <>
        {/* main box */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[1.55, 1.3, 3.4]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* darker glass strip on front cabin */}
        <mesh position={[0, 1.15, -1.55]}>
          <boxGeometry args={[1.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#0c4a6e" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* roof line */}
        <mesh position={[0, 1.42, 0.3]}>
          <boxGeometry args={[1.5, 0.04, 2.5]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <Wheels positions={[
          [-0.7, 0.25, -1.2], [0.7, 0.25, -1.2],
          [-0.7, 0.25,  1.3], [0.7, 0.25,  1.3],
        ]} />
      </>
    );
  }

  // car
  return (
    <>
      {/* lower body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.55, 3.0]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* upper cabin */}
      <mesh position={[0, 0.85, 0.1]} castShadow>
        <boxGeometry args={[1.28, 0.45, 1.7]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 0.86, -0.75]}>
        <boxGeometry args={[1.24, 0.42, 0.05]} />
        <meshStandardMaterial color="#0c4a6e" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* headlights */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.4, -1.51]}>
          <boxGeometry args={[0.2, 0.15, 0.04]} />
          <meshStandardMaterial color="#fefce8" emissive="#fef3c7" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <Wheels positions={[
        [-0.6, 0.22, -1.0], [0.6, 0.22, -1.0],
        [-0.6, 0.22,  1.0], [0.6, 0.22,  1.0],
      ]} />
    </>
  );
}

function Wheels({ positions }: { positions: [number, number, number][] }) {
  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.18, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
    </>
  );
}

/* ============================================================
   SURROUNDING LANDSCAPE — mountains, housing, farmland, trees
   (unchanged content; positions pushed out to clear the wider
   plant site rectangle)
   ============================================================ */

function ResidentialEstates() {
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string }[] = [];
    let s = 77777;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ROOFS = ["#b91c1c", "#92400e", "#0e7490", "#475569", "#7c2d12", "#1d4ed8", "#a16207", "#3f6212"];
    const WALLS = ["#fef3c7", "#fde68a", "#e7e5e4", "#fff7ed", "#f1f5f9", "#fafaf9", "#fde2c2"];

    const NEIGHBORHOODS: [number, number, number, number][] = [
      [-240, -180, 5, 4],
      [ 130, -240, 5, 4],
      [ 250,  -50, 4, 5],
      [-260,   55, 4, 5],
      [-160,  230, 5, 4],
      [ 180,  220, 5, 4],
    ];

    for (const [ox, oz, cols, rows] of NEIGHBORHOODS) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (rand() < 0.18) continue;
          const x = ox + col * 6.2 + (rand() - 0.5) * 1.0;
          const z = oz + row * 6.5 + (rand() - 0.5) * 1.0;
          out.push({
            x, z,
            w: 3.0 + rand() * 1.2,
            d: 3.4 + rand() * 0.9,
            h: 2.0 + rand() * 1.4,
            roof: ROOFS[Math.floor(rand() * ROOFS.length)],
            wall: WALLS[Math.floor(rand() * WALLS.length)],
          });
        }
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

function House({ x, z, w, d, h, roof, wall }: {
  x: number; z: number; w: number; d: number; h: number; roof: string; wall: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.75, 1.0, 4]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
      <mesh position={[0, 0.45, d / 2 + 0.02]}>
        <boxGeometry args={[0.4, 0.9, 0.04]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
    </group>
  );
}

/* ---------------- Mountains ----------------
   Each "mountain" is a small cluster of jagged sub-peaks built from
   ConeGeometry with random vertex displacement + flatShading, so the
   silhouette reads as a real low-poly ridge (see reference image) instead
   of a single perfect cone.
*/
function Mountains() {
  const clusters = useMemo(() => {
    const out: { p: [number, number, number]; s: number; seed: number }[] = [];
    let counter = 1;
    let rs = 18181;
    const rand = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };

    // Northern range (back)
    for (let i = -7; i <= 7; i++) {
      const x = i * 30 + (rand() - 0.5) * 10;
      const z = -340 + (rand() - 0.5) * 28;
      const scale = 48 + rand() * 36;
      out.push({ p: [x, 0, z], s: scale, seed: counter++ });
    }
    // Southern range
    for (let i = -7; i <= 7; i++) {
      const x = i * 30 + (rand() - 0.5) * 10;
      const z = 340 + (rand() - 0.5) * 28;
      const scale = 44 + rand() * 34;
      out.push({ p: [x, 0, z], s: scale, seed: counter++ });
    }
    // Western range
    for (let i = -5; i <= 5; i++) {
      const x = -340 + (rand() - 0.5) * 28;
      const z = i * 32 + (rand() - 0.5) * 10;
      const scale = 40 + rand() * 32;
      out.push({ p: [x, 0, z], s: scale, seed: counter++ });
    }
    // Eastern range
    for (let i = -5; i <= 5; i++) {
      const x = 340 + (rand() - 0.5) * 28;
      const z = i * 32 + (rand() - 0.5) * 10;
      const scale = 40 + rand() * 32;
      out.push({ p: [x, 0, z], s: scale, seed: counter++ });
    }

    // Dedicated tunnel-anchor mountains — extra-large, positioned right
    // where the access road meets each mountain range, so the dark tunnel
    // interior is hidden by mountain mass instead of empty sky.
    out.push({ p: [ 348, 0, 110], s: 95, seed: counter++ });
    out.push({ p: [-348, 0, 110], s: 95, seed: counter++ });
    out.push({ p: [ 360, 0,  90], s: 70, seed: counter++ });
    out.push({ p: [ 360, 0, 130], s: 70, seed: counter++ });
    out.push({ p: [-360, 0,  90], s: 70, seed: counter++ });
    out.push({ p: [-360, 0, 130], s: 70, seed: counter++ });
    return out;
  }, []);

  return (
    <>
      {clusters.map((m, i) => (
        <MountainCluster
          key={i}
          position={m.p}
          scale={m.s}
          seed={m.seed}
        />
      ))}
    </>
  );
}

/** A mountain mass = 1 main peak + 2-4 lower sub-peaks sharing the base.
 *  Looks like a connected ridge instead of an isolated cone. */
function MountainCluster({ position, scale, seed }: {
  position: [number, number, number];
  scale: number;
  seed: number;
}) {
  const peaks = useMemo(() => {
    let s = seed * 31 + 1;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out: { pos: [number, number, number]; h: number; r: number; subSeed: number }[] = [];

    // main peak in centre
    const mainH = scale * (0.85 + rand() * 0.3);
    const mainR = mainH * (0.48 + rand() * 0.08);
    out.push({ pos: [0, 0, 0], h: mainH, r: mainR, subSeed: seed * 7 + 1 });

    // 2-4 secondary peaks fused around the base
    const sideCount = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < sideCount; i++) {
      const angle = (i / sideCount) * Math.PI * 2 + rand() * 0.9;
      const dist = scale * (0.28 + rand() * 0.22);
      const h = mainH * (0.45 + rand() * 0.35);
      const r = h * (0.48 + rand() * 0.1);
      out.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        h, r,
        subSeed: seed * 7 + i + 2,
      });
    }
    return out;
  }, [scale, seed]);

  return (
    <group position={position}>
      {peaks.map((p, i) => (
        <JaggedPeak
          key={i}
          position={p.pos}
          height={p.h}
          radius={p.r}
          seed={p.subSeed}
        />
      ))}
    </group>
  );
}

/** A single jagged peak — ConeGeometry with each vertex randomly nudged
 *  radially + vertically so the facets break up into ridges.
 *  flatShading=true on the material gives the low-poly faceted look. */
function JaggedPeak({ position, height, radius, seed }: {
  position: [number, number, number];
  height: number;
  radius: number;
  seed: number;
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.ConeGeometry(radius, height, 9, 5);
    let s = seed * 31 + 1;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // y range: -height/2 (bottom) to +height/2 (top)
      const yNorm = (y + height / 2) / height; // 0 (base) to 1 (apex)

      // Keep the very bottom ring flat so the mountain sits on the ground
      if (yNorm > 0.04) {
        const r = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);

        // Radial jitter — bigger near the top to make the ridges read
        const radialJitter = (rand() - 0.5) * radius * 0.45 * yNorm;
        const newR = Math.max(0.02, r + radialJitter);

        // Tangential angle jitter — twists the silhouette so adjacent faces
        // are no longer parallel
        const angleJitter = (rand() - 0.5) * 0.25 * yNorm;
        const newAngle = angle + angleJitter;

        x = Math.cos(newAngle) * newR;
        z = Math.sin(newAngle) * newR;

        // Vertical jitter only near the peak so the summit feels jagged
        if (yNorm > 0.55) {
          y += (rand() - 0.5) * height * 0.12;
        }
      }

      pos.setX(i, x);
      pos.setY(i, y);
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }, [height, radius, seed]);

  // ConeGeometry is centred on origin, so shift up by height/2 so its base
  // sits on the ground plane.
  return (
    <mesh
      geometry={geometry}
      position={[position[0], position[1] + height / 2, position[2]]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#d6deea" roughness={1} flatShading />
    </mesh>
  );
}

function Farmland() {
  const fields = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; color: string }[] = [];
    const COLS = ["#86efac", "#d9f99d", "#bef264", "#fde68a", "#a3e635", "#bbf7d0", "#fef3c7"];
    let s = 33333;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    for (let i = 0; i < 10; i++) {
      out.push({
        x: -180 + i * 22 + (rand() - 0.5) * 4,
        z: -285 + (rand() - 0.5) * 14,
        w: 14 + rand() * 6,
        d: 22 + rand() * 8,
        color: COLS[Math.floor(rand() * COLS.length)],
      });
    }
    for (let i = 0; i < 10; i++) {
      out.push({
        x: -180 + i * 22 + (rand() - 0.5) * 4,
        z: 285 + (rand() - 0.5) * 14,
        w: 14 + rand() * 6,
        d: 22 + rand() * 8,
        color: COLS[Math.floor(rand() * COLS.length)],
      });
    }
    for (let i = 0; i < 7; i++) {
      out.push({
        x: -290 + (rand() - 0.5) * 14,
        z: -110 + i * 30,
        w: 24 + rand() * 8,
        d: 16 + rand() * 6,
        color: COLS[Math.floor(rand() * COLS.length)],
      });
    }
    for (let i = 0; i < 7; i++) {
      out.push({
        x: 290 + (rand() - 0.5) * 14,
        z: -110 + i * 30,
        w: 24 + rand() * 8,
        d: 16 + rand() * 6,
        color: COLS[Math.floor(rand() * COLS.length)],
      });
    }
    return out;
  }, []);
  return (
    <group>
      {fields.map((f, i) => (
        <mesh
          key={i}
          receiveShadow
          position={[f.x, 0.03, f.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[f.w, f.d]} />
          <meshStandardMaterial color={f.color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function DistantTrees() {
  const positions = useMemo<[number, number][]>(() => {
    const out: [number, number][] = [];
    let s = 9876;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 240; i++) {
      const x = -320 + rand() * 640;
      const z = -320 + rand() * 640;
      const inSite = Math.abs(x) < 140 && Math.abs(z) < 100;
      const inFar = Math.abs(z) > 315 || Math.abs(x) > 315;
      if (inSite || inFar) continue;
      out.push([x, z]);
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
            <coneGeometry args={[0.8, 2.2, 10]} />
            <meshStandardMaterial color="#3d8b5e" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
