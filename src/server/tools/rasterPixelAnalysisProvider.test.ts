import { describe, it, expect } from 'vitest';
import { analyzeRasterPixels } from './rasterPixelAnalysisProvider.js';

describe('rasterPixelAnalysisProvider', () => {
  it('should calculate stats for a normal numeric raster', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 4, height: 1 },
          assetKey: "asset_1",
          width: 4,
          nodata: null,
          pixelData: [
            new Float32Array([1, 2, 3, 4])
          ]
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    expect(res.status).toBe('SUCCESS');
    
    const data = res.data as any;
    expect(data.totalPixels).toBe(4);
    expect(data.totalValidPixels).toBe(4);
    expect(data.totalNoDataPixels).toBe(0);
    
    const b = data.bands[0];
    expect(b.minimum).toBe(1);
    expect(b.maximum).toBe(4);
    expect(b.mean).toBe(2.5);
    expect(b.sum).toBe(10);
  });

  it('should exclude NoData from stats', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 4, height: 1 },
          assetKey: "asset_1",
          width: 4,
          nodata: -9999,
          pixelData: [
            new Float32Array([1, 2, -9999, 4])
          ]
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    const data = res.data as any;
    expect(data.totalValidPixels).toBe(3);
    expect(data.totalNoDataPixels).toBe(1);
    
    const b = data.bands[0];
    expect(b.mean).toBeCloseTo(7/3, 4);
    expect(b.sum).toBe(7);
  });

  it('should handle All NoData', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 3, height: 1 },
          assetKey: "asset_1",
          width: 3,
          nodata: -9999,
          pixelData: [
            new Float32Array([-9999, -9999, -9999])
          ]
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    const data = res.data as any;
    expect(res.status).toBe('SUCCESS');
    expect(data.status).toBe('NO VALID PIXELS');
    expect(data.totalValidPixels).toBe(0);
    expect(data.totalNoDataPixels).toBe(3);
    
    const b = data.bands[0];
    expect(b.minimum).toBeNull();
    expect(b.maximum).toBeNull();
    expect(b.mean).toBeNull();
    expect(b.sum).toBeNull();
    expect(b.standardDeviation).toBeNull();
  });

  it('should handle NaN / Infinity', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 4, height: 1 },
          assetKey: "asset_1",
          width: 4,
          nodata: null,
          pixelData: [
            new Float32Array([1, NaN, Infinity, -Infinity])
          ]
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    const data = res.data as any;
    expect(data.totalValidPixels).toBe(1);
    expect(data.totalNoDataPixels).toBe(3);
    
    const b = data.bands[0];
    expect(b.minimum).toBe(1);
    expect(b.maximum).toBe(1);
    expect(b.mean).toBe(1);
    expect(b.sum).toBe(1);
  });

  it('should support multiple bands', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 2, height: 1 },
          assetKey: "asset_1",
          width: 2,
          nodata: null,
          bandNames: ["Red", "NIR"],
          pixelData: [
            new Float32Array([1, 2]),
            new Float32Array([10, 20])
          ]
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    const data = res.data as any;
    expect(data.bands).toHaveLength(2);
    expect(data.bands[0].bandName).toBe("Red");
    expect(data.bands[0].mean).toBe(1.5);
    expect(data.bands[1].bandName).toBe("NIR");
    expect(data.bands[1].mean).toBe(15);
  });

  it('should fail on missing pixelData', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          pixelWindow: { width: 1, height: 1 },
          assetKey: "asset_1",
          width: 1,
          nodata: null
          // No pixelData
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    expect(res.status).toBe('FAILED');
    expect(res.message).toMatch(/No pixel data available/);
  });
  
  it('should return SKIPPED when raster window is missing', async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          assetKey: "asset_1",
          width: 1,
          nodata: null
          // No pixelWindow
        }
      }
    };
    
    const res = await analyzeRasterPixels(input);
    expect(res.status).toBe('FAILED');
  });

});
