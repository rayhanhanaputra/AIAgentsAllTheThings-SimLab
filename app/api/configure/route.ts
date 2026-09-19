import {
  configureSimulation,
  type SafetyMode,
  type ScenarioId,
} from '@/lib/simulation';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: ScenarioId;
    mode?: SafetyMode;
    reset?: boolean;
  };
  return Response.json(configureSimulation(body), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
