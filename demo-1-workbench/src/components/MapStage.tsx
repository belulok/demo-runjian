import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  useTransformContext,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import type { Plant, PlantStatus } from '../types';
import { PLANTS } from '../data';
import mapUrl from '../../map.png?url';
import { MapPixiOverlay } from './MapPixiOverlay';
import { MapSvgEffects } from './MapSvgEffects';
import { RoadNetwork } from './RoadNetwork';

interface Props {
  selectedPlantId: string | null;
  onSelectPlant: (p: Plant | null) => void;
  onPeekAction: (action: string, plantId: string) => void;
  /** Bottom action bar — rendered inside the stage so the existing absolute positioning works. */
  actionBar?: React.ReactNode;
  /** Open the global command palette (peek "More commands…" link). */
  onOpenPalette?: () => void;
}

/** Small floating HUD that reads the live zoom/pan from react-zoom-pan-pinch. */
function MapHudBottom() {
  const { transformState } = useTransformContext();
  const [coord, setCoord] = useState('—');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.querySelector('.map-wrap') as HTMLElement | null;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      setCoord(`${x}% , ${y}%`);
    };
    const onLeave = () => setCoord('—');
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="map-hud-bottom" ref={wrapRef}>
      <div className="map-zoom-chip">
        <span className="mz-label">ZOOM</span>
        <span className="mz-val">{transformState.scale.toFixed(2)}×</span>
      </div>
      <div className="map-coord-chip">
        <span className="mc-label">CURSOR</span>
        <span className="mc-val">{coord}</span>
      </div>
      <div className="map-hint">
        <span>scroll to zoom · drag to pan the map · momentum on release</span>
      </div>
    </div>
  );
}

/** Top HUD with proper zoom buttons that drive react-zoom-pan-pinch. */
function MapHudTop({ time }: { time: string }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="map-hud-top">
      <div className="map-zoom">
        <button onClick={() => zoomIn(0.3, 280)} title="Zoom in (+)" aria-label="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button onClick={() => zoomOut(0.3, 280)} title="Zoom out (−)" aria-label="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M5 12h14" />
          </svg>
        </button>
        <button onClick={() => resetTransform(380, 'easeOutCubic' as any)} title="Reset view (0)" aria-label="Reset view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </button>
      </div>

      <div className="map-clock">
        <div className="clock-time">{time}</div>
        <div className="clock-date">17 May 2026 · Malaysia / Kuala Lumpur</div>
      </div>

      <div className="map-legend">
        <div className="legend-row"><span className="dot normal" /> Online <span className="legend-n">4</span></div>
        <div className="legend-row"><span className="dot alert" /> Alarm <span className="legend-n">1</span></div>
        <div className="legend-row"><span className="dot offline" /> Offline <span className="legend-n">0</span></div>
      </div>
    </div>
  );
}

/** Re-usable plant peek popover — shown next to the selected plant. */
function PlantPeek({
  plant, anchorEl, onAction, onClose, onOpenPalette,
}: { plant: Plant; anchorEl: HTMLElement; onAction: (a: string) => void; onClose: () => void; onOpenPalette?: () => void }) {
  const peekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function reposition() {
      if (!peekRef.current || !anchorEl) return;
      const stage = document.getElementById('stage');
      if (!stage) return;
      const a = anchorEl.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const left = a.left - s.left + a.width / 2 - 120;
      const top = a.top - s.top + a.height + 8;
      peekRef.current.style.left = Math.max(20, Math.min(stage.clientWidth - 260, left)) + 'px';
      peekRef.current.style.top = top + 'px';
    }
    reposition();
    const obs = new MutationObserver(reposition);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'transform'] });
    window.addEventListener('resize', reposition);
    return () => { obs.disconnect(); window.removeEventListener('resize', reposition); };
  }, [anchorEl]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!peekRef.current) return;
      const target = e.target as HTMLElement;
      if (peekRef.current.contains(target)) return;
      if (target.closest('.plant')) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="plant-peek" ref={peekRef}>
      <div className="peek-head">
        <div className="peek-title">{plant.name}</div>
        <div className={`peek-tag ${plant.status === 'critical' ? 'alert' : ''}`}>
          {plant.status === 'critical' ? 'CRITICAL' : 'NORMAL'}
        </div>
      </div>
      <div className="peek-stats">
        <div><span>Capacity</span><strong>{plant.cap}</strong></div>
        <div><span>OEM</span><strong>{plant.oem}</strong></div>
        <div><span>Today</span><strong>{plant.today}</strong></div>
        <div><span>Status</span><strong>{plant.status === 'critical' ? `Alarm (${plant.alarms || 1})` : 'Online'}</strong></div>
      </div>
      <div className="peek-section-label">MONITORING</div>
      <div className="peek-actions">
        <button onClick={() => onAction('monitor.plant')}>📡 Live Monitor</button>
        <button onClick={() => onAction('monitor.device')}>🛠 Device Status</button>
        <button onClick={() => onAction('monitor.video')}>🎥 CCTV / PTZ</button>
      </div>

      <div className="peek-section-label">DIAGNOSTICS</div>
      <div className="peek-actions">
        <button onClick={() => onAction('alarm.device')}>🚨 Active Alarms</button>
        <button onClick={() => onAction('inspect.start')}>🔎 Run SOP</button>
        <button onClick={() => onAction('analysis.trend')}>📈 Trend</button>
      </div>

      <div className="peek-section-label">DISPATCH</div>
      <div className="peek-actions">
        <button onClick={() => onAction('ticket.create')}>📝 Work Order</button>
        <button onClick={() => onAction('ticket.dispatch')}>🚐 Dispatch Crew</button>
        <button onClick={() => onAction('asset.maintenance')}>🔧 Maintenance</button>
      </div>

      <div className="peek-section-label">REPORTS & ESCALATE</div>
      <div className="peek-actions">
        <button onClick={() => onAction('report.smart')}>🤖 Smart Report</button>
        <button onClick={() => onAction('ticket.history')}>📜 History</button>
        <button className="destructive" onClick={() => onAction('alarm.escalate')}>🆘 SOS</button>
      </div>

      <button className="peek-more" onClick={() => { onClose(); onOpenPalette?.(); }}>
        Open command palette · {65}+ BO commands  ⌘K →
      </button>
    </div>
  );
}

