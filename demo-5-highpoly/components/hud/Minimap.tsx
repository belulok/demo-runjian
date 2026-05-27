"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { useWorldStore } from "@/lib/store/worldStore";
import {
  STATIONS,
  STATION_BY_PLANT_ID,
  STATION_TYPE_LABEL,
  STATION_TYPE_TINT,
  WORLD_BOUNDS,
} from "@/lib/mock/stations";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";

/**
 * Top-down minimap bound to the unified SimCity world.
 *  - Drag → pan the minimap viewport.
 *  - Wheel → zoom around cursor.
 *  - Click (no drag) → pan the 3D camera to that world (x, z).
 *  - Click a station dot → also pans + opens the StationTeamBrief panel.
 */
const PADDING = 30;
const DRAG_THRESHOLD = 5;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;

export function Minimap() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const cameraView = useWorldStore((s) => s.cameraView);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const selectStation = useWorldStore((s) => s.selectStation);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeStation = STATION_BY_PLANT_ID[activeId];

  // Base viewport — full world bounds with padding
  const base = useMemo(() => {
    const b = WORLD_BOUNDS;
    return {
      minX: b.minX - PADDING,
      minZ: b.minZ - PADDING,
      width: b.maxX - b.minX + PADDING * 2,
      height: b.maxZ - b.minZ + PADDING * 2,
    };
  }, []);

  // User pan + zoom state
  const [panX, setPanX] = useState(0);
  const [panZ, setPanZ] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Drag state
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  const screenToWorldDelta = useCallback(
    (dxPx: number, dyPx: number) => {
      const svg = svgRef.current;
      if (!svg) return { dx: 0, dz: 0 };
      const rect = svg.getBoundingClientRect();
      const worldPerPxX = base.width / zoom / rect.width;
      const worldPerPxY = base.height / zoom / rect.height;
      return { dx: dxPx * worldPerPxX, dz: dyPx * worldPerPxY };
    },
    [base, zoom],
  );

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, z: local.y };
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - d.lastX;
    const dyPx = e.clientY - d.lastY;
    const totalDx = Math.abs(e.clientX - d.startX);
    const totalDy = Math.abs(e.clientY - d.startY);
    if (!d.moved && (totalDx > DRAG_THRESHOLD || totalDy > DRAG_THRESHOLD)) {
      d.moved = true;
    }
    if (d.moved) {
      const { dx, dz } = screenToWorldDelta(-dxPx, -dyPx);
      setPanX((p) => p + dx);
      setPanZ((p) => p + dz);
    }
    d.lastX = e.clientX;
    d.lastY = e.clientY;
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const wasClick = !d.moved;
    drag.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
    if (wasClick) {
      const world = screenToWorld(e.clientX, e.clientY);
      if (world) panToWorld(world.x, world.z);
    }
  };

  const handlePointerCancel = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === e.pointerId) {
      drag.current = null;
      svgRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: ReactWheelEvent<SVGSVGElement>) => {
    const before = screenToWorld(e.clientX, e.clientY);
    if (!before) return;
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (nextZoom === zoom) return;
    const fracX = (before.x - (base.minX + panX)) / (base.width / zoom);
    const fracZ = (before.z - (base.minZ + panZ)) / (base.height / zoom);
    const newOriginX = before.x - fracX * (base.width / nextZoom);
    const newOriginZ = before.z - fracZ * (base.height / nextZoom);
    setPanX(newOriginX - base.minX);
    setPanZ(newOriginZ - base.minZ);
    setZoom(nextZoom);
  };

  const viewBox = useMemo(() => {
    const w = base.width / zoom;
    const h = base.height / zoom;
    const x = base.minX + panX;
    const z = base.minZ + panZ;
    return `${x} ${z} ${w} ${h}`;
  }, [base, panX, panZ, zoom]);

  const resetView = useCallback(() => {
    setPanX(0);
    setPanZ(0);
    setZoom(1);
  }, []);

  return (
    <div className="relative h-full aspect-square">
      <div className="relative h-full clip-hex-frame bg-gradient-to-b from-[#0c1322] to-[#06090f] ring-1 ring-inset ring-[rgba(20,184,166,0.25)]">
        <div
          className="absolute top-0 left-3 right-3 h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, var(--color-agent-scheduling) 50%, transparent)",
          }}
        />
        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 border-b border-[var(--color-rule)]">
          <OrnateTitle size="xs" accentColor="var(--color-agent-scheduling)">
            World Map
          </OrnateTitle>
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[8px] text-text-muted truncate max-w-[80px]"
              title={activeStation?.name}
            >
              {STATIONS.length} stations
            </span>
            <button
              onClick={resetView}
              title="Recenter & reset zoom"
              className="font-mono text-[9px] leading-none text-text-muted hover:text-[var(--color-agent-scheduling)] px-1.5 py-0.5 rounded-sm bg-black/30 hover:bg-black/50 transition-colors"
            >
              ⊙
            </button>
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="block w-full h-[calc(100%-26px)] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onWheel={handleWheel}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="mm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Big grid background */}
          <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#mm-grid)" />

          {/* World boundary */}
          <rect
            x={WORLD_BOUNDS.minX}
            y={WORLD_BOUNDS.minZ}
            width={WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX}
            height={WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ}
            fill="rgba(102, 158, 88, 0.12)"
            stroke="rgba(102, 158, 88, 0.35)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {/* Lakes */}
          <circle cx={180} cy={-55} r={48} fill="rgba(75, 128, 168, 0.55)" />
          <circle cx={-260} cy={-180} r={26} fill="rgba(75, 128, 168, 0.55)" />

          {/* Town centre + plaza */}
          <circle cx={0} cy={0} r={70} fill="rgba(214, 201, 160, 0.25)" stroke="rgba(214, 201, 160, 0.5)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <circle cx={0} cy={0} r={14} fill="rgba(214, 201, 160, 0.55)" />

          {/* Main roads */}
          <line x1={-380} y1={0} x2={380} y2={0} stroke="#58616d" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          <line x1={0} y1={-250} x2={0} y2={250} stroke="#58616d" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          {/* Branch roads to stations */}
          {STATIONS.map((s, i) => {
            const towardX = Math.abs(s.pos[0]) > Math.abs(s.pos[2]);
            const elbowX = towardX ? s.pos[0] : 0;
            const elbowZ = towardX ? 0 : s.pos[2];
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={0}
                  x2={elbowX}
                  y2={elbowZ}
                  stroke="#454c57"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={elbowX}
                  y1={elbowZ}
                  x2={s.pos[0]}
                  y2={s.pos[2]}
                  stroke="#454c57"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {/* Live camera viewport */}
          {cameraView && (
            <>
              <circle
                cx={cameraView.x}
                cy={cameraView.z}
                r={cameraView.radius}
                fill="rgba(201,168,90,0.06)"
                stroke="#c9a85a"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <circle
                cx={cameraView.x}
                cy={cameraView.z}
                r={3}
                fill="#c9a85a"
                pointerEvents="none"
              />
            </>
          )}

          {/* Station dots */}
          {STATIONS.map((s) => {
            const isActive = s.plantId === activeId;
            const tint = STATION_TYPE_TINT[s.type];
            const statusColour =
              s.status === "critical" ? "#ef4444" :
              s.status === "warning"  ? "#f59e0b" :
                                        tint;
            return (
              <g
                key={s.id}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  panToWorld(s.pos[0], s.pos[2]);
                  selectStation(s.id);
                }}
              >
                {/* Halo when active */}
                {isActive && (
                  <circle
                    cx={s.pos[0]}
                    cy={s.pos[2]}
                    r={12}
                    fill="none"
                    stroke={tint}
                    strokeWidth={0.8}
                    strokeOpacity={0.85}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <circle
                  cx={s.pos[0]}
                  cy={s.pos[2]}
                  r={5}
                  fill={statusColour}
                  stroke="#0a0e1a"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
                {s.status === "critical" && (
                  <circle
                    cx={s.pos[0]}
                    cy={s.pos[2]}
                    r={8}
                    fill="none"
                    stroke={statusColour}
                    strokeWidth={0.8}
                    strokeOpacity={0.6}
                    vectorEffect="non-scaling-stroke"
                  >
                    <animate
                      attributeName="r"
                      values="8;14;8"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.6;0;0.6"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {/* Label */}
                <text
                  x={s.pos[0] + 8}
                  y={s.pos[2] - 8}
                  fill={tint}
                  fontSize={9}
                  fontFamily="ui-monospace, Menlo, monospace"
                  style={{ pointerEvents: "none", textShadow: "0 0 3px #0a0e1a" }}
                  vectorEffect="non-scaling-stroke"
                >
                  {STATION_TYPE_LABEL[s.type]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Footer */}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between font-mono text-[8px] text-text-muted">
          <span>click pan · drag scroll · wheel zoom</span>
          <span className="text-emerald-400">● live</span>
        </div>
      </div>
    </div>
  );
}
