import { useMemo } from 'react';

/**
 * Road network + sprite-based actors.
 *
 *  • Dashed connector paths (cyan + white) trace the visible iso roads.
 *  • Actors are PNG sprites: vans, trucks, drone, helicopter, robot,
 *    walking humans with multi-frame sprite-cycle animation.
 *  • Walking humans cycle through walk_01..walk_04 frames using SVG
 *    <animate> on the href attribute — proper anim, not just bobbing.
 *  • Drone has a ground shadow that tracks the same path so it reads
 *    as airborne.
 *  • Every actor is clickable → ActorPeek popover via onSelectActor.
 */

export interface ActorInfo {
  id: string;
  kind: 'van' | 'ambulance' | 'truck' | 'car' | 'robot'
      | 'crew' | 'engineer' | 'manager' | 'tech' | 'warehouse'
      | 'drone' | 'helicopter';
  name: string;
  role: string;
  status: string;
  meta: Record<string, string>;
}

interface Props {
  onSelectActor: (a: ActorInfo, anchorEl: SVGGElement) => void;
}

/** ROAD PATHS — traced along the visible iso roads. */
const ROADS: { id: string; d: string; color: 'cyan' | 'white' }[] = [
  // Upper east-west corridor: Kedah → Penang → Perak
  { id: 'rd-1', color: 'cyan',  d: 'M18,22  L18,38  L48,38  L48,12  L50,12' },
  { id: 'rd-2', color: 'cyan',  d: 'M50,12  L72,12  L72,22  L78,22' },
  // Central vertical artery (Penang → central command → south)
  { id: 'rd-3', color: 'cyan',  d: 'M50,12  L50,46' },
  // South-west route: Central → Melaka via solar arrays
  { id: 'rd-4', color: 'white', d: 'M50,46  L50,58  L34,58  L34,70  L28,70' },
  // South-east route: Central → Johor through storage yard
  { id: 'rd-5', color: 'white', d: 'M50,46  L50,55  L66,55  L66,75  L72,75' },
  // Mid-east cross artery
  { id: 'rd-6', color: 'white', d: 'M14,55  L86,55' },
  // North-south central
  { id: 'rd-7', color: 'cyan',  d: 'M14,28  L86,28' },
  // Outer perimeter (patrol route)
  { id: 'rd-perim', color: 'white', d: 'M8,16 L92,16 L92,90 L8,90 Z' },
];

/** Walking sprite frame sets (each cycles via SVG <animate href>). */
const WALK_CHEN_WEI = [
  '/generated/characters/chen-wei-technician/chen_wei_technician_walk_01.png',
  '/generated/characters/chen-wei-technician/chen_wei_technician_walk_02.png',
  '/generated/characters/chen-wei-technician/chen_wei_technician_walk_03.png',
  '/generated/characters/chen-wei-technician/chen_wei_technician_walk_04.png',
];
const IDLE_CHEN_WEI = [
  '/generated/characters/chen-wei-technician/chen_wei_technician_idle_01.png',
  '/generated/characters/chen-wei-technician/chen_wei_technician_idle_02.png',
  '/generated/characters/chen-wei-technician/chen_wei_technician_idle_03.png',
];

/** ACTORS — vehicles, walkers, aerial. ~16 total to feel alive. */
type ActorSpec = ActorInfo & {
  road: string; dur: number; begin?: number; rotate?: boolean; reverse?: boolean;
  href?: string; frames?: string[]; frameDur?: number;
  sw: number; sh: number; sy?: number;
  hasShadow?: boolean;
};

