"use client";

import { Fragment, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Sky,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
  Instances,
  Instance,
} from "@react-three/drei";
import {
  EffectComposer,
  N8AO,
  Bloom,
  ToneMapping,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
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
import {
  grassTextures,
  fieldTextures,
  asphaltTextures,
  concreteTextures,
  sandTextures,
  waterNormalMap,
} from "@/lib/three/proceduralTextures";

/* ============================================================
   Unified high-fidelity world.

   Physically-lit outdoor scene: a procedural atmospheric Sky +
   image-based environment lighting for reflections, a single warm
   sun casting soft shadows, PBR materials with procedurally
   generated albedo/normal/roughness on every large surface, true
   planar-reflection water, instanced vegetation, and an ACES post
   stack (AO + bloom + tone mapping + vignette).
   ============================================================ */

interface Props {
  selectedStationId: string | null;
  activeStationId: string | null;
  onSelectStation: (station: Station) => void;
}

type ControlsLike = {
  target: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number };
  update: () => void;
};

/** Sun direction (warm late-afternoon). Shared by the Sky, the shadow-casting
 *  directional light, and the environment sun disc so highlights agree. */
const SUN = new THREE.Vector3(180, 170, 130);
const SKY_HORIZON = "#c4d4e6";

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
        flat
        shadows
        dpr={[1, 2]}
        camera={{ position: [230, 320, 360], fov: 38, near: 1, far: 2400 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMappingExposure = 1.0;
        }}
      >
        {/* Atmosphere */}
        <fog attach="fog" args={[SKY_HORIZON, 460, 1500]} />
        <Sky
          distance={3000}
          sunPosition={[SUN.x, SUN.y, SUN.z]}
          turbidity={6}
          rayleigh={1.2}
          mieCoefficient={0.006}
          mieDirectionalG={0.85}
        />

        {/* Lighting rig */}
        <SunRig />
        <hemisphereLight args={["#bcd4ef", "#5b6e4e", 0.6]} />
        <ambientLight intensity={0.12} />

        {/* Image-based lighting for metal/glass/water reflections (procedural, offline) */}
        <Environment resolution={256} frames={1}>
          <SkyEnvironment />
        </Environment>

        {/* Ground + landscape */}
        <Ground />
        <ReflectiveLake position={[180, -55]} radius={48} />
        <ReflectiveLake position={[-260, -180]} radius={26} />
        <River />
        <Vegetation />
        <MountainRing />

        {/* Roads */}
        <RoadNetwork />

        {/* Central town */}
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
          <SceneActorCard poi={selectedAsPoi} onClose={() => { /* lifecycle owned by StationTeamBrief */ }} />
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
          autoRotateSpeed={0.12}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        <CameraSync controlsRef={controlsRef} />

        {/* Post-processing */}
        <EffectComposer enableNormalPass multisampling={0}>
          <N8AO halfRes color="#0b0e07" aoRadius={6} intensity={2.4} distanceFalloff={1.4} />
          <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.3} intensity={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.32} darkness={0.55} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </section>
  );
}

/* ============================================================
   Lighting
   ============================================================ */
function SunRig() {
  const ref = useRef<THREE.DirectionalLight>(null);
  return (
    <directionalLight
      ref={ref}
      position={[SUN.x, SUN.y, SUN.z]}
      intensity={3.0}
      color="#fff4e0"
      castShadow
      shadow-mapSize={[4096, 4096]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.04}
    >
      <orthographicCamera
        attach="shadow-camera"
        args={[-440, 440, 440, -440, 1, 1200]}
      />
    </directionalLight>
  );
}

/** Procedural environment: a bright warm sun disc, a cool sky dome, and a
 *  soft ground bounce. Gives believable reflections without downloading HDRIs. */
