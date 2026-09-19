import {
  getScenario,
  getState,
  processAgentInput,
  type ScenarioId,
} from './simulation';

export function observation(id: ScenarioId) {
  const state = getState(id);
  const scenario = getScenario(id);
  return {
    text: state.responseText,
    actions: state.actions,
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
  processAgentInput(input, source, id, mode);
  return Response.json(observation(id), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