const ACTORS: ActorSpec[] = [
  // ---- VEHICLES ----
  { id: 'van-04', kind: 'van', name: 'VAN-04', role: 'Service Van', status: 'En route to Penang',
    meta: { Team: 'Team-2', Driver: 'Chen Wei', ETA: '38 min', Payload: 'Spare IGBT module' },
    road: 'rd-1', dur: 26, href: '/sprites/van.png', sw: 7, sh: 7 },

  { id: 'van-08', kind: 'van', name: 'VAN-08', role: 'Patrol Van', status: 'On route',
    meta: { Team: 'Security-1', Last: '10 min ago', Loop: 'Outer perimeter' },
    road: 'rd-5', dur: 48, reverse: true, begin: 6, href: '/sprites/van.png', sw: 7, sh: 7 },

  { id: 'amb-01', kind: 'ambulance', name: 'AMB-01', role: 'Emergency Response', status: 'Standing by',
    meta: { Station: 'Central', Crew: '2 medics', Response: '4 min', Last: '3d ago' },
    road: 'rd-perim', dur: 90, href: '/sprites/van.png', sw: 7, sh: 7 },

  { id: 'truck-02', kind: 'truck', name: 'TRUCK-02', role: 'Bucket Truck', status: 'Moving · Inverter Yard',
    meta: { Driver: 'Wang Min', Load: 'Maintenance tools', Hoist: 'Stowed' },
    road: 'rd-7', dur: 38, begin: 3, href: '/generated/vehicles/bucket-truck.png', sw: 8, sh: 8 },

  { id: 'car-03', kind: 'car', name: 'CAR-03', role: 'Service Car', status: 'En route',
    meta: { Driver: 'Li Na', Destination: 'Perak Yard' },
    road: 'rd-2', dur: 34, begin: 4, href: '/generated/vehicles/service-car.png', sw: 6, sh: 6 },

  { id: 'car-04', kind: 'car', name: 'CAR-04', role: 'Service Car', status: 'Returning to base',
    meta: { Driver: 'Wang Min', Destination: 'Central Depot' },
    road: 'rd-6', dur: 36, reverse: true, begin: 10, href: '/generated/vehicles/service-car.png', sw: 6, sh: 6 },

  { id: 'gen-01', kind: 'truck', name: 'GEN-01', role: 'Generator Trailer', status: 'Towed',
    meta: { Capacity: '500kW backup', Tow: 'TRUCK-02' },
    road: 'rd-perim', dur: 120, begin: 30, reverse: true, href: '/generated/vehicles/generator-trailer.png', sw: 7, sh: 7 },

  // ---- ROBOT (scanning) ----
  { id: 'bot-02', kind: 'robot', name: 'BOT-02', role: 'Inspection Robot', status: 'Scanning Perak yard',
    meta: { Mode: 'Thermal sweep', Battery: '64%', Coverage: '38%' },
    road: 'rd-2', dur: 62, reverse: true, begin: 8, href: '/generated/motion-states/inspection_robot_scanning_01.png', sw: 5, sh: 5 },

  // ---- WALKING HUMANS (Chen Wei sprite-frame cycle) ----
  { id: 'tech-01', kind: 'tech', name: 'Chen Wei', role: 'Field Technician',
    status: 'Walking · Melaka inverter yard',
    meta: { Role: 'L3 Field Tech', Wearable: 'ONLINE', Heartrate: '74bpm', Battery: '88%' },
    road: 'rd-4', dur: 95, frames: WALK_CHEN_WEI, frameDur: 0.16, sw: 6, sh: 6 },

  { id: 'tech-02', kind: 'tech', name: 'Tech Beta', role: 'Field Technician',
    status: 'Walking · north corridor',
    meta: { Role: 'L2 Tech', Wearable: 'ONLINE', Heartrate: '69bpm', Battery: '92%' },
    road: 'rd-7', dur: 110, reverse: true, begin: 14, frames: WALK_CHEN_WEI, frameDur: 0.16, sw: 6, sh: 6 },

  // ---- STANDING / SLOW WALKING ----
  { id: 'crew-01', kind: 'crew', name: 'Crew Alpha (2)', role: 'Field Inspection',
    status: 'Inspecting Melaka inverters',
    meta: { Lead: 'Chen Wei', Member: 'Li Na', Started: '14:12', SOP: 'PV-SOP-014' },
    road: 'rd-4', dur: 150, begin: 5, href: '/sprites/crew.png', sw: 7, sh: 7 },

  { id: 'eng-02', kind: 'engineer', name: 'Wang Min', role: 'Engineer · L3',
    status: 'Walking · Perak yard',
    meta: { Role: 'Senior Tech', Wearable: 'ONLINE', Heartrate: '72bpm', Battery: '88%' },
    road: 'rd-6', dur: 130, href: '/sprites/engineer.png', sw: 5.5, sh: 5.5 },

  { id: 'mgr-01', kind: 'manager', name: 'Site Manager', role: 'Operations Manager',
    status: 'Walking · Central admin',
    meta: { Office: 'Block C', Phone: 'available', Today: '8 tickets approved' },
    road: 'rd-3', dur: 165, href: '/sprites/manager.png', sw: 5.5, sh: 5.5 },

  { id: 'wh-01', kind: 'warehouse', name: 'Zhou Qiang', role: 'Warehouse Lead',
    status: 'Carrying tool case',
    meta: { Stop: 'Warehouse B', Cargo: 'Spare modules', Logged: '14:32' },
    road: 'rd-6', dur: 140, reverse: true, begin: 20,
    href: '/generated/characters/operations-team/zhou_qiang_warehouse_carry_case_01.png', sw: 5.5, sh: 5.5 },

  // ---- AERIAL (with ground shadow) ----
  { id: 'drone-01', kind: 'drone', name: 'DRONE-01', role: 'Recon Drone',
    status: 'Sweeping · Battery 78%',
    meta: { Altitude: '40m', Speed: '12 m/s', Camera: '4K + thermal', Mission: 'Penang pre-inspect' },
    road: 'rd-perim', dur: 38, reverse: true, begin: 4,
    href: '/generated/vehicles/drone.png', sw: 5, sh: 5, sy: -4.5, hasShadow: true },

  { id: 'heli-02', kind: 'helicopter', name: 'HELI-02', role: 'Survey Helicopter',
    status: 'Aerial photogrammetry',
    meta: { Pilot: 'Captain Yi', Fuel: '74%', Altitude: '120m', Mission: 'NDVI scan' },
    road: 'rd-7', dur: 52, begin: 18, rotate: true,
    href: '/generated/motion-states/drone_flying_01.png', sw: 7, sh: 7, sy: -6, hasShadow: true },
];

