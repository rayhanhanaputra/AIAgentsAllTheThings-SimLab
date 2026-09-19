import { notFound } from 'next/navigation';
import { SimLab } from '@/components/sim-lab';
import { isScenarioId, publicSnapshot } from '@/lib/simulation';

export const dynamic = 'force-dynamic';
export default async function SimulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScenarioId(id)) notFound();
  return <SimLab key={id} initial={publicSnapshot(id)} />;
}