function SkyEnvironment() {
  return (
    <group>
      {/* sky dome — large cool overhead panel */}
      <Lightformer
        intensity={1.1}
        color="#cfe0f2"
        form="rect"
        position={[0, 60, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[200, 200, 1]}
      />
      {/* sun disc — bright warm key, in the sun direction */}
      <Lightformer
        intensity={9}
        color="#fff2da"
        form="circle"
        position={[SUN.x * 0.6, SUN.y * 0.6, SUN.z * 0.6]}
        scale={[34, 34, 1]}
        target={[0, 0, 0]}
      />
      {/* horizon haze band */}
      <Lightformer
        intensity={0.7}
        color="#d8e2ee"
        form="rect"
        position={[0, 14, -120]}
        rotation={[0, 0, 0]}
        scale={[260, 60, 1]}
      />
      {/* ground bounce — warm green up-light */}
      <Lightformer
        intensity={0.35}
        color="#7e8a5a"
        form="rect"
        position={[0, -20, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[200, 200, 1]}
      />
    </group>
  );
}

/* ============================================================
   Camera sync
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
  const grass = grassTextures();
  const field = fieldTextures();

  // A few large field patches break up the lawn (different crop tones).
  const patches = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; rot: number; tone: string }[] = [];
    const TONES = ["#7a8a44", "#8a9a52", "#6f8a40", "#9aa860"];
    let s = 24680;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 10; i++) {
      out.push({
        x: -360 + rand() * 720,
        z: -250 + rand() * 500,
        w: 60 + rand() * 90,
        h: 60 + rand() * 90,
        rot: rand() * Math.PI,
        tone: TONES[Math.floor(rand() * TONES.length)],
      });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Base terrain */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2200, 2200, 1, 1]} />
        <meshStandardMaterial
          map={grass.map}
          normalMap={grass.normalMap}
          roughnessMap={grass.roughnessMap}
          normalScale={new THREE.Vector2(1.1, 1.1)}
          color="#8fa86a"
          envMapIntensity={0.5}
          dithering
        />
      </mesh>

      {/* Crop / field patches */}
      {patches.map((p, i) => (
        <mesh key={i} receiveShadow position={[p.x, 0.015, p.z]} rotation={[-Math.PI / 2, 0, p.rot]}>
          <planeGeometry args={[p.w, p.h]} />
          <meshStandardMaterial
            map={field.map}
            normalMap={field.normalMap}
            roughnessMap={field.roughnessMap}
            color={p.tone}
            transparent
            opacity={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}
    </group>
  );
}

function ReflectiveLake({ position, radius }: { position: [number, number]; radius: number }) {
  const sand = sandTextures();
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* Sandy shoreline */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 1, radius + 7, 64]} />
        <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} color="#cdbb92" />
      </mesh>
      {/* Reflective water surface */}
      <mesh receiveShadow position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 96]} />
        <MeshReflectorMaterial
          resolution={256}
          mixBlur={1}
          mixStrength={4}
          blur={[200, 60]}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.2}
          depthScale={1}
          color="#36617f"
          metalness={0.55}
          roughness={0.22}
          normalMap={waterNormalMap()}
          normalScale={[0.18, 0.18]}
          envMapIntensity={1.0}
        />
      </mesh>
    </group>
  );
}

