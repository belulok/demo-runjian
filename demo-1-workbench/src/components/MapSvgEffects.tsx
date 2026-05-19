/**
 * SVG ambient effects — kept minimal so the map doesn't strobe.
 *  • subtle water shimmer over the river edge (feTurbulence displacement)
 *  • subtle heat shimmer over the substation yards
 *
 * Aviation blink lights, lightning arcs, solar glints, window flicker and
 * other "lights" effects were intentionally REMOVED — the user said keep
 * only the plant rings + atmospheric shimmer.
 */
export function MapSvgEffects() {
  return (
    <svg className="map-fx-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="fx-water" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="1" result="t">
            <animate attributeName="baseFrequency" dur="14s" values="0.012 0.04; 0.018 0.03; 0.012 0.04" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="t" scale="1.4"/>
        </filter>

        <filter id="fx-heat" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="4" result="h">
            <animate attributeName="baseFrequency" dur="3.2s" values="0.02 0.06; 0.025 0.07; 0.02 0.06" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="h" scale="0.55"/>
        </filter>

        <linearGradient id="grad-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#67e8f9" stopOpacity=".0"/>
          <stop offset="50%" stopColor="#22d3ee" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#0891b2" stopOpacity=".0"/>
        </linearGradient>
      </defs>

      {/* river shimmer on the left edge */}
      <g filter="url(#fx-water)">
        <path
          d="M-1,28 C 1.8,40 3.5,52 2.6,64 C 1.8,76 3.4,86 1.6,99 L -1,99 Z"
          fill="url(#grad-river)"
        />
      </g>

      {/* subtle heat haze over substation yards */}
      <g filter="url(#fx-heat)" opacity=".5">
        <rect x="10" y="50" width="10" height="14" fill="#facc15" opacity=".08" />
        <rect x="27" y="35" width="11" height="13" fill="#facc15" opacity=".08" />
        <rect x="66" y="45" width="10" height="13" fill="#facc15" opacity=".08" />
        <rect x="84" y="38" width="9"  height="13" fill="#facc15" opacity=".08" />
      </g>
    </svg>
  );
}
