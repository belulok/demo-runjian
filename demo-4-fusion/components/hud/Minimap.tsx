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
import { PLANT_BY_ID } from "@/lib/mock/plants";
import { getSceneMeta, PLANT_POIS, type SceneFacility } from "@/lib/mock/scenePOIs";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";

/**
 * Top-down minimap bound to the active sector's 3D world.
 *
 *  - Click without drag → pan the 3D camera to that world (x, z).
 *  - Drag (>5px) → scroll the minimap's own viewport independently of the
 *    3D world. Lets you look beyond the building cluster.
 *  - Wheel → zoom the minimap viewport around the cursor.
 *  - The minimap viewport is NOT anchored to the building bounds — pan and
 *    zoom are free. The double-circle recenter button resets to the active
 *    sector's bounds.
 */
const PADDING = 12; // world-unit padding on the bbox
const DRAG_THRESHOLD = 5; // pixels — distinguishes click from drag
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;

const KIND_COLOR: Record<SceneFacility["kind"], string> = {
  building: "#586071",
  tank:     "#7a8f7e",
  yard:     "#b3a880",
  tower:    "#4a5066",
  gate:     "#facc15",
  pad:      "#cbd5e1",
  array:    "#1f3a5e",
};

export function Minimap() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const cameraView = useWorldStore((s) => s.cameraView);
  const panToWorld = useWorldStore((s) => s.panToWorld);
  const svgRef = useRef<SVGSVGElement>(null);

  const active = PLANT_BY_ID[activeId];
  const meta = useMemo(() => getSceneMeta(activeId), [activeId]);
  const pois = useMemo(() => PLANT_POIS[activeId] ?? [], [activeId]);

  // Base viewport — what we show before any user pan/zoom
  const base = useMemo(() => {
    const b = meta.bounds;
    return {
      minX: b.minX - PADDING,
      minZ: b.minZ - PADDING,
      width: b.maxX - b.minX + PADDING * 2,
      height: b.maxZ - b.minZ + PADDING * 2,
    };
  }, [meta]);

  // User pan offset (world units) + zoom factor (>1 = zoomed in)
  const [panX, setPanX] = useState(0);
  const [panZ, setPanZ] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Reset pan + zoom whenever the active sector changes
  useEffect(() => {
    setPanX(0);
    setPanZ(0);
    setZoom(1);
  }, [activeId]);

  // Drag state — refs so we don't re-render on every move
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
      // Each on-screen pixel maps to (viewportWidth / rectWidth) world units.
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
    // Anchor zoom around the cursor — feels natural while exploring the map.
    const before = screenToWorld(e.clientX, e.clientY);
    if (!before) return;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? 1.18 : 1 / 1.18;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (nextZoom === zoom) return;
    // Adjust pan so the world coord under the cursor stays put after zoom.
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
            Sector Map
          </OrnateTitle>
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[8px] text-text-muted truncate max-w-[80px]"
              title={active?.name}
            >
              {active?.region.slice(0, 3).toUpperCase() ?? "—"} · {pois.length} poi
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
            <pattern id="mm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="0.4" />
            </pattern>
          </defs>

          {/* Background grid — huge so it covers any pan offset */}
          <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#mm-grid)" />

          {/* Site pad outline */}
          <rect
            x={meta.bounds.minX}
            y={meta.bounds.minZ}
            width={meta.bounds.maxX - meta.bounds.minX}
            height={meta.bounds.maxZ - meta.bounds.minZ}
            fill="rgba(227, 218, 193, 0.05)"
            stroke="rgba(201, 168, 90, 0.18)"
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
          />

          {/* Facility footprints */}
          {meta.facilities.map((f, i) => (
            <rect
              key={i}
              x={f.pos[0] - f.size[0] / 2}
              y={f.pos[1] - f.size[1] / 2}
              width={f.size[0]}
              height={f.size[1]}
              fill={KIND_COLOR[f.kind]}
              fillOpacity={0.55}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={0.3}
              vectorEffect="non-scaling-stroke"
            />
          ))}

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
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <circle
                cx={cameraView.x}
                cy={cameraView.z}
                r={2}
                fill="#c9a85a"
                pointerEvents="none"
              />
            </>
          )}

          {/* Active-sector POIs */}
          {pois.map((p) => {
            const colour =
              p.status === "critical" ? "#ef4444" :
              p.status === "offline"  ? "#94a3b8" :
                                        "#34d399";
            return (
              <g
                key={p.id}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  panToWorld(p.pos[0], p.pos[2]);
                }}
              >
                <circle
                  cx={p.pos[0]}
                  cy={p.pos[2]}
                  r={3.5}
                  fill={colour}
                  stroke="#0a0e1a"
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                />
                {p.status === "critical" && (
                  <circle
                    cx={p.pos[0]}
                    cy={p.pos[2]}
                    r={5.5}
                    fill="none"
                    stroke={colour}
                    strokeWidth={0.7}
                    strokeOpacity={0.6}
                    vectorEffect="non-scaling-stroke"
                  >
                    <animate
                      attributeName="r"
                      values="5.5;9;5.5"
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
