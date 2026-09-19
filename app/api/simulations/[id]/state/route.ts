import { isScenarioId, publicSnapshot } from '@/lib/simulation';

export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isScenarioId(id))
    return Response.json({ error: 'Unknown simulation' }, { status: 404 });
  return Response.json(publicSnapshot(id), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
