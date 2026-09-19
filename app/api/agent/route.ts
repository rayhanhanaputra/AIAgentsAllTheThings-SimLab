import { getScenario, processAgentInput } from '@/lib/simulation';

const MAX_REQUEST_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: 'request exceeds 64 KiB' }, { status: 413 });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) {
    return Response.json({ error: 'request exceeds 64 KiB' }, { status: 413 });
  }
  let input: unknown = raw;
  try {
    input = JSON.parse(raw);
  } catch {
    // Plain text is a supported agent input channel.
  }
  const source =
    request.headers.get('x-simlab-source') === 'local' ? 'local' : 'workbench';
  const state = processAgentInput(input, source);
  const scenario = getScenario(state.scenarioId);
  return Response.json(
    {
      text: state.responseText,
      response: state.responseText,
      actions: state.actions,
      status: state.status,
      scenario: scenario.name,
      metric: {
        label: scenario.metricLabel,
        value: state.metric,
        unit: scenario.metricUnit,
      },
      revision: state.revision,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
