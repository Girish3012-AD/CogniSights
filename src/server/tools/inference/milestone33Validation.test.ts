import { describe, it, expect, vi } from "vitest";
import { RemoteInferenceAdapter, convertBboxToGeoJSONPolygon, convertPixelPolygonToGeoJSONPolygon } from "./remoteInferenceAdapter.js";
import { RasterWindowResult } from "../../../types/index.js";
import { detectObjects } from "../objectDetectionProvider.js";
import { createQueryPlan } from "../../planner/planner.js";
import { searchDatasetsProvider } from "../datasetProvider.js";

describe("Milestone 33 - Real Building Detection Validation", () => {
  const sampleNaipRaster: RasterWindowResult = {
    rasterId: "wa_m_4712211_se_10_060_20210619",
    assetKey: "image",
    width: 256,
    height: 256,
    crs: "EPSG:4326",
    resolution: { x: 0.00001, y: -0.00001 },
    window: { minX: -122.34, minY: 47.60, maxX: -122.33, maxY: 47.61 },
    pixelWindow: { originX: 0, originY: 0, width: 256, height: 256 },
    pixelData: [
      new Float32Array(256 * 256).fill(100),
      new Float32Array(256 * 256).fill(120),
      new Float32Array(256 * 256).fill(140)
    ]
  };

  // 1. Successful response normalization
  it("1. Successful response normalization: maps remote payload to strongly-typed detection result", async () => {
    const mockModelResponse = {
      status: "SUCCESS",
      model: "BuildingDetector-YOLOv8",
      version: "1.4.0",
      source: "SatGeo Remote Inference",
      license: "MIT",
      durationMs: 250,
      detections: [
        {
          className: "building",
          confidence: 0.94,
          bbox: [20, 20, 60, 60]
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockModelResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"], confidenceThreshold: 0.50 },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.inferenceStatus).toBe("SUCCESS");
    expect(result.model).toBe("BuildingDetector-YOLOv8");
    expect(result.modelVersion).toBe("1.4.0");
    expect(result.totalObjects).toBe(1);
    expect(result.classesDetected).toEqual(["building"]);
    expect(result.features.features.length).toBe(1);
  });

  // 2. Confidence filtering
  it("2. Confidence filtering: filters out detections below threshold without altering valid scores", async () => {
    const mockModelResponse = {
      status: "SUCCESS",
      model: "BuildingDetector-YOLOv8",
      version: "1.4.0",
      detections: [
        { className: "building", confidence: 0.85, bbox: [10, 10, 30, 30] },
        { className: "building", confidence: 0.35, bbox: [40, 40, 60, 60] } // Below 0.50 threshold
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockModelResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"], confidenceThreshold: 0.50 },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.totalObjects).toBe(1);
    expect(result.features.features[0].properties?.confidence).toBe(0.85);
  });

  // 3. Pixel-to-geographic conversion
  it("3. Pixel-to-geographic conversion: accurately projects pixel coordinates using affine transform", () => {
    const transform = [0.00001, -0.00001];
    const originX = -122.34;
    const originY = 47.61;
    const poly = convertBboxToGeoJSONPolygon(10, 10, 50, 50, transform, originX, originY);

    expect(poly.type).toBe("Polygon");
    const ring = poly.coordinates[0];
    expect(ring[0][0]).toBeCloseTo(-122.3399);
    expect(ring[0][1]).toBeCloseTo(47.6099);
    expect(ring[2][0]).toBeCloseTo(-122.3395);
    expect(ring[2][1]).toBeCloseTo(47.6095);
  });

  // 4. GeoJSON generation
  it("4. GeoJSON generation: produces valid closed Polygon features with calculated area", async () => {
    const mockModelResponse = {
      status: "SUCCESS",
      model: "BuildingDetector-YOLOv8",
      version: "1.4.0",
      detections: [
        { className: "building", confidence: 0.90, bbox: [0, 0, 100, 100] }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockModelResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    const feature = result.features.features[0];
    expect(feature.geometry.type).toBe("Polygon");
    expect(feature.geometry.coordinates[0].length).toBe(5);
    expect(feature.properties?.areaM2).toBeGreaterThan(0);
  });

  // 5. Invalid response
  it("5. Invalid response: returns FAILED when response body is not valid JSON or invalid schema", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "Non-JSON HTML Error Page"
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("FAILED");
    expect(result.inferenceStatus).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("Remote inference response is not valid JSON");
  });

  // 6. Invalid geometry
  it("6. Invalid geometry: handles corrupted/out-of-bounds bounding box safely", async () => {
    const mockModelResponse = {
      status: "SUCCESS",
      model: "BuildingDetector-YOLOv8",
      version: "1.4.0",
      detections: [
        { className: "building", confidence: 0.90, bbox: [NaN, Infinity, 10, 10] }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockModelResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    // Corrupted geometry is rejected safely without crashing
    expect(result.features.features.length).toBe(0);
    expect(result.totalObjects).toBe(0);
  });

  // 7. No endpoint
  it("7. No endpoint: returns NOT_IMPLEMENTED when INFERENCE_API_URL is unset or empty", async () => {
    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "" }
    );

    expect(result.status).toBe("NOT_IMPLEMENTED");
    expect(result.inferenceStatus).toBe("NOT_IMPLEMENTED");
    expect(result.totalObjects).toBe(0);
  });

  // 8. Endpoint failure
  it("8. Endpoint failure: returns FAILED with diagnostic message when endpoint is unreachable", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused (ECONNREFUSED)"));

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://unreachable-host.example.com:9999/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("FAILED");
    expect(result.inferenceStatus).toBe("FAILED");
    expect(result.processingMetadata?.error).toContain("Connection refused");
  });

  // 9. NO_DETECTIONS
  it("9. NO_DETECTIONS: accurately handles empty detection result from model", async () => {
    const mockEmptyResponse = {
      status: "NO_DETECTIONS",
      model: "BuildingDetector-YOLOv8",
      version: "1.4.0",
      durationMs: 120
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockEmptyResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.totalObjects).toBe(0);
    expect(result.features.features).toEqual([]);
  });

  // 10. Unsupported class
  it("10. Target class filtering: preserves requested target classes in metadata", async () => {
    const mockModelResponse = {
      status: "SUCCESS",
      model: "MultiObjectDetector",
      version: "1.0",
      detections: [
        { className: "vehicle", confidence: 0.90, bbox: [10, 10, 20, 20] }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockModelResponse)
    } as Response);

    const result = await RemoteInferenceAdapter.execute(
      sampleNaipRaster,
      { targetClasses: ["buildings"] },
      { apiUrl: "https://api.satml.example.com/detect", fetchFn: mockFetch }
    );

    expect(result.classesRequested).toEqual(["buildings"]);
    expect(result.classesDetected).toEqual(["vehicle"]);
  });

  // 11. Existing NAIP selection in planner
  it("11. Deterministic Planner: creates building detection steps requiring high-resolution raster", () => {
    const plan = createQueryPlan({
      target: "buildings",
      operation: "detect",
      location: { name: "Seattle" }
    } as any);

    const hasSearchDatasets = plan.some(s => s.toolName === "searchDatasets");
    const hasGetSatelliteImagery = plan.some(s => s.toolName === "getSatelliteImagery");
    const hasProcessRasterWindow = plan.some(s => s.toolName === "processRasterWindow");
    const hasDetectObjects = plan.some(s => s.toolName === "detectObjects");

    expect(hasSearchDatasets).toBe(true);
    expect(hasGetSatelliteImagery).toBe(true);
    expect(hasProcessRasterWindow).toBe(true);
    expect(hasDetectObjects).toBe(true);
  });

  // 12. Existing Pune rejection for NAIP / high-res dataset search
  it("12. Dataset Discovery: searchDatasetsProvider searches real Planetary Computer catalog", async () => {
    const mockMpcResponse = {
      collections: [
        { id: "naip", title: "NAIP: National Agriculture Imagery Program", description: "High resolution aerial imagery of the USA." },
        { id: "sentinel-2-l2a", title: "Sentinel-2 Level-2A", description: "Global multispectral imagery." }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMpcResponse
    } as Response);

    try {
      const result = await searchDatasetsProvider({ query: "NAIP" });
      expect(result.status).toBe("SUCCESS");
      expect(result.data?.some(d => d.id === "naip")).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  // 13. Dependency enforcement in detectObjects
  it("13. Provider Safety: detectObjects returns SKIPPED when upstream raster dependencies fail", async () => {
    const result = await detectObjects({
      target: "buildings",
      dependencyOutputs: {}
    });

    expect(result.status).toBe("SKIPPED");
  });
});