function River() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = -350 + t * 700;
      const z = 200 - t * 380 + Math.sin(t * Math.PI * 1.5) * 30;
      pts.push(new THREE.Vector3(x, 0.06, z));
    }
    return pts;
  }, []);

  const normal = useMemo(() => {
    const n = waterNormalMap().clone();
    n.needsUpdate = true;
    return n;
  }, []);
  useFrame((_, dt) => {
    normal.offset.x = (normal.offset.x + dt * 0.02) % 1;
    normal.offset.y = (normal.offset.y + dt * 0.012) % 1;
  });

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
          <mesh key={i} receiveShadow position={[mid.x, 0.06, mid.z]} rotation={[-Math.PI / 2, 0, -angle]}>
            <planeGeometry args={[len + 1, 15]} />
            <meshStandardMaterial
              color="#2f5e7c"
              metalness={0.4}
              roughness={0.12}
              normalMap={normal}
              normalScale={new THREE.Vector2(0.5, 0.5)}
              envMapIntensity={1.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- Vegetation: instanced trees ---------- */
function Vegetation() {
  const trees = useMemo(() => {
    const out: { x: number; z: number; scale: number; conifer: boolean; tone: number }[] = [];
    let s = 31415;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 260; i++) {
      const x = -360 + rand() * 720;
      const z = -250 + rand() * 500;
      const inTown = Math.abs(x) < 100 && Math.abs(z) < 80;
      const tooFar = Math.abs(x) > 350 || Math.abs(z) > 240;
      if (inTown || tooFar) continue;
      let nearStation = false;
      for (const st of STATIONS) {
        const dx = x - st.pos[0];
        const dz = z - st.pos[2];
        if (dx * dx + dz * dz < 52 * 52) { nearStation = true; break; }
      }
      if (nearStation) continue;
      const lakeDx = x - 180, lakeDz = z + 55;
      if (lakeDx * lakeDx + lakeDz * lakeDz < 62 * 62) continue;
      out.push({ x, z, scale: 0.85 + rand() * 1.25, conifer: rand() > 0.55, tone: rand() });
    }
    return out;
  }, []);

  const conifers = trees.filter((t) => t.conifer);
  const broadleaf = trees.filter((t) => !t.conifer);
  const greenFor = (t: number) => new THREE.Color().setHSL(0.27 + t * 0.08, 0.45 + t * 0.2, 0.24 + t * 0.1);

  return (
    <group>
      {/* trunks */}
      <Instances limit={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.34, 1, 7]} />
        <meshStandardMaterial color="#5b4327" roughness={0.95} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, t.scale * 1.0, t.z]} scale={[t.scale, t.scale * 2.4, t.scale]} />
        ))}
      </Instances>

      {/* broadleaf canopies — two overlapping icosahedra per tree */}
      <Instances limit={broadleaf.length * 2} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.85} flatShading />
        {broadleaf.map((t, i) => (
          <Fragment key={i}>
            <Instance position={[t.x, t.scale * 3.0, t.z]} scale={[t.scale * 1.9, t.scale * 1.7, t.scale * 1.9]} color={greenFor(t.tone)} />
            <Instance position={[t.x + t.scale * 0.5, t.scale * 3.8, t.z - t.scale * 0.3]} scale={[t.scale * 1.3, t.scale * 1.2, t.scale * 1.3]} color={greenFor(t.tone * 0.7 + 0.15)} />
          </Fragment>
        ))}
      </Instances>

      {/* conifer cones */}
      <Instances limit={conifers.length * 2} castShadow receiveShadow>
        <coneGeometry args={[1, 2.4, 9]} />
        <meshStandardMaterial roughness={0.88} flatShading />
        {conifers.map((t, i) => (
          <Fragment key={i}>
            <Instance position={[t.x, t.scale * 2.6, t.z]} scale={[t.scale * 1.5, t.scale * 1.5, t.scale * 1.5]} color={greenFor(t.tone * 0.6)} />
            <Instance position={[t.x, t.scale * 4.0, t.z]} scale={[t.scale * 1.05, t.scale * 1.2, t.scale * 1.05]} color={greenFor(t.tone * 0.6 + 0.1)} />
          </Fragment>
        ))}
      </Instances>
    </group>
  );
}

function MountainRing() {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number; seed: number }[] = [];
    let s = 91234;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 34; i++) {
      const angle = (i / 34) * Math.PI * 2 + rand() * 0.18;
      const r = 520 + rand() * 110;
      const scale = 70 + rand() * 70;
      out.push({ p: [Math.cos(angle) * r, 0, Math.sin(angle) * r], s: scale, seed: i });
    }
    return out;
  }, []);
  return (
    <group>
      {peaks.map((m, i) => (
        <JaggedPeak key={i} position={m.p} height={m.s} radius={m.s * 0.55} seed={m.seed} />
      ))}
    </group>
  );
}

