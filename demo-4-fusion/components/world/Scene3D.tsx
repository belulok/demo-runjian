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
  kedah:  { pos: [-105, 9,  55], label: "Admin"     },
  penang: { pos: [ -75, 26, -25], label: "HRSG"      },
  perak:  { pos: [  -5, 18, -25], label: "Cooling"   },
  melaka: { pos: [ -75, 14,   5], label: "Turbine"   },
  johor:  { pos: [  25, 16,   8], label: "Switchyard"},
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

        {/* ── Roads — south access + internal grid ── */}
        <PlantAccessRoad />
        <InternalRoadGrid />

        {/* ── Site boundary (tree-lined fence) ── */}
        <SiteBoundary halfW={137} halfD={92.5} />

        {/* ── 22 numbered facilities ── */}
        {/* Row 1 (north): parking, GIS bldg, demin water, fuel-oil small, raw water tank top */}
        <ParkingArea     position={[-92, 0, -65]} cols={8} rows={4} />
        <GISBuilding     position={[-25, 0, -65]} />
        <DemineralizedWaterPlant position={[28, 0, -65]} />
        <FuelOilTankSmall position={[60, 0, -65]} />
        <RawWaterTank    position={[110, 0, -65]} colour="#7a8f7e" />

        {/* Row 2: HRSG/turbine/gas turbine, cooling towers, condenser, raw water tank */}
        <HRSG            position={[-90, 0, -25]} />
        <GasTurbineArea  position={[-55, 0, -32]} />
        <CoolingTowers   position={[ -5, 0, -25]} />
        <CondenserFanArray position={[40, 0, -25]} />
        <RawWaterTank    position={[110, 0, -25]} colour="#8aa18e" />

        {/* Row 3 (center): steam turbine, switchyard, aux building, condenser triple, raw water */}
        <SteamTurbineBuilding position={[-75, 0, 5]} />
        <CirculatingWaterPumps position={[-30, 0, 18]} />
        <Switchyard      position={[ 25, 0, 8]} />
        <AuxiliaryBuilding position={[85, 0, 8]} />
        <CondenserTriple position={[110, 0, 8]} />

        {/* Row 4 (south): admin, workshop, warehouse, wastewater, solid waste, fuel-oil large, raw water */}
        <WorkshopMaintenance position={[-105, 0, 5]} />
        <AdminBuilding   position={[-105, 0, 55]} />
        <Warehouse       position={[5, 0, 55]} />
        <WastewaterTreatment position={[40, 0, 60]} />
        <SolidWasteArea  position={[78, 0, 55]} />
        <FuelOilTanksLarge position={[110, 0, 45]} />
        <RawWaterTank    position={[110, 0, 78]} colour="#7a8f7e" />

        {/* Gas pipeline (item 15) — yellow vertical pipe stub */}
        <GasPipeline position={[0, 0, -90]} />

        {/* Main gate (item 2) on the south access road */}
        <MainGate position={[-50, 0, 88]} />

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

