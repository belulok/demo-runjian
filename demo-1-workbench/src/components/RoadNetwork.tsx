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

/** Invisible motion-paths for actors (no longer rendered as dotted lines). */
const ROADS: { id: string; d: string }[] = [
  // Upper east-west corridor: Kedah → Penang → Perak
  { id: 'rd-1', d: 'M18,22  L18,38  L48,38  L48,12  L50,12' },
  { id: 'rd-2', d: 'M50,12  L72,12  L72,22  L78,22' },
  // Central vertical artery (Penang → central command → south)
  { id: 'rd-3', d: 'M50,12  L50,46' },
  // South-west route: Central → Melaka via solar arrays
  { id: 'rd-4', d: 'M50,46  L50,58  L34,58  L34,70  L28,70' },
  // South-east route: Central → Johor through storage yard
  { id: 'rd-5', d: 'M50,46  L50,55  L66,55  L66,75  L72,75' },
  // Mid-east cross artery
  { id: 'rd-6', d: 'M14,55  L86,55' },
  // North-south central
  { id: 'rd-7', d: 'M14,28  L86,28' },
  // Outer perimeter (patrol route)
  { id: 'rd-perim', d: 'M8,16 L92,16 L92,90 L8,90 Z' },
  // AMBULANCE — smooth curved meander across the compound (not a rect loop)
  { id: 'rd-amb',
    d: 'M2,82 C 18,82  22,68  34,62 S 52,52  60,42 S 74,28  90,20 S 92,46  78,58 S 60,72  44,80 S 22,92  2,82 Z' },
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
  // ---- VEHICLES (vans removed, kept truck + cars) ----
  { id: 'truck-02', kind: 'truck', name: 'TRUCK-02', role: 'Bucket Truck', status: 'Moving · Inverter Yard',
    meta: { Driver: 'Wang Min', Load: 'Maintenance tools', Hoist: 'Stowed' },
    road: 'rd-7', dur: 38, begin: 3, href: '/generated/vehicles/bucket-truck.png', sw: 8, sh: 8 },

  { id: 'car-03', kind: 'car', name: 'CAR-03', role: 'Service Car', status: 'En route',
    meta: { Driver: 'Li Na', Destination: 'Perak Yard' },
    road: 'rd-2', dur: 34, begin: 4, href: '/generated/vehicles/service-car.png', sw: 6, sh: 6 },

  { id: 'car-04', kind: 'car', name: 'CAR-04', role: 'Service Car', status: 'Returning to base',
    meta: { Driver: 'Wang Min', Destination: 'Central Depot' },
    road: 'rd-6', dur: 36, reverse: true, begin: 10, href: '/generated/vehicles/service-car.png', sw: 6, sh: 6 },

  // ---- ROBOT (scanning) ----
  { id: 'bot-02', kind: 'robot', name: 'BOT-02', role: 'Inspection Robot', status: 'Scanning Perak yard',
    meta: { Mode: 'Thermal sweep', Battery: '64%', Coverage: '38%' },
    road: 'rd-2', dur: 62, reverse: true, begin: 8, href: '/generated/motion-states/inspection_robot_scanning_01.png', sw: 5, sh: 5 },

  // ---- WALKING HUMANS (Chen Wei sprite-frame cycle) — smaller than before ----
  { id: 'tech-01', kind: 'tech', name: 'Chen Wei', role: 'Field Technician',
    status: 'Walking · Melaka inverter yard',
    meta: { Role: 'L3 Field Tech', Wearable: 'ONLINE', Heartrate: '74bpm', Battery: '88%' },
    road: 'rd-4', dur: 95, frames: WALK_CHEN_WEI, frameDur: 0.16, sw: 3.5, sh: 3.5 },

  { id: 'tech-02', kind: 'tech', name: 'Tech Beta', role: 'Field Technician',
    status: 'Walking · north corridor',
    meta: { Role: 'L2 Tech', Wearable: 'ONLINE', Heartrate: '69bpm', Battery: '92%' },
    road: 'rd-7', dur: 110, reverse: true, begin: 14, frames: WALK_CHEN_WEI, frameDur: 0.16, sw: 3.5, sh: 3.5 },

  // ---- STANDING / SLOW WALKING — also smaller ----
  { id: 'crew-01', kind: 'crew', name: 'Crew Alpha (2)', role: 'Field Inspection',
    status: 'Inspecting Melaka inverters',
    meta: { Lead: 'Chen Wei', Member: 'Li Na', Started: '14:12', SOP: 'PV-SOP-014' },
    road: 'rd-4', dur: 150, begin: 5, href: '/sprites/crew.png', sw: 4.2, sh: 4.2 },

  { id: 'eng-02', kind: 'engineer', name: 'Wang Min', role: 'Engineer · L3',
    status: 'Walking · Perak yard',
    meta: { Role: 'Senior Tech', Wearable: 'ONLINE', Heartrate: '72bpm', Battery: '88%' },
    road: 'rd-6', dur: 130, href: '/sprites/engineer.png', sw: 3.2, sh: 3.2 },

  { id: 'mgr-01', kind: 'manager', name: 'Site Manager', role: 'Operations Manager',
    status: 'Walking · Central admin',
    meta: { Office: 'Block C', Phone: 'available', Today: '8 tickets approved' },
    road: 'rd-3', dur: 165, href: '/sprites/manager.png', sw: 3.2, sh: 3.2 },

  { id: 'wh-01', kind: 'warehouse', name: 'Zhou Qiang', role: 'Warehouse Lead',
    status: 'Carrying tool case',
    meta: { Stop: 'Warehouse B', Cargo: 'Spare modules', Logged: '14:32' },
    road: 'rd-6', dur: 140, reverse: true, begin: 20,
    href: '/generated/characters/operations-team/zhou_qiang_warehouse_carry_case_01.png', sw: 3.2, sh: 3.2 },

  // ---- 2 DRONES flying around (both using /generated/vehicles/drone.png) ----
  { id: 'drone-01', kind: 'drone', name: 'DRONE-01', role: 'Recon Drone',
    status: 'Outer perimeter sweep · Battery 78%',
    meta: { Altitude: '40m', Speed: '12 m/s', Camera: '4K + thermal', Mission: 'Penang pre-inspect' },
    road: 'rd-perim', dur: 38, reverse: true, begin: 0,
    href: '/generated/vehicles/drone.png', sw: 5.5, sh: 5.5, sy: -4.5, hasShadow: true },

  { id: 'drone-02', kind: 'drone', name: 'DRONE-02', role: 'Inspection Drone',
    status: 'Curved patrol · Battery 91%',
    meta: { Altitude: '25m', Speed: '8 m/s', Camera: 'Macro + IR', Mission: 'Inverter scan' },
    road: 'rd-amb', dur: 46, begin: 8,
    href: '/generated/vehicles/drone.png', sw: 5.5, sh: 5.5, sy: -4.5, hasShadow: true },
];

export function RoadNetwork({ onSelectActor }: Props) {
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

      {/* Invisible motion-paths used by <animateMotion> only — no visible dashes */}
      {ROADS.map(r => (
        <path key={r.id} id={r.id} d={r.d} fill="none" stroke="none" />
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
            {/* sprite + status dot — for aerial actors, this inner <g> bobs
                vertically so they look like they're flying */}
            <g>
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
              <circle r="0.4" cy={sy - 0.6}
                      fill={a.kind === 'ambulance' ? '#f43f5e'
                         : a.kind === 'drone'      ? '#67e8f9'
                         : a.kind === 'helicopter' ? '#fb923c'
                         : a.kind === 'robot'      ? '#a855f7'
                         :                            '#34d399'}/>
              {a.hasShadow && (
                <>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0,-1.2; 0,-2.2; 0,-1.2; 0,-0.6; 0,-1.2"
                    dur={a.kind === 'helicopter' ? '3.6s' : '2.4s'}
                    repeatCount="indefinite"
                  />
                </>
              )}
            </g>

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
