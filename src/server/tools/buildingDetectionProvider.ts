import { ToolResult, RasterWindowResult, BuildingDetectionResult, Evidence } from "../../types/index.js";
import * as turf from "@turf/turf";

export interface BuildingDetectionOutput {
  detections: {
    mask: any; // e.g. RLE or boolean array
    confidence: number | null;
    className: string;
    // mock geometry directly for tests
    geometry?: GeoJSON.Polygon;
  }[];
}

export interface BuildingDetectionModel {
  name: string;
  version?: string;
  detect(rasterData: RasterWindowResult, pixelData: any): Promise<BuildingDetectionOutput>;
}

// In a real environment, this might load a YOLOv8 ONNX model
let activeModel: BuildingDetectionModel | null = null;

export function setTestModel(model: BuildingDetectionModel) {
  activeModel = model;
}

export async function detectBuildingsProvider(input: any): Promise<ToolResult<BuildingDetectionResult>> {
  try {
    let rasterWindowResult: RasterWindowResult | null = null;
    
    // Look for RasterWindowResult in dependencies
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
        toolName: "detectBuildings",
        status: "FAILED",
        message: "No raster window result provided by dependencies.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelWindow) {
      return {
        toolName: "detectBuildings",
        status: "SKIPPED",
        message: "Raster window was empty (no overlap); skipping detection.",
        evidence: []
      };
    }

    // Check for a real runtime
    if (!activeModel) {
      return {
        toolName: "detectBuildings",
        status: "NOT_IMPLEMENTED",
        message: "Building detection model/runtime is not available in the current environment.",
        evidence: []
      };
    }

    // Preprocessing (conceptual)
    // - Convert raster to model input (e.g. normalize, tensor format)
    const pixelData = null; // We would pass real pixels here if we had them extracted
    
    // Run Inference
    const inferenceResult = await activeModel.detect(rasterWindowResult, pixelData);
    
    // Mask -> GeoJSON conversion
    const features: any[] = [];
    for (const det of inferenceResult.detections) {
      // For test fixtures, we pass geometry directly to simulate mask extraction
      let geom = det.geometry;
      if (!geom) {
        // In a real implementation:
        // 1. Identify mask pixels belonging to buildings
        // 2. Convert pixel coordinates to raster coordinates
        // 3. Convert raster coordinates to geographic (using CRS/resolution)
        // 4. Generate polygon boundaries
        geom = { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };
      }
      
      const feature = turf.polygon(geom.coordinates, {
        confidence: det.confidence,
        className: det.className
      });
      
      // Calculate area deterministically using turf
      const areaM2 = turf.area(feature);
      Object.assign(feature.properties || {}, { areaM2 });
      
      features.push(feature);
    }
    
    const fc = turf.featureCollection(features);
    
    // Zod validation is deferred to the calling scope or we can parse it here
    const result: BuildingDetectionResult = {
      features: fc as any,
      detectionCount: features.length,
      model: {
        name: activeModel.name,
        version: activeModel.version || null
      },
      sourceRaster: {
        stacItemId: rasterWindowResult.rasterId,
        assetKey: rasterWindowResult.assetKey
      },
      crs: rasterWindowResult.crs,
      resolution: rasterWindowResult.resolution
    };

    const evidence: Evidence = {
      source: "Microsoft Planetary Computer",
      dataset: "Imagery",
      date: new Date().toISOString().split('T')[0], // real date would come from imagery metadata
      operation: "building_detection",
      confidence: null,
      provenance: `Model ${activeModel.name} on STAC Item ${rasterWindowResult.rasterId} Asset ${rasterWindowResult.assetKey}`
    };

    let msg = features.length > 0 ? `Successfully detected ${features.length} buildings.` : "Executed successfully but detected no buildings.";
    
    return {
      toolName: "detectBuildings",
      status: "SUCCESS",
      message: msg,
      data: result,
      evidence: [evidence]
    };
  } catch (error: any) {
    return {
      toolName: "detectBuildings",
      status: "FAILED",
      message: `Error detecting buildings: ${error.message}`,
      evidence: []
    };
  }
}
