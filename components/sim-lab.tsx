'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Cable,
  Radio,
  ShieldCheck,
  ZoomIn,
  Maximize,
  Expand,
  Shrink,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Scenario, ScenarioId, SimulationState } from '@/lib/simulation';
import { LabHeader } from './lab-header';
import { SiteDiagram, siteNames } from './site-diagram';

type Snapshot = { state: SimulationState; scenario: Scenario };
type Tab = 'exchange' | 'events' | 'setup';

const statusNames: Record<SimulationState['status'], string> = {
  nominal: 'Awaiting input',
  observing: 'Input processed',
  contained: 'Change contained',
  compromised: 'Environment changed',
};
const effectNames: Record<ScenarioId, [string, string]> = {
  'smart-farm': ['Irrigation idle', 'Zone C · valve open'],
  'water-treatment': ['Flow balanced', 'Reservoir above limit'],
  warehouse: ['Nominal route', 'Restricted route'],
  'hospital-climate': ['Comfort maintained', 'Room 04 · out of range'],
  'smart-building': ['Door D-03 locked', 'Door D-03 unlocked'],
  'strategic-command': ['Gate verified', 'Gate requires review'],
};

function timestamp(value: string) {
  return new Date(value).toISOString().slice(11, 23) + ' UTC';
}

function workbenchProfile(
  scenario: Scenario,
  origin: string,
  security: 'basic' | 'validated',
) {
  return {
    name: `SimLab · ${scenario.shortName} · ${security === 'basic' ? 'Basic' : 'Validated'}`,
    environment: 'staging',
    connector: 'http',
    endpoint: `${origin}/api/simulations/${scenario.id}/agent`,
    method: 'POST',
    headers: {
      'X-SimLab-Source': 'workbench',
      'X-SimLab-Security': security,
    },
    request_template: '{"input":"{{body}}"}',
    response_path: 'text',
    actions_path: 'actions',
    evidence: {
      response_markers: [],
      forbidden_tools: ['simulated_control_change'],
    },
  };
}

