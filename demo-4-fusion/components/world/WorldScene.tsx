"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useWorldStore } from "@/lib/store/worldStore";
import {
  STATIONS,
  STATION_TYPE_LABEL,
  STATION_TYPE_TINT,
  WORLD_BOUNDS,
  type Station,
} from "@/lib/mock/stations";
import { SceneActorCard } from "./SceneActorCard";
import type { ScenePOI } from "@/lib/mock/scenePOIs";

/* ============================================================
   Unified SimCity-style world.
   One big green ground with grass + water + a small town in the
   middle, surrounded by 5 distinct station composites.
   ============================================================ */

interface Props {
  /** Currently-highlighted station (drives ring + opens the brief). */
  selectedStationId: string | null;
  /** Station currently in focus via SectorPicker — drawn with a softer accent. */
  activeStationId: string | null;
  onSelectStation: (station: Station) => void;
}

type ControlsLike = {
  target: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number };
  update: () => void;
};

export function WorldScene({
  selectedStationId,
  activeStationId,
  onSelectStation,
}: Props) {
  const controlsRef = useRef<ControlsLike | null>(null);
  const selectedStation = useMemo(
    () => STATIONS.find((s) => s.id === selectedStationId) ?? null,
    [selectedStationId],
  );

  // SceneActorCard expects a ScenePOI; map the selected station onto that shape.
  const selectedAsPoi: ScenePOI | null = useMemo(() => {
    if (!selectedStation) return null;
    const tint = STATION_TYPE_TINT[selectedStation.type];
    return {
      id: selectedStation.id,
      plantId: selectedStation.plantId,
      name: selectedStation.name,
      role: STATION_TYPE_LABEL[selectedStation.type],
      pos: selectedStation.pos,
      status:
        selectedStation.status === "critical"
          ? "critical"
          : selectedStation.status === "warning"
            ? "offline"
            : "normal",
      capacity: tint,
      power: selectedStation.summary,
      health: undefined,
    };
  }, [selectedStation]);

  return (
    <section className="stage stage-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [230, 320, 360], fov: 38, near: 1, far: 1500 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={["#b8d4ec", "#7a9c6e", 0.95]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[120, 220, 60]} intensity={1.5} castShadow />
        <color attach="background" args={["#dde9f2"]} />

        {/* Ground + landscape backdrop */}
        <Ground />
        <Lake position={[180, -55]} radius={48} />
        <Lake position={[-260, -180]} radius={26} />
        <River />
        <DistantTrees />
        <MountainRing />

        {/* Roads connecting the town to the stations */}
        <RoadNetwork />

        {/* Central town / city */}
        <Town center={[0, 0]} />

        {/* Five station composites */}
        <CommandCenter pos={STATIONS.find((s) => s.type === "command_center")!.pos} />
        <PowerTower    pos={STATIONS.find((s) => s.type === "power_tower")!.pos} />
        <PowerStation  pos={STATIONS.find((s) => s.type === "power_station")!.pos} />
        <SolarFarm     pos={STATIONS.find((s) => s.type === "solar_power")!.pos} />
        <SolarHouse    pos={STATIONS.find((s) => s.type === "solar_house")!.pos} />

        {/* Station POI pins */}
        {STATIONS.map((s) => (
          <StationPin
            key={s.id}
            station={s}
            selected={s.id === selectedStationId}
            active={s.id === activeStationId}
            onSelect={() => onSelectStation(s)}
          />
        ))}

        {selectedAsPoi && (
          <SceneActorCard
            poi={selectedAsPoi}
            onClose={() => {
              /* Closing the actor card doesn't deselect the station — the
                 StationTeamBrief panel manages station lifecycle. */
            }}
          />
        )}

        <OrbitControls
          ref={(node) => { controlsRef.current = (node as unknown as ControlsLike | null); }}
          target={[0, 6, 0]}
          enableDamping
          enablePan
          screenSpacePanning
          minDistance={120}
          maxDistance={650}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.3}
          autoRotate={!selectedStationId}
          autoRotateSpeed={0.14}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        <CameraSync controlsRef={controlsRef} />
      </Canvas>
    </section>
  );
}

/* ============================================================
   Camera sync (mirrors Scene3D / PVPlantScene patterns)
   ============================================================ */
