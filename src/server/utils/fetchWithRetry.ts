export interface FetchRetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  providerName?: string;
  operationName?: string;
}

export interface TelemetryEvent {
  provider: string;
  operation: string;
  attempt: number;
  startTime: string;
  durationMs: number;
  status: "SUCCESS" | "RETRYING" | "TIMEOUT" | "RATE_LIMITED" | "FAILED" | "NOT_IMPLEMENTED";
  httpStatus?: number;
  errorType?: string;
  retryable?: boolean;
  finalAttempt?: boolean;
}

export const telemetryLogs: TelemetryEvent[] = [];

export async function fetchWithRetry(url: string | URL | Request, options: RequestInit = {}, config: FetchRetryConfig = {}): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    timeoutMs = 10000,
    providerName = "unknown",
    operationName = "unknown"
  } = config;

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    const isFinalAttempt = attempt > maxRetries;
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestOptions = {
      ...options,
      signal: controller.signal as any
    };

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      
      const status = response.status;
      const isTransient = [408, 429, 500, 502, 503, 504].includes(status);
      const isRateLimit = status === 429;

      if (response.ok) {
        telemetryLogs.push({
          provider: providerName,
          operation: operationName,
          attempt,
          startTime: new Date(startTime).toISOString(),
          durationMs,
          status: "SUCCESS",
          httpStatus: status,
          finalAttempt: true
        });
        return response;
      }

      if (isTransient && !isFinalAttempt) {
        telemetryLogs.push({
          provider: providerName,
          operation: operationName,
          attempt,
          startTime: new Date(startTime).toISOString(),
          durationMs,
          status: isRateLimit ? "RATE_LIMITED" : "RETRYING",
          httpStatus: status,
          retryable: true,
          finalAttempt: false
        });

        let delay = baseDelayMs * Math.pow(2, attempt - 1);
        const retryAfter = response.headers.get("Retry-After");
        if (retryAfter) {
           const parsed = parseInt(retryAfter, 10);
           if (!isNaN(parsed)) {
               delay = parsed * 1000;
           }
        }
        delay = Math.min(delay, maxDelayMs);
        delay = delay + Math.random() * 200;

        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      telemetryLogs.push({
        provider: providerName,
        operation: operationName,
        attempt,
        startTime: new Date(startTime).toISOString(),
        durationMs,
        status: "FAILED",
        httpStatus: status,
        retryable: false,
        finalAttempt: true
      });

      return response;

    } catch (err: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('fetch failed');
      
      telemetryLogs.push({
        provider: providerName,
        operation: operationName,
        attempt,
        startTime: new Date(startTime).toISOString(),
        durationMs,
        status: isAbort ? "TIMEOUT" : "FAILED",
        errorType: err.name || "NetworkError",
        retryable: !isFinalAttempt,
        finalAttempt: isFinalAttempt
      });

      if (!isFinalAttempt) {
        let delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        delay = delay + Math.random() * 200;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }

  throw new Error("fetchWithRetry failed after max retries.");
}
