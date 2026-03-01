/**
 * Phase 13E — bulkRunner unit tests
 *
 * Covers:
 * - 409 is NOT retried (worker returns `{ outcome: 'blocked' }`)
 * - 5xx errors ARE retried up to maxAttempts
 * - Network/timeout errors ARE retried
 * - Non-retryable 4xx (e.g. 400) are NOT retried
 * - All successes aggregated correctly
 */

import { runBulkWithConcurrency } from '@/lib/bulkRunner';

function makeTransientError(status: number) {
  const err: any = new Error(`HTTP ${status}`);
  err.response = { status };
  return err;
}

function makeNetworkError(code: string) {
  const err: any = new Error('Network error');
  err.code = code;
  return err;
}

describe('runBulkWithConcurrency — retry policy', () => {
  it('returns success outcome when workerFn resolves success', async () => {
    const worker = jest.fn().mockResolvedValue({ outcome: 'success' });
    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results).toHaveLength(1);
    expect(results[0].outcome).toBe('success');
    expect(results[0].attempts).toBe(1);
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('returns blocked outcome when workerFn returns blocked (no retry)', async () => {
    const blockedBody = { validation: { status: 'invalid' } };
    const worker = jest.fn().mockResolvedValue({ outcome: 'blocked', blockedBody });

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('blocked');
    expect(results[0].blockedBody).toEqual(blockedBody);
    // Worker is called exactly once — blocked is never retried
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 409 error (thrown from workerFn)', async () => {
    // Edge case: if workerFn throws a 409 (not the standard pattern), it
    // must NOT be retried — 409 is not transient.
    const err409 = makeTransientError(409);
    const worker = jest.fn().mockRejectedValue(err409);

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('failed');
    // Must have been called exactly once — 409 must not trigger retries
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 error up to maxAttempts then returns failed', async () => {
    const err = makeTransientError(500);
    const worker = jest.fn().mockRejectedValue(err);

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('failed');
    expect(results[0].attempts).toBe(3);
    expect(worker).toHaveBeenCalledTimes(3);
  });

  it('retries on 503 and succeeds on the second attempt', async () => {
    let calls = 0;
    const worker = jest.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) throw makeTransientError(503);
      return { outcome: 'success' };
    });

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('success');
    expect(results[0].attempts).toBe(2);
    expect(worker).toHaveBeenCalledTimes(2);
  });

  it('retries on ECONNABORTED (network timeout)', async () => {
    const err = makeNetworkError('ECONNABORTED');
    const worker = jest.fn().mockRejectedValue(err);

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 2,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('failed');
    expect(worker).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 400 (client error is not transient)', async () => {
    const worker = jest.fn().mockRejectedValue(makeTransientError(400));

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('failed');
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 422 (unprocessable entity)', async () => {
    const worker = jest.fn().mockRejectedValue(makeTransientError(422));

    const results = await runBulkWithConcurrency(['id1'], worker, {
      concurrency: 1,
      maxAttempts: 3,
      baseDelayMs: 0,
    });

    expect(results[0].outcome).toBe('failed');
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it('processes multiple IDs and aggregates outcomes correctly', async () => {
    const worker = jest.fn().mockImplementation(async (id: string) => {
      if (id === 'blocked') return { outcome: 'blocked', blockedBody: { v: 1 } };
      return { outcome: 'success' };
    });

    const results = await runBulkWithConcurrency(['ok1', 'blocked', 'ok2'], worker, {
      concurrency: 2,
      maxAttempts: 1,
      baseDelayMs: 0,
    });

    expect(results).toHaveLength(3);
    const byId = Object.fromEntries(results.map((r) => [r.id, r]));
    expect(byId['ok1'].outcome).toBe('success');
    expect(byId['blocked'].outcome).toBe('blocked');
    expect(byId['ok2'].outcome).toBe('success');
  });

  it('calls onProgress for each completed item', async () => {
    const worker = jest.fn().mockResolvedValue({ outcome: 'success' });
    const onProgress = jest.fn();

    await runBulkWithConcurrency(['a', 'b', 'c'], worker, {
      concurrency: 1,
      maxAttempts: 1,
      baseDelayMs: 0,
      onProgress,
    });

    // onProgress called on start (no last) + once per item
    expect(onProgress).toHaveBeenCalledTimes(4); // start + 3 items
    const calls = onProgress.mock.calls.map((c) => c[0]);
    expect(calls[0]).toEqual({ completed: 0, total: 3, last: undefined });
    expect(calls[3].completed).toBe(3);
  });
});
