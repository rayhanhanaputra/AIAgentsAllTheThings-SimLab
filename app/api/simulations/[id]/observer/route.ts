import { isScenarioId } from '@/lib/simulation';
import { observation } from '@/lib/target-api';

export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isScenarioId(id))
    return Response.json({ error: 'Unknown simulation' }, { status: 404 });
  return Response.json(observation(id), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
