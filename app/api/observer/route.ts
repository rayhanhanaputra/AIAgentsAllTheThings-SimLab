import { getScenario, getState } from '@/lib/simulation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = getState();
  const scenario = getScenario(state.scenarioId);
  return Response.json(
    {
      text: state.responseText,
      status: state.status,
      actions: state.actions,
      scenario: scenario.name,
      metric: state.metric,
      revision: state.revision,
      observed_at: state.updatedAt,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
