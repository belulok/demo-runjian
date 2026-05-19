/**
 * Road network + live actors on the iso map.
 *
 * Everything is in a single SVG so all motion is on the same coordinate system
 * (the SVG viewBox is 0–100 in both axes, mapped to the map-world container).
 *
 *  • invisible road paths (id="rd-…") trace the major arteries on the iso art
 *  • data-flow orbs travel along those paths (the "power grid" feel)
 *  • cars + vans + service trucks are small SVG rects with animateMotion + rotate
 *  • technicians are dots with concentric "wearable broadcast" rings around them
 *  • drones / helicopter fly free above the network
 *
 * Adding/changing a route = add a new <path id="rd-X"/> below, then reference it
 * in any number of `<animateMotion><mpath href="#rd-X"/></animateMotion>` calls.
 */

const ORB_FILL_PURPLE = 'url(#orb-grad-purple)';
const ORB_FILL_TEAL   = 'url(#orb-grad-teal)';
const ORB_FILL_AMBER  = 'url(#orb-grad-amber)';

/** Helper to spawn N data orbs along a road id with staggered begin offsets. */
function orbsOn(road: string, count: number, dur: number, fill: string, r = 0.7, beginShift = 0) {
  const out: JSX.Element[] = [];
  for (let i = 0; i < count; i++) {
    const begin = (dur * i) / count + beginShift;
    out.push(
      <circle key={`${road}-${i}`} r={r} fill={fill} filter="url(#orb-blur)">
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} rotate="0">
          <mpath href={`#${road}`} />
        </animateMotion>
      </circle>
    );
  }
  return out;
}

