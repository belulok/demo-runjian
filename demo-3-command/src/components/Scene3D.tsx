import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PLANTS } from '../data';
import type { Plant } from '../types';

/* ============================================================
   Actor click → info card + action buttons
   ============================================================ */
type ActorKind = 'drone' | 'helicopter' | 'vehicle' | 'person' | 'building';

interface ActorInfo {
  kind: ActorKind;
  id: string;
  name: string;
  role: string;
  status: string;
  meta: Record<string, string>;
  /** Optional — for static actors (buildings) to anchor a global card. */
  position?: [number, number, number];
}

const ACTIONS_BY_KIND: Record<ActorKind, { id: string; label: string; icon: string; destructive?: boolean }[]> = {
  drone: [
    { id: 'track',   label: 'Track',         icon: '📍' },
    { id: 'recall',  label: 'Recall',        icon: '↩' },
    { id: 'stream',  label: 'Live Stream',   icon: '📺' },
    { id: 'thermal', label: 'Thermal Sweep', icon: '🌡' },
  ],
  helicopter: [
    { id: 'track',  label: 'Track',         icon: '📍' },
    { id: 'recall', label: 'Recall',        icon: '↩' },
    { id: 'stream', label: 'Live Stream',   icon: '📺' },
  ],
  vehicle: [
    { id: 'track',    label: 'Track',    icon: '📍' },
    { id: 'recall',   label: 'Recall',   icon: '↩' },
    { id: 'contact',  label: 'Contact',  icon: '📞' },
    { id: 'dispatch', label: 'Re-route', icon: '🚐' },
  ],
  person: [
    { id: 'message',  label: 'Message',  icon: '💬' },
    { id: 'locate',   label: 'Locate',   icon: '📍' },
    { id: 'reassign', label: 'Reassign', icon: '↪' },
    { id: 'wearable', label: 'Wearable', icon: '⌚' },
  ],
  building: [
    { id: 'inspect',     label: 'Inspect',     icon: '🔎' },
    { id: 'status',      label: 'Status',      icon: '📊' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ],
};

/** Reusable HTML popover anchored to an actor in 3D space. */
function ActorCard({ actor, onAction, onClose }: { actor: ActorInfo; onAction: (id: string) => void; onClose: () => void }) {
  const actions = ACTIONS_BY_KIND[actor.kind] ?? [];
  return (
    <div className="scene-actor-card" onPointerDown={(e) => e.stopPropagation()}>
      <header>
        <div className="sac-name">{actor.name}</div>
        <button className="sac-x" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="sac-role">{actor.role}</div>
      <div className="sac-status"><span className="sac-dot"/>{actor.status}</div>
      <div className="sac-meta">
        {Object.entries(actor.meta).slice(0, 4).map(([k, v]) => (
          <div key={k}><span>{k}</span><strong>{v}</strong></div>
        ))}
      </div>
      <div className="sac-actions">
        {actions.map(a => (
          <button key={a.id} className={a.destructive ? 'destructive' : ''} onClick={() => onAction(a.id)}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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

export function Scene3D({ selectedPlantId, onSelectPlant, onPeekAction, actionBar }: Props) {
  const [selectedActor, setSelectedActor] = useState<ActorInfo | null>(null);

  const handleActorAction = (action: string) => {
    if (!selectedActor) return;
    onPeekAction?.(`actor.${action}`, `${selectedActor.kind}:${selectedActor.id}`);
  };

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

        {/* Ground — extra-wide to host the expanded multi-district city */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[500, 100, '#cbd6e2', '#dde6f0']} position={[0, 0.01, 0]} />

        {/* River */}
        <mesh receiveShadow position={[-44, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 180]} />
          <meshStandardMaterial color="#7da6c6" transparent opacity={.85} />
        </mesh>

        <Mountains />
        {/* MEGA CITY — multi-district urban environment surrounding the compound */}
        <CitySkyline />
        <SouthCity />
        <EastCity />
        <CommercialDistrict />
        <HousingDistrict />
        <SuburbBelt />
        <IndustrialZone />
        <FarmsAndFields />
        <WindFarm origin={[-38, 0, -34]} />
        <WindFarm origin={[ 38, 0, -34]} />
        <WindFarm origin={[ 60, 0,  10]} />
        <WindFarm origin={[-80, 0,  40]} />
        <WindFarm origin={[ 80, 0,  68]} />

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
        {/* Solar farms — 20+ ground-mounted arrays + rooftop solar on low buildings */}
        {/* Inside compound */}
        <SolarFarm origin={[-12, 0, -10]} cols={8}  rows={6} />
        <SolarFarm origin={[ 12, 0, -10]} cols={8}  rows={6} />
        <SolarFarm origin={[  0, 0,  18]} cols={12} rows={4} />
        <SolarFarm origin={[-46, 0,   6]} cols={6}  rows={4} />
        <SolarFarm origin={[ 46, 0, -10]} cols={6}  rows={4} />
        {/* Mid-perimeter */}
        <SolarFarm origin={[-60, 0, -22]} cols={6}  rows={4} />
        <SolarFarm origin={[ 58, 0,  20]} cols={6}  rows={4} />
        <SolarFarm origin={[  0, 0,  44]} cols={10} rows={3} />
        <SolarFarm origin={[ 30, 0,  40]} cols={5}  rows={3} />
        <SolarFarm origin={[-30, 0,  44]} cols={5}  rows={3} />
        {/* Outer rings — far-out solar fields */}
        <SolarFarm origin={[-110, 0,  10]} cols={8}  rows={5} />
        <SolarFarm origin={[ 110, 0,  50]} cols={8}  rows={5} />
        <SolarFarm origin={[-90,  0,  60]} cols={7}  rows={4} />
        <SolarFarm origin={[ 90,  0, -50]} cols={7}  rows={4} />
        <SolarFarm origin={[  0,  0,  80]} cols={14} rows={3} />
        <SolarFarm origin={[ 50,  0,  90]} cols={5}  rows={3} />
        <SolarFarm origin={[-50,  0,  90]} cols={5}  rows={3} />
        <SolarFarm origin={[-130, 0, -30]} cols={6}  rows={3} />
        <SolarFarm origin={[ 130, 0,  -8]} cols={6}  rows={3} />

        {/* Transmission towers — ring around the compound + outer relay towers */}
        <TxTower position={[-22, 0, -28]} />
        <TxTower position={[ 22, 0, -28]} />
        <TxTower position={[-22, 0,  20]} />
        <TxTower position={[ 22, 0,  20]} />
        <TxTower position={[-46, 0, -10]} />
        <TxTower position={[ 46, 0,  10]} />
        <TxTower position={[ -8, 0,  38]} />
        <TxTower position={[  8, 0,  38]} />
        {/* Outer relay towers */}
        <TxTower position={[-80, 0, -40]} />
        <TxTower position={[ 80, 0, -40]} />
        <TxTower position={[-100, 0,  30]} />
        <TxTower position={[ 100, 0,  30]} />
        <TxTower position={[  0, 0,  62]} />
        <TxTower position={[  0, 0, -50]} />

        {/* 3 drones + 1 helicopter — each clickable with its own metadata */}
        {([
          { id: 'DRONE-01', radius: 30, altitude: 12, speed: 0.18, color: '#1f2937', ringColor: '#67e8f9', phase: 0,
            name: 'DRONE-01', role: 'Recon Drone', status: 'Sweeping · Battery 78%',
            meta: { Altitude: '40m', Speed: '12 m/s', Camera: '4K + thermal', Mission: 'Penang pre-inspect' } },
          { id: 'DRONE-02', radius: 42, altitude: 16, speed: 0.12, color: '#374151', ringColor: '#a5f3fc', phase: 1.8,
            name: 'DRONE-02', role: 'Perimeter Drone', status: 'Patrol · Battery 64%',
            meta: { Altitude: '55m', Speed: '9 m/s', Camera: '4K + LiDAR', Mission: 'Outer fence' } },
          { id: 'DRONE-03', radius: 22, altitude: 9, speed: 0.26, color: '#0f172a', ringColor: '#5eead4', phase: 3.2,
            name: 'DRONE-03', role: 'Inspection Drone', status: 'Low-altitude · Battery 91%',
            meta: { Altitude: '15m', Speed: '6 m/s', Camera: 'Macro + IR', Mission: 'Inverter scan' } },
        ] as const).map((d) => (
          <Drone key={d.id} {...d}
            actorInfo={{ kind: 'drone', id: d.id, name: d.name, role: d.role, status: d.status, meta: d.meta }}
            selectedId={selectedActor?.id ?? null}
            onSelect={setSelectedActor}
            onClose={() => setSelectedActor(null)}
            onAction={handleActorAction}
          />
        ))}
        <Helicopter
          actorInfo={{ kind: 'helicopter', id: 'HELI-02', name: 'HELI-02', role: 'Survey Helicopter',
            status: 'Aerial photogrammetry', meta: { Pilot: 'Capt. Yi', Fuel: '74%', Altitude: '120m', Mission: 'NDVI scan' } }}
          selectedId={selectedActor?.id ?? null}
          onSelect={setSelectedActor}
          onClose={() => setSelectedActor(null)}
          onAction={handleActorAction}
        />

        {/* Ground vehicles removed — they looked like floating cars
            since there are no visible roads underneath them. */}

        {/* 8 walking people on small idle loops */}
        {([
          { id: 'PERSON-01', path: 'person-1', speed: 0.35, color: '#3b82f6', hat: '#1e40af', name: 'Chen Wei',    role: 'L3 Field Technician', status: 'Walking · Kedah yard',    meta: { Role: 'Senior Tech', Wearable: 'ONLINE', Heartrate: '72bpm', Battery: '88%' } },
          { id: 'PERSON-02', path: 'person-2', speed: 0.4,  color: '#dc2626', hat: '#7f1d1d', name: 'Li Na',       role: 'Field Technician',    status: 'Walking · Penang yard',   meta: { Role: 'L2 Tech', Wearable: 'ONLINE', Heartrate: '70bpm', Battery: '92%' } },
          { id: 'PERSON-03', path: 'person-3', speed: 0.32, color: '#10b981', hat: '#065f46', name: 'Wang Min',    role: 'Engineer',            status: 'Walking · Perak yard',    meta: { Role: 'Engineer L3', Wearable: 'ONLINE', Heartrate: '74bpm', Battery: '81%' } },
          { id: 'PERSON-04', path: 'person-4', speed: 0.38, color: '#f59e0b', hat: '#92400e', name: 'Zhou Qiang',  role: 'Warehouse Lead',      status: 'Walking · Melaka',        meta: { Role: 'Warehouse', Wearable: 'ONLINE', Stop: 'Warehouse B' } },
          { id: 'PERSON-05', path: 'person-5', speed: 0.42, color: '#8b5cf6', hat: '#5b21b6', name: 'Crew Alpha',  role: 'Inspection Team',     status: 'Walking · Johor',         meta: { Lead: 'Chen Wei', Member: 'Li Na', SOP: 'PV-SOP-014' } },
          { id: 'PERSON-06', path: 'person-6', speed: 0.3,  color: '#3b82f6', hat: '#1e40af', name: 'Site Manager',role: 'Operations Manager',  status: 'Walking · Central admin', meta: { Office: 'Block C', Phone: 'available' } },
          { id: 'PERSON-07', path: 'person-7', speed: 0.36, color: '#ffffff', hat: '#374151', name: 'Tech Bravo',  role: 'Field Technician',    status: 'Walking · Carpark A',     meta: { Role: 'L2 Tech', Wearable: 'ONLINE' } },
          { id: 'PERSON-08', path: 'person-8', speed: 0.34, color: '#06b6d4', hat: '#0e7490', name: 'Tech Charlie',role: 'Field Technician',    status: 'Walking · Carpark B',     meta: { Role: 'L2 Tech', Wearable: 'ONLINE' } },
        ] as const).map((p) => (
          <Person key={p.id} path={p.path} speed={p.speed} color={p.color} hat={p.hat}
            actorInfo={{ kind: 'person', id: p.id, name: p.name, role: p.role, status: p.status, meta: p.meta }}
            selectedId={selectedActor?.id ?? null}
            onSelect={setSelectedActor}
            onClose={() => setSelectedActor(null)}
            onAction={handleActorAction}
          />
        ))}

        {/* Buildings/landmarks — clickable POIs (open an info card with actions) */}
        {([
          { pos: [  0, 22,   0], id: 'admin-tower',  name: 'Admin Tower',   role: 'Operations HQ',       status: 'Online',         meta: { Floors: '6', Staff: '42', Power: '180 kW', Backup: '8h UPS' } },
          { pos: [  0,  4,  10], id: 'battery-bank', name: 'Battery Bank',  role: 'Energy Storage',       status: 'Charging · 64%', meta: { Capacity: '12 MWh', Cells: '480', Temp: '32°C', Status: 'Warning' }, warn: true },
          { pos: [-22, 14, -28], id: 'tx-a',         name: 'TX Tower A',    role: 'Transmission Tower',   status: 'Nominal',        meta: { Voltage: '275 kV', Load: '78%', Phase: '3φ' } },
          { pos: [ 22, 14, -28], id: 'tx-b',         name: 'TX Tower B',    role: 'Transmission Tower',   status: 'Nominal',        meta: { Voltage: '275 kV', Load: '71%', Phase: '3φ' } },
          { pos: [-38, 9, -34],  id: 'wind-a',       name: 'Wind Farm A',   role: 'Wind Farm',            status: '3/3 turbines OK', meta: { Output: '4.2 MW', Wind: '8 m/s NE' } },
          { pos: [ 38, 9, -34],  id: 'wind-b',       name: 'Wind Farm B',   role: 'Wind Farm',            status: '3/3 turbines OK', meta: { Output: '4.0 MW', Wind: '7 m/s NE' } },
          { pos: [ 60, 9,  10],  id: 'wind-c',       name: 'Wind Farm C',   role: 'Wind Farm',            status: '3/3 turbines OK', meta: { Output: '3.8 MW', Wind: '6 m/s NE' } },
          { pos: [-32, 4, 10],   id: 'carpark-a',    name: 'Carpark A',     role: 'Carpark',              status: '76% occupancy',   meta: { Spaces: '160', EV: '24', Free: '38' } },
          { pos: [ 32, 4, 10],   id: 'carpark-b',    name: 'Carpark B',     role: 'Carpark',              status: '82% occupancy',   meta: { Spaces: '160', EV: '24', Free: '28' } },
        ] as const).map((b) => (
          <Html key={b.id} position={b.pos as [number, number, number]} center distanceFactor={20}>
            <Poi
              label={b.name}
              status={(b as any).warn ? 'warn' : 'ok'}
              onClick={() => setSelectedActor({
                kind: 'building',
                id: b.id,
                name: b.name,
                role: b.role,
                status: b.status,
                meta: b.meta as Record<string, string>,
                position: b.pos as [number, number, number],
              })}
            />
          </Html>
        ))}
        <Html position={[ 50, 28, -50]} center distanceFactor={20}><Poi label="Downtown" /></Html>
        <Html position={[  0, 32, 110]} center distanceFactor={20}><Poi label="South City" /></Html>
        <Html position={[120, 26,  18]} center distanceFactor={20}><Poi label="East City" /></Html>
        <Html position={[  0, 14,  62]} center distanceFactor={20}><Poi label="Commercial District" /></Html>
        <Html position={[-62,  5,   8]} center distanceFactor={20}><Poi label="West Housing" /></Html>
        <Html position={[ 60,  5,  36]} center distanceFactor={20}><Poi label="East Housing" /></Html>
        <Html position={[-100, 5,  90]} center distanceFactor={20}><Poi label="SW Suburbs" /></Html>
        <Html position={[ 110, 5, -70]} center distanceFactor={20}><Poi label="NE Suburbs" /></Html>
        <Html position={[-58, 14,  34]} center distanceFactor={20}><Poi label="Warehouse Park" /></Html>
        <Html position={[ 66, 10, -16]} center distanceFactor={20}><Poi label="Container Yard" /></Html>
        <Html position={[-110, 4,  10]} center distanceFactor={20}><Poi label="Solar Field A" /></Html>
        <Html position={[ 110, 4,  50]} center distanceFactor={20}><Poi label="Solar Field B" /></Html>
        <Html position={[   0, 4,  80]} center distanceFactor={20}><Poi label="Solar Field C" /></Html>

        {/* Building info card — rendered globally because buildings are static
            and have no animated group to embed the card in. */}
        {selectedActor?.kind === 'building' && selectedActor.position && (
          <Html position={[selectedActor.position[0], selectedActor.position[1] + 2.5, selectedActor.position[2]]}
                center distanceFactor={14} zIndexRange={[100, 0]}>
            <ActorCard actor={selectedActor}
              onAction={handleActorAction}
              onClose={() => setSelectedActor(null)}/>
          </Html>
        )}

        <OrbitControls
          target={[0, 4, 0]}
          enableDamping
          minDistance={30}
          maxDistance={140}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate={!selectedActor}
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {actionBar}
    </section>
  );
}

function Poi({ label, status = 'ok', onClick }: { label: string; status?: 'ok' | 'warn' | 'crit'; onClick?: () => void }) {
  return (
    <div
      className={`scene-poi scene-poi-${status} ${onClick ? 'clickable' : ''}`}
      onPointerDown={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}
    >
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
  actorInfo, selectedId, onSelect, onClose, onAction,
}: {
  radius?: number; altitude?: number; speed?: number;
  color?: string; ringColor?: string; phase?: number;
  actorInfo: ActorInfo;
  selectedId: string | null;
  onSelect: (info: ActorInfo) => void;
  onClose: () => void;
  onAction: (id: string) => void;
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
  const isSel = selectedId === actorInfo.id;
  return (
    <>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.3}>
        <group ref={drone} onClick={(e) => { e.stopPropagation(); onSelect(actorInfo); }}>
          <mesh castShadow>
            <boxGeometry args={[1, .3, 1]} />
            <meshStandardMaterial color={color} emissive={isSel ? '#fbbf24' : '#000'} emissiveIntensity={isSel ? .4 : 0}/>
          </mesh>
          {[[-0.7, 0, -0.7], [0.7, 0, -0.7], [-0.7, 0, 0.7], [0.7, 0, 0.7]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.5, 24]} />
              <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={.7} transparent opacity={.55} />
            </mesh>
          ))}
          {isSel && (
            <Html position={[0, 1.5, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
              <ActorCard actor={actorInfo} onAction={onAction} onClose={onClose} />
            </Html>
          )}
        </group>
      </Float>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={.32}/>
      </mesh>
    </>
  );
}

function Helicopter({ actorInfo, selectedId, onSelect, onClose, onAction }: {
  actorInfo: ActorInfo; selectedId: string | null;
  onSelect: (info: ActorInfo) => void; onClose: () => void; onAction: (id: string) => void;
}) {
  const heli = useRef<THREE.Group>(null);
  const blades = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const isSel = selectedId === actorInfo.id;
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
      <group ref={heli} onClick={(e) => { e.stopPropagation(); onSelect(actorInfo); }}>
        {/* body */}
        <mesh castShadow>
          <capsuleGeometry args={[0.6, 1.6, 6, 12]} />
          <meshStandardMaterial color="#fb923c" metalness={.4} roughness={.5} emissive={isSel ? '#fbbf24' : '#000'} emissiveIntensity={isSel ? .35 : 0}/>
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
        {isSel && (
          <Html position={[0, 2.5, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
            <ActorCard actor={actorInfo} onAction={onAction} onClose={onClose} />
          </Html>
        )}
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={.28}/>
      </mesh>
    </>
  );
}

function Vehicle({ path, speed, color, phase = 0, actorInfo, selectedId, onSelect, onClose, onAction }: {
  path: 'loop-a' | 'loop-b' | 'loop-c'; speed: number; color: string; phase?: number;
  actorInfo: ActorInfo; selectedId: string | null;
  onSelect: (info: ActorInfo) => void; onClose: () => void; onAction: (id: string) => void;
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

  const isSel = selectedId === actorInfo.id;
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(actorInfo); }}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.7, 0.9]} />
        <meshStandardMaterial color={color} metalness={.5} roughness={.4} emissive={isSel ? '#fbbf24' : '#000'} emissiveIntensity={isSel ? .35 : 0}/>
      </mesh>
      <mesh position={[-0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.85]} />
        <meshStandardMaterial color={color} metalness={.4} roughness={.5}/>
      </mesh>
      {/* invisible hit-box to make the small vehicle easier to click */}
      <mesh visible={false}>
        <boxGeometry args={[3, 2, 2]} />
        <meshBasicMaterial />
      </mesh>
      {isSel && (
        <Html position={[0, 1.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
          <ActorCard actor={actorInfo} onAction={onAction} onClose={onClose} />
        </Html>
      )}
    </group>
  );
}

/* -------- Walking person — small capsule body, sphere head + step animation -------- */
function Person({ path, speed, color, hat, actorInfo, selectedId, onSelect, onClose, onAction }: {
  path: string; speed: number; color: string; hat: string;
  actorInfo: ActorInfo; selectedId: string | null;
  onSelect: (info: ActorInfo) => void; onClose: () => void; onAction: (id: string) => void;
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

  const isSel = selectedId === actorInfo.id;
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(actorInfo); }}>
      <group ref={torsoRef} position={[0, 0.5, 0]}>
        {/* invisible hit-box — people are small in 3D space */}
        <mesh visible={false}>
          <boxGeometry args={[1.4, 1.6, 1.4]} />
          <meshBasicMaterial />
        </mesh>
        {/* torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
          <meshStandardMaterial color={color} emissive={isSel ? '#fbbf24' : '#000'} emissiveIntensity={isSel ? .5 : 0}/>
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
      {isSel && (
        <Html position={[0, 2.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
          <ActorCard actor={actorInfo} onAction={onAction} onClose={onClose} />
        </Html>
      )}
    </group>
  );
}

/* -------- Massive downtown skyline behind the compound — 6 rows + 2 wings -------- */
function CitySkyline() {
  const buildings = useMemo(() => {
    const out: BuildingSpec[] = [];
    let s = 12345;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // 6 deep rows of city — gets shorter further back
    const ROWS = [
      { z: -54, count: 13, heightBoost: 1.0 },
      { z: -68, count: 12, heightBoost: 1.15 },  // tallest row
      { z: -82, count: 11, heightBoost: 0.95 },
      { z: -96, count: 10, heightBoost: 0.8 },
      { z:-110, count:  9, heightBoost: 0.65 },
      { z:-124, count:  8, heightBoost: 0.5 },
    ];
    const COL_SPACING = 11;
    for (const row of ROWS) {
      for (let i = 0; i < row.count; i++) {
        if (rand() < 0.16) continue;     // skip 16% for cross-streets
        const x = -row.count * (COL_SPACING / 2) + i * COL_SPACING + (rand() - .5) * 2;
        const z = row.z - (rand() - .5) * 5;
        out.push(makeMixed(x, z, rand, row.heightBoost));
      }
    }
    // Wider side wings (east + west) — 9 each side
    for (let i = 0; i < 9; i++) {
      const z = -54 + i * 12 + (rand() - .5) * 3;
      const w = 4 + rand() * 2.5;
      const d = 4 + rand() * 2.5;
      const h = 6 + rand() * 22;
      const kind: BuildingSpec['kind'] = h > 18 ? 'mid' : 'low';
      out.push({ x: -86 - rand() * 8, z, w, d, h, tint: rand(), kind, solarRoof: kind === 'low' && rand() > 0.4 });
      out.push({ x:  86 + rand() * 8, z, w, d, h, tint: rand(), kind, solarRoof: kind === 'low' && rand() > 0.4 });
    }
    return out;
  }, []);
  return (
    <group>
      {buildings.map((b, i) => <Skyscraper key={i} {...b} />)}
    </group>
  );
}

/** Helper — pick a low/mid/tall building from a uniform roll. */
function makeMixed(x: number, z: number, rand: () => number, heightBoost = 1): BuildingSpec {
  const r = rand();
  if (r < 0.36) {
    return { x, z, w: 3.5 + rand() * 2,   d: 3.5 + rand() * 2,   h: (3 + rand() * 4)   * heightBoost, tint: rand(), kind: 'low',  solarRoof: rand() > 0.45 };
  }
  if (r < 0.74) {
    return { x, z, w: 4   + rand() * 2.5, d: 4   + rand() * 2.5, h: (10 + rand() * 14) * heightBoost, tint: rand(), kind: 'mid' };
  }
  return   { x, z, w: 4.5 + rand() * 3,   d: 4.5 + rand() * 3,   h: (26 + rand() * 30) * heightBoost, tint: rand(), kind: 'tall' };
}

/* -------- South city — a second city block behind the compound's southern face -------- */
function SouthCity() {
  const buildings = useMemo(() => {
    const out: BuildingSpec[] = [];
    let s = 222222;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ROWS = [
      { z: 90, count: 12, hBoost: 0.95 },
      { z:104, count: 11, hBoost: 1.0  },   // tallest
      { z:118, count: 10, hBoost: 0.85 },
      { z:132, count:  9, hBoost: 0.7  },
    ];
    const COL_SPACING = 11;
    for (const row of ROWS) {
      for (let i = 0; i < row.count; i++) {
        if (rand() < 0.18) continue;
        const x = -row.count * (COL_SPACING / 2) + i * COL_SPACING + (rand() - .5) * 2;
        out.push(makeMixed(x, row.z + (rand() - .5) * 4, rand, row.hBoost));
      }
    }
    return out;
  }, []);
  return <group>{buildings.map((b, i) => <Skyscraper key={`s-${i}`} {...b} />)}</group>;
}

/* -------- East city — far-east cluster (across the main avenue) -------- */
function EastCity() {
  const buildings = useMemo(() => {
    const out: BuildingSpec[] = [];
    let s = 88888;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // 4 columns going south at x = 110..140
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i < 8; i++) {
        if (rand() < 0.18) continue;
        const x = 110 + c * 10 + (rand() - .5) * 1.6;
        const z = -30 + i * 12 + (rand() - .5) * 3;
        out.push(makeMixed(x, z, rand, 0.9));
      }
    }
    return out;
  }, []);
  return <group>{buildings.map((b, i) => <Skyscraper key={`e-${i}`} {...b} />)}</group>;
}

/* -------- Suburb belt — sparse 1-2 floor houses on the far outskirts -------- */
function SuburbBelt() {
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string }[] = [];
    let s = 99999;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ROOFS = ['#b91c1c', '#92400e', '#0e7490', '#475569', '#7c2d12', '#1d4ed8', '#a16207'];
    const WALLS = ['#fef3c7', '#fde68a', '#e7e5e4', '#fff7ed', '#f1f5f9', '#fafaf9', '#fde2c2'];
    // Strip along the far SW (south-west corner) — sparse, irregular
    for (let i = 0; i < 24; i++) {
      if (rand() < 0.18) continue;
      const x = -130 + (i % 6) * 11 + (rand() - .5) * 1.8;
      const z =  80 + Math.floor(i / 6) * 12 + (rand() - .5) * 1.8;
      out.push(suburb(x, z, rand, ROOFS, WALLS));
    }
    // Strip along the far NE
    for (let i = 0; i < 24; i++) {
      if (rand() < 0.18) continue;
      const x =  88 + (i % 6) * 11 + (rand() - .5) * 1.8;
      const z = -70 - Math.floor(i / 6) * 12 + (rand() - .5) * 1.8;
      out.push(suburb(x, z, rand, ROOFS, WALLS));
    }
    return out;
  }, []);
  return <group>{houses.map((h, i) => <House key={`sub-${i}`} {...h} />)}</group>;
}

