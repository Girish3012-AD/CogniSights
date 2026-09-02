
import { SatelliteImagerySearchCriteria, ImageryMetadata, ToolResult, DatasetMetadata, SatelliteImageryResult } from "../../types/index.js";
import { z } from "zod";
import { processRasterAssets } from "./rasterProvider.js";
import { fetchWithRetry } from "../utils/fetchWithRetry.js";

const MpcFeatureSchema = z.object({
  id: z.string(),
  collection: z.string().optional(),
  geometry: z.unknown().optional(),
  bbox: z.array(z.number()).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  assets: z.record(z.string(), z.any()).optional(),
  links: z.array(z.object({
    rel: z.string(),
    href: z.string()
  })).optional()
});

const MpcFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(MpcFeatureSchema)
});

export async function getSatelliteImageryProvider(input: any): Promise<ToolResult<SatelliteImageryResult>> {
  try {
    let date = input.date;
    let collections: string[] = [];
    let bbox: number[] | undefined = input.bbox;

    if (input.dependencyOutputs) {
      for (const [depId, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (Array.isArray(depOutput)) {
          depOutput.forEach((item: any) => {
            if (item && typeof item === 'object' && item.collection) {
              collections.push(item.collection);
            }
          });
        } else if (depOutput && typeof depOutput === 'object') {
          const aoi = depOutput as any;
          if (aoi.bbox && Array.isArray(aoi.bbox) && aoi.bbox.length === 4) {
            bbox = aoi.bbox;
          }
        }
      }
    }

    collections = [...new Set(collections)];

    if (!bbox) {
      return {
        toolName: "getSatelliteImagery",
        status: "FAILED",
        message: "No Area of Interest (bounding box) provided for imagery search.",
        evidence: []
      };
    }

    let datetimeParam = undefined;
    if (date) {
      if (/^\d{4}$/.test(date)) {
        datetimeParam = `${date}-01-01T00:00:00Z/${date}-12-31T23:59:59Z`;
      } else {
        datetimeParam = date;
      }
    }

    const payload: any = { limit: 10 };
    if (datetimeParam) payload.datetime = datetimeParam;
    if (collections.length > 0) payload.collections = collections;
    if (bbox) payload.bbox = bbox;

    let response;
    try {
      response = await fetchWithRetry("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, {
        providerName: 'PlanetaryComputer',
        operationName: 'stac_item_search',
        timeoutMs: 15000,
        maxRetries: 3
      });
    } catch (e) {
      return { toolName: "getSatelliteImagery", status: "FAILED", message: "Planetary Computer STAC search timeout or network failure.", evidence: [] };
    }

    if (!response.ok) {
      return {
        toolName: "getSatelliteImagery",
        status: "FAILED",
        message: `Failed to fetch imagery: HTTP ${response.status}`,
        evidence: []
      };
    }

    const json = await response.json();
    const validationResult = MpcFeatureCollectionSchema.safeParse(json);

    if (!validationResult.success) {
      return {
        toolName: "getSatelliteImagery",
        status: "FAILED",
        message: "Failed to parse provider response",
        evidence: []
      };
    }

    const features = validationResult.data.features;
    if (features.length === 0) {
      return {
        toolName: "getSatelliteImagery",
        status: "SUCCESS",
        message: "No matching satellite imagery STAC items were found.",
        data: { imageryItems: [] },
        evidence: []
      };
    }

    const mappedMetadata: ImageryMetadata[] = features.map(f => {
      const selfLink = f.links?.find(l => l.rel === "self")?.href;
      return {
        id: f.id,
        collection: f.collection,
        datetime: f.properties?.datetime,
        platform: f.properties?.platform,
        instruments: f.properties?.instruments,
        geometry: f.geometry,
        bbox: f.bbox,
        cloudCover: f.properties?.['eo:cloud_cover'] ?? null,
        sourceUrl: selfLink || `https://planetarycomputer.microsoft.com/api/stac/v1/collections/${f.collection}/items/${f.id}`
      };
    });

    const evidenceItems = mappedMetadata.map(m => ({
      source: "Microsoft Planetary Computer",
      dataset: m.collection || m.id,
      date: m.datetime || new Date().toISOString().split('T')[0],
      operation: "satellite_imagery_discovery",
      confidence: null,
      provenance: m.sourceUrl || "https://planetarycomputer.microsoft.com/"
    }));

    // Process Raster Assets natively
    const rasterResult = await processRasterAssets(features);
    const evidence = [...evidenceItems, ...rasterResult.evidence];
    
    // Determine the exact status and messaging based on Raster milestone requirements
    let status: 'SUCCESS' | 'FAILED' | 'NOT_IMPLEMENTED' | 'PENDING' | 'AMBIGUOUS' = 'SUCCESS';
    let message = `Discovered ${mappedMetadata.length} STAC metadata item(s). `;

    if (rasterResult.assets.length > 0) {
       message += `Successfully validated access to ${rasterResult.assets.length} raster asset(s).`;
    } else {
       message += `No valid, accessible raster assets found. (${rasterResult.errors.join("; ")})`;
    }

    return {
      toolName: "getSatelliteImagery",
      status,
      message,
      data: {
        imageryItems: mappedMetadata,
        imageryAssets: rasterResult.assets,
        rasterMetadata: rasterResult.metadata
      },
      evidence
    };
  } catch (error: any) {
    return {
      toolName: "getSatelliteImagery",
      status: "FAILED",
      message: `Network or provider error: ${error.message}`,
      evidence: []
    };
  }
}
