import { isScenarioId } from '@/lib/simulation';
import { health } from '@/lib/target-api';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isScenarioId(id))
    return Response.json({ error: 'Unknown simulation' }, { status: 404 });
  return Response.json(health(id), { headers: { 'Cache-Control': 'no-store' } });
}
