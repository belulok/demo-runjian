import { useMemo } from 'react';

/**
 * Road network + sprite-based actors.
 *
 *  • Dotted connector paths (CYAN + WHITE) trace the visible iso roads.
 *  • Animated dash offset gives a subtle "data flowing" feel along each path.
 *  • Actors are PNG sprites from /sprites/ (vans, crew, engineer, manager)
 *    + /generated/vehicles/ (drone). They follow the same paths with
 *    `animateMotion` so they always look "on the road".
 *  • Clicking an actor calls onSelectActor for the parent to show a peek card.
 */

export interface ActorInfo {
  id: string;
  kind: 'van' | 'ambulance' | 'crew' | 'engineer' | 'manager' | 'drone' | 'helicopter';
  name: string;
  role: string;
  status: string;
  meta: Record<string, string>;
}

interface Props {
  onSelectActor: (a: ActorInfo, anchorEl: SVGGElement) => void;
}

/** ROAD PATHS — traced along the visible roads on the iso compound image.
 *  All coords are in the same 0–100 viewBox the SVG uses. Quadratic curves
 *  follow the natural iso road skew. */
const ROADS: { id: string; d: string; color: 'cyan' | 'white' }[] = [
  // North loop: Kedah → main horizontal → Penang → continue east → Perak
  { id: 'rd-1', color: 'cyan',  d: 'M18,22  L18,38  L48,38  L48,12  L50,12' },
  { id: 'rd-2', color: 'cyan',  d: 'M50,12  L72,12  L72,22  L78,22' },
  // Center vertical artery (Penang → central command → south)
  { id: 'rd-3', color: 'cyan',  d: 'M50,12  L50,46' },
  // South-west route: Central → Melaka via solar arrays
  { id: 'rd-4', color: 'white', d: 'M50,46  L50,58  L34,58  L34,70  L28,70' },
  // South-east route: Central → Johor through storage yard
  { id: 'rd-5', color: 'white', d: 'M50,46  L50,55  L66,55  L66,75  L72,75' },
  // Outer perimeter (decorative — patrol route)
  { id: 'rd-perim', color: 'white', d: 'M8,16 L92,16 L92,90 L8,90 Z' },
];

/** ACTORS — sprite assets + which road they ride + speed (seconds per lap). */
const ACTORS: Array<ActorInfo & { road: string; dur: number; begin?: number; rotate?: boolean; reverse?: boolean; href: string; sw: number; sh: number; sy?: number }> = [
  // Service van heading to Penang (the alarm site)
  {
    id: 'van-04', kind: 'van', name: 'VAN-04', role: 'Service Van', status: 'En route to Penang',
    meta: { Team: 'Team-2', Driver: 'Chen Wei', ETA: '38 min', Payload: 'Spare IGBT module' },
    road: 'rd-1', dur: 26, rotate: false, href: '/sprites/van.png', sw: 6, sh: 6,
  },
  // Ambulance — uses same van.png but tinted with red ambulance siren (handled in CSS overlay)
  {
    id: 'amb-01', kind: 'ambulance', name: 'AMB-01', role: 'Emergency Response', status: 'Standing by',
    meta: { Station: 'Central', Crew: '2 medics', Response: '4 min', Last: '3d ago' },
    road: 'rd-perim', dur: 90, rotate: false, href: '/sprites/van.png', sw: 6, sh: 6,
  },
  // Patrol van running south route
  {
    id: 'van-08', kind: 'van', name: 'VAN-08', role: 'Patrol', status: 'On route',
    meta: { Team: 'Security-1', Last: '10 min ago', Loop: 'Outer perimeter' },
    road: 'rd-5', dur: 48, reverse: true, begin: 6, href: '/sprites/van.png', sw: 6, sh: 6,
  },

  // Walking crew (2 humans) — Melaka inspection
  {
    id: 'crew-01', kind: 'crew', name: 'Crew Alpha (2)', role: 'Field Inspection',
    status: 'Inspecting Melaka inverters',
    meta: { Lead: 'Chen Wei', Member: 'Li Na', Started: '14:12', SOP: 'PV-SOP-014' },
    road: 'rd-4', dur: 110, href: '/sprites/crew.png', sw: 5.5, sh: 5.5,
  },
  // Solo engineer — Perak roving
  {
    id: 'eng-02', kind: 'engineer', name: 'Wang Min', role: 'Engineer · L3',
    status: 'Walking · Perak yard',
    meta: { Role: 'Senior Tech', Wearable: 'ONLINE', Heartrate: '72bpm', Battery: '88%' },
    road: 'rd-2', dur: 96, href: '/sprites/engineer.png', sw: 4, sh: 4,
  },
  // Manager doing rounds in central command
  {
    id: 'mgr-01', kind: 'manager', name: 'Site Manager', role: 'Operations Manager',
    status: 'Walking · Central admin',
    meta: { Office: 'Block C', Phone: 'available', Today: '8 tickets approved' },
    road: 'rd-3', dur: 130, href: '/sprites/manager.png', sw: 4, sh: 4,
  },

  // Drone — flying over the compound
  {
    id: 'drone-01', kind: 'drone', name: 'DRONE-01', role: 'Recon Drone',
    status: 'Sweeping · Battery 78%',
    meta: { Altitude: '40m', Speed: '12 m/s', Camera: '4K + thermal', Mission: 'Penang pre-inspect' },
    road: 'rd-perim', dur: 38, reverse: true, begin: 4, href: '/generated/vehicles/drone.png', sw: 4, sh: 4,
  },
];

