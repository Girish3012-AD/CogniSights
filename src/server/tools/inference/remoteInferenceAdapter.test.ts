import { describe, it, expect, vi } from "vitest";
import { 
  RemoteInferenceAdapter, 
  RemoteInferenceResponseSchema, 
  RemoteInferenceRequestSchema,
  pixelToGeographic, 
  convertBboxToGeoJSONPolygon,
  convertPixelPolygonToGeoJSONPolygon 
} from "./remoteInferenceAdapter.js";
import { RasterWindowResult } from "../../../types/index.js";
import { detectObjects } from "../objectDetectionProvider.js";
import { detectChangeProvider } from "../changeDetectionProvider.js";

describe("Milestone 29A - Remote Inference Adapter", () => {
  const sampleRaster: RasterWindowResult = {
    rasterId: "STAC_TEST_001",
    assetKey: "visual",
    width: 256,
    height: 256,
    crs: "EPSG:4326",
    resolution: { x: 0.0001, y: -0.0001 },
    window: { minX: 10.0, minY: 50.0, maxX: 10.0256, maxY: 50.0256 },
    pixelWindow: { originX: 0, originY: 0, width: 256, height: 256 },
    pixelData: [new Float32Array(256 * 256)]
  };

  it("1. Missing endpoint: strictly returns NOT_IMPLEMENTED with zero fabricated detections", async () => {
    const result = await RemoteInferenceAdapter.execute(
      sampleRaster, 
      { targetClasses: ["buildings"] },
      { apiUrl: "" } // Explicitly unconfigured
    );

    expect(result.status).toBe("NOT_IMPLEMENTED");
    expect(result.inferenceStatus).toBe("NOT_IMPLEMENTED");
    expect(result.model).toBe("Unavailable");
    expect(result.modelAvailable).toBe(false);
    expect(result.runtimeAvailable).toBe(false);
    expect(result.totalObjects).toBe(0);
    expect(result.features.features).toEqual([]);
    expect(result.runtimeMetadata?.remote_endpoint_configured).toBe(false);
  });

  it("2. Payload limits: rejects rasters exceeding maximum allowed pixels", async () => {
    const hugeRaster: RasterWindowResult = {
      ...sampleRaster,
      width: 5000,
      height: 5000,
      pixelWindow: { originX: 0, originY: 0, width: 5000, height: 5000 }
    };

    const result = await RemoteInferenceAdapter.execute(
      hugeRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", maxTotalPixels: 4096 * 4096 }
    );

    expect(result.status).toBe("FAILED");
    expect(result.inferenceStatus).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("Payload limit exceeded");
    expect(result.features.features).toEqual([]);
  });

  it("3. Dimension Check: rejects rasters with non-positive dimensions", async () => {
    const invalidRaster: RasterWindowResult = {
      ...sampleRaster,
      width: 0,
      height: 256
    };

    const result = await RemoteInferenceAdapter.execute(
      invalidRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect" }
    );

    expect(result.status).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("Invalid raster window dimensions");
  });

  it("4. Zod Schema Validation (Success): accepts compliant response with pixel bboxes", async () => {
    const mockValidResponse = {
      status: "SUCCESS",
      model: "BuildingDetector-YOLOv8",
      version: "2.1.0",
      source: "SatGeo ML Cloud",
      license: "Apache-2.0",
      durationMs: 342,
      detections: [
        {
          className: "building",
          confidence: 0.92,
          bbox: [10, 10, 30, 30]
        },
        {
          className: "building",
          confidence: 0.78,
          bbox: [50, 50, 80, 80]
        },
        {
          className: "building",
          confidence: 0.25, // Below default 0.40 threshold
          bbox: [100, 100, 120, 120]
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockValidResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleRaster,
      { targetClasses: ["buildings"], confidenceThreshold: 0.40 },
      { apiUrl: "https://api.satml.example.com/detect?token=secret123", apiKey: "test-token", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.model).toBe("BuildingDetector-YOLOv8");
    // Filtered out the 0.25 confidence detection
    expect(result.totalObjects).toBe(2);
    expect(result.features.features.length).toBe(2);
    
    // Verify sanitization of endpoint in metadata
    expect(result.runtimeMetadata?.remote_endpoint).toBe("https://api.satml.example.com/detect");
  });

  it("5. Zod Schema Validation (NO_DETECTIONS): accepts NO_DETECTIONS response", async () => {
    const mockEmptyResponse = {
      status: "NO_DETECTIONS",
      model: "BuildingDetector-YOLOv8",
      version: "2.1.0"
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockEmptyResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.totalObjects).toBe(0);
    expect(result.features.features.length).toBe(0);
  });

  it("6. Zod Schema Validation (FAILED): rejects malformed remote response", async () => {
    // Malformed: missing spatial representation
    const malformedResponse = {
      status: "SUCCESS",
      model: "BadModel",
      detections: [
        {
          className: "building",
          confidence: 0.85
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(malformedResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("schema validation failed");
    expect(result.features.features).toEqual([]);
  });

  it("7. Network error: handles remote 500 error gracefully", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "Internal ML Gateway Crash"
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("HTTP 502: Bad Gateway");
  });

  it("8. Georeferencing Accuracy: correctly maps pixel bbox to geographic coordinates", () => {
    const poly = convertBboxToGeoJSONPolygon(10, 20, 30, 40, [0.0001, -0.0001], 10.0, 50.0);
    expect(poly.type).toBe("Polygon");
    const ring = poly.coordinates[0];
    expect(ring.length).toBe(5);

    expect(ring[0][0]).toBeCloseTo(10.001);
    expect(ring[0][1]).toBeCloseTo(49.998);
    expect(ring[2][0]).toBeCloseTo(10.003);
    expect(ring[2][1]).toBeCloseTo(49.996);
    expect(ring[0]).toEqual(ring[4]);
  });

  it("9. Arbitrary Pixel Polygon Georeferencing: converts and closes polygon rings", () => {
    const pixelPoints: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const poly = convertPixelPolygonToGeoJSONPolygon(pixelPoints, [0.0001, -0.0001], 10.0, 50.0);
    expect(poly.type).toBe("Polygon");
    expect(poly.coordinates[0].length).toBe(5);
    expect(poly.coordinates[0][0]).toEqual(poly.coordinates[0][4]);
  });

  it("10. Roboflow Format Compatibility: accurately parses center-x/y predictions into bboxes", async () => {
    const roboflowResponse = {
      predictions: [
        {
          x: 50,
          y: 60,
          width: 20,
          height: 30,
          class: "building",
          confidence: 0.88
        }
      ],
      time: 0.12
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(roboflowResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleRaster,
      { targetClasses: ["buildings"], confidenceThreshold: 0.5 },
      { apiUrl: "https://detect.roboflow.com/sat-building-model/1", apiKey: "rf_secret_key", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.totalObjects).toBe(1);
    expect(result.features.features.length).toBe(1);
    expect(result.features.features[0].properties?.className).toBe("building");
    expect(result.features.features[0].properties?.confidence).toBe(0.88);
  });

  it("11. Base64 PNG Encoding: produces valid base64 representation from multi-band pixels", async () => {
    const rasterWithMultiBands: RasterWindowResult = {
      ...sampleRaster,
      width: 16,
      height: 16,
      pixelWindow: { originX: 0, originY: 0, width: 16, height: 16 },
      pixelData: [
        new Float32Array(16 * 16).fill(120),
        new Float32Array(16 * 16).fill(140),
        new Float32Array(16 * 16).fill(160),
        new Float32Array(16 * 16).fill(255)
      ]
    };

    let sentBase64: string | undefined;
    const mockFetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const parsed = JSON.parse(init.body);
      sentBase64 = parsed.imageBase64;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "NO_DETECTIONS", model: "Validator", version: "1.0" })
      } as Response;
    });

    const result = await RemoteInferenceAdapter.execute(
      rasterWithMultiBands,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(sentBase64).toBeDefined();
    expect(sentBase64?.length).toBeGreaterThan(50);
    // Base64 header for PNG starts with iVBORw0KGgo
    expect(sentBase64?.startsWith("iVBORw0KGgo")).toBe(true);
  });
});
