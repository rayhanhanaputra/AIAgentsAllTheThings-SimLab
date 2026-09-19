import { SimLab } from '@/components/sim-lab';
import { publicSnapshot } from '@/lib/simulation';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <SimLab initial={publicSnapshot()} />;
}