function JaggedPeak({
  position, height, radius, seed,
}: { position: [number, number, number]; height: number; radius: number; seed: number }) {
  const geometry = useMemo(() => {
    const geom = new THREE.ConeGeometry(radius, height, 11, 7);
    let s = seed * 31 + 1;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const pos = geom.attributes.position;
    const colors: number[] = [];
    const rock = new THREE.Color("#7c8597");
    const grassC = new THREE.Color("#566b41");
    const snow = new THREE.Color("#eef3f8");
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const yNorm = (y + height / 2) / height;
      if (yNorm > 0.04) {
        const r = Math.sqrt(x * x + z * z);
        const a = Math.atan2(z, x);
        const newR = Math.max(0.02, r + (rand() - 0.5) * radius * 0.5 * yNorm);
        const newA = a + (rand() - 0.5) * 0.28 * yNorm;
        x = Math.cos(newA) * newR;
        z = Math.sin(newA) * newR;
        if (yNorm > 0.55) y += (rand() - 0.5) * height * 0.14;
      }
      pos.setX(i, x); pos.setY(i, y); pos.setZ(i, z);
      // vertex colour: grass at base → rock → snow caps
      const c = yNorm < 0.25 ? grassC.clone().lerp(rock, yNorm / 0.25)
        : yNorm < 0.78 ? rock.clone()
          : rock.clone().lerp(snow, (yNorm - 0.78) / 0.22);
      colors.push(c.r, c.g, c.b);
    }
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [height, radius, seed]);
  return (
    <mesh geometry={geometry} position={[position[0], position[1] + height / 2, position[2]]} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} flatShading />
    </mesh>
  );
}

/* ============================================================
   ROADS
   ============================================================ */
function RoadNetwork() {
  return (
    <group>
      <RoadSegment from={[-380, 0]} to={[380, 0]} width={8} />
      <RoadSegment from={[0, -250]} to={[0, 250]} width={8} />
      {STATIONS.map((s, i) => {
        const [sx, , sz] = s.pos;
        const towardX = Math.abs(sx) > Math.abs(sz);
        const elbow: [number, number] = towardX ? [sx, 0] : [0, sz];
        return (
          <group key={i}>
            <RoadSegment from={[0, 0]} to={elbow} width={5} />
            <RoadSegment from={elbow} to={[sx, sz]} width={5} />
          </group>
        );
      })}
    </group>
  );
}

