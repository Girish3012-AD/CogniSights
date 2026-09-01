import { describe, it, expect } from "vitest";
import { detectObjects } from "./objectDetectionProvider.js";

describe("objectDetectionProvider", () => {
  const dummyRaster = {
    rasterId: "STAC_123",
    assetKey: "visual",
    width: 256,
    height: 256,
    pixelWindow: { originX: 0, originY: 0, width: 256, height: 256 },
    pixelData: [new Float32Array(256 * 256)]
  };

  it("T1/T2 - should return NOT_IMPLEMENTED when valid raster input is provided but no model exists", async () => {
    const input = {
      targetClasses: ["buildings"],
      dependencyOutputs: {
        "step_1": dummyRaster
      }
    };
    
    const result = await detectObjects(input);
    expect(result.status).toBe("NOT_IMPLEMENTED");
    expect(result.message).toContain("requires GPU infrastructure");
    expect(result.evidence.length).toBe(1); expect(result.evidence[0].provenance).toContain("Inference disabled");
    expect(result.data?.inferenceStatus).toBe("NOT_IMPLEMENTED");
    expect(result.data?.model).toContain("Unavailable");
  });
  
  it("T12 - should return SKIPPED if dependency outputs are missing", async () => {
    const input = {
      targetClasses: ["buildings"],
      dependencyOutputs: {}
    };
    
    const result = await detectObjects(input);
    expect(result.status).toBe("SKIPPED");
  });
  
  it("should return FAILED if pixel data is incomplete", async () => {
    const input = {
      targetClasses: ["buildings"],
      dependencyOutputs: {
        "step_1": {
          assetKey: "visual",
          width: 256,
          height: 256,
          pixelWindow: { originX: 0, originY: 0, width: 256, height: 256 }
          // pixelData missing
        }
      }
    };
    
    const result = await detectObjects(input);
    expect(result.status).toBe("FAILED");
  });

  it("T3/T4/T5 - Confidence filtering and preprocessing metadata is populated", async () => {
    const input = {
      targetClasses: ["buildings"],
      confidenceThreshold: 0.75,
      dependencyOutputs: {
        "step_1": dummyRaster
      }
    };
    
    const result = await detectObjects(input);
    expect(result.data?.confidenceThreshold).toBe(0.75);
    expect(result.data?.processingMetadata?.preprocessing.padding).toContain("Letterboxing");
  });

  it("T8/T9/T11 - Returns empty FeatureCollection placeholder due to NOT_IMPLEMENTED", async () => {
    const input = {
      targetClasses: ["buildings"],
      dependencyOutputs: {
        "step_1": dummyRaster
      }
    };
    
    const result = await detectObjects(input);
    expect(result.data?.features?.type).toBe("FeatureCollection");
    expect(result.data?.features?.features).toEqual([]);
    expect(result.data?.tileCount).toBe(1);
  });
});

import { pixelToGeographic, convertBboxToGeoJSONPolygon } from "./inference/buildingDetectionEngine.js";

describe("Georeferencing Math", () => {
  it("T6/T7 - pixelToGeographic converts correctly using standard res transform", () => {
    // Top left of window is 73.0, 18.0
    // Resolution is 0.0001
    const transform = [0.0001, -0.0001];
    const geo = pixelToGeographic(10, 20, transform, 73.0, 18.0);
    // x = 73.0 + 10 * 0.0001 = 73.001
    // y = 18.0 + 20 * -0.0001 = 17.998
    expect(geo[0]).toBeCloseTo(73.001);
    expect(geo[1]).toBeCloseTo(17.998);
  });

  it("T6/T7 - convertBboxToGeoJSONPolygon generates valid geojson array", () => {
    const poly = convertBboxToGeoJSONPolygon(0, 0, 10, 10, [0.0001, -0.0001], 73.0, 18.0);
    expect(poly.type).toBe("Polygon");
    expect(poly.coordinates[0].length).toBe(5); // closed ring
    expect(poly.coordinates[0][0][0]).toBe(73.0);
    expect(poly.coordinates[0][0][1]).toBe(18.0);
    expect(poly.coordinates[0][2][0]).toBe(73.001);
    expect(poly.coordinates[0][2][1]).toBe(17.999);
  });
});