function suburb(x: number, z: number, rand: () => number,
                ROOFS: string[], WALLS: string[]) {
  return {
    x, z,
    w: 2.8 + rand() * 1.0,
    d: 3.2 + rand() * 0.8,
    h: 1.8 + rand() * 1.6,
    roof: ROOFS[Math.floor(rand() * ROOFS.length)],
    wall: WALLS[Math.floor(rand() * WALLS.length)],
  };
}

/* -------- Farmland + fields between districts (decorative low strips) -------- */
function FarmsAndFields() {
  // alternating green/cream rectangles on the ground
  const fields = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; color: string }[] = [];
    const COLS = ['#86efac', '#d9f99d', '#bef264', '#fde68a', '#a3e635'];
    let s = 77123;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // strip going north-east, off the compound
    for (let i = 0; i < 5; i++) {
      out.push({ x:  -140 + i * 4.8,  z: -40,  w: 4.4, d: 16, color: COLS[Math.floor(rand() * COLS.length)] });
    }
    // strip going south-east
    for (let i = 0; i < 6; i++) {
      out.push({ x:  -160 + i * 6,  z:  60,  w: 5.6, d: 18, color: COLS[Math.floor(rand() * COLS.length)] });
    }
    return out;
  }, []);
  return (
    <group>
      {fields.map((f, i) => (
        <mesh key={i} receiveShadow position={[f.x, 0.03, f.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[f.w, f.d]} />
          <meshStandardMaterial color={f.color} roughness={1}/>
        </mesh>
      ))}
    </group>
  );
}

