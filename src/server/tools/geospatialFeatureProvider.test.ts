import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geospatialFeatureProvider } from './geospatialFeatureProvider.js';

// geospatialFeatureProvider now uses fetchWithRetry which calls global fetch
// Mock global.fetch directly

function makeMockResponse(status: number, body: any, ok?: boolean) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: String(status),
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as any as Response;
}

describe('geospatialFeatureProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should retrieve major roads correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeMockResponse(200, {
        elements: [
          {
            type: "way",
            id: 123,
            geometry: [{ lat: 10, lon: 10 }, { lat: 11, lon: 11 }],
            tags: { highway: "motorway", name: "Test Road" }
          }
        ]
      })
    );

    const res = await geospatialFeatureProvider({
      featureType: 'major roads',
      dependencyOutputs: {
        aoi: { bbox: [10, 10, 11, 11] }
      }
    });

    expect(res.status).toBe('SUCCESS');
    expect(res.data?.features).toHaveLength(1);
    expect(res.data?.features[0].geometry.type).toBe('LineString');
    expect(res.data?.features[0].properties.highway).toBe('motorway');
  });

  it('should return empty FeatureCollection if no results', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeMockResponse(200, { elements: [] })
    );

    const res = await geospatialFeatureProvider({
      featureType: 'rivers',
      dependencyOutputs: {
        aoi: { bbox: [10, 10, 11, 11] }
      }
    });

    expect(res.status).toBe('SUCCESS');
    expect(res.data?.features).toHaveLength(0);
  });

  it('should return NOT_IMPLEMENTED for unsupported features', async () => {
    const res = await geospatialFeatureProvider({
      featureType: 'fake feature',
      dependencyOutputs: {
        aoi: { bbox: [10, 10, 11, 11] }
      }
    });

    expect(res.status).toBe('NOT_IMPLEMENTED');
  });

  it('should return FAILED on fetch error', async () => {
    // All retries fail with a network error.
    // fetchWithRetry retries 3 times with exponential backoff (1s+2s+4s ≈ 7s).
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const res = await geospatialFeatureProvider({
      featureType: 'hospitals',
      dependencyOutputs: {
        aoi: { bbox: [10, 10, 11, 11] }
      }
    });

    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('Feature detection error');
  }, 15000); // extended timeout to allow 3 retries with backoff

  it('should return FAILED if no AOI is provided', async () => {
    const res = await geospatialFeatureProvider({
      featureType: 'hospitals'
    });

    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('No Area of Interest');
  });
});
