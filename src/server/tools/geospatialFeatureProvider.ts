import { ToolResult, GeoJSONFeatureCollection, GeoJSONFeatureCollectionSchema } from "../../types/index.js";
import { fetchWithRetry } from "../utils/fetchWithRetry.js";

export async function geospatialFeatureProvider(input: any): Promise<ToolResult<GeoJSONFeatureCollection>> {
  try {
    let bbox: number[] | undefined;
    
    if (input.dependencyOutputs) {
      for (const [depId, depOutput] of Object.entries(input.dependencyOutputs)) {
        if (depOutput && typeof (depOutput as any).bbox === 'object' && Array.isArray((depOutput as any).bbox)) {
          bbox = (depOutput as any).bbox as number[];
        }
      }
    }

    if (!bbox) {
      return {
        toolName: "searchGeospatialFeatures",
        status: "FAILED",
        message: "No Area of Interest (bounding box) provided for semantic feature search.",
        evidence: []
      };
    }

    const featureType = (input.featureType as string || "").toLowerCase();
    
    // Determine the Overpass query
    let overpassQuery = "";
    if (featureType.includes("major road") || featureType.includes("highway") || featureType === "major roads") {
      overpassQuery = `way["highway"~"motorway|trunk|primary|secondary"]`;
    } else if (featureType.includes("road")) {
      overpassQuery = `way["highway"]`;
    } else if (featureType.includes("river")) {
      overpassQuery = `way["waterway"="river"]`;
    } else if (featureType.includes("hospital")) {
      overpassQuery = `
        node["amenity"="hospital"];
        way["amenity"="hospital"];
        rel["amenity"="hospital"]
      `;
    } else if (featureType.includes("protected")) {
      overpassQuery = `
        way["boundary"="protected_area"];
        rel["boundary"="protected_area"]
      `;
    } else if (featureType.includes("agricultural") || featureType.includes("farmland")) {
      overpassQuery = `
        way["landuse"="farmland"];
        rel["landuse"="farmland"]
      `;
    } else {
      return {
        toolName: "searchGeospatialFeatures",
        status: "NOT_IMPLEMENTED",
        message: `Semantic feature type '${input.featureType}' is not supported by the provider.`,
        evidence: []
      };
    }

    const [minX, minY, maxX, maxY] = bbox;
    // Overpass expects (south, west, north, east) -> (minY, minX, maxY, maxX)
    const overpassBounds = `${minY},${minX},${maxY},${maxX}`;
    
    let queryLines = overpassQuery.trim().split(';').map(q => q.trim()).filter(q => q.length > 0);
    queryLines = queryLines.map(q => `${q}(${overpassBounds});`);
    
    const query = `
      [out:json];
      (
        ${queryLines.join('\n        ')}
      );
      out geom;
    `;

    const params = new URLSearchParams();
    params.append('data', query);

    
    
    let res;
    try {
      res = await fetchWithRetry("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SATQuery-Agent/1.0',
          'Accept': 'application/json'
        },
        body: params.toString()
      }, {
        providerName: 'Overpass',
        operationName: 'feature_discovery',
        timeoutMs: 30000,
        maxRetries: 3
      });
    } catch (e) {
      return {
        toolName: "searchGeospatialFeatures",
        status: "FAILED",
        message: "Feature detection error: Overpass API timeout or network failure.",
        evidence: []
      };
    }



    if (!res.ok) {
      return {
        toolName: "searchGeospatialFeatures",
        status: "FAILED",
        message: `Geospatial feature service returned HTTP ${res.status}`,
        evidence: []
      };
    }

    const data = await res.json() as any;

    if (!data.elements) {
      return {
        toolName: "searchGeospatialFeatures",
        status: "FAILED",
        message: "Malformed response from geospatial feature service.",
        evidence: []
      };
    }

    const features: any[] = data.elements.map((el: any) => {
      let geometry;
      if (el.type === "node") {
        geometry = { type: "Point", coordinates: [el.lon, el.lat] };
      } else if (el.type === "way") {
        if (!el.geometry || el.geometry.length < 2) return null;
        const coordinates = el.geometry.map((pt: any) => [pt.lon, pt.lat]);
        // Simple heuristic: if closed, it's a polygon, else LineString
        if (coordinates[0][0] === coordinates[coordinates.length - 1][0] && coordinates[0][1] === coordinates[coordinates.length - 1][1] && coordinates.length > 3) {
           geometry = { type: "Polygon", coordinates: [coordinates] };
        } else {
           geometry = { type: "LineString", coordinates };
        }
      } else if (el.type === "relation") {
        // Advanced geometry mapping skipped for relations, approximating with bounding box or skipping if complex.
        // For hospitals / boundaries it might be a relation. Let's try to parse a polygon if bounds are available.
        if (el.bounds) {
          geometry = {
            type: "Polygon",
            coordinates: [[[el.bounds.minlon, el.bounds.minlat], [el.bounds.maxlon, el.bounds.minlat], [el.bounds.maxlon, el.bounds.maxlat], [el.bounds.minlon, el.bounds.maxlat], [el.bounds.minlon, el.bounds.minlat]]]
          };
        } else {
          return null; // Skip unsupported relation geometry without bounds
        }
      } else {
        return null;
      }

      return {
        type: "Feature",
        id: `${el.type}/${el.id}`,
        geometry,
        properties: el.tags || {}
      };
    }).filter(Boolean);

    const featureCollection = {
      type: "FeatureCollection",
      features
    };

    const validation = GeoJSONFeatureCollectionSchema.safeParse(featureCollection);

    if (!validation.success) {
      return {
        toolName: "searchGeospatialFeatures",
        status: "FAILED",
        message: `Validation of detected features failed: ${validation.error.message}`,
        evidence: []
      };
    }

    const evidence = [{
      source: "OpenStreetMap",
      dataset: `OSM ${featureType}`,
      date: new Date().toISOString().split('T')[0],
      operation: "semantic_feature_search",
      confidence: null,
      provenance: "https://overpass-api.de/"
    }];

    return {
      toolName: "searchGeospatialFeatures",
      status: "SUCCESS",
      message: features.length > 0
        ? `Successfully retrieved ${features.length} ${featureType} features.`
        : `No ${featureType} features found in the specified area. Please try expanding the search area or checking if the feature type is correct for this location.`,
      data: validation.data,
      evidence
    };
  } catch (error: any) {
    return {
      toolName: "searchGeospatialFeatures",
      status: "FAILED",
      message: `Feature detection error: ${error.message}`,
      evidence: []
    };
  }
}