function CameraSync({ controlsRef }: { controlsRef: MutableRefObject<ControlsLike | null> }) {
  const camera = useThree((s) => s.camera);
  const cameraTarget = useWorldStore((s) => s.cameraTarget);
  const setCameraView = useWorldStore((s) => s.setCameraView);
  const lastPushed = useRef({ x: 0, z: 0, radius: 0 });

  useEffect(() => {
    if (!cameraTarget || !controlsRef.current) return;
    controlsRef.current.target.set(cameraTarget.x, 6, cameraTarget.z);
    controlsRef.current.update();
  }, [cameraTarget, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const t = controls.target;
    const dx = camera.position.x - t.x;
    const dy = camera.position.y - 6;
    const dz = camera.position.z - t.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 36;
    const radius = dist * Math.tan((fov * Math.PI) / 360) * 0.9;
    const last = lastPushed.current;
    if (
      Math.abs(t.x - last.x) > 0.6 ||
      Math.abs(t.z - last.z) > 0.6 ||
      Math.abs(radius - last.radius) > 3
    ) {
      lastPushed.current = { x: t.x, z: t.z, radius };
      setCameraView({ x: t.x, z: t.z, radius });
    }
  });
  return null;
}

/* ============================================================
   GROUND + LANDSCAPE
   ============================================================ */
function Ground() {
  // Pre-computed grass colour patches for organic variation
  const patches = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; color: string }[] = [];
    const COLOURS = ["#5e944c", "#558a44", "#67a056", "#487a3a", "#5e944c", "#7baa66"];
    let s = 24680;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 36; i++) {
      out.push({
        x: -350 + rand() * 700,
        z: -240 + rand() * 480,
        w: 30 + rand() * 80,
        h: 30 + rand() * 80,
        color: COLOURS[Math.floor(rand() * COLOURS.length)],
      });
    }
    return out;
  }, []);
  return (
    <group>
      {/* Big green ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#5a8a4f" roughness={1} />
      </mesh>
      {/* Faint grid */}
      <gridHelper
        args={[1400, 140, "#4a7541", "#557a4d"]}
        position={[0, 0.005, 0]}
      />
      {/* Colour-varying patches */}
      {patches.map((p, i) => (
        <mesh
          key={i}
          receiveShadow
          position={[p.x, 0.01, p.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[p.w, p.h]} />
          <meshStandardMaterial color={p.color} roughness={1} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* World pad — a softer plane that defines the populated zone */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 80, WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 80]} />
        <meshStandardMaterial color="#6e9c61" roughness={1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Lake({ position, radius }: { position: [number, number]; radius: number }) {
  return (
    <group position={[position[0], 0.03, position[1]]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#4b80a8" roughness={0.45} metalness={0.18} />
      </mesh>
      {/* Sand rim */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 5, 48]} />
        <meshStandardMaterial color="#d2c3a0" roughness={1} />
      </mesh>
    </group>
  );
}

function River() {
  // Long thin water strip running NE-SW across the map for variety.
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = -350 + t * 700;
      const z = 200 - t * 380 + Math.sin(t * Math.PI * 1.5) * 30;
      pts.push(new THREE.Vector3(x, 0.04, z));
    }
    return pts;
  }, []);

  return (
    <group>
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const mid = new THREE.Vector3().addVectors(p, next).multiplyScalar(0.5);
        const dx = next.x - p.x;
        const dz = next.z - p.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh
            key={i}
            position={[mid.x, 0.03, mid.z]}
            rotation={[-Math.PI / 2, 0, -angle]}
          >
            <planeGeometry args={[len + 1, 14]} />
            <meshStandardMaterial color="#4b80a8" roughness={0.45} metalness={0.18} />
          </mesh>
        );
      })}
    </group>
  );
}