function RoadSegment({ from, to, width }: { from: [number, number]; to: [number, number]; width: number }) {
  const asphalt = asphaltTextures();
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 1) return null;
  const angle = Math.atan2(dz, dx);
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  return (
    <group position={[mid[0], 0.07, mid[1]]} rotation={[0, -angle, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[len, width]} />
        <meshStandardMaterial
          map={asphalt.map}
          normalMap={asphalt.normalMap}
          roughnessMap={asphalt.roughnessMap}
          color="#6a6f78"
          normalScale={new THREE.Vector2(0.8, 0.8)}
        />
      </mesh>
      {Array.from({ length: Math.max(2, Math.floor(len / 5)) }).map((_, i) => {
        const fraction = (i + 0.5) / Math.max(2, Math.floor(len / 5));
        return (
          <mesh key={i} position={[-len / 2 + fraction * len, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.6, 0.18]} />
            <meshStandardMaterial color="#d9b41f" roughness={0.6} emissive="#3a2f06" emissiveIntensity={0.2} />
          </mesh>
        );
      })}
      {[width / 2 - 0.25, -width / 2 + 0.25].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, 0.15]} />
          <meshStandardMaterial color="#cdd2d8" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   Shared material helpers
   ============================================================ */
function ConcretePad({ w, d, tint = "#c4c8cd" }: { w: number; d: number; tint?: string }) {
  const concrete = concreteTextures();
  return (
    <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial
        map={concrete.map}
        normalMap={concrete.normalMap}
        roughnessMap={concrete.roughnessMap}
        color={tint}
        normalScale={new THREE.Vector2(0.6, 0.6)}
      />
    </mesh>
  );
}

/** Reflective architectural glass band. */
function GlassMaterial({ tint = "#22384c" }: { tint?: string }) {
  return (
    <meshPhysicalMaterial
      color={tint}
      roughness={0.08}
      metalness={0.0}
      clearcoat={1}
      clearcoatRoughness={0.06}
      envMapIntensity={1.8}
      emissive="#3f6890"
      emissiveIntensity={0.12}
    />
  );
}

/* ============================================================
   TOWN
   ============================================================ */
function Town({ center }: { center: [number, number] }) {
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string; r: number }[] = [];
    const ROOFS = ["#9a3322", "#7a3410", "#0e6074", "#3f4b5c", "#6a2410", "#1f4ba8", "#8a6410"];
    const WALLS = ["#efe3c2", "#e8d6a8", "#dcdad4", "#f2ead6", "#e3e8ee", "#ecd6b6"];
    let s = 13579;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const QUADRANTS: [number, number, number, number][] = [
      [-90, 8, 4, 3], [-90, -65, 4, 3], [12, 8, 4, 3], [12, -65, 4, 3],
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
      {[-60, -40, -22, 22, 40, 60].map((x, i) => (
        <Shop key={`shop-${i}`} x={x} z={28} />
      ))}
      {/* Town square plaza */}
      <ConcretePadAt position={[0, 0.05, 0]} w={28} d={28} round tint="#cfc4a4" />
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 3.2, 12]} />
        <meshStandardMaterial color="#9aa1ab" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <sphereGeometry args={[0.65, 24, 24]} />
        <meshStandardMaterial color="#c9a85a" metalness={0.85} roughness={0.25} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

function ConcretePadAt({ position, w, d, round = false, tint = "#c4c8cd" }: {
  position: [number, number, number]; w: number; d: number; round?: boolean; tint?: string;
}) {
  const concrete = concreteTextures();
  return (
    <mesh receiveShadow position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {round ? <circleGeometry args={[w / 2, 48]} /> : <planeGeometry args={[w, d]} />}
      <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughnessMap={concrete.roughnessMap} color={tint} normalScale={new THREE.Vector2(0.5, 0.5)} />
    </mesh>
  );
}

function TownHouse({ x, z, w, d, h, roof, wall, r }: {
  x: number; z: number; w: number; d: number; h: number; roof: string; wall: string; r: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.18} smoothness={3} position={[0, h / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={wall} roughness={0.9} envMapIntensity={0.6} />
      </RoundedBox>
      {/* Pitched roof */}
      <mesh position={[0, h + 1.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.78, 2.6, 4]} />
        <meshStandardMaterial color={roof} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Chimney */}
      <mesh position={[w / 4, h + 1.8, d / 6]} castShadow>
        <boxGeometry args={[0.7, 1.6, 0.7]} />
        <meshStandardMaterial color="#6a5040" roughness={0.95} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, d / 2 + 0.03]} castShadow>
        <boxGeometry args={[0.9, 2.0, 0.1]} />
        <meshStandardMaterial color="#3a1605" roughness={0.7} />
      </mesh>
      {/* Windows */}
      {[-w / 3, w / 3].map((wx) => (
        <mesh key={wx} position={[wx, h / 2 + 0.5, d / 2 + 0.03]}>
          <boxGeometry args={[1.0, 0.9, 0.06]} />
          <GlassMaterial tint="#2a4258" />
        </mesh>
      ))}
    </group>
  );
}

