import { ToolResult, GeoJSONGeometry, GeoJSONGeometrySchema, GeoJSONFeatureCollection, GeoJSONFeatureCollectionSchema } from "../../types/index.js";
import { buffer, intersect, area, featureCollection, multiPolygon, booleanIntersects } from "@turf/turf";

function extractGeometry(input: any, key: string = 'geometry'): GeoJSONGeometry | GeoJSONFeatureCollection | undefined {
  if (input[key]) return input[key];
  if (input.dependencyOutputs) {
    for (const output of Object.values(input.dependencyOutputs)) {
      if (output && typeof output === 'object') {
        if ('added' in output && 'removed' in output && 'summary' in output) {
          return (output as any).added as GeoJSONFeatureCollection;
        }
        // Direct FeatureCollection
        if ('type' in output && (output as any).type === 'FeatureCollection' && 'features' in output && Array.isArray(output.features)) {
          return (output as any) as GeoJSONFeatureCollection;
        }
        // ObjectDetectionResult with features
        if ('features' in output && (output as any).features && (output as any).features.type === 'FeatureCollection') {
          return (output as any).features as GeoJSONFeatureCollection;
        }
        // Direct geometry object
        if ('type' in output && 'coordinates' in output && Array.isArray((output as any).coordinates)) {
          return (output as any) as GeoJSONGeometry;
        }
        // BuildingDetectionResult or similar wrapper with a FeatureCollection
        if ('buildings' in output && (output as any).buildings && (output as any).buildings.type === 'FeatureCollection') {
          return (output as any).buildings as GeoJSONFeatureCollection;
        }
        // Wrapper object with geometry
        if ('geometry' in output && (output as any).geometry && typeof (output as any).geometry === 'object' && 'type' in (output as any).geometry && 'coordinates' in (output as any).geometry) {
          return (output as any).geometry as GeoJSONGeometry;
        }
        // AreaOfInterest with bbox but no explicit geometry
        if ('bbox' in output && Array.isArray(output.bbox) && output.bbox.length === 4) {
          const [minX, minY, maxX, maxY] = output.bbox as [number, number, number, number];
          return {
            type: "Polygon",
            coordinates: [[
              [minX, minY],
              [maxX, minY],
              [maxX, maxY],
              [minX, maxY],
              [minX, minY]
            ]]
          };
        }
      }
    }
  }
  return undefined;
}

function extractGeometriesForIntersection(input: any): { target: GeoJSONGeometry | GeoJSONFeatureCollection | undefined, constraint: GeoJSONGeometry | GeoJSONFeatureCollection | undefined } {
  if (input.geometryA && input.geometryB) {
    return { target: input.geometryA, constraint: input.geometryB };
  }
  
  let target: any;
  let constraint: any;
  let fallback: any[] = [];
  
  if (input.dependencyOutputs) {
    for (const [key, output] of Object.entries(input.dependencyOutputs)) {
      if (output && typeof output === 'object') {
        let geom: any;
        if ('added' in output && 'removed' in output && 'summary' in output) {
          geom = (output as any).added as GeoJSONFeatureCollection;
        } else if ('type' in output && (output as any).type === 'FeatureCollection' && 'features' in output && Array.isArray((output as any).features)) {
          geom = output as GeoJSONFeatureCollection;
        } else if ('features' in output && (output as any).features && (output as any).features.type === 'FeatureCollection') {
          geom = (output as any).features as GeoJSONFeatureCollection;
        } else if ('buildings' in output && (output as any).buildings && (output as any).buildings.type === 'FeatureCollection') {
          geom = (output as any).buildings as GeoJSONFeatureCollection;
        } else if ('type' in output && 'coordinates' in output) {
          geom = output as GeoJSONGeometry;
        } else if ('geometry' in output && (output as any).geometry) {
          geom = (output as any).geometry as GeoJSONGeometry;
        } else if ('bbox' in output && Array.isArray((output as any).bbox) && (output as any).bbox.length === 4) {
          const [minX, minY, maxX, maxY] = (output as any).bbox as [number, number, number, number];
          geom = {
            type: "Polygon",
            coordinates: [[
              [minX, minY],
              [maxX, minY],
              [maxX, maxY],
              [minX, maxY],
              [minX, minY]
            ]]
          };
        }
        
        if (geom) {
          if (key.includes('buffer')) {
            constraint = geom;
          } else if (key.includes('detect') || key.includes('change')) {
            target = geom;
          } else {
            fallback.push(geom);
          }
        }
      }
    }
  }
  
  if (!target && fallback.length > 0) target = fallback.shift();
  if (!constraint && fallback.length > 0) constraint = fallback.shift();
  
  return { target, constraint } as { target: any, constraint: any };
}

