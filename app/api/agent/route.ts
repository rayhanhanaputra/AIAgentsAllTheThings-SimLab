import { receiveInput } from '@/lib/target-api';

// Compatibility endpoint; new Workbench targets should use scenario-specific URLs.
export async function POST(request: Request) {
  return receiveInput(request, 'smart-farm');
}
