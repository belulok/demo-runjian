import { useCallback, useEffect, useRef, useState } from 'react';
import { MissionBar } from './components/MissionBar';
import { EventFeed, type FeedEntry } from './components/EventFeed';
import { Telemetry } from './components/Telemetry';
import { ChatPanel } from './components/ChatPanel';
import { ActionBar } from './components/ActionBar';
import { BoToast } from './components/BoToast';
import { Scene3D } from './components/Scene3D';
import { CommandPalette } from './components/CommandPalette';
import { ACTIONS } from './data';
import { BO_COMMANDS, findCommand, type BoCommand } from './data/commands';
import type { ActionKey, AgentKey, Plant } from './types';

const ACTION_PAYLOADS: Record<ActionKey, Record<string, unknown>> = {
  'view-alarms': { action: 'VIEW_ALARMS', scope: 'region', count: 2 },
  'work-order':  { action: 'CREATE_WORK_ORDER', template: 'PV_INSPECTION' },
  'dispatch':    { action: 'DISPATCH_CREW', team: 'Team-2' },
  'inspect':     { action: 'START_INSPECTION', sop: 'PV-SOP-014', steps: 14 },
  'history':     { action: 'OPEN_TICKET_HISTORY', range: 'last_30d' },
  'report':      { action: 'GENERATE_SMART_REPORT', period: 'daily' },
  'maintenance': { action: 'SCHEDULE_MAINTENANCE' },
  'sos':         { action: 'SOS_ESCALATE', priority: 'P0', notify: ['oncall', 'manager'] },
};