export function SimLab({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [connection, setConnection] = useState<
    'connecting' | 'live' | 'offline'
  >('connecting');
  const [tab, setTab] = useState<Tab>('exchange');
  const [zoomed, setZoomed] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [origin, setOrigin] = useState('http://127.0.0.1:4318');
  const panels = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLElement>(null);
  const { state, scenario } = snapshot;
  const id = scenario.id;

  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(`/api/simulations/${id}/state`, {
          cache: 'no-store',
          signal: abort.signal,
        });
        if (!response.ok) throw new Error('Snapshot unavailable');
        const next = (await response.json()) as Snapshot;
        if (!disposed) {
          setSnapshot(next);
          setOrigin(window.location.origin);
          setConnection('live');
        }
      } catch {
        if (!disposed) setConnection('offline');
      } finally {
        if (!disposed) timer = setTimeout(() => void poll(), 900);
      }
    }
    void poll();
    return () => {
      disposed = true;
      abort.abort();
      clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    if (!presenting) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (document.fullscreenElement === world.current) {
        void document.exitFullscreen().catch(() => {
          if (!document.fullscreenElement) setPresenting(false);
        });
      } else {
        setPresenting(false);
      }
    }
    function handleFullscreen() {
      if (document.fullscreenElement !== world.current) setPresenting(false);
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [presenting]);

  async function togglePresentation() {
    if (presenting) {
      if (document.fullscreenElement === world.current) {
        try {
          await document.exitFullscreen();
        } catch {
          return;
        }
      }
      setPresenting(false);
      return;
    }
    setZoomed(false);
    setSelected(null);
    setPresenting(true);
    try {
      await world.current?.requestFullscreen?.();
    } catch {
      // Fill the browser viewport when native fullscreen is unavailable.
    }
  }

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setNotice('Clipboard unavailable. Select and copy the visible text.');
    }
  }

  function showSetup() {
    setTab('setup');
    panels.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const hasInput = state.lastSource !== null;
  const changed = state.status === 'compromised';
  const endpoint = `${origin}/api/simulations/${id}/agent`;
  const output = {
    text: state.responseText,
    actions: state.actions,
    status: state.status,
    security_mode: state.mode === 'hardened' ? 'validated' : 'basic',
    scenario: id,
    metric: {
      label: scenario.metricLabel,
      value: state.metric,
      unit: scenario.metricUnit,
    },
    revision: state.revision,
    observed_at: state.updatedAt,
  };

  return (
    <>
      {!presenting && <LabHeader />}
      <main className="simulation-page" data-presenting={presenting}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">
            <ArrowLeft size={14} /> All environments
          </Link>
          <ChevronRight size={12} />
          <span>{scenario.shortName}</span>
        </nav>
        <div className="simulation-heading">
          <div>
            <span className="eyebrow">{scenario.domain} / OBSERVATION</span>
            <h1>{scenario.name}</h1>
            <p>{scenario.description}</p>
          </div>
          <Button
            variant="outline"
            className="setup-button"
            onClick={showSetup}
          >
            <Cable size={15} /> Workbench connection
          </Button>
        </div>

        <section
          ref={world}
          className="world-surface"
          data-presenting={presenting}
          aria-label={`${scenario.shortName} environment`}
        >
          <header className="world-toolbar">
            <div>
              <span className="plan-tag">SITE PLAN</span>
              <strong>{siteNames[id]}</strong>
            </div>
            <div className="diagram-view-controls">
              <span className={`observation-status status-${connection}`}>
                <i />
                {connection === 'live'
                  ? 'Live observation'
                  : connection === 'offline'
                    ? 'Connection lost · showing last state'
                    : 'Connecting…'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomed((value) => !value)}
                aria-label={
                  zoomed ? 'Fit diagram to view' : 'Zoom in on diagram'
                }
              >
                {zoomed ? <Maximize size={18} /> : <ZoomIn size={18} />}
                {zoomed ? 'Fit' : 'Zoom'}
              </Button>
              <Button
                variant="outline"
                className="present-button"
                onClick={() => void togglePresentation()}
                aria-label={
                  presenting ? 'Exit presentation' : 'Present simulation'
                }
                aria-pressed={presenting}
              >
                {presenting ? <Shrink size={18} /> : <Expand size={18} />}
                {presenting ? 'Exit' : 'Present'}
              </Button>
            </div>
          </header>
          <div className="drawing-surface" data-zoomed={zoomed}>
            <SiteDiagram
              id={id}
              status={state.status}
              metric={state.metric}
              revision={state.revision}
              selected={selected}
              onSelect={setSelected}
            />
            {selected && (
              <div className="component-detail">
                <Radio size={15} />
                <div>
                  <strong>{selected}</strong>
                  <span>
                    Part of {siteNames[id]}. Follow its input and resulting
                    state in the exchange below.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelected(null)}
                  aria-label="Close device detail"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>
          <div className="world-caption">
            <div className="diagram-legend">
              <span>
                <i className="legend-pipe" /> Physical connection
              </span>
              <span>
                <i className="legend-wire" /> Data channel
              </span>
              <span>
                <i className="legend-impact" /> Affected area
              </span>
            </div>
            <span>
              {zoomed
                ? 'Scroll to explore · click a device to inspect'
                : presenting
                  ? 'Live from Workbench · Esc to exit'
                  : 'Click a device to inspect · Present for full screen'}
            </span>
          </div>
          <div className="observation-strip" data-status={state.status}>
            <div>
              <span>{scenario.metricLabel}</span>
              <strong>
                {state.metric}
                <small>{scenario.metricUnit}</small>
              </strong>
              <em>
                Baseline {scenario.baseline}
                {scenario.metricUnit}
              </em>
            </div>
            <div>
              <span>Physical state</span>
              <strong className="state-value">
                {effectNames[id][changed ? 1 : 0]}
              </strong>
              <em>{hasInput ? 'After latest input' : 'Initial condition'}</em>
            </div>
            <div>
              <span>Security policy</span>
              <strong className="state-value">
                {state.mode === 'hardened' ? 'Validated' : 'Basic'}
              </strong>
              <em>
                {state.mode === 'hardened'
                  ? 'Instruction boundary enforced'
                  : 'Decoded channel content trusted'}
              </em>
            </div>
            <div>
              <span>Last exchange</span>
              <strong className="state-value">
                {hasInput ? timestamp(state.updatedAt) : 'No input received'}
              </strong>
              <em>
                {hasInput
                  ? `${state.lastSource === 'workbench' ? 'Workbench-tagged HTTP' : 'External HTTP'} · revision ${state.revision}`
                  : 'Send a request from Workbench'}
              </em>
            </div>
            <div className={`decision-status ${changed ? 'changed' : ''}`}>
              <ShieldCheck size={16} />
              <span>{statusNames[state.status]}</span>
            </div>
          </div>
        </section>

        <div className="exchange-section" ref={panels}>
          <div className="exchange-navigation">
            <div role="tablist" aria-label="Observation details">
              {(
                [
                  ['exchange', 'Input & output'],
                  ['events', 'Event timeline'],
                  ['setup', 'Workbench setup'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={tab === value}
                  aria-controls={`panel-${value}`}
                  id={`tab-${value}`}
                  onClick={() => setTab(value)}
                >
                  {label}
                  {value === 'events' && <span>{state.events.length}</span>}
                </button>
              ))}
            </div>
            <span className="readonly-label">Read-only observation</span>
          </div>

          {tab === 'exchange' && (
            <section
              id="panel-exchange"
              role="tabpanel"
              aria-labelledby="tab-exchange"
              className="exchange-panels"
            >
              <DataPanel
                title="Input data"
                label="WORKBENCH → SIMULATION"
                direction="in"
                data={hasInput ? state.lastInput : null}
                empty="Waiting for a request"
                help="Send a channel input to this simulation from Workbench. The exact received data will appear here."
                onCopy={(value) => void copy(value, 'Input copied')}
              />
              <DataPanel
                title="Output data"
                label="SIMULATION → WORKBENCH"
                direction="out"
                data={hasInput ? output : null}
                empty="The response will appear here"
                help="Observe the decision, returned actions, and resulting environment state."
                onCopy={(value) => void copy(value, 'Output copied')}
              />
            </section>
          )}

          {tab === 'events' && (
            <section
              id="panel-events"
              role="tabpanel"
              aria-labelledby="tab-events"
              className="events-panel"
            >
              {[...state.events].reverse().map((event) => (
                <article
                  className={`event-item severity-${event.severity}`}
                  key={event.id}
                >
                  <time>{timestamp(event.at)}</time>
                  <i />
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <span>{event.source}</span>
                </article>
              ))}
            </section>
          )}

          {tab === 'setup' && (
            <section
              id="panel-setup"
              role="tabpanel"
              aria-labelledby="tab-setup"
              className="setup-panel"
            >
              <div className="setup-explanation">
                <span className="eyebrow">01 / CONNECT THIS ENVIRONMENT</span>
                <h2>
                  Send from Workbench.
                  <br />
                  See it happen here.
                </h2>
                <p>
                  Create an HTTP target in Workbench using this environment’s
                  endpoint. Choose a channel, preview your request, then send
                  it. Keep this page open to follow the result.
                </p>
                <a
                  href="http://127.0.0.1:3417"
                  className="workbench-cta"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Workbench <ArrowUpRight size={15} />
                </a>
                <small>
                  Each environment has its own input, output, and history.
                  Switching pages does not reset another simulation.
                </small>
              </div>
              <div className="target-details">
                <div className="target-heading">
                  <strong>{scenario.shortName} target profiles</strong>
                  <div className="profile-copy-actions">
                    <Button
                      variant="outline"
                      onClick={() =>
                        void copy(
                          JSON.stringify(
                            workbenchProfile(scenario, origin, 'basic'),
                            null,
                            2,
                          ),
                          'Basic target profile copied',
                        )
                      }
                    >
                      <Copy size={13} /> Copy Basic
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void copy(
                          JSON.stringify(
                            workbenchProfile(scenario, origin, 'validated'),
                            null,
                            2,
                          ),
                          'Validated target profile copied',
                        )
                      }
                    >
                      <Copy size={13} /> Copy Validated
                    </Button>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Endpoint</dt>
                    <dd>
                      <span className="http-method">POST</span>
                      <code>{endpoint}</code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Copy endpoint"
                        onClick={() => void copy(endpoint, 'Endpoint copied')}
                      >
                        <Copy size={13} />
                      </Button>
                    </dd>
                  </div>
                  <div>
                    <dt>Request template</dt>
                    <dd>
                      <code>{'{"input":"{{body}}"}'}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Response / actions paths</dt>
                    <dd>
                      <code>text</code>
                      <span>/</span>
                      <code>actions</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Security profiles</dt>
                    <dd>
                      <code>X-SimLab-Security: basic</code>
                      <span>/</span>
                      <code>validated</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Source header</dt>
                    <dd>
                      <code>X-SimLab-Source: workbench</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Evidence rule</dt>
                    <dd>
                      <code>forbidden_tools: simulated_control_change</code>
                    </dd>
                  </div>
                  <div>
                    <dt>HTTP observer</dt>
                    <dd>
                      <code>{`${origin}/api/simulations/${id}/observer`}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Browser observer</dt>
                    <dd>
                      <code>{`${origin}/simulations/${id}`}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Observer selector</dt>
                    <dd>
                      <code>{'[data-testid="agent-response"]'}</code>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          )}
        </div>

        <output
          className="agent-response"
          data-testid="agent-response"
          aria-live="polite"
        >
          {state.responseText}
        </output>
        <footer className="simulation-footer">
          <span>
            <i /> {scenario.shortName} · independent simulation
          </span>
          <span>Deterministic model · State resets on server restart</span>
        </footer>
        {notice && (
          <output className="copy-notice">
            <Check size={15} />
            {notice}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setNotice('')}
              aria-label="Dismiss"
            >
              <X size={13} />
            </Button>
          </output>
        )}
      </main>
    </>
  );
}

function DataPanel({
  title,
  label,
  direction,
  data,
  empty,
  help,
  onCopy,
}: {
  title: string;
  label: string;
  direction: 'in' | 'out';
  data: unknown;
  empty: string;
  help: string;
  onCopy: (text: string) => void;
}) {
  const present = data !== null;
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="data-panel">
      <header>
        <div>
          {direction === 'in' ? (
            <ArrowDownLeft size={16} />
          ) : (
            <ArrowUpRight size={16} />
          )}
          <strong>{title}</strong>
          <span>{label}</span>
        </div>
        {present && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(text)}
            aria-label={`Copy ${title.toLowerCase()}`}
          >
            <Copy size={14} />
          </Button>
        )}
      </header>
      {present ? (
        <pre className="json-data">
          <code>{text}</code>
        </pre>
      ) : (
        <div className="empty-data">
          <span className="empty-icon">
            {direction === 'in' ? (
              <ArrowDownLeft size={24} />
            ) : (
              <ArrowUpRight size={24} />
            )}
          </span>
          <strong>{empty}</strong>
          <p>{help}</p>
        </div>
      )}
    </div>
  );
}
