import { ToolResult, ChangeDetectionResult, GeoJSONFeatureCollection } from "../../types/index.js";
import { center, distance } from "@turf/turf";

export async function detectChangeProvider(input: any): Promise<ToolResult<ChangeDetectionResult>> {
  try {
    const deps = input.dependencyOutputs || {};
    
    // Find the T1 and T2 detection results
    const detectKeys = Object.keys(deps).filter(k => k.includes("detect_objects") || k.includes("detect_buildings"));
    
    if (detectKeys.length !== 2) {
      return {
        toolName: "detectChange",
        status: "FAILED",
        message: `Change detection requires exactly 2 building detection dependencies, found ${detectKeys.length}.`
      };
    }
    
    // Determine which is T1 (start) and T2 (end) based on key names
    const t1Key = detectKeys.find(k => k.includes("start")) || detectKeys[0];
    const t2Key = detectKeys.find(k => k.includes("end")) || detectKeys[1];
    
    const t1Result = deps[t1Key] as any;
    const t2Result = deps[t2Key] as any;
    
    if (t1Result?.status === "NOT_IMPLEMENTED" || t2Result?.status === "NOT_IMPLEMENTED") {
       return {
         toolName: "detectChange",
         status: "NOT_IMPLEMENTED",
         message: "Change detection is unavailable because upstream building detection is not implemented.",
         evidence: []
       };
    }
    if (t1Result?.inferenceStatus === "NOT_IMPLEMENTED" || t2Result?.inferenceStatus === "NOT_IMPLEMENTED") {
       return {
         toolName: "detectChange",
         status: "NOT_IMPLEMENTED",
         message: "Change detection is unavailable because upstream building inference is not implemented.",
         evidence: []
       };
    }
    
    
    if (!t1Result || !t2Result || !t1Result.features || !t2Result.features) {
      return {
        toolName: "detectChange",
        status: "FAILED",
        message: "Missing valid building detections for T1 or T2."
      };
    }

    const t1Features = t1Result.features.features || [];
    const t2Features = t2Result.features.features || [];
    
    const addedFeatures: any[] = [];
    const removedFeatures: any[] = [];
    const unchangedFeatures: any[] = [];
    
    // Deterministic matching: Centroid distance < 15 meters
    const MATCH_THRESHOLD_METERS = 15;
    
    const t2Matched = new Set<number>();
    
    // Find removed and unchanged
    for (const f1 of t1Features) {
      let matched = false;
      const c1 = center(f1 as any);
      
      for (let j = 0; j < t2Features.length; j++) {
        if (t2Matched.has(j)) continue;
        
        const f2 = t2Features[j];
        const c2 = center(f2 as any);
        const dist = distance(c1, c2, { units: 'meters' });
        
        if (dist < MATCH_THRESHOLD_METERS) {
          matched = true;
          t2Matched.add(j);
          unchangedFeatures.push(f2);
          break;
        }
      }
      
      if (!matched) {
        removedFeatures.push(f1);
      }
    }
    
    // Find added
    for (let j = 0; j < t2Features.length; j++) {
      if (!t2Matched.has(j)) {
        addedFeatures.push(t2Features[j]);
      }
    }
    
    const addedCollection: GeoJSONFeatureCollection = { type: "FeatureCollection", features: addedFeatures };
    const removedCollection: GeoJSONFeatureCollection = { type: "FeatureCollection", features: removedFeatures };
    const unchangedCollection: GeoJSONFeatureCollection = { type: "FeatureCollection", features: unchangedFeatures };
    
    const baselineDate = (t1Result as any).acquisitionDate || "Unknown Baseline";
    const comparisonDate = (t2Result as any).acquisitionDate || "Unknown Comparison";

    const data: ChangeDetectionResult = {
      added: addedCollection,
      removed: removedCollection,
      unchanged: unchangedCollection,
      summary: {
        addedCount: addedFeatures.length,
        removedCount: removedFeatures.length,
        unchangedCount: unchangedFeatures.length
      },
      baselineDate,
      comparisonDate
    };
    
    return {
      toolName: "detectChange",
      status: "SUCCESS",
      message: `Detected ${addedFeatures.length} added and ${removedFeatures.length} removed buildings between ${baselineDate} and ${comparisonDate}.`,
      data,
      evidence: [
        {
          source: "SATQuery GIS Engine",
          dataset: `Temporal Comparison (${t1Result.model || "Unknown Model"})`,
          operation: "change_detection",
          date: new Date().toISOString().split('T')[0],
          confidence: null,
          provenance: `Deterministic geometric centroid distance matching (threshold: ${MATCH_THRESHOLD_METERS}m) between ${baselineDate} and ${comparisonDate}.`
        }
      ]
    };

  } catch (error: any) {
    return {
      toolName: "detectChange",
      status: "FAILED",
      message: `Change detection error: ${error.message}`
    };
  }
}