export default function App() {
  const [activeAgent, setActiveAgent] = useState<AgentKey>('alarm');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [toastPayload, setToastPayload] = useState<object | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const feedIdRef = useRef(0);

  const pushFeed = useCallback((sev: FeedEntry['sev'], html: string) => {
    feedIdRef.current += 1;
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setFeed(prev => [{ id: feedIdRef.current, sev, html, ts }, ...prev].slice(0, 80));
  }, []);

  const fireBoAction = useCallback((payload: Record<string, unknown>) => {
    const full = {
      timestamp: new Date().toISOString(),
      source: 'runjian-command-fe',
      method: 'api_or_rpa_bridge',
      boTarget: 'IRUN-BO/CMS',
      tenant: 'International Landing Plants',
      user: 'hunter',
      clearance: 'P3',
      ...payload,
    };
    setToastPayload(full);
    const act = (payload.action as string | undefined) ?? (payload.command_id as string | undefined) ?? 'COMMAND';
    pushFeed(
      act.toString().toUpperCase().includes('SOS') ? 'crit' : 'info',
      `<strong>BO/CMS</strong> · ${act} dispatched`,
    );
  }, [pushFeed]);

  const onAction = useCallback((key: ActionKey) => {
    const payload = { ...ACTION_PAYLOADS[key], plantId: selectedPlantId || 'penang' };
    fireBoAction({ source_panel: 'action_bar', ...payload });
  }, [selectedPlantId, fireBoAction]);

  const onPeekAction = useCallback((action: string, plantId: string) => {
    const cmd = findCommand(action);
    if (cmd) {
      fireBoAction({ source_panel: 'plant_peek', command_id: cmd.id, category: cmd.category, plantId, ...cmd.payload });
    } else {
      fireBoAction({ source_panel: 'plant_peek', action: action.toUpperCase(), plantId });
    }
  }, [fireBoAction]);

  const onChatFire = useCallback((action: string, plantId?: string, team?: string) => {
    fireBoAction({ source_panel: 'agent_chat', action, plantId, team });
  }, [fireBoAction]);

  const onSelectPlant = useCallback((p: Plant | null) => {
    setSelectedPlantId(p ? p.id : null);
    if (p) pushFeed('info', `<strong>OPERATOR</strong> · target acquired: <strong>${p.name}</strong>`);
  }, [pushFeed]);

  const runCommand = useCallback((cmd: BoCommand) => {
    fireBoAction({
      source_panel: 'command_palette',
      command_id: cmd.id,
      category: cmd.category,
      plantId: selectedPlantId || 'penang',
      ...cmd.payload,
    });
  }, [selectedPlantId, fireBoAction]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(o => !o); return;
      }
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (e.shiftKey && k === 'q') { onAction('sos'); return; }
      const match = ACTIONS.find(a => a.hotkey.toLowerCase() === k);
      if (match) onAction(match.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAction]);

  // Seed the feed + ambient stream
  useEffect(() => {
    const seed: Array<[FeedEntry['sev'], string]> = [
      ['crit', '<strong>PS-02 PENANG</strong> · DC arc fault detected on Inverter #4'],
      ['warn', '<strong>PS-02 PENANG</strong> · Combiner Box 2 thermal +24°C above baseline'],
      ['info', '<strong>DRONE-01</strong> · pre-flight check OK · ETA 6 min'],
      ['info', '<strong>VAN-04</strong> · departing depot · payload: spare IGBT module'],
      ['ok',   '<strong>PS-04 MELAKA</strong> · daily yield target met (1.84 MWh)'],
      ['info', '<strong>AI · Diagnosis</strong> · Bayesian inference complete · arc fault 91% conf.'],
      ['info', '<strong>PR</strong> · portfolio performance ratio steady at 84.2%'],
      ['warn', '<strong>PS-05 JOHOR</strong> · WO-2026-0418 overdue (3 days)'],
    ];
    seed.forEach(([sev, html]) => pushFeed(sev, html));
    const stream: Array<[FeedEntry['sev'], string]> = [
      ['ok',   '<strong>TEAM-2 (CHEN WEI)</strong> · acknowledged dispatch · status: en route'],
      ['info', '<strong>SAT</strong> · irradiance 746 W/m² · clear sky window 14:00–17:00'],
      ['info', '<strong>AGENT · PV ASSISTANT</strong> · soiling estimate Perak -1.3pp'],
      ['ok',   '<strong>UPLINK</strong> · BO/CMS bridge healthy · 142ms RTT'],
      ['info', '<strong>HELI-02</strong> · refuel cycle complete'],
      ['info', '<strong>WEARABLE · Wang Min</strong> · heart-rate 72bpm · ok'],
      ['ok',   '<strong>PERIMETER</strong> · no intrusion detected · 2h since last sweep'],
    ];
    let idx = 0;
    const tid = window.setInterval(() => {
      const [sev, html] = stream[idx % stream.length]; idx++;
      pushFeed(sev, html);
    }, 4200);
    return () => clearInterval(tid);
  }, [pushFeed]);

  return (
    <div className="cmd-app">
      <MissionBar />

      <main className="cmd-grid">
        <aside className="col-left">
          <EventFeed entries={feed} />
        </aside>

        <section className="col-center">
          <Scene3D
            selectedPlantId={selectedPlantId}
            onSelectPlant={onSelectPlant}
            onPeekAction={onPeekAction}
            actionBar={<ActionBar onAction={onAction} />}
          />
        </section>

        <aside className="col-right">
          <ChatPanel
            agentKey={activeAgent}
            collapsed={false}
            onCollapse={() => { /* not collapsible in command layout */ }}
            onFire={onChatFire}
            onSelectAgent={setActiveAgent}
          />
          <Telemetry />
        </aside>
      </main>

      <BoToast payload={toastPayload} onClose={() => setToastPayload(null)} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRun={runCommand}
      />

      <button className="cmdk-launcher" onClick={() => setPaletteOpen(true)} title="Open command palette (⌘K)">
        <span className="cmdk-launcher-icon">⌘K</span>
        <span className="cmdk-launcher-text">{BO_COMMANDS.length} BO commands</span>
      </button>
    </div>
  );
}