// Helper to convert FeatureCollection to a single Geometry for intersection if needed
function toMultiPolygon(geom: GeoJSONGeometry | GeoJSONFeatureCollection): any {
  if (geom.type === 'FeatureCollection') {
    const polys = geom.features
      .filter((f: any) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'))
      .map((f: any) => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)
      .flat(1);
    
    if (polys.length === 0) return null;
    return { type: "MultiPolygon", coordinates: polys };
  }
  return geom;
}

export async function spatialBufferProvider(input: any): Promise<ToolResult<GeoJSONGeometry>> {
  try {
    const geometry = extractGeometry(input);
    if (!geometry) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Missing geometry input for spatialBuffer.",
        evidence: []
      };
    }
    
    let isValid = false;
    if (geometry.type === "FeatureCollection") {
      isValid = GeoJSONFeatureCollectionSchema.safeParse(geometry).success;
    } else {
      isValid = GeoJSONGeometrySchema.safeParse(geometry).success;
    }

    if (!isValid) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Invalid geometry or feature collection input.",
        evidence: []
      };
    }

    const distance = Number(input.distance);
    if (isNaN(distance) || distance < 0 || distance === Infinity) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Invalid distance parameter.",
        evidence: []
      };
    }

    // Units
    const allowedUnits = ["meters", "kilometers", "miles", "degrees", "radians"];
    let units = input.units || "kilometers";
    if (!allowedUnits.includes(units)) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: `Unsupported units: ${units}`,
        evidence: []
      };
    }

    // Turf buffer
    // Turf buffer accepts FeatureCollection | Geometry | Feature
    const resultFeature = buffer(geometry as any, distance, { units: units as any });
    
    if (!resultFeature) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Buffer operation failed to produce geometry.",
        evidence: []
      };
    }
    
    // We should convert the buffered result to a single MultiPolygon if possible
    // since spatialBuffer returns ToolResult<GeoJSONGeometry>
    const geomOut = toMultiPolygon(resultFeature as any);
    if (!geomOut) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Buffer operation produced empty geometry.",
        evidence: []
      };
    }

    const outValidation = GeoJSONGeometrySchema.safeParse(geomOut);
    if (!outValidation.success) {
      return {
        toolName: "spatialBuffer",
        status: "FAILED",
        message: "Buffer operation produced invalid geometry.",
        evidence: []
      };
    }

    return {
      toolName: "spatialBuffer",
      status: "SUCCESS",
      data: outValidation.data,
      evidence: [{
        source: "SATQuery GIS Engine",
        dataset: "Derived computation",
        date: new Date().toISOString().split('T')[0],
        operation: "spatial_buffer",
        confidence: null,
        provenance: "Turf.js deterministic geometry operation"
      }]
    };
  } catch (error: any) {
    return {
      toolName: "spatialBuffer",
      status: "FAILED",
      message: `Turf error: ${error.message}`,
      evidence: []
    };
  }
}