interface BuildingSpec {
  x: number; z: number; w: number; d: number; h: number;
  tint: number;
  kind?: 'low' | 'mid' | 'tall';
  solarRoof?: boolean;
}

/* -------- Mid-rise commercial district (south) — mostly 1-3 floors, well spaced -------- */
function CommercialDistrict() {
  const buildings = useMemo(() => {
    const out: BuildingSpec[] = [];
    let s = 33333;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // Two rows of low/mid commercial — wider column spacing (~9m), gaps skipped
    for (let i = 0; i < 13; i++) {
      if (rand() < 0.18) continue;
      const x = -52 + i * 9 + (rand() - .5) * 1.5;
      const z = 56 + (rand() - .5) * 3;
      const r = rand();
      const kind: BuildingSpec['kind'] = r < 0.5 ? 'low' : r < 0.85 ? 'mid' : 'tall';
      const h = kind === 'low' ? 3 + rand() * 4 : kind === 'mid' ? 9 + rand() * 9 : 22 + rand() * 12;
      out.push({ x, z, w: 3.4 + rand() * 2.4, d: 3.4 + rand() * 2.4, h, tint: rand(), kind, solarRoof: kind === 'low' && rand() > 0.4 });
    }
    for (let i = 0; i < 11; i++) {
      if (rand() < 0.18) continue;
      const x = -44 + i * 9 + (rand() - .5) * 1.5;
      const z = 70 + (rand() - .5) * 3;
      const kind: BuildingSpec['kind'] = rand() < 0.6 ? 'low' : 'mid';
      const h = kind === 'low' ? 3 + rand() * 4 : 8 + rand() * 10;
      out.push({ x, z, w: 3.2 + rand() * 2, d: 3.2 + rand() * 2, h, tint: rand(), kind, solarRoof: kind === 'low' && rand() > 0.3 });
    }
    return out;
  }, []);
  return (
    <group>
      {buildings.map((b, i) => <Skyscraper key={`com-${i}`} {...b} />)}
    </group>
  );
}