function statusClass(status: PlantStatus): string {
  if (status === 'critical') return 'alert';
  if (status === 'offline') return 'offline';
  return 'normal';
}

export function MapStage({ selectedPlantId, onSelectPlant, onPeekAction, actionBar, onOpenPalette }: Props) {
  const wrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // live MYT clock
  const [time, setTime] = useState(() => formatMyt());
  useEffect(() => {
    const id = setInterval(() => setTime(formatMyt()), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedPlant = useMemo(
    () => PLANTS.find(p => p.id === selectedPlantId) || null,
    [selectedPlantId]
  );
  const selectedEl = selectedPlant ? document.querySelector<HTMLElement>(`.plant[data-id="${selectedPlant.id}"]`) : null;

  // Allow programmatic focus to Penang when alarms fire elsewhere
  function focusPenang() {
    wrapperRef.current?.zoomToElement('plant-penang' as any, 1.6, 600, 'easeOutCubic');
  }

  return (
    <section className="stage" id="stage" ref={stageRef}>
      <div className="map-wrap">
        <TransformWrapper
          ref={wrapperRef}
          initialScale={1.3}
          minScale={1}
          maxScale={3.4}
          centerOnInit
          limitToBounds                    /* clamp pan so you never see past the image */
          smooth
          wheel={{ step: 0.16, smoothStep: 0.008 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{
            velocityDisabled: false,
            excluded: ['plant', 'plant-icon', 'plant-label', 'plant-peek', 'map-hud-top', 'map-hud-bottom'],
          }}
          velocityAnimation={{
            sensitivity: 0.85,
            animationTime: 520,
            animationType: 'easeOutCubic',
            equalToMove: true,
          }}
        >
          <>
            <TransformComponent
              wrapperClass="rpp-wrap"
              contentClass="rpp-content"
            >
              <MapWorld />
            </TransformComponent>

            <MapHudTop time={time} />
            <MapHudBottom />
          </>
        </TransformWrapper>

        {/* peek popover lives outside the transform so it doesn't scale with the world */}
        {selectedPlant && selectedEl && (
          <PlantPeek
            plant={selectedPlant}
            anchorEl={selectedEl}
            onAction={(a) => onPeekAction(a, selectedPlant.id)}
            onClose={() => onSelectPlant(null)}
            onOpenPalette={onOpenPalette}
          />
        )}
      </div>

      {actionBar}
    </section>
  );

  // ----------- inner world ---------------
  function MapWorld() {
    return (
      <div className="map-world">
        {/* iso background — large detailed power compound */}
        <div className="map-bg-wrap">
          <img className="map-bg-img" src={mapUrl} alt="" draggable={false} />
          <div className="map-tod" />
          <div className="map-vignette" />
        </div>

        {/* SVG effects targeted at landmarks (river shimmer, heat shimmer,
            aviation lights, lightning arcs, solar glints) */}
        <MapSvgEffects />

        {/* GPU particle system (cooling-tower smoke, steam, substation sparks) */}
        <MapPixiOverlay />

        <div className="map-clouds">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>

        <div className="sun-flare" />

        {/* ============= ROAD NETWORK =============
            Replaces the old dashed point-to-point lines + 3 sprite actors with a
            structured road grid + many actors (cars, vans, trucks, technicians
            with wearable broadcast rings, drone, helicopter). */}
        <RoadNetwork />

        {/* Central command radar sweep — slow rotating cone only (shockwaves removed) */}
        <div className="cmd-radar">
          <div className="radar-cone" />
        </div>

        {/* alarm beacon */}
        <div className="alarm-ping">
          <div className="ap-ring" />
          <div className="ap-ring d" />
          <div className="ap-ring d2" />
          <div className="ap-text">⚠ ALARM</div>
        </div>

        {/* plant markers */}
        <div className="plants">
          {PLANTS.map(p => {
            const isSel = p.id === selectedPlantId;
            const isAlert = p.status === 'critical';
            return (
              <button
                key={p.id}
                id={`plant-${p.id}`}
                className={`plant ${isAlert ? 'alert' : ''} ${isSel ? 'selected' : ''}`}
                data-id={p.id}
                style={{ ['--mx' as any]: `${p.x}%`, ['--my' as any]: `${p.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlant(p);
                }}
              >
                <div className={`plant-pulse ${isAlert ? 'alert' : ''}`} />
                <div className="plant-icon">
                  <img src="/generated/electrical/solar-panel.png" alt="" />
                </div>
                {isAlert && p.alarms ? <div className="plant-alert-badge">{p.alarms}</div> : null}
                <div className={`plant-label ${isAlert ? 'alert' : ''}`}>
                  <div className={`plant-status ${statusClass(p.status)}`} />
                  <div className="plant-name">{p.name.split('-')[0]}</div>
                  <div className="plant-power">{p.capMW < 1 ? `${Math.round(p.capMW * 1000)} kWp` : `${p.capMW.toFixed(2)} MWp`}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

function formatMyt(): string {
  const d = new Date();
  const offset = 8 * 60 * 60 * 1000;
  const ts = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + offset);
  return `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}:${String(ts.getSeconds()).padStart(2, '0')}`;
}
