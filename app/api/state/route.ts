import { publicSnapshot } from '@/lib/simulation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(publicSnapshot(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