function DistantTrees() {
  const positions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    let s = 31415;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 320; i++) {
      const x = -360 + rand() * 720;
      const z = -250 + rand() * 500;
      // Avoid the central town and station footprints
      const inTown = Math.abs(x) < 100 && Math.abs(z) < 80;
      const tooFarFromCenter = Math.abs(x) > 350 || Math.abs(z) > 240;
      if (inTown || tooFarFromCenter) continue;
      // Avoid stations (rough 30m exclusion)
      let nearStation = false;
      for (const s of STATIONS) {
        const dx = x - s.pos[0];
        const dz = z - s.pos[2];
        if (dx * dx + dz * dz < 50 * 50) { nearStation = true; break; }
      }
      if (nearStation) continue;
      // Avoid lake
      const lakeDx = x - 180;
      const lakeDz = z - (-55);
      if (lakeDx * lakeDx + lakeDz * lakeDz < 60 * 60) continue;
      const scale = 0.8 + rand() * 1.2;
      out.push([x, scale, z]);
    }
    return out;
  }, []);
  return (
    <group>
      {positions.map(([x, scale, z], i) => (
        <group key={i} position={[x, 0, z]} scale={[scale, scale, scale]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.26, 1.4, 6]} />
            <meshStandardMaterial color="#6b4f2a" roughness={1} />
          </mesh>
          <mesh position={[0, 2.4, 0]} castShadow>
            <coneGeometry args={[1.2, 3.0, 10]} />
            <meshStandardMaterial color="#3d8b5e" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MountainRing() {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number; seed: number }[] = [];
    let s = 91234;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // Distribute peaks around the world border at radius ~520
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + rand() * 0.18;
      const r = 480 + rand() * 80;
      const scale = 60 + rand() * 50;
      out.push({
        p: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        s: scale,
        seed: i,
      });
    }
    return out;
  }, []);
  return (
    <group>
      {peaks.map((m, i) => (
        <JaggedPeak key={i} position={m.p} height={m.s} radius={m.s * 0.5} seed={m.seed} />
      ))}
    </group>
  );
}

function JaggedPeak({
  position,
  height,
  radius,
  seed,
}: {
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
      const yNorm = (y + height / 2) / height;
      if (yNorm > 0.04) {
        const r = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);
        const newR = Math.max(0.02, r + (rand() - 0.5) * radius * 0.45 * yNorm);
        const newAngle = angle + (rand() - 0.5) * 0.25 * yNorm;
        x = Math.cos(newAngle) * newR;
        z = Math.sin(newAngle) * newR;
        if (yNorm > 0.55) y += (rand() - 0.5) * height * 0.12;
      }
      pos.setX(i, x);
      pos.setY(i, y);
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }, [height, radius, seed]);
  return (
    <mesh
      geometry={geometry}
      position={[position[0], position[1] + height / 2, position[2]]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#a8b5c9" roughness={1} flatShading />
    </mesh>
  );
}

/* ============================================================
   ROADS — connect the town to each station
   ============================================================ */
function RoadNetwork() {
  return (
    <group>
      {/* Main E-W road through town */}
      <RoadSegment from={[-380, 0]} to={[380, 0]} width={8} />
      {/* Main N-S road through town */}
      <RoadSegment from={[0, -250]} to={[0, 250]} width={8} />
      {/* Branch roads to stations */}
      {STATIONS.map((s, i) => {
        const [sx, , sz] = s.pos;
        // Snap to nearest axis intersection then continue to station
        const towardX = Math.abs(sx) > Math.abs(sz);
        const elbow: [number, number] = towardX ? [sx, 0] : [0, sz];
        return (
          <group key={i}>
            <RoadSegment from={towardX ? [0, 0] : [0, 0]} to={elbow} width={5} />
            <RoadSegment from={elbow} to={[sx, sz]} width={5} />
          </group>
        );
      })}
    </group>
  );
}