function Shop({ x, z }: { x: number; z: number }) {
  const colours = ["#e08e16", "#2f72c4", "#0f9f6e", "#d63b3b", "#9c4bd4", "#15a99a"];
  const wall = colours[Math.abs(Math.floor(x + z)) % colours.length];
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[10, 4.4, 7]} radius={0.2} smoothness={3} position={[0, 2.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={wall} roughness={0.7} envMapIntensity={0.6} />
      </RoundedBox>
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[10.4, 0.3, 7.4]} />
        <meshStandardMaterial color="#2a3340" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 3.0, 3.7]} castShadow>
        <boxGeometry args={[10, 0.15, 0.8]} />
        <meshStandardMaterial color="#c41f1f" roughness={0.6} />
      </mesh>
      <mesh position={[-2, 1.4, 3.58]}>
        <boxGeometry args={[1.4, 2.6, 0.06]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[1.5, 2.0, 3.58]}>
        <boxGeometry args={[4.5, 1.8, 0.06]} />
        <GlassMaterial tint="#9ad0e6" />
      </mesh>
    </group>
  );
}

/* ============================================================
   STATION COMPOSITES
   ============================================================ */
function CommandCenter({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <ConcretePad w={42} d={36} tint="#bcc1c7" />
      <RoundedBox args={[20, 9, 14]} radius={0.5} smoothness={4} position={[0, 4.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e6ecf3" roughness={0.55} metalness={0.1} envMapIntensity={0.9} />
      </RoundedBox>
      <mesh position={[0, 9.3, 0]} castShadow>
        <boxGeometry args={[20.6, 0.5, 14.6]} />
        <meshStandardMaterial color="#1c3470" metalness={0.5} roughness={0.4} envMapIntensity={1.1} />
      </mesh>
      {[2.2, 5.8].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[20.1, 1.0, 14.1]} />
          <GlassMaterial tint="#244763" />
        </mesh>
      ))}
      {/* Antenna mast */}
      <mesh position={[6, 14, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 10, 12]} />
        <meshStandardMaterial color="#4a5563" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[6, 19.4, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* Satellite dish */}
      <group position={[-7, 10, -5]} rotation={[Math.PI / 6, Math.PI / 5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8ebef" side={THREE.DoubleSide} metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      {/* Flagpole */}
      <mesh position={[-8, 5, 7]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 10, 8]} />
        <meshStandardMaterial color="#9aa6b4" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-7.4, 9.4, 7]}>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#d62828" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <ParkingPad position={[0, 11]} w={18} d={8} />
    </group>
  );
}

function ParkingPad({ position, w, d }: { position: [number, number]; w: number; d: number }) {
  const asphalt = asphaltTextures();
  return (
    <mesh position={[position[0], 0.07, position[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={asphalt.map} normalMap={asphalt.normalMap} roughnessMap={asphalt.roughnessMap} color="#5e636c" />
    </mesh>
  );
}

function PowerTower({ pos }: { pos: [number, number, number] }) {
  const steel = { color: "#566173", metalness: 0.85, roughness: 0.4 } as const;
  return (
    <group position={pos}>
      <ConcretePad w={18} d={18} tint="#b6ac8e" />
      {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 13, dz]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 26, 8]} />
          <meshStandardMaterial {...steel} envMapIntensity={1.1} />
        </mesh>
      ))}
      {[8, 16, 22].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh castShadow><boxGeometry args={[8, 0.25, 0.25]} /><meshStandardMaterial {...steel} /></mesh>
          <mesh castShadow><boxGeometry args={[0.25, 0.25, 8]} /><meshStandardMaterial {...steel} /></mesh>
          {[-3.5, 0, 3.5].map((dx) => (
            <mesh key={dx} position={[dx, -0.6, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.9, 10]} />
              <meshStandardMaterial color="#e8edf2" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 26.5, 0]} castShadow>
        <cylinderGeometry args={[0, 0.5, 1.5, 4]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, 27.6, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {[8, 16, 22].map((y) =>
        [-3.5, 3.5].map((dx, i) => (
          <mesh key={`${y}-${i}`} position={[dx, y - 0.55, 30]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 60, 6]} />
            <meshStandardMaterial color="#11161f" roughness={0.6} />
          </mesh>
        )),
      )}
    </group>
  );
}

