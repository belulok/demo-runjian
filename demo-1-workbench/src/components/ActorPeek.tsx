import { useEffect, useRef } from 'react';
import type { ActorInfo } from './RoadNetwork';

interface Props {
  actor: ActorInfo;
  anchorEl: SVGGElement | null;
  onClose: () => void;
  onAction: (action: string, actor: ActorInfo) => void;
}

const ACTIONS_BY_KIND: Record<ActorInfo['kind'], { id: string; label: string; icon: string; destructive?: boolean }[]> = {
  van: [
    { id: 'track',   label: 'Track',   icon: '📍' },
    { id: 'recall',  label: 'Recall',  icon: '↩' },
    { id: 'contact', label: 'Contact', icon: '📞' },
  ],
  ambulance: [
    { id: 'dispatch', label: 'Dispatch',  icon: '🚐' },
    { id: 'track',    label: 'Track',     icon: '📍' },
    { id: 'sos',      label: 'SOS',       icon: '🆘', destructive: true },
  ],
  crew: [
    { id: 'message',  label: 'Message',   icon: '💬' },
    { id: 'reassign', label: 'Reassign',  icon: '↪' },
    { id: 'sop',      label: 'View SOP',  icon: '📋' },
  ],
  engineer: [
    { id: 'message',   label: 'Message',     icon: '💬' },
    { id: 'wearable',  label: 'Wearable',    icon: '⌚' },
    { id: 'biometric', label: 'Biometric',   icon: '❤️' },
  ],
  manager: [
    { id: 'message',  label: 'Message',  icon: '💬' },
    { id: 'approve',  label: 'Approve',  icon: '✔' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
  ],
  drone: [
    { id: 'recall',   label: 'Recall',         icon: '↩' },
    { id: 'stream',   label: 'Live Stream',    icon: '📺' },
    { id: 'thermal',  label: 'Thermal Sweep',  icon: '🌡' },
  ],
  helicopter: [
    { id: 'recall', label: 'Recall', icon: '↩' },
    { id: 'track',  label: 'Track',  icon: '📍' },
  ],
};

export function ActorPeek({ actor, anchorEl, onClose, onAction }: Props) {
  const peekRef = useRef<HTMLDivElement>(null);

  // reposition near the anchor element each frame for moving actors
  useEffect(() => {
    if (!anchorEl) return;
    let raf = 0;
    function tick() {
      if (!peekRef.current || !anchorEl) return;
      const stage = document.getElementById('stage');
      if (!stage) return;
      const a = anchorEl.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const left = a.left - s.left + a.width / 2 - 140;
      const top = a.top - s.top + a.height + 8;
      peekRef.current.style.left = Math.max(20, Math.min(stage.clientWidth - 300, left)) + 'px';
      peekRef.current.style.top = top + 'px';
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchorEl]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!peekRef.current) return;
      const target = e.target as HTMLElement;
      if (peekRef.current.contains(target)) return;
      if (target.closest('.map-actor')) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = ACTIONS_BY_KIND[actor.kind] ?? [];

  return (
    <div className="actor-peek" ref={peekRef}>
      <div className="peek-head">
        <div className="peek-title">{actor.name}</div>
        <div className="peek-tag">{actor.kind.toUpperCase()}</div>
      </div>
      <div className="actor-peek-sub">{actor.role}</div>
      <div className="actor-peek-status">
        <span className="dot" />
        {actor.status}
      </div>

      <div className="peek-stats">
        {Object.entries(actor.meta).slice(0, 4).map(([k, v]) => (
          <div key={k}><span>{k}</span><strong>{v}</strong></div>
        ))}
      </div>

      <div className="peek-actions">
        {actions.map(a => (
          <button
            key={a.id}
            className={a.destructive ? 'destructive' : ''}
            onClick={() => onAction(a.id, actor)}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