function RoadSegment({
  from,
  to,
  width,
}: {
  from: [number, number];
  to: [number, number];
  width: number;
}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 1) return null;
  const angle = Math.atan2(dz, dx);
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  return (
    <group position={[mid[0], 0.08, mid[1]]} rotation={[0, -angle, 0]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[len, width]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.95} />
      </mesh>
      {/* Centre line (dashed) */}
      {Array.from({ length: Math.max(2, Math.floor(len / 5)) }).map((_, i) => {
        const fraction = (i + 0.5) / Math.max(2, Math.floor(len / 5));
        return (
          <mesh
            key={i}
            position={[-len / 2 + fraction * len, 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.6, 0.18]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        );
      })}
      {/* Shoulder lines */}
      {[width / 2 - 0.25, -width / 2 + 0.25].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, 0.15]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   TOWN — procedural houses + shops
   ============================================================ */
function Town({ center }: { center: [number, number] }) {
  const houses = useMemo(() => {
    const out: {
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      roof: string;
      wall: string;
      r: number;
    }[] = [];
    const ROOFS = ["#b91c1c", "#92400e", "#0e7490", "#475569", "#7c2d12", "#1d4ed8", "#a16207"];
    const WALLS = ["#fef3c7", "#fde68a", "#e7e5e4", "#fff7ed", "#f1f5f9", "#fde2c2"];
    let s = 13579;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // 4 quadrants of houses around the cross of main roads (avoid road strips)
    const QUADRANTS: [number, number, number, number][] = [
      [-90,   8,  4, 3],
      [-90, -65,  4, 3],
      [ 12,   8,  4, 3],
      [ 12, -65,  4, 3],
    ];
    for (const [ox, oz, cols, rows] of QUADRANTS) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.15) continue;
          out.push({
            x: center[0] + ox + c * 18 + (rand() - 0.5) * 3,
            z: center[1] + oz + r * 18 + (rand() - 0.5) * 3,
            w: 6 + rand() * 3,
            d: 7 + rand() * 3,
            h: 4 + rand() * 3,
            roof: ROOFS[Math.floor(rand() * ROOFS.length)],
            wall: WALLS[Math.floor(rand() * WALLS.length)],
            r: Math.floor(rand() * 4) * (Math.PI / 2),
          });
        }
      }
    }
    return out;
  }, [center]);

  return (
    <group>
      {houses.map((h, i) => (
        <TownHouse key={i} {...h} />
      ))}
      {/* Small town centre shops along the main E-W road, just south of the cross */}
      {[-60, -40, -22, 22, 40, 60].map((x, i) => (
        <Shop key={`shop-${i}`} x={x} z={28} />
      ))}
      {/* Town square plaza in the centre */}
      <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color="#d6c9a0" roughness={1} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#c9a85a" />
      </mesh>
    </group>
  );
}

function TownHouse({
  x, z, w, d, h, roof, wall, r,
}: {
  x: number; z: number; w: number; d: number; h: number;
  roof: string; wall: string; r: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      {/* Pitched roof */}
      <mesh position={[0, h + 1.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.75, 2.4, 4]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, d / 2 + 0.02]}>
        <boxGeometry args={[0.9, 2.0, 0.05]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* Windows */}
      <mesh position={[-w / 3, h / 2 + 0.5, d / 2 + 0.02]}>
        <boxGeometry args={[1.0, 0.9, 0.05]} />
        <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[w / 3, h / 2 + 0.5, d / 2 + 0.02]}>
        <boxGeometry args={[1.0, 0.9, 0.05]} />
        <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Shop({ x, z }: { x: number; z: number }) {
  const colours = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#a855f7", "#14b8a6"];
  const wall = colours[Math.abs(Math.floor(x + z)) % colours.length];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 4.4, 7]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[10.4, 0.3, 7.4]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 3.0, 3.7]}>
        <boxGeometry args={[10, 0.15, 0.8]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Door + window */}
      <mesh position={[-2, 1.4, 3.55]}>
        <boxGeometry args={[1.4, 2.6, 0.05]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[1.5, 2.0, 3.55]}>
        <boxGeometry args={[4.5, 1.8, 0.05]} />
        <meshStandardMaterial color="#a5d8e6" emissive="#83b3e4" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/* ============================================================
   STATION COMPOSITES
   ============================================================ */

function StationPad({
  w, d, colour = "#d0d4d8",
}: { w: number; d: number; colour?: string }) {
  return (
    <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={colour} roughness={1} />
    </mesh>
  );
}