function PowerStation({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <ConcretePad w={56} d={42} tint="#b9aa82" />
      <RoundedBox args={[20, 7, 12]} radius={0.4} smoothness={4} position={[-12, 3.5, 10]} castShadow receiveShadow>
        <meshStandardMaterial color="#cdd5e0" roughness={0.6} envMapIntensity={0.8} />
      </RoundedBox>
      <mesh position={[-12, 7.2, 10]} castShadow>
        <boxGeometry args={[20.4, 0.4, 12.4]} />
        <meshStandardMaterial color="#1c3470" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Red/white smokestack */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-22, i * 3.2 + 1.6, 14]} castShadow>
          <cylinderGeometry args={[1.4, 1.5, 3.2, 24]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#f1f4f8" : "#cc2222"} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
      <SteamPuff position={[-22, 21, 14]} />
      {/* Transformer yard */}
      {[-10, -3, 4, 11, 18].map((dx, i) => (
        <group key={i} position={[dx, 0, -7]}>
          <RoundedBox args={[3.4, 3.6, 2.6]} radius={0.15} smoothness={3} position={[0, 1.8, 0]} castShadow>
            <meshStandardMaterial color="#444c57" metalness={0.7} roughness={0.45} envMapIntensity={1.0} />
          </RoundedBox>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 10]} />
            <meshStandardMaterial color="#e8edf2" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {[-14, 22].map((dx) => (
        <mesh key={dx} position={[dx, 5.5, -7]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 11, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[4, 10.5, -7]}><boxGeometry args={[38, 0.25, 0.4]} /><meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.4} /></mesh>
      {/* Cooling pond */}
      <mesh receiveShadow position={[18, 0.12, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial color="#2f5e7c" metalness={0.4} roughness={0.15} normalMap={waterNormalMap()} normalScale={new THREE.Vector2(0.4, 0.4)} envMapIntensity={1.3} />
      </mesh>
    </group>
  );
}

function SteamPuff({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><sphereGeometry args={[1.6, 16, 16]} /><meshStandardMaterial color="#eef2f6" transparent opacity={0.5} roughness={1} /></mesh>
      <mesh position={[0.6, 1.2, 0.4]}><sphereGeometry args={[1.0, 14, 14]} /><meshStandardMaterial color="#eef2f6" transparent opacity={0.38} roughness={1} /></mesh>
      <mesh position={[-0.5, 2.0, -0.3]}><sphereGeometry args={[0.8, 12, 12]} /><meshStandardMaterial color="#eef2f6" transparent opacity={0.28} roughness={1} /></mesh>
    </group>
  );
}

function SolarPanelMaterial() {
  return (
    <meshPhysicalMaterial
      color="#0a1730"
      metalness={0.2}
      roughness={0.08}
      clearcoat={1}
      clearcoatRoughness={0.08}
      envMapIntensity={1.7}
      emissive="#13294a"
      emissiveIntensity={0.18}
    />
  );
}

function SolarFarm({ pos }: { pos: [number, number, number] }) {
  const ROWS = 5, COLS = 8, PITCH_X = 7, PITCH_Z = 6;
  return (
    <group position={pos}>
      <ConcretePad w={COLS * PITCH_X + 12} d={ROWS * PITCH_Z + 16} tint="#b7c096" />
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          const x = -(COLS - 1) * PITCH_X / 2 + c * PITCH_X;
          const z = -(ROWS - 1) * PITCH_Z / 2 + r * PITCH_Z;
          return (
            <group key={`${r}-${c}`} position={[x, 0, z]}>
              {[-2, 2].map((dx) => (
                <mesh key={dx} position={[dx, 0.9, 0]} castShadow>
                  <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
                  <meshStandardMaterial color="#3a4452" metalness={0.7} roughness={0.4} />
                </mesh>
              ))}
              <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 9, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.5, 0.12, 3.0]} />
                <SolarPanelMaterial />
              </mesh>
              {/* cell grid lines */}
              <mesh position={[0, 1.69, 0]} rotation={[Math.PI / 9, 0, 0]}>
                <boxGeometry args={[5.55, 0.01, 3.05]} />
                <meshStandardMaterial color="#1a2c4a" roughness={0.5} wireframe />
              </mesh>
            </group>
          );
        }),
      )}
      {/* Inverters */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = -12 + i * 8;
        const z = (ROWS - 1) * PITCH_Z / 2 + 7;
        return (
          <group key={i} position={[x, 0, z]}>
            <RoundedBox args={[3.4, 2.4, 2.2]} radius={0.12} smoothness={3} position={[0, 1.2, 0]} castShadow>
              <meshStandardMaterial color="#3b6ea5" metalness={0.5} roughness={0.4} envMapIntensity={0.9} />
            </RoundedBox>
            <mesh position={[0, 2.5, 0]} castShadow><boxGeometry args={[3.6, 0.18, 2.4]} /><meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.6} /></mesh>
          </group>
        );
      })}
      {/* Operator hut */}
      <group position={[-(COLS - 1) * PITCH_X / 2 - 12, 0, -(ROWS - 1) * PITCH_Z / 2 - 4]}>
        <RoundedBox args={[6, 3, 5]} radius={0.2} smoothness={3} position={[0, 1.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e3e1dc" roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, 3.2, 0]} castShadow><boxGeometry args={[6.2, 0.3, 5.2]} /><meshStandardMaterial color="#475569" metalness={0.3} roughness={0.6} /></mesh>
      </group>
    </group>
  );
}

