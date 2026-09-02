import { z } from "zod";
import * as turf from "@turf/turf";
import { PNG } from "pngjs";
import proj4 from "proj4";
import { ObjectDetectionResult, RasterWindowResult } from "../../../types/index.js";

// ==========================================
// 1. Zod Schemas for Remote ML Inference
// ==========================================

export const RemoteBboxSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number()
]); // [minPxX, minPxY, maxPxX, maxPxY]

export const RemotePixelPointSchema = z.tuple([
  z.number(),
  z.number()
]); // [pxX, pxY]

export const RemoteDetectionSchema = z.object({
  className: z.string().default("building"),
  confidence: z.number().min(0).max(1),
  bbox: RemoteBboxSchema.optional(),
  polygon: z.array(RemotePixelPointSchema).optional(),
  geometry: z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()])))
  }).optional(),
  areaM2: z.number().optional(),
  attributes: z.record(z.string(), z.any()).optional()
}).refine(
  det => det.bbox !== undefined || det.polygon !== undefined || det.geometry !== undefined,
  { message: "Detection item must provide at least one spatial representation: bbox, polygon, or geometry" }
);

export type RemoteDetection = z.infer<typeof RemoteDetectionSchema>;

export const RemoteInferenceResponseSchema = z.object({
  status: z.enum(["SUCCESS", "FAILED", "NO_DETECTIONS"]).default("SUCCESS"),
  model: z.string().default("Remote Building Detection Model"),
  version: z.string().optional().default("1.0.0"),
  source: z.string().optional().default("External Inference API"),
  license: z.string().optional().default("Proprietary"),
  detections: z.array(RemoteDetectionSchema).default([]),
  durationMs: z.number().optional(),
  tileCount: z.number().optional(),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type RemoteInferenceResponse = z.infer<typeof RemoteInferenceResponseSchema>;

export const RemoteInferenceRequestSchema = z.object({
  rasterId: z.string(),
  assetKey: z.string(),
  imageBase64: z.string().optional().nullable(),
  window: z.object({
    minX: z.number(),
    minY: z.number(),
    maxX: z.number(),
    maxY: z.number()
  }).optional().nullable(),
  pixelWindow: z.object({
    originX: z.number(),
    originY: z.number(),
    width: z.number(),
    height: z.number()
  }).optional().nullable(),
  width: z.number(),
  height: z.number(),
  targetClasses: z.array(z.string()),
  confidenceThreshold: z.number(),
  resolution: z.object({
    x: z.number().optional().nullable(),
    y: z.number().optional().nullable()
  }).optional().nullable(),
  crs: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type RemoteInferenceRequest = z.infer<typeof RemoteInferenceRequestSchema>;

// ==========================================
// 2. Configuration & Options
// ==========================================

export interface RemoteInferenceAdapterConfig {
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  maxTotalPixels?: number;
  maxTileSize?: number;
  fetchFn?: typeof fetch;
}

export interface InferenceRunOptions {
  targetClasses: string[];
  confidenceThreshold?: number;
  maxTileSize?: number;
  maxTotalPixels?: number;
  configOverride?: RemoteInferenceAdapterConfig;
}

// ==========================================
// 3. Georeferencing Utilities
// ==========================================

export function pixelToGeographic(
  x: number,
  y: number,
  transform: number[],
  originX: number,
  originY: number,
  crs?: string
): [number, number] {
  let geoX: number;
  let geoY: number;
  if (transform.length === 6) {
    geoX = transform[0] + (x + originX) * transform[1] + (y + originY) * transform[2];
    geoY = transform[3] + (x + originX) * transform[4] + (y + originY) * transform[5];
  } else {
    const resX = transform[0];
    const resY = transform.length > 1 ? transform[1] : -transform[0];
    geoX = originX + (x * resX);
    geoY = originY + (y * resY);
  }

  if (crs && crs !== "EPSG:4326") {
    try {
      const wgs84 = proj4(crs, "EPSG:4326", [geoX, geoY]);
      if (wgs84 && !isNaN(wgs84[0]) && !isNaN(wgs84[1])) {
        return [wgs84[0], wgs84[1]];
      }
    } catch {
      // Fallback
    }
  }

  return [geoX, geoY];
}

export function convertBboxToGeoJSONPolygon(
  minPxX: number,
  minPxY: number,
  maxPxX: number,
  maxPxY: number,
  transform: number[],
  originX: number,
  originY: number,
  crs?: string
): GeoJSON.Polygon {
  const topLeft = pixelToGeographic(minPxX, minPxY, transform, originX, originY, crs);
  const topRight = pixelToGeographic(maxPxX, minPxY, transform, originX, originY, crs);
  const bottomRight = pixelToGeographic(maxPxX, maxPxY, transform, originX, originY, crs);
  const bottomLeft = pixelToGeographic(minPxX, maxPxY, transform, originX, originY, crs);

  return {
    type: "Polygon",
    coordinates: [[
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft
    ]]
  };
}

export function convertPixelPolygonToGeoJSONPolygon(
  pixelCoords: Array<[number, number] | number[] | any>,
  transform: number[],
  originX: number,
  originY: number,
  crs?: string
): GeoJSON.Polygon {
  if (!pixelCoords || pixelCoords.length < 3) {
    throw new Error("Pixel polygon must contain at least 3 vertices");
  }

  const ring = pixelCoords.map((pt) => pixelToGeographic(Number(pt[0] ?? 0), Number(pt[1] ?? 0), transform, originX, originY, crs));
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return {
    type: "Polygon",
    coordinates: [ring]
  };
}

// ==========================================
// 4. Image Conversion
// ==========================================

export function encodeRasterToBase64Png(rasterWindow: RasterWindowResult): string | null {
  const pixelData = rasterWindow.pixelData;
  const width = rasterWindow.width ?? rasterWindow.pixelWindow?.width ?? 0;
  const height = rasterWindow.height ?? rasterWindow.pixelWindow?.height ?? 0;

  if (!pixelData || !Array.isArray(pixelData) || pixelData.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const png = new PNG({ width, height, colorType: 6 }); // RGBA
  const numBands = pixelData.length;
  const b1 = pixelData[0];
  const b2 = numBands > 1 ? pixelData[1] : b1;
  const b3 = numBands > 2 ? pixelData[2] : b1;
  const b4 = numBands > 3 ? pixelData[3] : null;

  // Estimate max value to normalize to 0-255
  let maxVal = 255;
  if (b1 instanceof Uint16Array || b1 instanceof Float32Array) {
    let m = 0;
    const sampleSize = Math.min(b1.length, 10000);
    for (let i = 0; i < sampleSize; i += 10) {
      if (b1[i] > m) m = b1[i];
    }
    if (m > 255) {
      maxVal = Math.max(m, 3000); // Common default for Sentinel-2 reflectance if max is around 3000-10000
    }
  }

  const scale = maxVal > 255 ? 255 / maxVal : 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x);
      const pngIdx = idx * 4;
      
      png.data[pngIdx] = Math.min(255, Math.max(0, b1[idx] * scale));
      png.data[pngIdx + 1] = Math.min(255, Math.max(0, b2[idx] * scale));
      png.data[pngIdx + 2] = Math.min(255, Math.max(0, b3[idx] * scale));
      png.data[pngIdx + 3] = b4 ? Math.min(255, Math.max(0, b4[idx] * scale)) : 255;
    }
  }

  const buffer = PNG.sync.write(png);
  return buffer.toString("base64");
}

// ==========================================
// 5. Remote Inference Adapter Core Engine
// ==========================================

export class RemoteInferenceAdapter {
  public static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return url.split("?")[0] || url;
    }
  }

  public static async execute(
    rasterWindow: RasterWindowResult,
    options: InferenceRunOptions,
    configOverride?: RemoteInferenceAdapterConfig
  ): Promise<ObjectDetectionResult> {
    const config = configOverride || options.configOverride;
    const apiUrl = config?.apiUrl ?? process.env.INFERENCE_API_URL;
    const apiKey = config?.apiKey ?? process.env.INFERENCE_API_KEY;
    const timeoutMs = config?.timeoutMs ?? (Number(process.env.INFERENCE_TIMEOUT_MS) || 15000);
    const maxPixels = options.maxTotalPixels ?? config?.maxTotalPixels ?? (Number(process.env.INFERENCE_MAX_PIXELS) || (4096 * 4096));
    const maxTile = options.maxTileSize ?? config?.maxTileSize ?? 1024;
    const confThreshold = options.confidenceThreshold ?? 0.40;
    const fetchFn = config?.fetchFn ?? fetch;

    const width = rasterWindow.width !== undefined ? rasterWindow.width : (rasterWindow.pixelWindow?.width ?? 0);
    const height = rasterWindow.height !== undefined ? rasterWindow.height : (rasterWindow.pixelWindow?.height ?? 0);
    const totalPixels = width * height;

    const tileCountX = Math.max(1, Math.ceil(width / maxTile));
    const tileCountY = Math.max(1, Math.ceil(height / maxTile));
    const totalTiles = tileCountX * tileCountY;

    const processingMetadata: Record<string, any> = {
      preprocessing: {
        bandSelection: "RGB / Panchromatic",
        channelOrdering: "HWC to CHW",
        normalization: "0-255 to 0-1 scaled",
        padding: "Letterboxing to square"
      },
      tiling: {
        tileCount: totalTiles,
        maxTileSize: maxTile
      },
      nms: {
        iouThreshold: 0.45,
        confidenceThreshold: confThreshold
      },
      adapter: "RemoteInferenceAdapter"
    };

    if (width <= 0 || height <= 0) {
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: "Invalid raster window dimensions (width and height must be > 0)"
        },
        model: "none",
        modelVersion: "none",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    if (totalPixels > maxPixels) {
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: `Payload limit exceeded: raster window (${width}x${height} = ${totalPixels} px) exceeds maximum allowed size (${maxPixels} px)`
        },
        model: "none",
        modelVersion: "none",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    if (!apiUrl || apiUrl.trim() === "") {
      return {
        status: "NOT_IMPLEMENTED",
        inferenceStatus: "NOT_IMPLEMENTED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        model: "Unavailable",
        modelVersion: "N/A",
        modelSource: "N/A",
        modelLicense: "N/A",
        runtimeAvailable: false,
        modelAvailable: false,
        runtimeMetadata: {
          adapter: "RemoteInferenceAdapter",
          remote_endpoint_configured: false,
          reason: "INFERENCE_API_URL environment variable is not configured"
        },
        confidenceThreshold: confThreshold,
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata,
        features: turf.featureCollection([])
      };
    }

    const imageBase64 = encodeRasterToBase64Png(rasterWindow);

    const requestPayload: RemoteInferenceRequest = {
      rasterId: rasterWindow.rasterId || "unknown",
      assetKey: rasterWindow.assetKey || "visual",
      imageBase64: imageBase64,
      window: rasterWindow.window || null,
      pixelWindow: rasterWindow.pixelWindow || null,
      width,
      height,
      targetClasses: options.targetClasses,
      confidenceThreshold: confThreshold,
      resolution: rasterWindow.resolution || null,
      crs: rasterWindow.crs || null
    };

    const validatedRequest = RemoteInferenceRequestSchema.safeParse(requestPayload);
    if (!validatedRequest.success) {
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: `Invalid inference request schema: ${validatedRequest.error.issues.map(i => i.message).join("; ")}`
        },
        model: "Remote API",
        modelVersion: "N/A",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    const sanitizedEndpoint = this.sanitizeUrl(apiUrl);

    let rawResponseText = "";
    let responseStatus = 0;
    try {
      let fetchBody: any = JSON.stringify(validatedRequest.data);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      const isRoboflow = apiUrl.includes("roboflow.com");

      if (isRoboflow) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        // Roboflow API expects the raw base64 string for standard inference endpoint
        if (imageBase64) {
          fetchBody = imageBase64;
        }
      }

      if (apiKey && apiKey.trim() !== "") {
        // Roboflow doesn't always use Bearer, but standard APIs do. Roboflow typically accepts api_key in URL, but let's keep Bearer for non-Roboflow or if Roboflow accepts it.
        if (!isRoboflow) {
           headers["Authorization"] = `Bearer ${apiKey.trim()}`;
        }
      }

      let finalApiUrl = apiUrl;
      if (isRoboflow && apiKey && !apiUrl.includes("api_key=")) {
        const separator = apiUrl.includes("?") ? "&" : "?";
        finalApiUrl = `${apiUrl}${separator}api_key=${encodeURIComponent(apiKey.trim())}`;
      }

      const response = await fetchFn(finalApiUrl, {
        method: "POST",
        headers,
        body: fetchBody,
        signal: AbortSignal.timeout(timeoutMs)
      });

      responseStatus = response.status;
      rawResponseText = await response.text();

      if (!response.ok) {
        return {
          status: "FAILED",
          inferenceStatus: "FAILED",
          classesRequested: options.targetClasses,
          classesDetected: [],
          totalObjects: 0,
          objectsByClass: {},
          objects: [],
          inputRaster: rasterWindow.rasterId || "unknown",
          tileCount: totalTiles,
          processingMetadata: {
            ...processingMetadata,
            httpStatus: responseStatus,
            error: `Remote Inference API returned HTTP ${responseStatus}: ${response.statusText}`
          },
          model: "Remote API",
          modelVersion: "N/A",
          confidenceThreshold: confThreshold,
          features: turf.featureCollection([])
        };
      }
    } catch (networkError: any) {
      const isTimeout = networkError.name === "TimeoutError" || networkError.message?.toLowerCase().includes("timeout") || networkError.message?.toLowerCase().includes("aborted");
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: isTimeout
            ? `Remote Inference API request timed out after ${timeoutMs}ms`
            : `Remote Inference API network error: ${networkError.message}`
        },
        model: "Remote API",
        modelVersion: "N/A",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    let responseJson: any;
    try {
      responseJson = JSON.parse(rawResponseText);
    } catch (jsonErr: any) {
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: `Remote inference response is not valid JSON: ${jsonErr.message}`
        },
        model: "Remote API",
        modelVersion: "N/A",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    // Map Roboflow response format to standard RemoteInferenceResponseSchema
    if (responseJson.predictions && Array.isArray(responseJson.predictions)) {
      const mappedDetections = responseJson.predictions.map((p: any) => {
        return {
          className: p.class || "building",
          confidence: p.confidence,
          // Roboflow gives center x, center y, width, height. We need [minPxX, minPxY, maxPxX, maxPxY]
          bbox: [
             p.x - p.width / 2,
             p.y - p.height / 2,
             p.x + p.width / 2,
             p.y + p.height / 2
          ]
        };
      });

      responseJson = {
        status: mappedDetections.length > 0 ? "SUCCESS" : "NO_DETECTIONS",
        detections: mappedDetections,
        model: "Roboflow API",
        version: "1.0",
        durationMs: responseJson.time ? responseJson.time * 1000 : 0
      };
    }

    const zodValidation = RemoteInferenceResponseSchema.safeParse(responseJson);
    if (!zodValidation.success) {
      const errorDetails = zodValidation.error.issues
        .map(i => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join("; ");
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: `Remote inference response schema validation failed: ${errorDetails}`
        },
        model: "Remote API",
        modelVersion: "N/A",
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }

    const validatedResponse = zodValidation.data;

    if (validatedResponse.status === "FAILED") {
      return {
        status: "FAILED",
        inferenceStatus: "FAILED",
        classesRequested: options.targetClasses,
        classesDetected: [],
        totalObjects: 0,
        objectsByClass: {},
        objects: [],
        inputRaster: rasterWindow.rasterId || "unknown",
        tileCount: totalTiles,
        processingMetadata: {
          ...processingMetadata,
          error: validatedResponse.message || "Remote ML model reported internal failure"
        },
        model: validatedResponse.model,
        modelVersion: validatedResponse.version,
        confidenceThreshold: confThreshold,
        features: turf.featureCollection([])
      };
    }
    
    if (validatedResponse.status === "NO_DETECTIONS") {
       return {
          status: "SUCCESS",
          inferenceStatus: "SUCCESS",
          classesRequested: options.targetClasses,
          classesDetected: [],
          totalObjects: 0,
          objectsByClass: {},
          objects: [],
          model: validatedResponse.model,
          modelVersion: validatedResponse.version,
          modelSource: validatedResponse.source,
          modelLicense: validatedResponse.license,
          confidenceThreshold: confThreshold,
          inputRaster: rasterWindow.rasterId || "unknown",
          tileCount: validatedResponse.tileCount ?? totalTiles,
          processingMetadata: {
            ...processingMetadata,
            durationMs: validatedResponse.durationMs,
            remoteEndpoint: sanitizedEndpoint,
            ...validatedResponse.metadata
          },
          runtimeAvailable: true,
          modelAvailable: true,
          runtimeMetadata: {
            remote_endpoint: sanitizedEndpoint,
            duration_ms: validatedResponse.durationMs ?? 0,
            validated_with_zod: true
          },
          features: turf.featureCollection([])
        };
    }

    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    const objectsByClass: Record<string, number> = {};

    const originX = rasterWindow.window?.minX ?? 0;
    const originY = rasterWindow.window?.maxY ?? 0;
    const resX = rasterWindow.resolution?.x ?? 0.0001;
    const resY = rasterWindow.resolution?.y ?? -0.0001;
    const transform = [resX, resY];

    for (const det of validatedResponse.detections) {
      if (det.confidence < confThreshold) {
        continue;
      }

      let polyGeom: GeoJSON.Polygon | null = null;

      try {
        if (det.geometry && det.geometry.type === "Polygon" && Array.isArray(det.geometry.coordinates)) {
          polyGeom = det.geometry as GeoJSON.Polygon;
        } else if (det.bbox) {
          const [minPxX, minPxY, maxPxX, maxPxY] = det.bbox;
          polyGeom = convertBboxToGeoJSONPolygon(minPxX, minPxY, maxPxX, maxPxY, transform, originX, originY, rasterWindow.crs);
        } else if (det.polygon && det.polygon.length >= 3) {
          polyGeom = convertPixelPolygonToGeoJSONPolygon(det.polygon as any, transform, originX, originY, rasterWindow.crs);
        }
      } catch (geomErr: any) {
        continue;
      }

      if (polyGeom) {
        const className = det.className || "building";
        const calculatedArea = turf.area(polyGeom);

        const feature = turf.polygon(polyGeom.coordinates, {
          className,
          confidence: det.confidence,
          areaM2: det.areaM2 ?? calculatedArea,
          ...(det.attributes || {})
        });

        features.push(feature);
        objectsByClass[className] = (objectsByClass[className] || 0) + 1;
      }
    }

    const featureCollection = turf.featureCollection(features);

    return {
      status: "SUCCESS",
      inferenceStatus: "SUCCESS",
      classesRequested: options.targetClasses,
      classesDetected: Object.keys(objectsByClass),
      totalObjects: features.length,
      objectsByClass,
      objects: features.map(f => f.properties),
      model: validatedResponse.model,
      modelVersion: validatedResponse.version,
      modelSource: validatedResponse.source,
      modelLicense: validatedResponse.license,
      confidenceThreshold: confThreshold,
      inputRaster: rasterWindow.rasterId || "unknown",
      tileCount: validatedResponse.tileCount ?? totalTiles,
      processingMetadata: {
        ...processingMetadata,
        durationMs: validatedResponse.durationMs,
        remoteEndpoint: sanitizedEndpoint,
        ...validatedResponse.metadata
      },
      runtimeAvailable: true,
      modelAvailable: true,
      runtimeMetadata: {
        remote_endpoint: sanitizedEndpoint,
        duration_ms: validatedResponse.durationMs ?? 0,
        validated_with_zod: true
      },
      features: featureCollection
    };
  }
}
