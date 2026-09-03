import { ToolResult, RasterAsset, RasterWindowResult, Evidence, AreaOfInterest } from "../../types/index.js";
import { fromUrl } from "geotiff";
import proj4 from "proj4";
import * as turf from "@turf/turf";

export async function processRasterWindow(input: any): Promise<ToolResult<RasterWindowResult>> {
  try {
    let rasterAssets: RasterAsset[] = [];
    let aoi: AreaOfInterest | undefined;

    // Resolve dependencies
    if (input.dependencyOutputs) {
      for (const [depId, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (depOutput && typeof depOutput === "object") {
          const out = depOutput as any;
          if (out.imageryAssets && Array.isArray(out.imageryAssets)) {
            rasterAssets.push(...out.imageryAssets);
          } else if (out.bbox && out.geometry) { // AreaOfInterest match
            aoi = out as AreaOfInterest;
          }
        }
      }
    }

    if (!aoi) {
      return {
        toolName: "processRasterWindow",
        status: "FAILED",
        message: "No Area of Interest provided.",
        evidence: []
      };
    }

    if (rasterAssets.length === 0) {
      return {
        toolName: "processRasterWindow",
        status: "FAILED",
        message: "No raster assets available from dependencies.",
        evidence: []
      };
    }

    // Pick and load candidate raster asset with fallback re-signing
    let tiff: any = null;
    let image: any = null;
    let asset: RasterAsset = rasterAssets[0];

    for (const candidateAsset of rasterAssets) {
      try {
        tiff = await fromUrl(candidateAsset.href, { headers: { "User-Agent": "SATQuery-Agent/1.0" } });
        image = await tiff.getImage();
        asset = candidateAsset;
        break;
      } catch (e1: any) {
        try {
          const rawUrl = candidateAsset.href.split('?')[0];
          const signUrl = `https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=${encodeURIComponent(rawUrl)}`;
          const signRes = await fetch(signUrl);
          if (signRes.ok) {
            const signData = await signRes.json() as any;
            if (signData?.href) {
              tiff = await fromUrl(signData.href, { headers: { "User-Agent": "SATQuery-Agent/1.0" } });
              image = await tiff.getImage();
              asset = { ...candidateAsset, href: signData.href };
              break;
            }
          }
        } catch (e2: any) {
          // Continue to next candidate
        }
      }
    }

    if (!tiff || !image) {
      return {
        toolName: "processRasterWindow",
        status: "FAILED",
        message: "Unable to read GeoTIFF raster assets from STAC provider.",
        evidence: []
      };
    }
    
    // Read Metadata
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
    const fd = image.getFileDirectory();
    
    // Extract basic data type if possible
    let dataType = "Unknown";
    const bits = (fd as any).BitsPerSample ? (Array.isArray((fd as any).BitsPerSample) ? (fd as any).BitsPerSample[0] : (fd as any).BitsPerSample) : null;
    const sampleFormat = (fd as any).SampleFormat ? (Array.isArray((fd as any).SampleFormat) ? (fd as any).SampleFormat[0] : (fd as any).SampleFormat) : null;
    if (bits !== null) {
      if (sampleFormat === 1) dataType = "UInt" + bits;
      else if (sampleFormat === 2) dataType = "Int" + bits;
      else if (sampleFormat === 3) dataType = "Float" + bits;
      else dataType = bits + "-bit (format " + sampleFormat + ")";
    }
    
    let epsg = null;
    const geoKeys = image.getGeoKeys();
    if (geoKeys && geoKeys.ProjectedCSTypeGeoKey) {
      epsg = geoKeys.ProjectedCSTypeGeoKey;
    } else if (geoKeys && geoKeys.GeographicTypeGeoKey) {
      epsg = geoKeys.GeographicTypeGeoKey;
    }

    if (!epsg) {
      // Fallback or attempt to parse from crs if we had it
      // For Sentinel-2 MPC, it's typically UTM, often specified in ProjectedCSTypeGeoKey
      return {
        toolName: "processRasterWindow",
        status: "FAILED",
        message: "Raster does not have a recognizable EPSG code.",
        evidence: []
      };
    }

    // Proj4 definitions - add standard ones, plus a way to resolve UTM automatically
    let projString = `EPSG:${epsg}`;
    if (!proj4.defs(projString)) {
      // If it's a UTM projection (32601-32660 for North, 32701-32760 for South)
      if (epsg >= 32601 && epsg <= 32660) {
        const zone = epsg - 32600;
        proj4.defs(projString, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`);
      } else if (epsg >= 32701 && epsg <= 32760) {
        const zone = epsg - 32700;
        proj4.defs(projString, `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`);
      } else if (epsg >= 26901 && epsg <= 26923) {
        const zone = epsg - 26900;
        proj4.defs(projString, `+proj=utm +zone=${zone} +ellps=GRS80 +datum=NAD83 +units=m +no_defs`);
      } else if (epsg === 3857 || epsg === 900913) {
        proj4.defs(projString, "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs");
      } else if (epsg === 4326) {
        proj4.defs(projString, "+proj=longlat +datum=WGS84 +no_defs");
      } else {
        return {
          toolName: "processRasterWindow",
          status: "FAILED",
          message: `Raster EPSG code ${epsg} is not dynamically supported in this prototype.`,
          evidence: []
        };
      }
    }

    // Get AOI bbox in WGS84
    const aoiBbox = aoi.bbox; // [minLon, minLat, maxLon, maxLat]

    // Transform AOI bbox corners to Raster CRS
    const bl = proj4('EPSG:4326', projString, [aoiBbox[0], aoiBbox[1]]);
    const tr = proj4('EPSG:4326', projString, [aoiBbox[2], aoiBbox[3]]);
    const tl = proj4('EPSG:4326', projString, [aoiBbox[0], aoiBbox[3]]);
    const br = proj4('EPSG:4326', projString, [aoiBbox[2], aoiBbox[1]]);

    // Calculate AOI bounds in Raster CRS
    const aoiMinX = Math.min(bl[0], tr[0], tl[0], br[0]);
    const aoiMaxX = Math.max(bl[0], tr[0], tl[0], br[0]);
    const aoiMinY = Math.min(bl[1], tr[1], tl[1], br[1]);
    const aoiMaxY = Math.max(bl[1], tr[1], tl[1], br[1]);

    // Check intersection with raster bbox
    // geotiff.js bounding box: [minX, minY, maxX, maxY]
    // Note: Y might be flipped depending on resolution sign, but standard bbox is usually [minX, minY, maxX, maxY]
    const rMinX = Math.min(bbox[0], bbox[2]);
    const rMaxX = Math.max(bbox[0], bbox[2]);
    const rMinY = Math.min(bbox[1], bbox[3]);
    const rMaxY = Math.max(bbox[1], bbox[3]);

    const intersectMinX = Math.max(aoiMinX, rMinX);
    const intersectMaxX = Math.min(aoiMaxX, rMaxX);
    const intersectMinY = Math.max(aoiMinY, rMinY);
    const intersectMaxY = Math.min(aoiMaxY, rMaxY);

    if (intersectMinX >= intersectMaxX || intersectMinY >= intersectMaxY) {
      return {
        toolName: "processRasterWindow",
        status: "SUCCESS",
        message: "AOI does not overlap with the raster asset.",
        data: null,
        evidence: []
      };
    }

    // Convert coordinates to pixel coordinates
    // transform is usually [xScale, yShear, xShear, yScale, xTranslation, yTranslation] in tiff metadata or ModelPixelScale / ModelTiepoint
    const resX = (bbox[2] - bbox[0]) / width;
    const resY = (bbox[3] - bbox[1]) / height; // resY is usually negative

    // x = (coordX - bbox[0]) / resX
    let px1 = (intersectMinX - bbox[0]) / resX;
    let px2 = (intersectMaxX - bbox[0]) / resX;
    let py1 = (intersectMinY - bbox[1]) / resY;
    let py2 = (intersectMaxY - bbox[1]) / resY;

    // Since resY is negative, py1 and py2 might be inverted
    let pMinX = Math.floor(Math.min(px1, px2));
    let pMaxX = Math.ceil(Math.max(px1, px2));
    let pMinY = Math.floor(Math.min(py1, py2));
    let pMaxY = Math.ceil(Math.max(py1, py2));

    // Clamp to image dimensions
    pMinX = Math.max(0, pMinX);
    pMaxX = Math.min(width, pMaxX);
    pMinY = Math.max(0, pMinY);
    pMaxY = Math.min(height, pMaxY);

    // If window is larger than 1024x1024, sample a representative 1024x1024 center sub-window
    if (pMaxX - pMinX > 1024) {
      const centerX = Math.floor((pMinX + pMaxX) / 2);
      pMinX = Math.max(0, centerX - 512);
      pMaxX = Math.min(width, pMinX + 1024);
    }
    if (pMaxY - pMinY > 1024) {
      const centerY = Math.floor((pMinY + pMaxY) / 2);
      pMinY = Math.max(0, centerY - 512);
      pMaxY = Math.min(height, pMinY + 1024);
    }

    const winWidth = pMaxX - pMinX;
    const winHeight = pMaxY - pMinY;
    const pixelCount = winWidth * winHeight;

    if (winWidth <= 0 || winHeight <= 0) {
      return {
        toolName: "processRasterWindow",
        status: "SUCCESS",
        message: "AOI does not overlap with the raster asset on a pixel level.",
        data: null,
        evidence: []
      };
    }

    // Compute exact geographic bounding coordinates for the sampled pixel window
    const sampleMinX = Math.min(bbox[0] + pMinX * resX, bbox[0] + pMaxX * resX);
    const sampleMaxX = Math.max(bbox[0] + pMinX * resX, bbox[0] + pMaxX * resX);
    const sampleMinY = Math.min(bbox[1] + pMinY * resY, bbox[1] + pMaxY * resY);
    const sampleMaxY = Math.max(bbox[1] + pMinY * resY, bbox[1] + pMaxY * resY);

    // Actually read the window using HTTP Range
    const rasters = await image.readRasters({ window: [pMinX, pMinY, pMaxX, pMaxY] });
    
    // Check nodata
    const nodata = (fd as any).GDAL_NODATA ? parseFloat((fd as any).GDAL_NODATA) : null;

    const evidence: Evidence = {
      source: "Microsoft Planetary Computer / GeoTIFF.js",
      dataset: `Raster pixels from ${asset.collection}`,
      date: asset.acquisitionDate || new Date().toISOString().split('T')[0],
      operation: "raster_window_read",
      confidence: null,
      provenance: `STAC Item ${asset.itemId} / Asset ${asset.assetKey} / Window [${pMinX},${pMinY},${pMaxX},${pMaxY}]`
    };

    return {
      toolName: "processRasterWindow",
      status: "SUCCESS",
      message: `Successfully read ${winWidth}x${winHeight} raster window (${pixelCount} pixels).`,
      data: {
        rasterId: asset.itemId,
        assetKey: asset.assetKey,
        window: {
          minX: sampleMinX,
          minY: sampleMinY,
          maxX: sampleMaxX,
          maxY: sampleMaxY
        },
        pixelWindow: {
          originX: pMinX,
          originY: pMinY,
          width: winWidth,
          height: winHeight
        },
        width: winWidth,
        height: winHeight,
        bandCount: rasters.length,
        dataType: dataType,
        nodata: nodata,
        pixelDataPlaceholder: true,
        pixelData: rasters,
        crs: projString,
        resolution: {
          x: resX,
          y: resY
        }
      },
      evidence: [evidence]
    };
  } catch (error: any) {
    return {
      toolName: "processRasterWindow",
      status: "FAILED",
      message: `Raster reading error: ${error.message}`,
      evidence: []
    };
  }
}
