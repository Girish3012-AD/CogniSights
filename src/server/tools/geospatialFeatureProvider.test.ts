import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geospatialFeatureProvider } from './geospatialFeatureProvider.js';
import fetch from 'node-fetch';

vi.mock('node-fetch', () => {
  return {
    default: vi.fn()
  };
});

describe('geospatialFeatureProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should retrieve major roads correctly', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        elements: [
          {
            type: "way",
            id: 123,
            geometry: [{ lat: 10, lon: 10 }, { lat: 11, lon: 11 }],
            tags: { highway: "motorway", name: "Test Road" }
          }
        ]
      })
    });

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
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] })
    });

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
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const res = await geospatialFeatureProvider({
      featureType: 'hospitals',
      dependencyOutputs: {
        aoi: { bbox: [10, 10, 11, 11] }
      }
    });

    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('Feature detection error');
  });

  it('should return FAILED if no AOI is provided', async () => {
    const res = await geospatialFeatureProvider({
      featureType: 'hospitals'
    });

    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('No Area of Interest');
  });
});
