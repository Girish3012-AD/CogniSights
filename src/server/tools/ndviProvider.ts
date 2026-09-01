import { ToolResult, RasterWindowResult, NDVIResult, Evidence } from "../../types/index.js";

function getPercentile(sortedValidData: number[], percentile: number): number {
  if (sortedValidData.length === 0) return 0;
  if (sortedValidData.length === 1) return sortedValidData[0];
  const index = (percentile / 100) * (sortedValidData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedValidData[lower] * (1 - weight) + sortedValidData[upper] * weight;
}

export async function calculateNDVI(input: any): Promise<ToolResult<NDVIResult>> {
  try {
    let rasterWindowResult: RasterWindowResult | null = null;
    let stacItemMetadata: any = null;
    
    if (input.dependencyOutputs) {
      for (const [id, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (depOutput && typeof depOutput === "object") {
          const out = depOutput as any;
          if (("pixelWindow" in out) && out.assetKey && out.width) {
            rasterWindowResult = out as RasterWindowResult;
          }
        }
      }
    }

    if (!rasterWindowResult) {
      return {
        toolName: "calculateNDVI",
        status: "FAILED",
        message: "No raster window result provided by dependencies.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelWindow) {
      return {
        toolName: "calculateNDVI",
        status: "SKIPPED",
        message: "Raster window was empty (no overlap); skipping NDVI.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelData || !Array.isArray(rasterWindowResult.pixelData)) {
      return {
        toolName: "calculateNDVI",
        status: "FAILED",
        message: "No pixel data available in the raster window result.",
        evidence: []
      };
    }

    const bandsData = rasterWindowResult.pixelData as any[];
    const nodata = rasterWindowResult.nodata;
    
    let redIndex = -1;
    let nirIndex = -1;
    let redName = null;
    let nirName = null;
    
    if (input.redBandIndex !== undefined && input.nirBandIndex !== undefined) {
      redIndex = input.redBandIndex;
      nirIndex = input.nirBandIndex;
      redName = "Provided_RED";
      nirName = "Provided_NIR";
    } else {
       // Heuristic: NAIP or 4-band imagery is typically R=0,G=1,B=2,NIR=3 
       // Sentinel-2 L2A in MPC: if the asset itself is a multi-band COG, maybe?
       // Let's check bandCount. If it's 4 bands, assume index 0=Red, 3=NIR for Red-Edge/NIR images (like Planet), 
       // Actually NAIP is R=0, G=1, B=2, NIR=3.
       if (bandsData.length === 4) {
         // Some NAIP.
         redIndex = 0;
         nirIndex = 3;
         redName = "Band 1 (Red)";
         nirName = "Band 4 (NIR)";
       } else {
         return {
           toolName: "calculateNDVI",
           status: "NOT_IMPLEMENTED",
           message: "Metadata indicating RED and NIR bands was not found. Cannot reliably identify bands for NDVI.",
           evidence: []
         };
       }
    }
    
    if (redIndex < 0 || redIndex >= bandsData.length || nirIndex < 0 || nirIndex >= bandsData.length) {
       return {
         toolName: "calculateNDVI",
         status: "FAILED",
         message: "Specified RED or NIR band index is out of bounds.",
         evidence: []
       };
    }

    const redBand = bandsData[redIndex];
    const nirBand = bandsData[nirIndex];
    
    if (redBand.length !== nirBand.length) {
       return {
         toolName: "calculateNDVI",
         status: "FAILED",
         message: "RED and NIR bands have mismatched pixel counts.",
         evidence: []
       };
    }

    const pixelCount = redBand.length;
    let validCount = 0;
    let invalidCount = 0;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    const validNDVI: number[] = [];

    for (let i = 0; i < pixelCount; i++) {
      const r = redBand[i];
      const n = nirBand[i];
      
      if (nodata !== null && nodata !== undefined && (r === nodata || n === nodata)) {
        invalidCount++;
        continue;
      }
      if (Number.isNaN(r) || Number.isNaN(n)) {
        invalidCount++;
        continue;
      }
      
      const denominator = n + r;
      if (denominator === 0) {
        invalidCount++;
        continue;
      }
      
      let ndvi = (n - r) / denominator;
      
      // Float precision clamping
      if (ndvi < -1 && ndvi >= -1.000001) ndvi = -1;
      if (ndvi > 1 && ndvi <= 1.000001) ndvi = 1;
      
      if (ndvi < -1 || ndvi > 1 || Number.isNaN(ndvi)) {
        invalidCount++;
        continue;
      }
      
      validCount++;
      sum += ndvi;
      if (ndvi < min) min = ndvi;
      if (ndvi > max) max = ndvi;
      validNDVI.push(ndvi);
    }
    
    let mean = null;
    let median = null;
    let stdDev = null;
    let p25 = null;
    let p75 = null;
    
    if (validCount > 0) {
      mean = sum / validCount;
      
      let sumSqDiff = 0;
      for (let i = 0; i < validCount; i++) {
        const diff = validNDVI[i] - mean;
        sumSqDiff += diff * diff;
      }
      stdDev = Math.sqrt(sumSqDiff / validCount);
      
      validNDVI.sort((a, b) => a - b);
      median = getPercentile(validNDVI, 50);
      p25 = getPercentile(validNDVI, 25);
      p75 = getPercentile(validNDVI, 75);
    } else {
      min = null as any;
      max = null as any;
    }

    const resultData: NDVIResult = {
      status: validCount > 0 ? "SUCCESS" : "NO VALID PIXELS", window: { bbox: [0, 0, 0, 0], width: 0, height: 0 },
      redBand: { index: redIndex, name: redName },
      nirBand: { index: nirIndex, name: nirName },
      totalPixels: pixelCount,
      validPixelCount: validCount,
      invalidPixelCount: invalidCount,
      minimum: min !== Infinity ? min : null,
      maximum: max !== -Infinity ? max : null,
      mean,
      median,
      percentile25: p25,
      percentile75: p75,
    };

    const evidence: Evidence = {
      source: "Microsoft Planetary Computer",
      dataset: "Imagery",
      date: new Date().toISOString().split('T')[0],
      operation: "deterministic_ndvi",
      confidence: null,
      provenance: `STAC Item ${rasterWindowResult.rasterId} Asset ${rasterWindowResult.assetKey} Window`
    };

    return {
      toolName: "calculateNDVI",
      status: "SUCCESS",
      message: validCount > 0 ? `Successfully calculated NDVI for ${validCount} pixels.` : "SUCCESS with 0 valid pixels.",
      data: resultData,
      evidence: [evidence]
    };

  } catch (error: any) {
    return {
      toolName: "calculateNDVI",
      status: "FAILED",
      message: `Error calculating NDVI: ${error.message}`,
      evidence: []
    };
  }
}