/* -------- Housing — 4 distinct neighborhoods spread around the compound -------- */
function HousingDistrict() {
  const houses = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; roof: string; wall: string }[] = [];
    let s = 77777;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ROOFS = ['#b91c1c', '#92400e', '#0e7490', '#475569', '#7c2d12', '#1d4ed8', '#a16207', '#3f6212'];
    const WALLS = ['#fef3c7', '#fde68a', '#e7e5e4', '#fff7ed', '#f1f5f9', '#fafaf9', '#fde2c2'];

    // Grid of 4 neighborhoods, each ~5x6 houses with breathing room
    const NEIGHBORHOODS: [number, number, number, number][] = [
      // [originX, originZ, cols, rows]
      [-86,   2, 6, 5],   // WEST
      [ 54,  32, 6, 5],   // EAST
      [-66, -10, 5, 4],   // NORTH-WEST
      [ 56,  -8, 5, 4],   // NORTH-EAST
    ];

    for (const [ox, oz, cols, rows] of NEIGHBORHOODS) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (rand() < 0.12) continue;       // skip a few for variety
          const x = ox + col * 4.2 + (rand() - .5) * 0.4;
          const z = oz + row * 4.6 + (rand() - .5) * 0.4;
          out.push({
            x, z,
            w: 2.6 + rand() * 1.0,
            d: 3.0 + rand() * 0.8,
            h: 1.8 + rand() * 1.6,
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
    for (let i = 0; i < 10; i++) {
      const x = -78 + i * 8.5 + (rand() - .5);
      const z = 34 + (rand() - .5) * 2;
      out.push({ x, z, w: 7 + rand() * 1.5, d: 4.5 + rand(), h: 3.5 + rand() * 1.5, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    // Container-like blocks far north-east
    for (let i = 0; i < 16; i++) {
      const x = 64 + (i % 6) * 4.5 + (rand() - .5);
      const z = -22 + Math.floor(i / 6) * 5 + (rand() - .5);
      out.push({ x, z, w: 3.4, d: 3.6, h: 2.4 + rand() * 1.5, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    // Extra warehouse strip far south-east
    for (let i = 0; i < 8; i++) {
      const x = 64 + i * 8.5 + (rand() - .5);
      const z = 78 + (rand() - .5) * 2;
      out.push({ x, z, w: 6.5 + rand() * 1.5, d: 4.2 + rand(), h: 3 + rand() * 1.4, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    return out;
  }, []);
  const chimneys: { x: number; z: number; h: number }[] = [
    { x: -62, z: 30, h: 14 },
    { x: -55, z: 36, h: 16 },
    { x:  72, z: 36, h: 12 },
    { x:  86, z: 78, h: 18 },
    { x: -80, z: 28, h: 13 },
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

function Skyscraper({ x, z, w, d, h, tint, kind = 'tall', solarRoof = false }: BuildingSpec) {
  // Pale-blue/white palette — slight variation per building
  const base = tint < 0.33 ? '#d6e1ef' : tint < 0.66 ? '#cfd9e6' : '#e3ecf6';
  const emi  = tint < 0.5 ? '#7fa6d6' : '#83b3e4';
  const stripeSpacing = kind === 'low' ? 1.6 : 3;     // shorter floors on low buildings
  const stripeCount = Math.max(1, Math.floor(h / stripeSpacing));

  // For rooftop solar — small grid of tilted dark panels on flat roofs
  const solarCols = Math.max(2, Math.floor(w / 0.8));
  const solarRows = Math.max(2, Math.floor(d / 0.8));
  const sp = 0.7;

  return (
    <group position={[x, 0, z]}>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={base} metalness={kind === 'low' ? .2 : .45} roughness={kind === 'low' ? .85 : .2}/>
      </mesh>

      {/* Window stripes */}
      {Array.from({ length: stripeCount }).map((_, i) => (
        <mesh key={i} position={[0, 1.2 + i * stripeSpacing, 0]}>
          <boxGeometry args={[w + 0.02, 0.35, d + 0.02]} />
          <meshStandardMaterial color={emi} emissive={emi} emissiveIntensity={.3}/>
        </mesh>
      ))}

      {/* Rooftop solar panels (low buildings only) */}
      {solarRoof && (
        <group position={[0, h + 0.05, 0]}>
          {Array.from({ length: solarCols }).flatMap((_, i) =>
            Array.from({ length: solarRows }).map((_, j) => (
              <mesh
                key={`${i}-${j}`}
                position={[(i - solarCols / 2) * sp + sp / 2, 0.05, (j - solarRows / 2) * sp + sp / 2]}
                rotation={[-Math.PI / 6, 0, 0]}
                castShadow
              >
                <boxGeometry args={[sp * 0.85, 0.03, sp * 0.7]} />
                <meshStandardMaterial color="#1e3a5f" metalness={.55} roughness={.25}/>
              </mesh>
            ))
          )}
        </group>
      )}

      {/* Rooftop AC unit on tall buildings */}
      {!solarRoof && kind !== 'low' && (
        <mesh position={[0, h + 0.4, 0]}>
          <boxGeometry args={[w * 0.45, 0.6, d * 0.45]} />
          <meshStandardMaterial color="#a1a8b3" />
        </mesh>
      )}
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
    for (let i = 0; i < 140; i++) {
      const x = -160 + rand() * 320;
      const z = -100 + rand() * 220;
      // exclude footprint of major structures
      const tooClose =
        (Math.abs(x) < 14 && Math.abs(z) < 14) ||                                  // center admin
        ([-28, 0, 28].some(px => Math.hypot(x - px, z - (-22)) < 8)) ||             // plants top row
        ([-18, 18].some(px => Math.hypot(x - px, z - 22) < 8))   ||                 // plants bottom row
        ([-12, 12, 0].some(px => Math.hypot(x - px, z - (-10)) < 10)) ||           // solar farms compound
        (Math.abs(z - 18) < 5 && Math.abs(x) < 9) ||
        (z < -45)                              ||                                   // downtown
        (z > 84 && Math.abs(x) < 80)           ||                                   // south city
        (z >= 50 && z <= 78 && Math.abs(x) < 60) ||                                 // commercial district
        (x >  105 && z >= -38 && z <=  66)     ||                                   // east city
        (x >= -88  && x <= -50 && z >= -2 && z <= 24) ||                            // west housing
        (x >=  52  && x <=  82 && z >= 28 && z <= 56) ||                            // east housing
        (x >= -68  && x <= -44 && z >= -16 && z <= 8) ||                            // NW housing
        (x >=  54  && x <=  80 && z >= -14 && z <= 12) ||                           // NE housing
        (x >= -130 && x <= -78 && z >= 76 && z <= 110) ||                           // suburb SW
        (x >=  84  && x <= 142 && z >= -90 && z <= -56) ||                          // suburb NE
        (x <  -78 && z >= 24 && z <= 44) ||                                         // warehouses SW
        (x >  60 && z >= -28 && z <=  -4) ||                                        // containers NE
        (x >  58 && z >=  74 && z <=  88) ||                                        // warehouses SE
        Math.hypot(x - (-110), z -  10) < 14 ||                                     // far solar fields
        Math.hypot(x -  110,   z -  50) < 14 ||
        Math.hypot(x - (-90),  z -  60) < 12 ||
        Math.hypot(x -   90,   z - -50) < 12 ||
        Math.hypot(x -    0,   z -  80) < 18 ||
        Math.hypot(x - (-130), z - -30) < 12 ||
        Math.hypot(x -  130,   z -  -8) < 12;
      if (!tooClose) candidate.push([x, z]);
    }
    out.push(...candidate.slice(0, 110));
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
    // Push the range further back so the bigger city has room
    let s = 18181;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = -15; i <= 15; i++) {
      const x = i * 8 + (rand() - .5) * 4;
      const z = -150 + rand() * 12;
      const sz = 16 + rand() * 22;
      out.push({ p: [x, sz / 2, z], s: sz });
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