export function RoadNetwork({ onSelectActor }: Props) {
  // Pre-build the dashed connectors with animated dash-offset for a "march" effect.
  const connectors = useMemo(() => ROADS.map((r, i) => ({ ...r, dashKey: `dash-${i}` })), []);

  return (
    <svg className="road-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="false">
      <defs>
        <filter id="actor-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.25" stdDeviation=".25" floodOpacity=".55"/>
        </filter>
      </defs>

      {/* ---------------- DOTTED CONNECTORS following the roads ---------------- */}
      {connectors.map(c => (
        <g key={c.id}>
          {/* underlying glow */}
          <path
            id={c.id}
            d={c.d}
            fill="none"
            stroke={c.color === 'cyan' ? '#22d3ee' : '#ffffff'}
            strokeOpacity={c.color === 'cyan' ? .14 : .12}
            strokeWidth={c.id === 'rd-perim' ? '.8' : '1.6'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* dashed top line — animated march */}
          <path
            d={c.d}
            fill="none"
            stroke={c.color === 'cyan' ? '#67e8f9' : '#f4f4f6'}
            strokeWidth={c.id === 'rd-perim' ? '.35' : '.65'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={c.id === 'rd-perim' ? '1.2 1.4' : '1.8 1.6'}
            strokeOpacity={c.color === 'cyan' ? .9 : .85}
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur={c.id === 'rd-perim' ? '14s' : '7s'} repeatCount="indefinite"/>
          </path>
        </g>
      ))}

      {/* ---------------- SPRITE-BASED ACTORS ---------------- */}
      {ACTORS.map(a => {
        const keyTimes  = a.reverse ? '1;0' : '0;1';
        const keyPoints = a.reverse ? '1;0' : '0;1';
        const sy = a.sy ?? -a.sh / 2;
        return (
          <g
            key={a.id}
            className={`map-actor map-actor-${a.kind}`}
            filter="url(#actor-shadow)"
            onClick={(e) => onSelectActor(a, e.currentTarget)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {/* hit area circle to make small sprites easier to click */}
            <circle r={Math.max(a.sw, a.sh) / 2.4} fill="transparent"/>
            {/* small ground shadow ellipse */}
            <ellipse rx={a.sw * 0.42} ry={a.sw * 0.13} cy={a.sh * 0.42}
                     fill="rgba(0,0,0,.55)" opacity=".7"/>
            {/* the sprite */}
            <image href={a.href} x={-a.sw / 2} y={sy} width={a.sw} height={a.sh}/>
            {/* tiny status dot above the head */}
            <circle r="0.45" cy={sy - 0.7}
                    fill={a.kind === 'ambulance' ? '#f43f5e'
                       : a.kind === 'drone'      ? '#67e8f9'
                       : a.kind === 'helicopter' ? '#fb923c'
                       :                            '#34d399'} />
            <animateMotion
              dur={`${a.dur}s`}
              begin={`${a.begin ?? 0}s`}
              repeatCount="indefinite"
              rotate={a.rotate ? 'auto' : '0'}
              keyPoints={keyPoints}
              keyTimes={keyTimes}
              calcMode="linear"
            >
              <mpath href={`#${a.road}`} />
            </animateMotion>
          </g>
        );
      })}
    </svg>
  );
}

export const ROAD_NETWORK_ACTORS = ACTORS;