export function RoadNetwork() {
  return (
    <svg className="road-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="orb-grad-purple">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="1"/>
          <stop offset="35%" stopColor="#e5e5e7" stopOpacity=".95"/>
          <stop offset="70%" stopColor="#a1a1aa" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-grad-teal">
          <stop offset="0%"  stopColor="#ccfbf1" stopOpacity="1"/>
          <stop offset="40%" stopColor="#5eead4" stopOpacity=".85"/>
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-grad-amber">
          <stop offset="0%"  stopColor="#fef3c7" stopOpacity="1"/>
          <stop offset="40%" stopColor="#fcd34d" stopOpacity=".9"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>

        <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".35"/>
        </filter>
        <filter id="actor-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".15"/>
        </filter>
        <filter id="wearable-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation=".5"/>
        </filter>
      </defs>

      {/* ============================================================
         INVISIBLE ROAD PATHS — traced along the iso road grid.
         Coordinates picked from the actual map image's road layout.
         ============================================================ */}

      {/* Horizontal arteries — subtle violet glow so the network reads as a "grid" */}
      <path id="rd-h1" d="M2,20  L98,20"  stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h2" d="M2,38  L98,38"  stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h3" d="M2,55  L98,55"  stroke="rgba(255, 255, 255, .24)" strokeWidth=".3"  fill="none"/>
      <path id="rd-h4" d="M2,72  L98,72"  stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h5" d="M2,87  L98,87"  stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>

      {/* Vertical arteries */}
      <path id="rd-v1" d="M14,2 L14,98" stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v2" d="M32,2 L32,98" stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v3" d="M50,2 L50,98" stroke="rgba(255, 255, 255, .24)" strokeWidth=".3"  fill="none"/>
      <path id="rd-v4" d="M68,2 L68,98" stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v5" d="M86,2 L86,98" stroke="rgba(255, 255, 255, .18)" strokeWidth=".25" fill="none"/>

      {/* Loop routes — used for patrols */}
      <path id="rd-loop-outer" d="M6,16 L94,16 L94,90 L6,90 Z" stroke="rgba(255, 255, 255, .14)" strokeWidth=".22" fill="none"/>
      <path id="rd-loop-inner" d="M22,30 L78,30 L78,80 L22,80 Z" stroke="rgba(255, 255, 255, .14)" strokeWidth=".22" fill="none"/>

      {/* Aerial paths (drone, helicopter) — curved sweeps */}
      <path id="ar-drone-1"  d="M5,10 Q 50,5  95,15  Q 95,55 60,52  Q 30,50 20,80  Q 50,95 90,80" stroke="none" fill="none"/>
      <path id="ar-heli-1"   d="M-5,30 Q 50,8 105,40 Q 80,70 50,60 Q 20,55 -5,30" stroke="none" fill="none"/>

      {/* ============================================================
         DATA-FLOW ORBS — distributed all along the road network.
         Each road gets several orbs at different speeds + colors.
         ============================================================ */}
      {/* Much fewer orbs now — only major arteries get traffic so it doesn't
          look like a strobe show. Same staggered cadence, just less density. */}
      <g>
        {orbsOn('rd-h2', 2, 22, ORB_FILL_TEAL,   1.0)}
        {orbsOn('rd-h3', 3, 24, ORB_FILL_PURPLE, 1.1)}
        {orbsOn('rd-h4', 2, 22, ORB_FILL_TEAL,   1.0)}
        {orbsOn('rd-v2', 2, 28, ORB_FILL_TEAL,   1.0)}
        {orbsOn('rd-v3', 3, 24, ORB_FILL_PURPLE, 1.1)}
        {orbsOn('rd-v4', 2, 28, ORB_FILL_TEAL,   1.0)}
      </g>

      {/* ============================================================
         VEHICLES — cars + vans + trucks, bigger so they read at all zooms
         ============================================================ */}
      <g className="vehicles">
        {/* Cars on horizontal roads — fewer of them, no more strobe */}
        <Vehicle road="rd-h2" dur={32} color="#e5e5e7" w={3.2} h={1.6}/>
        <Vehicle road="rd-h3" dur={28} color="#a1a1aa" w={3.0} h={1.5} reverse begin={9}/>
        <Vehicle road="rd-h4" dur={36} color="#e5e5e7" w={3.2} h={1.6} reverse begin={4}/>

        {/* Service van (white) on a vertical artery */}
        <Vehicle road="rd-v2" dur={40} color="#f8fafc" w={4.0} h={2.0} halo="rgba(255,255,255,.5)" begin={3}/>

        {/* AMBULANCE responding to the Penang alarm — runs the inner loop */}
        <Ambulance road="rd-loop-inner" dur={54} begin={2}/>

        {/* Outer-loop patrol */}
        <Vehicle road="rd-loop-outer" dur={68} color="#a1a1aa" w={3.6} h={1.7} rotate begin={0}/>
      </g>

      {/* ============================================================
         TECHNICIANS — small green dots w/ wearable broadcast rings.
         They walk slow loops near key substations / solar arrays.
         ============================================================ */}
      {/* Walking humans — uses Chen Wei technician sprite. Two technicians
          patrolling on shorter loops near substations. Plus one with a
          wearable broadcast ring (slowed down so it doesn't strobe). */}
      <g className="techs">
        <WalkingTech road="rd-h4" dur={70} begin={0}  href="/generated/characters/chen-wei-technician/chen_wei_technician_walk_01.png"/>
        <WalkingTech road="rd-v3" dur={88} begin={20} href="/generated/characters/chen-wei-technician/chen_wei_technician_walk_02.png"/>
        <Technician  road="rd-h2" dur={92} begin={5}/>
      </g>

      {/* ============================================================
         AERIAL UNITS — drone + helicopter, on free flight paths
         (free of the road grid; we render them inside the SVG so they
          share the same coordinate system & rotate-on-path).
         ============================================================ */}
      <g className="aerial">
        {/* Drone: bright cyan glow with rotor */}
        <g>
          <circle r="1.0" fill="#67e8f9" filter="url(#wearable-glow)"/>
          <circle r="2.0" fill="none" stroke="#67e8f9" strokeWidth=".22" opacity=".8">
            <animate attributeName="r" values="1.0;2.4;1.0" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle r="0.55" fill="#ecfeff"/>
          <animateMotion dur="42s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ar-drone-1"/>
          </animateMotion>
        </g>
        {/* Helicopter: orange glow with rotor wash */}
        <g>
          <rect x="-1.6" y="-0.55" width="3.2" height="1.1" rx="0.5" fill="#fb923c" opacity=".98"/>
          <rect x="-0.3" y="-1.4"  width="0.6" height="2.8" rx="0.2" fill="#fcd34d" opacity=".7">
            <animate attributeName="opacity" values=".7;.1;.7" dur=".15s" repeatCount="indefinite"/>
          </rect>
          <circle r="2.2" fill="none" stroke="#fb923c" strokeWidth=".26" opacity=".55">
            <animate attributeName="r" values="1.6;2.8;1.6" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values=".8;0;.8" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <animateMotion dur="36s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ar-heli-1"/>
          </animateMotion>
        </g>
      </g>
    </svg>
  );
}