export function RoadNetwork({ onSelectActor }: Props) {
  const connectors = useMemo(() => ROADS.map((r, i) => ({ ...r, dashKey: `dash-${i}` })), []);

  return (
    <svg className="road-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="false">
      <defs>
        <filter id="actor-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.25" stdDeviation=".25" floodOpacity=".55"/>
        </filter>
        <filter id="actor-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".4"/>
        </filter>
      </defs>

      {/* ---------------- DOTTED CONNECTORS ---------------- */}
      {connectors.map(c => (
        <g key={c.id}>
          <path id={c.id} d={c.d} fill="none"
                stroke={c.color === 'cyan' ? '#22d3ee' : '#ffffff'}
                strokeOpacity={c.color === 'cyan' ? .12 : .10}
                strokeWidth={c.id === 'rd-perim' ? '.7' : '1.4'}
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={c.d} fill="none"
                stroke={c.color === 'cyan' ? '#67e8f9' : '#f4f4f6'}
                strokeWidth={c.id === 'rd-perim' ? '.32' : '.6'}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={c.id === 'rd-perim' ? '1.2 1.4' : '1.8 1.6'}
                strokeOpacity={c.color === 'cyan' ? .85 : .8}>
            <animate attributeName="stroke-dashoffset" from="0" to="-12"
                     dur={c.id === 'rd-perim' ? '14s' : '7s'} repeatCount="indefinite"/>
          </path>
        </g>
      ))}

      {/* ---------------- DRONE GROUND SHADOWS (separate from sprite) ---------------- */}
      {ACTORS.filter(a => a.hasShadow).map(a => (
        <g key={`${a.id}-shadow`} filter="url(#actor-blur)" style={{ pointerEvents: 'none' }}>
          <ellipse rx={a.sw * 0.5} ry={a.sw * 0.18} fill="rgba(0,0,0,.55)" opacity=".6"/>
          <animateMotion dur={`${a.dur}s`} begin={`${a.begin ?? 0}s`} repeatCount="indefinite"
                         keyPoints={a.reverse ? '1;0' : '0;1'}
                         keyTimes={a.reverse ? '1;0' : '0;1'}
                         calcMode="linear">
            <mpath href={`#${a.road}`}/>
          </animateMotion>
        </g>
      ))}

      {/* ---------------- SPRITE ACTORS ---------------- */}
      {ACTORS.map(a => {
        const keyPoints = a.reverse ? '1;0' : '0;1';
        const keyTimes = keyPoints;
        const sy = a.sy ?? -a.sh / 2;

        // Walking sprite-cycle for actors with `frames`
        const animatedHref = a.frames && a.frames.length > 0
          ? [...a.frames, a.frames[0]].join(';') // cycle back to first frame
          : null;

        return (
          <g
            key={a.id}
            className={`map-actor map-actor-${a.kind}`}
            filter="url(#actor-shadow)"
            onClick={(e) => onSelectActor(a, e.currentTarget)}
            style={{ cursor: 'pointer' }}
          >
            {/* hit area for easier clicking on small sprites */}
            <circle r={Math.max(a.sw, a.sh) / 2.2} fill="transparent" pointerEvents="all"/>
            {/* ground shadow */}
            <ellipse rx={a.sw * 0.42} ry={a.sw * 0.13} cy={a.sh * 0.42}
                     fill="rgba(0,0,0,.55)" opacity=".55" pointerEvents="none"/>
            {/* sprite */}
            <image
              href={a.frames?.[0] ?? a.href!}
              x={-a.sw / 2} y={sy} width={a.sw} height={a.sh}
              pointerEvents="none"
            >
              {animatedHref && (
                <animate
                  attributeName="href"
                  values={animatedHref}
                  dur={`${(a.frameDur ?? 0.15) * (a.frames!.length + 1)}s`}
                  repeatCount="indefinite"
                />
              )}
            </image>
            {/* status dot above the head */}
            <circle r="0.4" cy={sy - 0.6}
                    fill={a.kind === 'ambulance' ? '#f43f5e'
                       : a.kind === 'drone'      ? '#67e8f9'
                       : a.kind === 'helicopter' ? '#fb923c'
                       : a.kind === 'robot'      ? '#a855f7'
                       :                            '#34d399'}/>

            <animateMotion
              dur={`${a.dur}s`}
              begin={`${a.begin ?? 0}s`}
              repeatCount="indefinite"
              rotate={a.rotate ? 'auto' : '0'}
              keyPoints={keyPoints}
              keyTimes={keyTimes}
              calcMode="linear"
            >
              <mpath href={`#${a.road}`}/>
            </animateMotion>
          </g>
        );
      })}
    </svg>
  );
}

export const ROAD_NETWORK_ACTORS = ACTORS;