export async function spatialIntersectionProvider(input: any): Promise<ToolResult<GeoJSONGeometry | null>> {
  try {
    const { target: geomA, constraint: geomB } = extractGeometriesForIntersection(input);
    if (!geomA || !geomB) {
      return {
        toolName: "spatialIntersection",
        status: "FAILED",
        message: "Missing geometry inputs for spatialIntersection.",
        evidence: []
      };
    }
    
    const validA = GeoJSONGeometrySchema.safeParse(toMultiPolygon(geomA));
    const validB = GeoJSONGeometrySchema.safeParse(toMultiPolygon(geomB));
    
    if (!validA.success) {
      return {
        toolName: "spatialIntersection",
        status: "FAILED",
        message: "Invalid geometryA input: " + validA.error.message,
        evidence: []
      };
    }
    if (!validB.success) {
      return {
        toolName: "spatialIntersection",
        status: "FAILED",
        message: "Invalid geometryB input: " + validB.error.message,
        evidence: []
      };
    }

    let resultFeature: any;
    try {
       const featA = { type: "Feature", properties: {}, geometry: validA.data } as any;
       const featB = { type: "Feature", properties: {}, geometry: validB.data } as any;
       
       resultFeature = intersect({ type: "FeatureCollection", features: [featA, featB] } as any);
    } catch (e: any) {
      return {
        toolName: "spatialIntersection",
        status: "FAILED",
        message: `Turf intersection error: ${e.message}`,
        evidence: []
      };
    }

    if (!resultFeature) {
      // Empty intersection
      return {
        toolName: "spatialIntersection",
        status: "SUCCESS",
        data: null,
        message: "No intersection found.",
        evidence: [{
          source: "SATQuery GIS Engine",
          dataset: "Derived computation",
          date: new Date().toISOString().split('T')[0],
          operation: "spatial_intersection",
          confidence: null,
          provenance: "Turf.js deterministic geometry operation"
        }]
      };
    }

    const outValidation = GeoJSONGeometrySchema.safeParse(resultFeature.geometry);
    if (!outValidation.success) {
      return {
        toolName: "spatialIntersection",
        status: "FAILED",
        message: "Intersection operation produced invalid geometry.",
        evidence: []
      };
    }

    return {
      toolName: "spatialIntersection",
      status: "SUCCESS",
      data: outValidation.data,
      evidence: [{
        source: "SATQuery GIS Engine",
        dataset: "Derived computation",
        date: new Date().toISOString().split('T')[0],
        operation: "spatial_intersection",
        confidence: null,
        provenance: "Turf.js deterministic geometry operation"
      }]
    };
  } catch (error: any) {
    return {
      toolName: "spatialIntersection",
      status: "FAILED",
      message: `Turf error: ${error.message}`,
      evidence: []
    };
  }
}

export async function calculateAreaProvider(input: any): Promise<ToolResult<{ areaSquareMeters: number }>> {
  try {
    const geometry = extractGeometry(input);
    if (!geometry) {
      return {
        toolName: "calculateArea",
        status: "FAILED",
        message: "Missing geometry input for calculateArea.",
        evidence: []
      };
    }
    const geomToValidate = toMultiPolygon(geometry);
    if (!geomToValidate) {
       return {
         toolName: "calculateArea",
         status: "SUCCESS",
         message: "Geometry contains no polygons, area is 0.",
         data: { areaSquareMeters: 0 },
         evidence: []
       };
    }
    const validation = GeoJSONGeometrySchema.safeParse(geomToValidate);
    if (!validation.success) {
      return {
        toolName: "calculateArea",
        status: "FAILED",
        message: "Invalid geometry input: " + validation.error.message,
        evidence: []
      };
    }

    const calculatedArea = area(validation.data as any);

    return {
      toolName: "calculateArea",
      status: "SUCCESS",
      data: {
        areaSquareMeters: calculatedArea
      },
      evidence: [{
        source: "SATQuery GIS Engine",
        dataset: "Derived computation",
        date: new Date().toISOString().split('T')[0],
        operation: "calculate_area",
        confidence: null,
        provenance: "Turf.js deterministic geometry operation"
      }]
    };
  } catch (error: any) {
    return {
      toolName: "calculateArea",
      status: "FAILED",
      message: `Turf error: ${error.message}`,
      evidence: []
    };
  }
}
