export type BulkOutcomeKind = 'success' | 'blocked' | 'failed';

export type BulkItemOutcome<TBlockedBody = unknown> = {
  id: string;
  outcome: BulkOutcomeKind;
  attempts: number;
  errorMessage?: string;
  blockedBody?: TBlockedBody;
};

export type BulkProgressUpdate<TBlockedBody = unknown> = {
  completed: number;
  total: number;
  last?: BulkItemOutcome<TBlockedBody>;
};

type AxiosLikeError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
};

function asAxiosLikeError(error: unknown): AxiosLikeError {
  return error as any;
}

function isTransientError(error: unknown): boolean {
  const e = asAxiosLikeError(error);
  const status = e?.response?.status;

  if (!status) {
    // Network errors / timeouts
    return e?.code === 'ECONNABORTED' || (e?.message || '').toLowerCase().includes('timeout');
  }

  if (status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  opts: {
    maxAttempts: number;
    baseDelayMs: number;
    shouldRetry: (error: unknown) => boolean;
  }
): Promise<{ ok: true; value: T; attempts: number } | { ok: false; error: unknown; attempts: number }> {
  let attempt = 0;
  while (attempt < opts.maxAttempts) {
    attempt += 1;
    try {
      const value = await fn();
      return { ok: true, value, attempts: attempt };
    } catch (err) {
      if (attempt >= opts.maxAttempts || !opts.shouldRetry(err)) {
        return { ok: false, error: err, attempts: attempt };
      }

      const jitter = 0.8 + Math.random() * 0.4;
      const delay = Math.floor(opts.baseDelayMs * Math.pow(2, attempt - 1) * jitter);
      await sleep(delay);
    }
  }
  return { ok: false, error: new Error('exhausted retries'), attempts: attempt };
}

export async function runBulkWithConcurrency<TBlockedBody = unknown>(
  ids: string[],
  workerFn: (id: string) => Promise<
    | { outcome: 'success' }
    | { outcome: 'blocked'; blockedBody: TBlockedBody }
  >,
  opts?: {
    concurrency?: number;
    maxAttempts?: number;
    baseDelayMs?: number;
    onProgress?: (update: BulkProgressUpdate<TBlockedBody>) => void;
  }
): Promise<BulkItemOutcome<TBlockedBody>[]> {
  const concurrency = Math.max(1, Math.min(10, opts?.concurrency ?? 4));
  const maxAttempts = Math.max(1, Math.min(5, opts?.maxAttempts ?? 3));
  const baseDelayMs = Math.max(50, Math.min(5000, opts?.baseDelayMs ?? 250));

  let nextIndex = 0;
  let completed = 0;
  const total = ids.length;
  const outcomes: BulkItemOutcome<TBlockedBody>[] = [];

  const notify = (last?: BulkItemOutcome<TBlockedBody>) => {
    opts?.onProgress?.({ completed, total, last });
  };

  const runOne = async (id: string): Promise<BulkItemOutcome<TBlockedBody>> => {
    const attemptResult = await runWithRetry(
      async () => {
        return await workerFn(id);
      },
      {
        maxAttempts,
        baseDelayMs,
        shouldRetry: isTransientError,
      }
    );

    if (!attemptResult.ok) {
      const e = asAxiosLikeError(attemptResult.error);
      const msg =
        (e?.response?.status ? `HTTP ${e.response.status}` : '') || e?.message || 'Request failed';
      return {
        id,
        outcome: 'failed',
        attempts: attemptResult.attempts,
        errorMessage: msg,
      };
    }

    const value = attemptResult.value;
    if (value.outcome === 'blocked') {
      return {
        id,
        outcome: 'blocked',
        attempts: attemptResult.attempts,
        blockedBody: value.blockedBody,
      };
    }

    return { id, outcome: 'success', attempts: attemptResult.attempts };
  };

  notify();

  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (true) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= total) return;

      const id = ids[i];
      const outcome = await runOne(id);
      outcomes[i] = outcome;
      completed += 1;
      notify(outcome);
    }
  });

  await Promise.all(workers);
  return outcomes;
}
