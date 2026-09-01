import { describe, it, expect } from "vitest";
import { analyzeRasterFeatures } from "./rasterFeatureAnalysisProvider.js";

describe("rasterFeatureAnalysisProvider", () => {
  it("T1 - Valid NDVI calculation and thresholds (T1, T2, T3, T4, T10)", async () => {
    // We provide fake dependency outputs representing processRasterWindow
    // Let's create an array of pixels. 
    // red: 100, nir: 100 -> ndvi: 0 (LOW)
    // red: 100, nir: 200 -> ndvi: 0.33 (MODERATE)
    // red: 100, nir: 500 -> ndvi: 0.66 (HIGH)
    const redBand = new Float32Array([100, 100, 100]);
    const nirBand = new Float32Array([100, 200, 500]);
    
    const input = {
      dependencyOutputs: {
        "step_1": {
          assetKey: "B04", // Just some key
          width: 3,
          height: 1,
          pixelWindow: { originX: 0, originY: 0, width: 3, height: 1 },
          pixelData: [redBand, nirBand],
          bandNames: ["B04_RED", "B08_NIR"],
          nodata: 0,
          window: { minX: 10, minY: 10, maxX: 13, maxY: 11 }, // 3 units wide, 1 unit high
          resolution: { x: 10, y: 10 },
          crs: "EPSG:32632"
        }
      }
    };
    
    const result = await analyzeRasterFeatures(input);
    expect(result.status).toBe("SUCCESS");
    
    const data = result.data as any;
    expect(data.validPixelCount).toBe(3);
    
    // T2: LOW
    const lowClass = data.classes.find((c: any) => c.className === "LOW_VEGETATION");
    expect(lowClass.pixelCount).toBe(1);
    
    // T3: MODERATE
    const modClass = data.classes.find((c: any) => c.className === "MODERATE_VEGETATION");
    expect(modClass.pixelCount).toBe(1);
    
    // T4: HIGH
    const highClass = data.classes.find((c: any) => c.className === "HIGH_VEGETATION");
    expect(highClass.pixelCount).toBe(1);
    
    // T10: Area calculation
    // resolution x=10, y=10 => pixelAreaSqMeters = 100
    // so 1 pixel = 100 sq meters. Since it's EPSG:32632 (not WGS84 and not < 1), pixelArea is just x*y.
    // wait, my code only handles WGS84 explicitly, otherwise just x*y. 
    // Wait, my code actually did: pixelAreaSqMeters = Math.abs(resX * resY).
    // Let's check the area.
    expect(lowClass.areaSquareMeters).toBe(100);
    
    // T9: Geometry validation
    expect(lowClass.geometry.type).toBe("MultiPolygon");
  });
  
  it("T5 - NoData pixels", async () => {
    const redBand = new Float32Array([100, 0, NaN]);
    const nirBand = new Float32Array([500, 0, 500]);
    
    const input = {
      dependencyOutputs: {
        "step_1": {
          assetKey: "visual",
          width: 3,
          height: 1,
          pixelWindow: { originX: 0, originY: 0, width: 3, height: 1 },
          pixelData: [redBand, nirBand],
          bandNames: ["B04_RED", "B08_NIR"],
          nodata: 0,
          resolution: { x: 10, y: 10 }
        }
      }
    };
    
    const result = await analyzeRasterFeatures(input);
    const data = result.data as any;
    // 1 valid, 1 nodata (because 0 is nodata), 1 nodata (because NaN)
    expect(data.validPixelCount).toBe(1);
    expect(data.nodataPixelCount).toBe(2);
  });
  
  it("T6 - Missing RED band", async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          assetKey: "visual",
          width: 1, height: 1,
          pixelWindow: { originX: 0, originY: 0, width: 1, height: 1 },
          pixelData: [new Float32Array([100])],
          bandNames: ["B08_NIR"]
        }
      }
    };
    
    const result = await analyzeRasterFeatures(input);
    expect(result.status).toBe("NOT_IMPLEMENTED");
  });
  
  it("T7 - Missing NIR band", async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          assetKey: "visual",
          width: 1, height: 1,
          pixelWindow: { originX: 0, originY: 0, width: 1, height: 1 },
          pixelData: [new Float32Array([100])],
          bandNames: ["B04_RED"]
        }
      }
    };
    
    const result = await analyzeRasterFeatures(input);
    expect(result.status).toBe("NOT_IMPLEMENTED");
  });
  
  it("T8 - Invalid upstream raster data", async () => {
    const input = {
      dependencyOutputs: {
        "step_1": {
          // missing pixelData
          assetKey: "visual",
          width: 1, height: 1,
          pixelWindow: { originX: 0, originY: 0, width: 1, height: 1 }
        }
      }
    };
    
    const result = await analyzeRasterFeatures(input);
    expect(result.status).toBe("FAILED");
  });
});
