import { ToolResult, RasterWindowResult, RasterPixelAnalysisResult, Evidence } from "../../types/index.js";

export async function analyzeRasterPixels(input: any): Promise<ToolResult<RasterPixelAnalysisResult>> {
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
        toolName: "analyzeRasterPixels",
        status: "FAILED",
        message: "No raster window result provided by dependencies.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelWindow) {
      return {
        toolName: "analyzeRasterPixels",
        status: "SKIPPED",
        message: "Raster window was empty (no overlap); skipping analysis.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelData || !Array.isArray(rasterWindowResult.pixelData)) {
      return {
        toolName: "analyzeRasterPixels",
        status: "FAILED",
        message: "No pixel data available in the raster window result.",
        evidence: []
      };
    }

    const bandsData = rasterWindowResult.pixelData as any[];
    const nodata = rasterWindowResult.nodata;
    const bandNames = (rasterWindowResult as any).bandNames || [];
    
    if (bandsData.length === 0) {
      return {
        toolName: "analyzeRasterPixels",
        status: "SUCCESS",
        message: "Raster contains 0 bands.",
        data: {
          status: "NO BANDS",
          window: {
            bbox: [0, 0, 0, 0],
            width: 0,
            height: 0
          },
          bands: [],
          totalPixels: 0,
          totalValidPixels: 0,
          totalNoDataPixels: 0,
          analysisMethod: "raster_pixel_statistics"
        },
        evidence: []
      };
    }
    
    const firstBand = bandsData[0];
    const isSupported = 
      firstBand instanceof Uint8Array ||
      firstBand instanceof Uint16Array ||
      firstBand instanceof Int8Array ||
      firstBand instanceof Int16Array ||
      firstBand instanceof Uint32Array ||
      firstBand instanceof Int32Array ||
      firstBand instanceof Float32Array ||
      firstBand instanceof Float64Array ||
      Array.isArray(firstBand);

    if (!isSupported) {
      return {
        toolName: "analyzeRasterPixels",
        status: "NOT_IMPLEMENTED",
        message: `Unsupported pixel sample format: ${firstBand?.constructor?.name || 'unknown'}.`,
        evidence: []
      };
    }

    const bandAnalyses = [];
    let totalValidPixels = 0;
    let totalNoDataPixels = 0;
    let totalPixels = 0;

    for (let b = 0; b < bandsData.length; b++) {
      const bandArray = bandsData[b];
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let validCount = 0;
      let noDataCount = 0;
      
      const validPixelsForBand: number[] = [];
      
      for (let i = 0; i < bandArray.length; i++) {
        const val = bandArray[i];
        
        if (Number.isNaN(val) || val === Infinity || val === -Infinity) {
           noDataCount++;
           continue;
        }

        if (nodata !== null && nodata !== undefined && val === nodata) {
          noDataCount++;
        } else {
          validCount++;
          sum += val;
          if (val < min) min = val;
          if (val > max) max = val;
          validPixelsForBand.push(val);
        }
      }
      
      const pixelCount = bandArray.length;
      if (b === 0) {
        totalPixels = pixelCount;
        totalValidPixels = validCount;
        totalNoDataPixels = noDataCount;
      }
      
      let mean = null;
      let stdDev = null;
      
      if (validCount > 0) {
        mean = sum / validCount;
        
        let sumSqDiff = 0;
        for (let i = 0; i < validCount; i++) {
          const diff = validPixelsForBand[i] - mean;
          sumSqDiff += diff * diff;
        }
        stdDev = Math.sqrt(sumSqDiff / validCount);
      } else {
        min = null as any;
        max = null as any;
        sum = null as any;
      }

      bandAnalyses.push({
        bandIndex: b + 1,
        bandName: bandNames[b] || `band_${b + 1}`,
        pixelCount,
        validPixelCount: validCount,
        noDataPixelCount: noDataCount,
        minimum: min !== Infinity && min !== null ? min : null,
        maximum: max !== -Infinity && max !== null ? max : null,
        mean,
        sum: sum !== null ? sum : null,
        standardDeviation: stdDev
      });
    }

    const bbox = rasterWindowResult.window ? 
      [rasterWindowResult.window.minX, rasterWindowResult.window.minY, rasterWindowResult.window.maxX, rasterWindowResult.window.maxY] : 
      [0, 0, 0, 0];

    const resultData: RasterPixelAnalysisResult = {
      status: totalValidPixels > 0 ? "SUCCESS" : "NO VALID PIXELS",
      window: {
        bbox,
        width: rasterWindowResult.pixelWindow.width,
        height: rasterWindowResult.pixelWindow.height
      },
      bands: bandAnalyses,
      totalPixels,
      totalValidPixels,
      totalNoDataPixels,
      analysisMethod: "raster_pixel_statistics"
    };

    const evidence: Evidence = {
      source: "SATQuery Raster Analysis Engine",
      dataset: rasterWindowResult.rasterId || "Imagery", 
      date: new Date().toISOString().split('T')[0],
      operation: "raster_pixel_statistics",
      confidence: null,
      provenance: `STAC Item ${rasterWindowResult.rasterId} / Asset ${rasterWindowResult.assetKey} / Window ${rasterWindowResult.window?.minX},${rasterWindowResult.window?.minY},${rasterWindowResult.window?.maxX},${rasterWindowResult.window?.maxY}`
    };

    return {
      toolName: "analyzeRasterPixels",
      status: "SUCCESS",
      message: totalValidPixels > 0 ? `Successfully analyzed ${bandAnalyses.length} bands.` : "SUCCESS with 0 valid pixels.",
      data: resultData,
      evidence: [evidence]
    };

  } catch (error: any) {
    return {
      toolName: "analyzeRasterPixels",
      status: "FAILED",
      message: `Error analyzing raster: ${error.message}`,
      evidence: []
    };
  }
}