function CommandCenter({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <StationPad w={42} d={36} colour="#c8cdd3" />
      {/* Main two-storey building */}
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 9, 14]} />
        <meshStandardMaterial color="#e8eef5" roughness={0.7} />
      </mesh>
      <mesh position={[0, 9.2, 0]}>
        <boxGeometry args={[20.4, 0.4, 14.4]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Window bands */}
      {[2.2, 5.8].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[20.05, 0.9, 14.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* Antenna mast */}
      <mesh position={[6, 14, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 10, 8]} />
        <meshStandardMaterial color="#5c6877" />
      </mesh>
      <mesh position={[6, 19.4, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      {/* Satellite dish */}
      <group position={[-7, 10, -5]} rotation={[Math.PI / 6, Math.PI / 5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[2.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e5e7eb" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 1.4, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
      {/* Flagpole */}
      <mesh position={[-8, 5, 7]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 10, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-7.4, 9.4, 7]}>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Small parking pad */}
      <mesh position={[0, 0.07, 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#475569" roughness={1} />
      </mesh>
    </group>
  );
}

function PowerTower({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <StationPad w={18} d={18} colour="#c2b59a" />
      {/* 4 lattice legs */}
      {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 13, dz]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 26, 6]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      ))}
      {/* X-brace cross arms at three heights */}
      {[8, 16, 22].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[8, 0.25, 0.25]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.25, 0.25, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {/* Insulators */}
          {[-3.5, 0, 3.5].map((dx) => (
            <mesh key={dx} position={[dx, -0.6, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.9, 8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Spire + warning light */}
      <mesh position={[0, 26.5, 0]} castShadow>
        <cylinderGeometry args={[0, 0.5, 1.5, 4]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0, 27.6, 0]}>
        <sphereGeometry args={[0.4, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.7} />
      </mesh>
      {/* Outgoing transmission cables (visual hint) */}
      {[8, 16, 22].map((y) =>
        [-3.5, 3.5].map((dx, i) => (
          <mesh key={`${y}-${i}`} position={[dx, y - 0.55, 30]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 60, 4]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        )),
      )}
    </group>
  );
}

function PowerStation({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <StationPad w={56} d={42} colour="#cbb88a" />
      {/* Main control building */}
      <mesh position={[-12, 3.5, 10]} castShadow receiveShadow>
        <boxGeometry args={[20, 7, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[-12, 7.2, 10]}>
        <boxGeometry args={[20.4, 0.4, 12.4]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Red-and-white smokestack */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-22, i * 3.2 + 1.6, 14]} castShadow>
          <cylinderGeometry args={[1.4, 1.4, 3.2, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#f8fafc" : "#dc2626"} roughness={0.7} />
        </mesh>
      ))}
      {/* Steam wisp */}
      <mesh position={[-22, 21, 14]}>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} />
      </mesh>
      {/* Transformer yard — 5 cans + lattice gantry */}
      {[-10, -3, 4, 11, 18].map((dx, i) => (
        <group key={i} position={[dx, 0, -7]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[3.4, 3.6, 2.6]} />
            <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}
      {/* Gantry */}
      {[-14, 22].map((dx) => (
        <mesh key={dx} position={[dx, 5.5, -7]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 11, 6]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      ))}
      <mesh position={[4, 10.5, -7]}>
        <boxGeometry args={[38, 0.25, 0.4]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {/* Cooling pond */}
      <mesh receiveShadow position={[18, 0.07, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial color="#4b80a8" roughness={0.45} metalness={0.18} />
      </mesh>
    </group>
  );
}

function SolarFarm({ pos }: { pos: [number, number, number] }) {
  const ROWS = 5;
  const COLS = 8;
  const PITCH_X = 7;
  const PITCH_Z = 6;
  return (
    <group position={pos}>
      <StationPad w={COLS * PITCH_X + 12} d={ROWS * PITCH_Z + 16} colour="#c2cfa8" />
      {/* PV rows */}
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          const x = -(COLS - 1) * PITCH_X / 2 + c * PITCH_X;
          const z = -(ROWS - 1) * PITCH_Z / 2 + r * PITCH_Z;
          return (
            <group key={`${r}-${c}`} position={[x, 0, z]}>
              {/* Posts */}
              {[-2, 2].map((dx) => (
                <mesh key={dx} position={[dx, 0.9, 0]} castShadow>
                  <cylinderGeometry args={[0.08, 0.08, 1.8, 6]} />
                  <meshStandardMaterial color="#475569" />
                </mesh>
              ))}
              {/* Tilted panel */}
              <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 9, 0, 0]} castShadow>
                <boxGeometry args={[5.5, 0.1, 3.0]} />
                <meshStandardMaterial color="#13243f" metalness={0.55} roughness={0.3} />
              </mesh>
              <mesh position={[0, 1.66, 0]} rotation={[Math.PI / 9, 0, 0]}>
                <boxGeometry args={[5.45, 0.005, 2.95]} />
                <meshStandardMaterial color="#1f3a5e" emissive="#274a76" emissiveIntensity={0.22} />
              </mesh>
            </group>
          );
        }),
      )}
      {/* Inverter row south of the array */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = -12 + i * 8;
        const z = (ROWS - 1) * PITCH_Z / 2 + 7;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[3.4, 2.4, 2.2]} />
              <meshStandardMaterial color="#3b6ea5" metalness={0.4} roughness={0.45} />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
              <boxGeometry args={[3.6, 0.18, 2.4]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          </group>
        );
      })}
      {/* Small operator hut */}
      <group position={[-(COLS - 1) * PITCH_X / 2 - 12, 0, -(ROWS - 1) * PITCH_Z / 2 - 4]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 3, 5]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.85} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[6.2, 0.3, 5.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
    </group>
  );
}

