import {
  flatten,
  getScenario,
  getState,
  processAgentInput,
  type ScenarioId,
} from './simulation';
import { reportToSink, sinkUrl } from './sink';

/** The name sink events carry and /health reports, per simulation. */
export function targetName(id: ScenarioId) {
  return `simlab-${id}`;
}

export function health(id: ScenarioId) {
  const scenario = getScenario(id);
  return {
    name: targetName(id),
    kind: 'deterministic simulation',
    scenario: scenario.id,
    policy: 'per request: X-SimLab-Security basic (vulnerable) or validated (hardened)',
    forbidden_tools: ['simulated_control_change'],
    sink: sinkUrl() ? 'configured' : 'not configured',
    model: 'none',
  };
}

export function observation(id: ScenarioId) {
  const state = getState(id);
  const scenario = getScenario(id);
  return {
    text: state.responseText,
    actions: state.actions,
    perceived: state.perceived,
    status: state.status,
    security_mode: state.mode === 'hardened' ? 'validated' : 'basic',
    scenario: scenario.id,
    metric: {
      label: scenario.metricLabel,
      value: state.metric,
      unit: scenario.metricUnit,
    },
    revision: state.revision,
    observed_at: state.updatedAt,
  };
}

export async function receiveInput(request: Request, id: ScenarioId) {
  const maxBytes = 64 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes) {
    return Response.json({ error: 'request exceeds 64 KiB' }, { status: 413 });
  }
  const reader = request.body?.getReader();
  let raw = '';
  let size = 0;
  const decoder = new TextDecoder();
  if (reader) {
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          return Response.json(
            { error: 'request exceeds 64 KiB' },
            { status: 413 },
          );
        }
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }
  let input: unknown = raw;
  try {
    input = JSON.parse(raw);
  } catch {
    /* Plain text input is supported. */
  }
  const source =
    request.headers.get('x-simlab-source') === 'workbench'
      ? 'workbench'
      : 'external';
  const mode =
    request.headers.get('x-simlab-security')?.toLowerCase() === 'validated'
      ? 'hardened'
      : 'vulnerable';
  // Crosswire sends {"input": ..., "session": "<nonce>"}; the session keys the
  // trial's evidence. The whole body stays the input, as before.
  let session = '';
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const body = input as Record<string, unknown>;
    if (typeof body.session === 'string') session = body.session.slice(0, 64);
  }
  const state = processAgentInput(input, source, id, mode);
  // Report the control change to the sink, executed or refused. The input
  // excerpt goes in the arguments so a nonce in the input reaches the sink.
  const excerpt = flatten(input).slice(0, 600);
  const sink = sinkUrl(request);
  const change = state.actions.find(
    (action) => action.name === 'simulated_control_change',
  );
  const refusal = state.actions.find((action) => action.name === 'security_event');
  if (change) {
    void reportToSink({
      name: change.name,
      arguments: { ...change.arguments, input_excerpt: excerpt },
      target: targetName(id),
      blocked: false,
      session,
    }, sink);
  } else if (refusal) {
    void reportToSink({
      name: 'simulated_control_change',
      arguments: { scenario: id, input_excerpt: excerpt },
      target: targetName(id),
      blocked: true,
      reason: 'untrusted_instruction: channel content kept as data',
      session,
    }, sink);
  }
  return Response.json(observation(id), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
