// Technical timeout for activation I/O, not an authorization or product SLA.
export const ACTIVATION_TIMEOUT_MS = 12000;

export async function activationDeadline<T>(
  operation: (signal: AbortSignal) => PromiseLike<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('ACTIVATION_NETWORK_TIMEOUT'));
        }, ACTIVATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