function SolarHouse({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <ConcretePad w={26} d={22} tint="#9bbf83" />
      <RoundedBox args={[9, 6, 8]} radius={0.2} smoothness={4} position={[0, 3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f2dca0" roughness={0.85} envMapIntensity={0.6} />
      </RoundedBox>
      <mesh position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[7, 2.6, 4]} />
        <meshStandardMaterial color="#7a3410" roughness={0.85} />
      </mesh>
      {/* rooftop PV */}
      <mesh position={[0, 7.0, 2.0]} rotation={[Math.PI / 5, 0, 0]} castShadow>
        <boxGeometry args={[7, 0.14, 3.2]} />
        <SolarPanelMaterial />
      </mesh>
      <mesh position={[0, 1.4, 4.06]} castShadow>
        <boxGeometry args={[1.4, 2.8, 0.1]} />
        <meshStandardMaterial color="#3a1605" roughness={0.7} />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 3.4, 4.06]}>
          <boxGeometry args={[1.4, 1.4, 0.06]} />
          <GlassMaterial tint="#2a4258" />
        </mesh>
      ))}
      <RoundedBox args={[0.8, 2.6, 1.6]} radius={0.08} smoothness={2} position={[5.2, 1.3, 0]} castShadow>
        <meshStandardMaterial color="#3b6ea5" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* garden trees */}
      {[[-6, 7], [6, 7]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.0, 8]} />
            <meshStandardMaterial color="#5b4327" roughness={0.95} />
          </mesh>
          <mesh position={[0, 3.0, 0]} castShadow>
            <icosahedronGeometry args={[1.5, 1]} />
            <meshStandardMaterial color="#3a7a4e" roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   STATION PIN
   ============================================================ */
function StationPin({ station, selected, active, onSelect }: {
  station: Station; selected: boolean; active: boolean; onSelect: () => void;
}) {
  const tint = STATION_TYPE_TINT[station.type];
  const isCritical = station.status === "critical";
  return (
    <group
      position={[station.pos[0], station.pos[1], station.pos[2]]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {isCritical && <PulseRing colour="#ef4444" />}
      {selected && (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6, 7, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      )}
      {active && !selected && (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5, 5.6, 48]} />
          <meshBasicMaterial color={tint} transparent opacity={0.5} toneMapped={false} />
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
      <meshBasicMaterial color={colour} transparent opacity={0.8} toneMapped={false} />
    </mesh>
  );
}
