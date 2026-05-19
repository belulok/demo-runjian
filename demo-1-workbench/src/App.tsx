import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { AgentRail } from './components/AgentRail';
import { ChatPanel } from './components/ChatPanel';
import { ActionBar } from './components/ActionBar';
import { BoToast } from './components/BoToast';
import { MapStage } from './components/MapStage';
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
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [toastPayload, setToastPayload] = useState<object | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const fireBoAction = useCallback((payload: Record<string, unknown>) => {
    const full = {
      timestamp: new Date().toISOString(),
      source: 'irun-workbench-fe',
      method: 'api_or_rpa_bridge',
      boTarget: 'IRUN-BO/CMS',
      tenant: 'International Landing Plants',
      user: 'hunter',
      ...payload,
    };
    setToastPayload(full);
  }, []);

  const onAction = useCallback((key: ActionKey) => {
    const payload = { ...ACTION_PAYLOADS[key], plantId: selectedPlantId || 'penang' };
    fireBoAction({ source_panel: 'action_bar', ...payload });
  }, [selectedPlantId, fireBoAction]);

  const onPeekAction = useCallback((action: string, plantId: string) => {
    // The peek now passes BO command IDs (e.g. "monitor.plant", "alarm.escalate").
    // Resolve them through the BO_COMMANDS catalog when possible; fall back to a raw action.
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
  }, []);

  // Run any command from the palette / chat / agent — fires a BO payload toast.
  const runCommand = useCallback((cmd: BoCommand) => {
    fireBoAction({
      source_panel: 'command_palette',
      command_id: cmd.id,
      category: cmd.category,
      plantId: selectedPlantId || 'penang',
      ...cmd.payload,
    });
  }, [selectedPlantId, fireBoAction]);

  // hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      // ⌘K / Ctrl+K opens the palette even while typing in an input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
        return;
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

  return (
    <div className="app">
      <TopBar />
      <main className={`layout ${chatCollapsed ? 'chat-collapsed' : ''}`}>
        <MapStage
          selectedPlantId={selectedPlantId}
          onSelectPlant={onSelectPlant}
          onPeekAction={onPeekAction}
          actionBar={<ActionBar onAction={onAction} />}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <ChatPanel
          agentKey={activeAgent}
          collapsed={chatCollapsed}
          onCollapse={() => setChatCollapsed(true)}
          onFire={onChatFire}
        />
        <AgentRail activeAgent={activeAgent} onSelect={setActiveAgent} />

        {chatCollapsed && (
          <button className="chat-reopen" onClick={() => setChatCollapsed(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
            <span>Agent Chat</span>
          </button>
        )}
      </main>
      <BoToast payload={toastPayload} onClose={() => setToastPayload(null)} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRun={runCommand}
      />

      {/* Floating "⌘K" launcher pinned bottom-right */}
      <button className="cmdk-launcher" onClick={() => setPaletteOpen(true)} title="Open command palette (⌘K)">
        <span className="cmdk-launcher-icon">⌘K</span>
        <span className="cmdk-launcher-text">{BO_COMMANDS.length} BO commands</span>
      </button>
    </div>
  );
}
