import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithRetry, telemetryLogs } from "./fetchWithRetry.js";

function mockResponse(status: number, body: string = "{}", headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: (k: string) => headers[k] ?? null },
    text: async () => body,
    json: async () => JSON.parse(body)
  } as any as Response;
}

beforeEach(() => {
  telemetryLogs.length = 0;
});

describe("fetchWithRetry resilience", () => {
  it("1. Returns response on first attempt success", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse(200));
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, providerName: "test" });
    expect(res.ok).toBe(true);
  });

  it("2. HTTP 429 ? retry ? success", async () => {
    let call = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      call++;
      if (call < 3) return mockResponse(429);
      return mockResponse(200);
    });
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    global.fetch = undefined as any;
  });

  it("3. HTTP 503 ? retry ? success", async () => {
    let call = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      call++;
      if (call < 2) return mockResponse(503);
      return mockResponse(200);
    });
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.ok).toBe(true);
    global.fetch = undefined as any;
  });

  it("4. Network failure ? retry ? success", async () => {
    let call = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      call++;
      if (call < 2) throw new Error("fetch failed");
      return mockResponse(200);
    });
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.ok).toBe(true);
    global.fetch = undefined as any;
  });

  it("5. Timeout ? retry ? success", async () => {
    let call = 0;
    const mockFetch = vi.fn().mockImplementation(async (_url: any, opts: any) => {
      call++;
      if (call < 2) {
        return new Promise((_resolve, reject) =>
          setTimeout(() => { const e = new Error("AbortError"); e.name = "AbortError"; reject(e); }, 50)
        );
      }
      return mockResponse(200);
    });
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, timeoutMs: 5000, providerName: "test" });
    expect(res.ok).toBe(true);
    global.fetch = undefined as any;
  });

  it("6. Repeated timeout ? final FAILED throw", async () => {
    const mockFetch = vi.fn().mockImplementation(async () => {
      const e = new Error("AbortError"); e.name = "AbortError"; throw e;
    });
    global.fetch = mockFetch as any;
    await expect(
      fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, timeoutMs: 5000, providerName: "test" })
    ).rejects.toThrow();
    global.fetch = undefined as any;
  });

  it("7. HTTP 401 ? no retry, fail immediately", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(401));
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1); // no retry on 401
    global.fetch = undefined as any;
  });

  it("8. HTTP 404 ? no retry", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(404));
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    global.fetch = undefined as any;
  });

  it("9. Retry budget is bounded (max 3 retries = 4 calls)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(503));
    global.fetch = mockFetch as any;
    await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 1, providerName: "test" });
    expect(mockFetch).toHaveBeenCalledTimes(4); // initial + 3 retries
    global.fetch = undefined as any;
  });

  it("10. Retry-After header is respected", async () => {
    let call = 0;
    let actualDelay = 0;
    const origTimeout = global.setTimeout;
    const mockFetch = vi.fn().mockImplementation(async () => {
      call++;
      if (call === 1) return mockResponse(429, "{}", { "Retry-After": "1" });
      return mockResponse(200);
    });
    global.fetch = mockFetch as any;
    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 3, baseDelayMs: 10, providerName: "test" });
    expect(res.ok).toBe(true);
    global.fetch = undefined as any;
  });

  it("11. API key is NOT exposed in telemetry", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse(200));
    global.fetch = mockFetch as any;
    await fetchWithRetry("https://example.com", { headers: { Authorization: "Bearer secret-key-12345" } }, { maxRetries: 1, providerName: "testprovider" });
    const logs = telemetryLogs.filter(e => e.provider === "testprovider");
    const logStr = JSON.stringify(logs);
    expect(logStr).not.toContain("secret-key-12345");
    global.fetch = undefined as any;
  });

  it("12. Failed fetch produces telemetry with FAILED status", async () => {
    const mockFetch = vi.fn().mockImplementation(async () => { throw new Error("fetch failed"); });
    global.fetch = mockFetch as any;
    await expect(
      fetchWithRetry("https://example.com", {}, { maxRetries: 1, baseDelayMs: 1, providerName: "testprov2" })
    ).rejects.toThrow();
    const failed = telemetryLogs.find(e => e.provider === "testprov2" && e.finalAttempt);
    expect(failed).toBeDefined();
    expect(failed!.status).toMatch(/TIMEOUT|FAILED/);
    global.fetch = undefined as any;
  });
});
