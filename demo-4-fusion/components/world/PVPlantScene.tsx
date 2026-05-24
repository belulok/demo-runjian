"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useWorldStore } from "@/lib/store/worldStore";
import type { ScenePOI } from "@/lib/mock/scenePOIs";
import type { PVPlantParams } from "@/lib/mock/scenePOIs";
import { SceneActorCard } from "./SceneActorCard";

/* ============================================================
   Procedural PV plant scene — used for Kedah / Penang / Perak /
   Melaka sectors. Driven entirely by PVPlantParams: site size,
   panel grid, orientation, optional features, region tinting.
   ============================================================ */

interface Props {
  params: PVPlantParams;
  pois: ScenePOI[];
  selectedPoiId: string | null;
  onSelectPoi: (poi: ScenePOI | null) => void;
}

type ControlsLike = {
  target: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number };
  update: () => void;
};

export function PVPlantScene({ params, pois, selectedPoiId, onSelectPoi }: Props) {
  const controlsRef = useRef<ControlsLike | null>(null);
  const selectedPoi = useMemo(
    () => pois.find((p) => p.id === selectedPoiId) ?? null,
    [pois, selectedPoiId],
  );

  // Camera distance scales with site footprint
  const maxExtent = Math.max(params.halfW, params.halfD);
  const camDist = maxExtent * 2.2;

  return (
    <section className="stage stage-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [camDist * 0.4, camDist * 1.1, camDist], fov: 36, near: 1, far: 800 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={[params.ambientColor, "#cfd7e0", 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[60, 120, 40]} intensity={1.6} castShadow />
        <color attach="background" args={[params.ambientColor]} />

        {/* Surrounding terrain: large faded plane */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[800, 800]} />
          <meshStandardMaterial color={params.features.coastal ? "#d8dfe8" : "#eef3f8"} roughness={1} />
        </mesh>
        <gridHelper args={[800, 80, "#cbd6e2", "#dde6f0"]} position={[0, 0.01, 0]} />

        {/* Coastal water strip on west edge */}
        {params.features.coastal && (
          <mesh receiveShadow position={[-(params.halfW + 60), 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[110, params.halfD * 2 + 200]} />
            <meshStandardMaterial color="#5a87b0" roughness={0.7} metalness={0.1} />
          </mesh>
        )}

        {/* Site pad */}
        <mesh
          receiveShadow
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[params.halfW * 2, params.halfD * 2]} />
          <meshStandardMaterial color={params.groundColor} roughness={1} />
        </mesh>

        {/* Perimeter fence (tree row) */}
        <Boundary halfW={params.halfW} halfD={params.halfD} foliageColor={params.foliageColor} />

        {/* Internal access road — single loop around the panel block */}
        <PerimeterRoad halfW={params.halfW - 6} halfD={params.halfD - 6} />

        {/* PV panel array grid */}
        <PanelGrid params={params} />

        {/* Inverter row south of the panels */}
        <InverterRow params={params} />

        {/* Admin building NW */}
        <AdminBlock x={-params.halfW + 18} z={params.halfD - 16} />

        {/* Met tower W */}
        <MetTower x={-params.halfW + 12} z={0} />

        {/* Substation E */}
        {params.features.substation && (
          <Substation x={params.halfW - 22} z={params.halfD - 20} />
        )}

        {/* Battery bank E */}
        {params.features.battery && (
          <BatteryBank x={params.halfW - 18} z={-params.halfD + 16} />
        )}

        {/* Warehouse NW */}
        {params.features.warehouse && (
          <Warehouse x={-params.halfW + 22} z={-params.halfD + 14} />
        )}

        {/* Main gate on south fence */}
        <MainGate x={0} z={params.halfD - 4} />

        {/* Background landscape */}
        <BackgroundMountains halfW={params.halfW} halfD={params.halfD} />

        {/* Active-sector POIs */}
        {pois.map((p) => (
          <POIPin
            key={p.id}
            poi={p}
            selected={p.id === selectedPoiId}
            onSelect={() => onSelectPoi(p)}
          />
        ))}

        {selectedPoi && (
          <SceneActorCard poi={selectedPoi} onClose={() => onSelectPoi(null)} />
        )}

        <OrbitControls
          ref={(node) => { controlsRef.current = (node as unknown as ControlsLike | null); }}
          target={[0, 4, 0]}
          enableDamping
          enablePan
          screenSpacePanning
          minDistance={maxExtent * 0.9}
          maxDistance={maxExtent * 3.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate={!selectedPoiId}
          autoRotateSpeed={0.18}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          touches={{
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
        />
        <CameraSync controlsRef={controlsRef} />
      </Canvas>
    </section>
  );
}

function CameraSync({ controlsRef }: { controlsRef: MutableRefObject<ControlsLike | null> }) {
  const camera = useThree((s) => s.camera);
  const cameraTarget = useWorldStore((s) => s.cameraTarget);
  const setCameraView = useWorldStore((s) => s.setCameraView);
  const lastPushed = useRef({ x: 0, z: 0, radius: 0 });

  useEffect(() => {
    if (!cameraTarget || !controlsRef.current) return;
    controlsRef.current.target.set(cameraTarget.x, 4, cameraTarget.z);
    controlsRef.current.update();
  }, [cameraTarget, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const t = controls.target;
    const dx = camera.position.x - t.x;
    const dy = camera.position.y - 4;
    const dz = camera.position.z - t.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 36;
    const radius = dist * Math.tan((fov * Math.PI) / 360) * 0.9;
    const last = lastPushed.current;
    if (
      Math.abs(t.x - last.x) > 0.5 ||
      Math.abs(t.z - last.z) > 0.5 ||
      Math.abs(radius - last.radius) > 2
    ) {
      lastPushed.current = { x: t.x, z: t.z, radius };
      setCameraView({ x: t.x, z: t.z, radius });
    }
  });
  return null;
}

/* ============================================================
   Panel grid — rows × cols of PV arrays. Orientation rotates the
   individual panel tilt + footprint.
   ============================================================ */
function PanelGrid({ params }: { params: PVPlantParams }) {
  const totalW = params.cols * params.colPitch;
  const totalD = params.rows * params.rowPitch;
  const tiltAxis = params.orientation === "NS" ? "x" : "z";
  return (
    <group>
      {Array.from({ length: params.rows }).map((_, r) =>
        Array.from({ length: params.cols }).map((_, c) => {
          const x = -totalW / 2 + c * params.colPitch + params.colPitch / 2;
          const z = -totalD / 2 + r * params.rowPitch + params.rowPitch / 2;
          return <PanelArray key={`${r}-${c}`} x={x} z={z} pitch={params.colPitch} rowPitch={params.rowPitch} tiltAxis={tiltAxis} />;
        }),
      )}
    </group>
  );
}

function PanelArray({ x, z, pitch, rowPitch, tiltAxis }: {
  x: number; z: number; pitch: number; rowPitch: number; tiltAxis: "x" | "z";
}) {
  // The tilted panel face
  const w = tiltAxis === "x" ? pitch * 0.7 : pitch * 0.45;
  const d = tiltAxis === "x" ? rowPitch * 0.35 : rowPitch * 0.7;
  const tiltDeg = 18;
  const tiltRad = (tiltDeg * Math.PI) / 180;
  return (
    <group position={[x, 0, z]}>
      {/* Two support posts */}
      {[-w / 3, w / 3].map((dx) => (
        <mesh key={dx} position={[tiltAxis === "x" ? 0 : dx, 0.8, tiltAxis === "x" ? dx : 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* Tilted panel face */}
      <mesh
        position={[0, 1.4, 0]}
        rotation={tiltAxis === "x" ? [tiltRad, 0, 0] : [0, 0, tiltRad]}
        castShadow
      >
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color="#13243f" metalness={0.55} roughness={0.3} />
      </mesh>
      {/* Grid lines on panel */}
      <mesh
        position={[0, 1.44, 0]}
        rotation={tiltAxis === "x" ? [tiltRad, 0, 0] : [0, 0, tiltRad]}
      >
        <boxGeometry args={[w * 0.98, 0.005, d * 0.98]} />
        <meshStandardMaterial color="#1f3a5e" emissive="#274a76" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function InverterRow({ params }: { params: PVPlantParams }) {
  const totalW = params.cols * params.colPitch;
  const totalD = params.rows * params.rowPitch;
  const count = Math.min(params.cols, 6);
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const x = -totalW / 2 + (i + 0.5) * (totalW / count);
        const z = totalD / 2 + 9;
        return <InverterBox key={i} x={x} z={z} />;
      })}
    </group>
  );
}

function InverterBox({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 2.4, 3]} />
        <meshStandardMaterial color="#3b6ea5" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[5.2, 0.18, 3.2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Concrete pad */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.5, 4.5]} />
        <meshStandardMaterial color="#d2cdb7" roughness={1} />
      </mesh>
    </group>
  );
}

function AdminBlock({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#d2cdb7" roughness={1} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 5, 10]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.15, 0]}>
        <boxGeometry args={[14.2, 0.3, 10.2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[1.5, 3.6].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[14.05, 0.55, 10.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function MetTower({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* lattice */}
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 6, dz]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 12, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {[2, 5, 8, 11].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.2, 0.06, 1.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* anemometer */}
      <mesh position={[0, 12.3, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
}

function Substation({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#b3a880" roughness={1} />
      </mesh>
      {/* transformer cans */}
      {[[-6, 0], [0, 0], [6, 0]].map(([dx, dz], i) => (
        <group key={i} position={[dx, 0, dz]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[3.2, 2.4, 3]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 3.4, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 1.8, 8]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      ))}
      {/* lattice TX tower */}
      {[[-9, -6], [9, -6], [-9, 6], [9, 6]].map(([dx, dz], i) => (
        <mesh key={`pole-${i}`} position={[dx, 4, dz]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 8, 6]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
    </group>
  );
}

function BatteryBank({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#b3a880" roughness={1} />
      </mesh>
      {[-4, 0, 4].map((dx) => (
        <mesh key={dx} position={[dx, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 2.8, 6]} />
          <meshStandardMaterial color="#3a3055" metalness={0.45} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Warehouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color="#d2cdb7" roughness={1} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 5, 10]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.15, 0]}>
        <boxGeometry args={[18.2, 0.3, 10.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* bay doors */}
      {[-5, 0, 5].map((dx) => (
        <mesh key={dx} position={[dx, 2, 5.05]}>
          <boxGeometry args={[2.6, 3, 0.05]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  );
}

function MainGate({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.5, 2.6, 2.5]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.8, 0.2, 2.8]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {[-3, 3].map((dx) => (
        <mesh key={dx} position={[dx, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}
    </group>
  );
}

function PerimeterRoad({ halfW, halfD }: { halfW: number; halfD: number }) {
  const segments = [
    { x: 0, z: -halfD, w: halfW * 2, d: 4, h: true },
    { x: 0, z: halfD, w: halfW * 2, d: 4, h: true },
    { x: -halfW, z: 0, w: 4, d: halfD * 2, h: false },
    { x: halfW, z: 0, w: 4, d: halfD * 2, h: false },
  ];
  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0.1, s.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s.w, s.d]} />
          <meshStandardMaterial color="#3a3f4a" roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function Boundary({ halfW, halfD, foliageColor }: { halfW: number; halfD: number; foliageColor: string }) {
  const trees = useMemo(() => {
    const out: [number, number][] = [];
    const step = 4;
    for (let x = -halfW; x <= halfW; x += step) {
      out.push([x, -halfD]);
      out.push([x, halfD]);
    }
    for (let z = -halfD + step; z < halfD; z += step) {
      out.push([-halfW, z]);
      out.push([halfW, z]);
    }
    return out;
  }, [halfW, halfD]);
  return (
    <group>
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 0.8, 6]} />
            <meshStandardMaterial color="#6b4f2a" roughness={1} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <sphereGeometry args={[0.85, 10, 10]} />
            <meshStandardMaterial color={foliageColor} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BackgroundMountains({ halfW, halfD }: { halfW: number; halfD: number }) {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number; seed: number }[] = [];
    let s = 42424;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const radius = Math.max(halfW, halfD) + 120;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + rand() * 0.3;
      const r = radius + rand() * 80;
      const scale = 40 + rand() * 36;
      out.push({ p: [Math.cos(angle) * r, 0, Math.sin(angle) * r], s: scale, seed: i });
    }
    return out;
  }, [halfW, halfD]);
  return (
    <group>
      {peaks.map((m, i) => (
        <JaggedPeak key={i} position={m.p} height={m.s} radius={m.s * 0.5} seed={m.seed} />
      ))}
    </group>
  );
}

function JaggedPeak({ position, height, radius, seed }: {
  position: [number, number, number]; height: number; radius: number; seed: number;
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
    <mesh geometry={geometry} position={[position[0], position[1] + height / 2, position[2]]} castShadow receiveShadow>
      <meshStandardMaterial color="#d6deea" roughness={1} flatShading />
    </mesh>
  );
}

function POIPin({ poi, selected, onSelect }: {
  poi: ScenePOI; selected: boolean; onSelect: () => void;
}) {
  const isAlert = poi.status === "critical";
  const isOffline = poi.status === "offline";
  return (
    <group position={poi.pos} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isAlert && <PulseRing />}
      {selected && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.6, 2.95, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      )}
      <Html position={[0, 2.5, 0]} center distanceFactor={18}>
        <div
          className={`plant-poi ${isAlert ? "crit" : isOffline ? "warn" : "ok"} clickable`}
          onClick={onSelect}
        >
          <div className="plant-poi-dot" />
          <div className="plant-poi-card">
            <div className="plant-poi-name">{poi.name}</div>
            <div className="plant-poi-pwr">{poi.role}</div>
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
