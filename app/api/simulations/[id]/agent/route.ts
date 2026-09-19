import { isScenarioId } from '@/lib/simulation';
import { receiveInput } from '@/lib/target-api';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isScenarioId(id))
    return Response.json({ error: 'Unknown simulation' }, { status: 404 });
  return receiveInput(request, id);
}
