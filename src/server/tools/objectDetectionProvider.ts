import { ToolResult, ObjectDetectionResult, Evidence, RasterWindowResult } from "../../types/index.js";
import { detectBuildingsInference } from "./inference/buildingDetectionEngine.js";

export async function detectObjects(input: any): Promise<ToolResult<ObjectDetectionResult>> {
  try {
    let rasterWindowResult: RasterWindowResult | null = null;
    
    if (input.dependencyOutputs) {
      for (const [id, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (depOutput && typeof depOutput === "object") {
          const out = depOutput as any;
          if (("pixelWindow" in out) && out.assetKey && out.width) {
            rasterWindowResult = out as RasterWindowResult;
            break;
          }
        }
      }
    }

    if (!rasterWindowResult) {
      return {
        toolName: "detectObjects",
        status: "SKIPPED",
        message: "No upstream raster window result found.",
        evidence: []
      };
    }
    
    if (!rasterWindowResult.pixelWindow || !rasterWindowResult.pixelData || !Array.isArray(rasterWindowResult.pixelData)) {
      return {
        toolName: "detectObjects",
        status: "FAILED",
        message: "Raster window data is incomplete.",
        evidence: []
      };
    }

    const targetClasses = input.targetClasses || (input.target ? [input.target] : ["objects"]);
    const confidenceThreshold = input.confidenceThreshold || 0.40;

    const inferenceResult = await detectBuildingsInference(rasterWindowResult, {
      targetClasses,
      confidenceThreshold
    });

    const evidenceList: Evidence[] = [];
    if (inferenceResult.status === "SUCCESS") {
      evidenceList.push({
        source: inferenceResult.modelSource || "External ML Endpoint",
        dataset: rasterWindowResult.rasterId || "Planetary Computer STAC",
        date: new Date().toISOString().split('T')[0],
        operation: "building_object_detection",
        confidence: null, // Deterministic real confidence is preserved inside features
        provenance: `Endpoint: ${inferenceResult.runtimeMetadata?.remote_endpoint || "Remote API"} | Model: ${inferenceResult.model} v${inferenceResult.modelVersion} (License: ${inferenceResult.modelLicense || "N/A"}) | STAC Item ${rasterWindowResult.rasterId} Asset ${rasterWindowResult.assetKey} Window | Detections: ${inferenceResult.totalObjects} | Conf: ${inferenceResult.confidenceThreshold}`
      });
    } else if (inferenceResult.status === "NOT_IMPLEMENTED") {
      evidenceList.push({
        source: "System Audit",
        dataset: "Inference Engine",
        date: new Date().toISOString().split('T')[0],
        operation: "building_object_detection",
        confidence: null,
        provenance: "Inference disabled: " + inferenceResult.model
      });
    }

    return {
      toolName: "detectObjects",
      status: inferenceResult.status as any,
      message: inferenceResult.status === "NOT_IMPLEMENTED" 
        ? `Object detection for [${targetClasses.join(", ")}] requires GPU infrastructure and a loaded model (e.g., YOLO). No inference model available.` 
        : (inferenceResult.status === "SUCCESS"
            ? `Detection completed with status ${inferenceResult.status}. Found ${inferenceResult.totalObjects} objects (${inferenceResult.classesDetected.join(", ")}).`
            : (inferenceResult.processingMetadata?.error || `Detection failed.`)),
      data: inferenceResult,
      evidence: evidenceList
    };
    
  } catch (error: any) {
    return {
      toolName: "detectObjects",
      status: "FAILED",
      message: `Error detecting objects: ${error.message}`,
      evidence: []
    };
  }
}
