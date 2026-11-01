/**
 * Crosswire sink reporting. When CROSSWIRE_SINK_URL is set, every simulated
 * control change is POSTed there as a sink event, executed or refused, so the
 * Crosswire workbench can count it as evidence instead of reading it from the
 * response body. See crosswire/docs/CONTRACT.md section 3 in the Workbench repo.
 */
export type SinkEvent = {
  name: string;
  arguments: Record<string, unknown>;
  target: string;
  blocked: boolean;
  reason?: string;
  session?: string;
};

/** True for loopback hosts only; a request may not point SimLab at the network. */
export function isLoopback(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

/**
 * The sink address: the request's X-Crosswire-Sink header when it names a
 * loopback address (the Crosswire target profile sets it), else the
 * CROSSWIRE_SINK_URL environment variable.
 */
export function sinkUrl(request?: Request): string | undefined {
  const fromHeader = request?.headers.get('x-crosswire-sink')?.trim();
  if (fromHeader && isLoopback(fromHeader)) return fromHeader;
  const url = process.env.CROSSWIRE_SINK_URL?.trim();
  return url ? url : undefined;
}

/** Fire-and-forget: a sink outage must never change the simulation's reply. */
export function reportToSink(
  event: SinkEvent,
  url = sinkUrl(),
): Promise<void> {
  if (!url) return Promise.resolve();
  const body = JSON.stringify({
    ...event,
    reason: event.reason || undefined,
    session: event.session || undefined,
  });
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(2_000),
  })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.warn(`simlab: sink ${url}: ${String(error)}`);
    });
}