function SolarHouse({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <StationPad w={26} d={22} colour="#a3c98b" />
      {/* House body */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 6, 8]} />
        <meshStandardMaterial color="#fde68a" roughness={0.9} />
      </mesh>
      {/* Two-pitch roof using a flat rotated box (simple gable) */}
      <mesh position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[7, 2.6, 4]} />
        <meshStandardMaterial color="#92400e" roughness={1} />
      </mesh>
      {/* Rooftop solar panels — two facets straddling the ridge */}
      <mesh position={[0, 7.0, 2.0]} rotation={[Math.PI / 5, 0, 0]} castShadow>
        <boxGeometry args={[7, 0.12, 3.2]} />
        <meshStandardMaterial color="#13243f" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 7.05, 2.05]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[6.9, 0.01, 3.1]} />
        <meshStandardMaterial color="#1f3a5e" emissive="#274a76" emissiveIntensity={0.2} />
      </mesh>
      {/* Door + windows */}
      <mesh position={[0, 1.4, 4.05]}>
        <boxGeometry args={[1.4, 2.8, 0.05]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 3.4, 4.05]}>
          <boxGeometry args={[1.4, 1.4, 0.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Inverter box on the side */}
      <mesh position={[5.2, 1.3, 0]} castShadow>
        <boxGeometry args={[0.8, 2.6, 1.6]} />
        <meshStandardMaterial color="#3b6ea5" metalness={0.4} />
      </mesh>
      {/* Garden path */}
      <mesh position={[0, 0.05, 7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 6]} />
        <meshStandardMaterial color="#cbb88a" roughness={1} />
      </mesh>
      {/* Front-yard trees */}
      {[[-6, 7], [6, 7]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.0, 6]} />
            <meshStandardMaterial color="#6b4f2a" roughness={1} />
          </mesh>
          <mesh position={[0, 3.0, 0]} castShadow>
            <sphereGeometry args={[1.4, 12, 12]} />
            <meshStandardMaterial color="#3d8b5e" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   STATION PIN — the clickable POI floating above each station
   ============================================================ */
function StationPin({
  station,
  selected,
  active,
  onSelect,
}: {
  station: Station;
  selected: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const tint = STATION_TYPE_TINT[station.type];
  const isCritical = station.status === "critical";
  return (
    <group
      position={[station.pos[0], station.pos[1], station.pos[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isCritical && <PulseRing colour="#ef4444" />}
      {selected && (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6, 7, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      )}
      {active && !selected && (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5, 5.6, 48]} />
          <meshBasicMaterial color={tint} transparent opacity={0.5} />
        </mesh>
      )}
      <Html position={[0, 18, 0]} center distanceFactor={36}>
        <div
          className={`plant-poi clickable ${isCritical ? "crit" : station.status === "warning" ? "warn" : "ok"}`}
          onClick={onSelect}
        >
          <div className="plant-poi-dot" style={{ background: tint, boxShadow: `0 0 0 1px ${tint}, 0 4px 10px rgba(0,0,0,0.25)` }} />
          <div className="plant-poi-card">
            <div className="plant-poi-name">{station.name}</div>
            <div className="plant-poi-pwr">{STATION_TYPE_LABEL[station.type]}</div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function PulseRing({ colour = "#f43f5e" }: { colour?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime % 1.6) / 1.6;
    ref.current.scale.set(1 + t * 1.6, 1 + t * 1.6, 1 + t * 1.6);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[5, 5.6, 48]} />
      <meshBasicMaterial color={colour} transparent opacity={0.8} />
    </mesh>
  );
}
