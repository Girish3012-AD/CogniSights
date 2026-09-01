import { ToolResult, RasterWindowResult, Evidence } from "../../types/index.js";
import { fromUrl } from "geotiff";
import { RasterPreprocessingResult } from "../../types/index.js";

export async function preprocessRaster(input: any): Promise<ToolResult<RasterPreprocessingResult>> {
  try {
    let rasterWindowResult: RasterWindowResult | null = null;
    let hasNullRasterDependency = false;
    let imageryAssets: any[] = [];
    
    // Find dependencies
    if (input.dependencyOutputs) {
      for (const [id, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (depOutput === null) {
          hasNullRasterDependency = true;
        } else if (typeof depOutput === "object") {
          const out = depOutput as any;
          if (("pixelWindow" in out) && out.assetKey) {
            rasterWindowResult = out as RasterWindowResult;
          } else if (out.imageryAssets && Array.isArray(out.imageryAssets)) {
            imageryAssets.push(...out.imageryAssets);
          }
        }
      }
    }

    if (!rasterWindowResult) {
      if (hasNullRasterDependency) {
        return {
          toolName: "preprocessRaster",
          status: "SUCCESS",
          message: "Raster window was empty (no overlap).",
          data: null as any,
          evidence: []
        };
      }
      return {
        toolName: "preprocessRaster",
        status: "FAILED",
        message: "No raster window result provided by dependencies.",
        evidence: []
      };
    }

    if (!rasterWindowResult.pixelWindow) {
      return {
        toolName: "preprocessRaster",
        status: "SUCCESS",
        message: "Raster window is empty or no overlap.",
        data: null as any,
        evidence: []
      };
    }

    const asset = imageryAssets.find(a => a.assetKey === rasterWindowResult!.assetKey && a.itemId === rasterWindowResult!.rasterId);
    if (!asset) {
      return {
        toolName: "preprocessRaster",
        status: "FAILED",
        message: "Could not find matching raster asset to re-read window.",
        evidence: []
      };
    }

    const tiff = await fromUrl(asset.href);
    const image = await tiff.getImage();
    const pw = rasterWindowResult.pixelWindow;
    
    const rasters = await image.readRasters({ window: [pw.originX, pw.originY, pw.originX + pw.width, pw.originY + pw.height] });
    
    const bandCount = rasters.length;
    let validPixelCount = 0;
    let nodataPixelCount = 0;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    
    const nodata = rasterWindowResult.nodata;
    
    // Process all bands or just the first band?
    // Let's process the first band for statistics by default, or all bands.
    // The instruction says: "At minimum: validPixelCount, nodataPixelCount, min, max, mean"
    // "Only normalize valid pixels."
    
    const bandData = rasters[0] as unknown as (Float32Array | Int16Array | Uint16Array | Uint8Array);
    const length = bandData.length;
    
    for (let i = 0; i < length; i++) {
      const val = bandData[i];
      if (nodata !== null && val === nodata) {
        nodataPixelCount++;
      } else {
        validPixelCount++;
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
      }
    }

    const mean = validPixelCount > 0 ? sum / validPixelCount : 0;
    
    if (validPixelCount === 0) {
      return {
        toolName: "preprocessRaster",
        status: "SUCCESS",
        message: "Raster contains only nodata pixels.",
        data: {
          rasterId: rasterWindowResult.rasterId,
          assetKey: rasterWindowResult.assetKey,
          width: pw.width,
          height: pw.height,
          bandCount,
          validPixelCount,
          nodataPixelCount,
          statistics: null,
          normalizationStatus: "UNAVAILABLE",
          crs: rasterWindowResult.crs,
          resolution: rasterWindowResult.resolution,
          processingOperation: "preprocessing"
        },
        evidence: []
      };
    }
    
    const evidence: Evidence = {
      source: "Server-Side Raster Processor",
      dataset: "Preprocessing Results",
      date: new Date().toISOString().split('T')[0],
      operation: "raster_preprocessing",
      confidence: null,
      provenance: `STAC Item ${asset.itemId} / Asset ${asset.assetKey}`
    };

    return {
      toolName: "preprocessRaster",
      status: "SUCCESS",
      message: `Processed raster window, found ${validPixelCount} valid pixels.`,
      data: {
        rasterId: rasterWindowResult.rasterId,
        assetKey: rasterWindowResult.assetKey,
        width: pw.width,
        height: pw.height,
        bandCount,
        validPixelCount,
        nodataPixelCount,
        statistics: {
          min,
          max,
          mean
        },
        normalizationStatus: min === max ? "NOT_NORMALIZED_CONSTANT" : "NORMALIZED",
        crs: rasterWindowResult.crs,
        resolution: rasterWindowResult.resolution,
        processingOperation: "preprocessing"
      },
      evidence: [evidence]
    };
  } catch (err: any) {
    return {
      toolName: "preprocessRaster",
      status: "FAILED",
      message: `Error preprocessing raster: ${err.message}`,
      evidence: []
    };
  }
}