/** Big east-west "Plant Main Access Road" south of the site. */
function PlantAccessRoad() {
  return (
    <group position={[0, 0.10, 105]}>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[340, 14]} />
        <meshStandardMaterial color="#2d333f" roughness={0.96} />
      </mesh>
      {/* dashed centre line — lifted clear of the asphalt */}
      {Array.from({ length: 56 }).map((_, i) => (
        <mesh
          key={i}
          position={[-160 + i * 6, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[3, 0.25]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}
      {/* shoulder lines */}
      {[6.5, -6.5].map((z) => (
        <mesh key={z} position={[0, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[338, 0.18]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
    </group>
  );
}

/** The internal road grid that mirrors the Sohar plan. */
function InternalRoadGrid() {
  return (
    <group>
      {/* Horizontal roads — 4 rows */}
      <Road x={0} z={-90}  length={270} width={5}  horizontal />
      <Road x={0} z={-46}  length={270} width={5}  horizontal />
      <Road x={0} z={-8}   length={270} width={5.5} horizontal />
      <Road x={0} z={ 30}  length={270} width={5}  horizontal />
      <Road x={0} z={ 78}  length={270} width={5}  horizontal />
      {/* Vertical roads */}
      <Road x={-128} z={0} length={170} width={4} horizontal={false} />
      <Road x={ -60} z={0} length={170} width={4} horizontal={false} />
      <Road x={  -5} z={0} length={170} width={4} horizontal={false} />
      <Road x={  55} z={0} length={170} width={4} horizontal={false} />
      <Road x={  92} z={0} length={170} width={4} horizontal={false} />
      <Road x={ 128} z={0} length={170} width={4} horizontal={false} />
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
function SiteBoundary({ halfW, halfD }: { halfW: number; halfD: number }) {
  const trees = useMemo(() => {
    const out: [number, number][] = [];
    const step = 4;
    for (let x = -halfW; x <= halfW; x += step) {
      out.push([x, -halfD]);
      out.push([x,  halfD]);
    }
    for (let z = -halfD + step; z < halfD; z += step) {
      out.push([-halfW, z]);
      out.push([ halfW, z]);
    }
    return out;
  }, [halfW, halfD]);
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

/** 4 — Switchyard (large fenced area with lattice TX towers + bus bars) */
function Switchyard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={60} d={38} colour="#b3a880" />
      {/* lattice TX towers - 4 across, 2 deep */}
      {[-22, -7, 8, 23].map((x, i) => (
        <LatticeTxTower key={`a-${i}`} position={[x, 0, -10]} />
      ))}
      {[-22, -7, 8, 23].map((x, i) => (
        <LatticeTxTower key={`b-${i}`} position={[x, 0, 10]} />
      ))}
      {/* bus bars (thin grey rectangles running across) */}
      {[-13, -4, 5, 14].map((z, i) => (
        <mesh key={i} position={[0, 7, z]}>
          <boxGeometry args={[54, 0.05, 0.05]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
      {/* fence posts */}
      {[[-30, -19], [30, -19], [-30, 19], [30, 19], [0, -19], [0, 19]].map(([x, z], i) => (
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
      <FacilityPad w={44} d={26} />
      {/* main building */}
      <mesh position={[-8, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 4, 15]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[-8, 4.2, 0]}>
        <boxGeometry args={[18.2, 0.3, 15.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* transformer cubicles outside (3 cubicle rows) */}
      {[6, 11, 16].map((x, i) =>
        [-5, 0, 5].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 0, z]}>
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[2.6, 2, 2.6]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
            </mesh>
            {/* insulator stack */}
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
      <FacilityPad w={26} d={28} colour="#b3a880" />
      {/* boiler box (blue) */}
      <mesh position={[3, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 10, 18]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* internal ductwork pattern (lighter blue stripes) */}
      {[-2, 2, 6].map((y) => (
        <mesh key={y} position={[3, 5 + y, 0]}>
          <boxGeometry args={[14.1, 0.3, 18.1]} />
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
      <FacilityPad w={30} d={26} />
      {/* base block */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 5, 18]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>
      {/* two fan roof units */}
      {[-5, 5].map((x, i) => (
        <CondenserFan key={i} position={[x, 5, 0]} radius={3.2} />
      ))}
      <FacilityNumber n={9} position={[0, 9, 0]} />
    </group>
  );
}

/** 9b — Condenser (triple small fan cluster at the SE corner) */
function CondenserTriple({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <FacilityPad w={20} d={18} />
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[16, 1.6, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {[-5, 0, 5].map((x, i) => (
        <CondenserFan key={i} position={[x, 1.6, 0]} radius={2.0} />
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
      <FacilityPad w={36} d={26} />
      {[-9, 9].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* louvered side intake — block with vertical slats */}
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[14, 8, 18]} />
            <meshStandardMaterial color="#dbe1e8" roughness={0.7} />
          </mesh>
          {/* louvers */}
          {[-6, -2, 2, 6].map((dx) => (
            <mesh key={dx} position={[dx, 4, 9.05]}>
              <boxGeometry args={[1, 7, 0.15]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          ))}
          {/* rooftop fan with cowling */}
          <mesh position={[0, 8.5, 0]}>
            <cylinderGeometry args={[5, 5, 1.0, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
          </mesh>
          <CondenserFan position={[0, 9.1, 0]} radius={4.2} />
          {/* steam wisp */}
          <mesh position={[0, 11.5, 0]}>
            <sphereGeometry args={[1.6, 12, 12]} />
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
      <FacilityPad w={26} d={26} colour="#b3a880" />
      {/* tank body */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[9, 9, 7, 32]} />
        <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
      </mesh>
      {/* green water surface */}
      <mesh position={[0, 7.18, 0]}>
        <cylinderGeometry args={[8.95, 8.95, 0.1, 32]} />
        <meshStandardMaterial color={colour} roughness={0.95} />
      </mesh>
      {/* seam stripes — radius slightly larger than tank so they don't z-fight */}
      {[2, 5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[9.15, 9.15, 0.18, 32]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      {/* ladder */}
      <mesh position={[9, 3.5, 0]}>
        <boxGeometry args={[0.06, 7, 0.3]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <FacilityNumber n={13} position={[0, 9, 0]} />
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
      <FacilityPad w={32} d={32} colour="#b3a880" />
      {[[-7, 0], [7, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[6, 6, 8, 32]} />
            <meshStandardMaterial color="#e9eef4" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[0, 8.18, 0]}>
            <cylinderGeometry args={[5.95, 5.95, 0.1, 32]} />
            <meshStandardMaterial color="#7a8f7e" roughness={0.95} />
          </mesh>
          {/* belt */}
          <mesh position={[0, 4.12, 0]}>
            <cylinderGeometry args={[6.05, 6.05, 0.2, 32]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[6, 4, 0]}>
            <boxGeometry args={[0.06, 8, 0.3]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
      <FacilityNumber n={16} position={[0, 10, 0]} />
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
      <FacilityPad w={20} d={20} />
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 3.6, 14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[14.2, 0.3, 14.2]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {/* exterior skid units (the small grey blocks shown in image) */}
      {[[-4, -5.5], [0, -5.5], [4, -5.5], [-4, 5.5], [0, 5.5], [4, 5.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[2.2, 1.4, 1.6]} />
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

function Mountains() {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number; tint: number }[] = [];
    let s = 18181;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = -9; i <= 9; i++) {
      const x = i * 26 + (rand() - 0.5) * 8;
      out.push({ p: [x, 0, -350 + rand() * 30], s: 40 + rand() * 38, tint: rand() });
    }
    for (let i = -9; i <= 9; i++) {
      const x = i * 26 + (rand() - 0.5) * 8;
      out.push({ p: [x, 0, 340 + rand() * 30], s: 34 + rand() * 36, tint: rand() });
    }
    for (let i = -6; i <= 6; i++) {
      const z = i * 28 + (rand() - 0.5) * 6;
      out.push({ p: [-350 + rand() * 24, 0, z], s: 32 + rand() * 32, tint: rand() });
    }
    for (let i = -6; i <= 6; i++) {
      const z = i * 28 + (rand() - 0.5) * 6;
      out.push({ p: [350 + rand() * 24, 0, z], s: 32 + rand() * 34, tint: rand() });
    }
    return out;
  }, []);
  return (
    <>
      {peaks.map((m, i) => (
        <mesh key={i} position={[m.p[0], m.s / 2, m.p[2]]} castShadow receiveShadow>
          <coneGeometry args={[m.s * 0.6, m.s, 14]} />
          <meshStandardMaterial color={m.tint < 0.5 ? "#cbd6e2" : "#bfcad7"} roughness={1} />
        </mesh>
      ))}
    </>
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
