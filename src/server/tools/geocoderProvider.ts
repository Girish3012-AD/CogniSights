import { AreaOfInterest, ToolResult } from "../../types/index.js";
import { fetchWithRetry } from "../utils/fetchWithRetry.js";
import { z } from "zod";

const NominatimResponseSchema = z.array(z.object({
  place_id: z.number(),
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
  type: z.string().optional(),
  class: z.string().optional(),
  boundingbox: z.array(z.string()).optional(),
  geojson: z.record(z.string(), z.any()).optional()
}));

export async function resolveAreaOfInterestProvider(input: any): Promise<ToolResult<AreaOfInterest>> {
  try {
    const aoiInput = input.areaOfInterest || input.location || input;
    
    // Explicit bounding box fallback
    if (aoiInput.bbox && aoiInput.bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = aoiInput.bbox;
      
      if (
        minLon >= -180 && minLon <= 180 &&
        maxLon >= -180 && maxLon <= 180 &&
        minLat >= -90 && minLat <= 90 &&
        maxLat >= -90 && maxLat <= 90 &&
        minLon <= maxLon &&
        minLat <= maxLat
      ) {
        return {
          toolName: "resolveAreaOfInterest",
          status: "SUCCESS",
          message: "Explicit bounding box validated.",
          data: {
            source: "user",
            label: aoiInput.label || aoiInput.name || "User provided bounding box",
            bbox: [minLon, minLat, maxLon, maxLat],
            geometry: {
              type: "Polygon",
              coordinates: [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat]
              ]]
            }
          },
          evidence: [{
            source: "user",
            dataset: "User Bounding Box",
            date: new Date().toISOString().split('T')[0],
            operation: "area_of_interest_resolution",
            confidence: null,
            provenance: "user-provided"
          }]
        };
      } else {
        return {
          toolName: "resolveAreaOfInterest",
          status: "FAILED",
          message: "Invalid bounding box provided.",
          evidence: []
        };
      }
    }
    
    const placeName = aoiInput.label || aoiInput.name;
    if (!placeName) {
      return {
        toolName: "resolveAreaOfInterest",
        status: "FAILED",
        message: "No area of interest name provided.",
        evidence: []
      };
    }

    const query = encodeURIComponent(placeName);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&polygon_geojson=1&limit=3`;
    
    let response;
    try {
      response = await fetchWithRetry(url, {
        headers: { 'User-Agent': 'SATQuery-Agent/1.0' }
      }, {
        providerName: 'Nominatim',
        operationName: 'geocoding',
        timeoutMs: 10000,
        maxRetries: 3
      });
    } catch (err: any) {
       return { toolName: "resolveAreaOfInterest", status: "FAILED", message: "Geocoding failed/timeout", evidence: [] };
    }
    
    if (!response.ok) {
      return {
        toolName: "resolveAreaOfInterest",
        status: "FAILED",
        message: `Geocoding failed: HTTP ${response.status}`,
        evidence: []
      };
    }

    const data = await response.json();
    const validation = NominatimResponseSchema.safeParse(data);
    if (!validation.success) {
      return {
        toolName: "resolveAreaOfInterest",
        status: "FAILED",
        message: "Failed to parse geocoding provider response.",
        evidence: []
      };
    }

    const results = validation.data;
    if (results.length === 0) {
      return {
        toolName: "resolveAreaOfInterest",
        status: "FAILED", 
        message: `Location '${placeName}' could not be resolved. No valid area of interest could be found.`,
        evidence: []
      };
    }
    
    if (results.length > 1) {
      let ambiguous = false;
      if (results[0].boundingbox && results[1].boundingbox) {
        const [lat_min1, lat_max1, lon_min1, lon_max1] = results[0].boundingbox.map(parseFloat);
        const [lat_min2, lat_max2, lon_min2, lon_max2] = results[1].boundingbox.map(parseFloat);
        
        const intersectLat = Math.max(lat_min1, lat_min2) <= Math.min(lat_max1, lat_max2);
        const intersectLon = Math.max(lon_min1, lon_min2) <= Math.min(lon_max1, lon_max2);
        
        if (!(intersectLat && intersectLon)) {
          ambiguous = true;
        }
      } else {
        const lat1 = parseFloat(results[0].lat);
        const lon1 = parseFloat(results[0].lon);
        const lat2 = parseFloat(results[1].lat);
        const lon2 = parseFloat(results[1].lon);
        const dist = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
        if (dist > 1.0) ambiguous = true; 
      }

      if (ambiguous) {
        return {
          toolName: "resolveAreaOfInterest",
          status: "AMBIGUOUS" as any,
          message: `Location '${placeName}' is ambiguous. Please be more specific.`,
          evidence: []
        };
      }
    }

    const result = results[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    let bbox: [number, number, number, number];
    
    if (result.boundingbox && result.boundingbox.length === 4) {
      bbox = [
        parseFloat(result.boundingbox[2]), // lon min
        parseFloat(result.boundingbox[0]), // lat min
        parseFloat(result.boundingbox[3]), // lon max
        parseFloat(result.boundingbox[1])  // lat max
      ];
    } else {
      const buffer = 0.05;
      bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer];
    }
    
    if (bbox[0] > bbox[2] || bbox[1] > bbox[3] || bbox[0] < -180 || bbox[2] > 180 || bbox[1] < -90 || bbox[3] > 90) {
      return {
          toolName: "resolveAreaOfInterest",
          status: "FAILED",
          message: `Invalid bounding box parsed for '${placeName}'.`,
          evidence: []
      };
    }

    const featureType = result.type || result.class || "unknown";

    let geometry = result.geojson as any;
    if (!geometry) {
      geometry = {
        type: "Polygon",
        coordinates: [[
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]]
        ]]
      };
    }

    return {
      toolName: "resolveAreaOfInterest",
      status: "SUCCESS",
      message: `Location '${placeName}' resolved successfully.`,
      data: {
        name: placeName,
        source: "provider",
        provider: "OpenStreetMap Nominatim",
        label: result.display_name,
        featureType: featureType,
        bbox,
        geometry
      },
      evidence: [{
        source: "OpenStreetMap Nominatim",
        dataset: "Nominatim geocoding",
        date: new Date().toISOString().split('T')[0],
        operation: "geocoding",
        confidence: null,
        provenance: `https://nominatim.openstreetmap.org/ui/details.html?osmtype=N&osmid=${result.place_id}`
      }]
    };

  } catch (error: any) {
    return {
      toolName: "resolveAreaOfInterest",
      status: "FAILED",
      message: `Geocoding error: ${error.message}`,
      evidence: []
    };
  }
}