/* ---------- vehicle component (rect on a road path) ---------- */
function Vehicle({
  road, dur, color, w, h, halo, reverse, rotate, begin = 0,
}: {
  road: string; dur: number; color: string; w: number; h: number;
  halo?: string; reverse?: boolean; rotate?: boolean; begin?: number;
}) {
  const keyTimes  = reverse ? '1;0' : '0;1';
  const keyPoints = reverse ? '1;0' : '0;1';
  return (
    <g>
      {halo && (
        <ellipse rx={w * 1.3} ry={h * 1.6} fill={halo} opacity=".22" filter="url(#wearable-glow)"/>
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(w, h) * 0.35} fill={color} filter="url(#actor-blur)"/>
      {/* a small windshield highlight */}
      <rect x={-w * 0.35} y={-h * 0.3} width={w * 0.3} height={h * 0.55} fill="rgba(255,255,255,.55)" rx=".15"/>
      <animateMotion
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
        rotate={rotate ? 'auto' : '0'}
        keyPoints={keyPoints}
        keyTimes={keyTimes}
        calcMode="linear"
      >
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}

/* ---------- technician with wearable broadcast ring (single, slow) ---------- */
function Technician({ road, dur, begin = 0 }: { road: string; dur: number; begin?: number }) {
  return (
    <g>
      <circle r="0.7" fill="#34d399" filter="url(#wearable-glow)" />
      <circle r="0.4" fill="#ecfeff" />
      {/* single, slow broadcast ring — no longer a strobe */}
      <circle r="0.7" fill="none" stroke="#34d399" strokeWidth=".22" opacity="0">
        <animate attributeName="r"       values=".7;2.4;.7"   dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".7;0;0;.7"   dur="5s" repeatCount="indefinite" />
      </circle>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}

/* ---------- walking technician using a generated sprite from /assets ---------- */
function WalkingTech({ road, dur, begin = 0, href }: { road: string; dur: number; begin?: number; href: string }) {
  return (
    <g>
      {/* small shadow ellipse beneath */}
      <ellipse rx="1.0" ry="0.35" cy="0.6" fill="rgba(0,0,0,.55)" filter="url(#actor-blur)"/>
      {/* sprite from the assets pack */}
      <image href={href} x="-1.4" y="-2.2" width="2.8" height="2.8" />
      {/* subtle green glow ring around the walker */}
      <circle r="1.3" fill="none" stroke="#34d399" strokeWidth=".14" opacity=".35"/>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}

/* ---------- ambulance with rotating siren swirl ---------- */
function Ambulance({ road, dur, begin = 0, reverse }: { road: string; dur: number; begin?: number; reverse?: boolean }) {
  const keyTimes  = reverse ? '1;0' : '0;1';
  const keyPoints = reverse ? '1;0' : '0;1';
  return (
    <g>
      {/* white body w/ red cross stripe */}
      <ellipse rx="2.8" ry="2.0" fill="rgba(255,255,255,.20)" filter="url(#wearable-glow)"/>
      <rect x="-1.9" y="-0.95" width="3.8" height="1.9" rx="0.35" fill="#ffffff"/>
      <rect x="-1.9" y="-0.18" width="3.8" height="0.36" fill="#f43f5e"/>
      <rect x="-0.18" y="-0.95" width="0.36" height="1.9" fill="#f43f5e"/>
      {/* rotating siren halo — slow rotation, soft red/blue alternation via single color cycle */}
      <circle cx="0" cy="-0.95" r="0.45" fill="#f43f5e" opacity=".85">
        <animate attributeName="fill" values="#f43f5e;#60a5fa;#f43f5e" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <animateMotion
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
        rotate="auto"
        keyPoints={keyPoints}
        keyTimes={keyTimes}
        calcMode="linear"
      >
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}
