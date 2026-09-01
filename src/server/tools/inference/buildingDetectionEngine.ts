import { 
  RemoteInferenceAdapter, 
  InferenceRunOptions, 
  pixelToGeographic, 
  convertBboxToGeoJSONPolygon, 
  convertPixelPolygonToGeoJSONPolygon 
} from "./remoteInferenceAdapter.js";
import { ObjectDetectionResult, RasterWindowResult } from "../../../types/index.js";

export interface InferenceOptions {
  targetClasses: string[];
  confidenceThreshold?: number;
  maxTileSize?: number;
  maxTotalPixels?: number;
}

/**
 * Primary inference entry point for object and building detection.
 * Delegates to the server-side, strongly-typed RemoteInferenceAdapter.
 * 
 * Strict Architectural Rule:
 * If no real inference endpoint is configured, returns NOT_IMPLEMENTED.
 * Zero detections are fabricated.
 */
export async function detectBuildingsInference(
  rasterWindow: RasterWindowResult, 
  options: InferenceOptions
): Promise<ObjectDetectionResult> {
  return await RemoteInferenceAdapter.execute(rasterWindow, options);
}

export { 
  pixelToGeographic, 
  convertBboxToGeoJSONPolygon, 
  convertPixelPolygonToGeoJSONPolygon 
};
