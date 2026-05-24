"use client";

import { Html } from "@react-three/drei";
import type { ScenePOI } from "@/lib/mock/scenePOIs";

/** In-scene popover card anchored above a POI in 3D space. Uses the
 *  `.scene-actor-card` CSS class already defined in globals.css. */
export function SceneActorCard({
  poi,
  onClose,
}: {
  poi: ScenePOI;
  onClose: () => void;
}) {
  const statusLabel =
    poi.status === "critical"
      ? "Critical"
      : poi.status === "offline"
        ? "Offline"
        : "Operating · Online";
  const statusTone =
    poi.status === "critical"
      ? { bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.3)", dot: "#f43f5e" }
      : poi.status === "offline"
        ? { bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.3)", dot: "#94a3b8" }
        : { bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.25)", dot: "#34d399" };

  return (
    <Html
      position={[poi.pos[0], poi.pos[1] + 7, poi.pos[2]]}
      center
      zIndexRange={[100, 0]}
    >
      <div
        className="scene-actor-card"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div className="sac-name">{poi.name}</div>
          <button
            className="sac-x"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ×
          </button>
        </header>
        <div className="sac-role">{poi.role}</div>
        <div
          className="sac-status"
          style={{
            background: statusTone.bg,
            borderColor: statusTone.border,
          }}
        >
          <span className="sac-dot" style={{ background: statusTone.dot, boxShadow: `0 0 8px ${statusTone.dot}` }} />
          {statusLabel}
        </div>
        <div className="sac-meta">
          {poi.capacity && (
            <div>
              <span>Capacity</span>
              <strong>{poi.capacity}</strong>
            </div>
          )}
          {poi.power && (
            <div>
              <span>Output</span>
              <strong>{poi.power}</strong>
            </div>
          )}
          {poi.health != null && (
            <div>
              <span>Health</span>
              <strong>{poi.health}%</strong>
            </div>
          )}
          <div>
            <span>POI ID</span>
            <strong>{poi.id}</strong>
          </div>
        </div>
        <div className="sac-actions">
          <button>Inspect</button>
          <button>Diagnose</button>
          <button>Dispatch</button>
          <button className="destructive">Isolate</button>
        </div>
      </div>
    </Html>
  );
}
