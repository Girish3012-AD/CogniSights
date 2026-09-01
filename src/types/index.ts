import { z } from 'zod';

export const PositionSchema = z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.number()]));

export const GeoJSONGeometrySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Point"),
    coordinates: PositionSchema
  }),
  z.object({
    type: z.literal("MultiPoint"),
    coordinates: z.array(PositionSchema)
  }),
  z.object({
    type: z.literal("LineString"),
    coordinates: z.array(PositionSchema)
  }),
  z.object({
    type: z.literal("MultiLineString"),
    coordinates: z.array(z.array(PositionSchema))
  }),
  z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(PositionSchema))
  }),
  z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(PositionSchema)))
  })
]).refine((geom) => {
  // Validate basic ranges
  const checkPos = (pos: [number, number] | [number, number, number]) => {
    return pos[0] >= -180 && pos[0] <= 180 && pos[1] >= -90 && pos[1] <= 90;
  };
  const checkArray = (arr: any[]): boolean => {
    if (arr.length === 0) return true;
    if (typeof arr[0] === 'number') return checkPos(arr as [number, number]);
    return arr.every(checkArray);
  };
  return checkArray(geom.coordinates);
}, { message: "Invalid coordinates: Longitude must be between -180 and 180, Latitude between -90 and 90." });

export type GeoJSONGeometry = z.infer<typeof GeoJSONGeometrySchema>;

export const GeoJSONFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: GeoJSONGeometrySchema,
  properties: z.record(z.string(), z.any()).nullable().optional(),
});

export const GeoJSONFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GeoJSONFeatureSchema),
});


export const BoundingBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]).refine(
  ([minLon, minLat, maxLon, maxLat]) => {
    return (
      minLon >= -180 && minLon <= 180 &&
      maxLon >= -180 && maxLon <= 180 &&
      minLat >= -90 && minLat <= 90 &&
      maxLat >= -90 && maxLat <= 90 &&
      minLon <= maxLon &&
      minLat <= maxLat
    );
  },
  { message: "Invalid bounding box" }
);

export type GeoJSONFeatureCollection = z.infer<typeof GeoJSONFeatureCollectionSchema>;

export const BuildingDetectionFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  properties: z.object({
    confidence: z.number().nullable(),
    areaM2: z.number().nullable(),
    className: z.string().optional()
  }).catchall(z.any())
});
export type BuildingDetectionFeature = z.infer<typeof BuildingDetectionFeatureSchema>;

export const BuildingDetectionResultSchema = z.object({
  features: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(BuildingDetectionFeatureSchema)
  }),
  detectionCount: z.number(),
  model: z.object({
    name: z.string(),
    version: z.string().nullable()
  }),
  sourceRaster: z.object({
    stacItemId: z.string(),
    assetKey: z.string()
  }),
  crs: z.string().optional().nullable(),
  resolution: z.object({
    x: z.number().optional().nullable(),
    y: z.number().optional().nullable()
  }).optional().nullable()
});
export type BuildingDetectionResult = z.infer<typeof BuildingDetectionResultSchema>;

export const SpatialConstraintSchema = z.object({
  relation: z.string().optional().nullable(),
  distance: z.union([z.string(), z.number()]).optional().nullable(),
  referenceFeature: z.string().optional().nullable(),
});


export const LocationSchema = z.object({
  name: z.string().optional().nullable(),
  coordinates: z.tuple([z.number(), z.number()]).optional().nullable(),
  bbox: BoundingBoxSchema.optional().nullable()
});

export const QueryAreaOfInterestSchema = z.object({
  label: z.string().optional(),
  bbox: BoundingBoxSchema.optional()
});


export const TimeRangeSchema = z.object({
  start: z.string().optional().nullable(),
  end: z.string().optional().nullable(),
});

export const StructuredQuerySchema = z.object({
  intent: z.string(),
  target: z.string(),
  operation: z.string(),
  timeRange: TimeRangeSchema.optional().nullable(),
  spatialConstraint: SpatialConstraintSchema.optional().nullable(),
  location: LocationSchema.optional().nullable(),
  areaOfInterest: QueryAreaOfInterestSchema.optional().nullable(),
  changeType: z.string().optional().nullable(),
  threshold: z.number().optional().nullable(),
  operator: z.enum(["GREATER_THAN", "LESS_THAN", "EQUAL"]).optional().nullable(),
  filters: z.array(z.string()).optional(),
  requestedOutput: z.array(z.string()).optional(),
});

export type SpatialConstraint = z.infer<typeof SpatialConstraintSchema>;
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type StructuredQuery = z.infer<typeof StructuredQuerySchema>;

export const ToolNameSchema = z.enum([
  "searchDatasets",
  "getSatelliteImagery",
  "resolveAreaOfInterest",
  "detectBuildings",
  "detectChange",
  "detectVegetationChange",
  "spatialBuffer",
  "spatialIntersection",
  "calculateArea",
  "verifyResult",
  "searchGeospatialFeatures",
  "processRasterWindow",
  "preprocessRaster",
  "analyzeRasterPixels",
  "calculateNDVI",
  "analyzeRasterFeatures",
  "detectObjects"
]);

export interface ChangeDetectionResult {
  added: GeoJSONFeatureCollection;
  removed: GeoJSONFeatureCollection;
  unchanged: GeoJSONFeatureCollection;
  summary: {
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
  };
  baselineDate: string;
  comparisonDate: string;
}

export type ToolName = z.infer<typeof ToolNameSchema>;

export const QueryPlanStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  toolName: ToolNameSchema,
  operation: z.string(),
  description: z.string(),
  input: z.unknown().optional(),
  dependsOn: z.array(z.string()),
  status: z.enum(["PENDING"]).default("PENDING")
});

export type QueryPlanStep = z.infer<typeof QueryPlanStepSchema>;

export const QueryPlanSchema = z.object({
  steps: z.array(QueryPlanStepSchema)
}).refine(data => {
  const ids = data.steps.map(s => s.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) return false;

  for (const step of data.steps) {
    if (step.dependsOn.includes(step.id)) return false;
    for (const dep of step.dependsOn) {
      if (!uniqueIds.has(dep)) return false;
    }
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const hasCycle = (stepId: string): boolean => {
    visited.add(stepId);
    recursionStack.add(stepId);

    const step = data.steps.find(s => s.id === stepId);
    if (step) {
      for (const dep of step.dependsOn) {
        if (!visited.has(dep) && hasCycle(dep)) return true;
        else if (recursionStack.has(dep)) return true;
      }
    }

    recursionStack.delete(stepId);
    return false;
  };

  for (const step of data.steps) {
    if (!visited.has(step.id)) {
      if (hasCycle(step.id)) return false;
    }
  }

  return true;
}, { message: "Invalid query plan structure (IDs must be unique, dependencies must exist, no circular dependencies)." });

export type QueryPlan = z.infer<typeof QueryPlanSchema>;

export const DatasetSearchCriteriaSchema = z.object({
  target: z.string().optional(),
  query: z.string().optional(),
});

export type DatasetSearchCriteria = z.infer<typeof DatasetSearchCriteriaSchema>;

export const DatasetMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  provider: z.string(),
  collection: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;

export const SatelliteImagerySearchCriteriaSchema = z.object({
  date: z.string().optional(),
  collections: z.array(z.string()).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  limit: z.number().optional()
});

export type SatelliteImagerySearchCriteria = z.infer<typeof SatelliteImagerySearchCriteriaSchema>;

export const ImageryMetadataSchema = z.object({
  id: z.string(),
  collection: z.string().optional(),
  datetime: z.string().optional(),
  platform: z.string().optional(),
  instruments: z.array(z.string()).optional(),
  geometry: z.unknown().optional(),
  bbox: z.array(z.number()).optional(),
  cloudCover: z.number().nullable().optional(),
  sourceUrl: z.string().optional(),
});

export type ImageryMetadata = z.infer<typeof ImageryMetadataSchema>;



export const AreaOfInterestSchema = z.object({
  name: z.string().optional(),
  source: z.enum(["user", "geocoder", "provider"]),
  geometry: GeoJSONGeometrySchema.or(GeoJSONFeatureCollectionSchema).optional().nullable(),
  bbox: BoundingBoxSchema,
  label: z.string().optional(),
  provider: z.string().optional(),
  featureType: z.string().optional()
});


export type AreaOfInterest = z.infer<typeof AreaOfInterestSchema>;

export const GeocodingResultSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  source: z.string()
});

export type GeocodingResult = z.infer<typeof GeocodingResultSchema>;





export const RasterAssetSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  collection: z.string().optional(),
  assetKey: z.string(),
  href: z.string(),
  mediaType: z.string().optional(),
  roles: z.array(z.string()).optional(),
  platform: z.string().optional(),
  acquisitionDate: z.string().optional(),
  bbox: z.array(z.number()).optional(),
  geometry: z.unknown().optional(),
  bands: z.array(z.string()).optional(),
  source: z.string(),
  provenance: z.string(),
});
export type RasterAsset = z.infer<typeof RasterAssetSchema>;

export const RasterMetadataSchema = z.object({
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  crs: z.string().nullable().optional(),
  transform: z.array(z.number()).nullable().optional(),
  bounds: z.array(z.number()).nullable().optional(),
  bandCount: z.number().nullable().optional(),
  bandNames: z.array(z.string()).nullable().optional(),
  dataType: z.string().nullable().optional(),
  nodata: z.union([z.number(), z.string()]).nullable().optional(),
  resolution: z.number().nullable().optional(),
  fileFormat: z.string().nullable().optional()
});
export type RasterMetadata = z.infer<typeof RasterMetadataSchema>;

export const RasterWindowRequestSchema = z.object({
  rasterAsset: z.any().optional(), // In practice passed via dependencies
  aoi: z.any().optional()
});
export type RasterWindowRequest = z.infer<typeof RasterWindowRequestSchema>;

export const RasterWindowSchema = z.object({
  minX: z.number(),
  minY: z.number(),
  maxX: z.number(),
  maxY: z.number()
});
export type RasterWindow = z.infer<typeof RasterWindowSchema>;

export const PixelWindowSchema = z.object({
  originX: z.number(),
  originY: z.number(),
  width: z.number(),
  height: z.number()
});
export type PixelWindow = z.infer<typeof PixelWindowSchema>;



export const RasterBandStatisticsSchema = z.object({
  bandIndex: z.number(),
  bandName: z.string().nullable(),
  pixelCount: z.number(),
  validPixelCount: z.number(),
  noDataPixelCount: z.number(),
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  mean: z.number().nullable(),
  sum: z.number().nullable(),
  standardDeviation: z.number().nullable()
});

export const RasterPixelAnalysisResultSchema = z.object({
  status: z.string(),
  window: z.object({
    bbox: z.array(z.number()),
    width: z.number(),
    height: z.number()
  }),
  bands: z.array(RasterBandStatisticsSchema),
  totalPixels: z.number(),
  totalValidPixels: z.number(),
  totalNoDataPixels: z.number(),
  analysisMethod: z.string()
});
export type RasterPixelAnalysisResult = z.infer<typeof RasterPixelAnalysisResultSchema>;


export const NDVIResultSchema = z.object({
  status: z.string(),
  window: z.object({
    bbox: z.array(z.number()),
    width: z.number(),
    height: z.number()
  }),
  totalPixels: z.number(),
  validPixelCount: z.number(),
  invalidPixelCount: z.number(),
  minimum: z.number(),
  maximum: z.number(),
  mean: z.number(),
  median: z.number().nullable().optional(),
  redBand: z.object({ index: z.number(), name: z.string().optional() }).optional(),
  nirBand: z.object({ index: z.number(), name: z.string().optional() }).optional(),
  percentile25: z.number().nullable().optional(),
  percentile75: z.number().nullable().optional()
});
export type NDVIResult = z.infer<typeof NDVIResultSchema>;

export const RasterWindowResultSchema = z.object({
  rasterId: z.string(),
  assetKey: z.string(),
  window: RasterWindowSchema.optional().nullable(),
  pixelWindow: PixelWindowSchema.optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  bandCount: z.number().optional().nullable(),
  dataType: z.string().optional().nullable(),
  nodata: z.number().optional().nullable(),
  pixelDataPlaceholder: z.boolean().optional().nullable(),
  pixelData: z.any().optional(),
  bandNames: z.array(z.string()).optional().nullable(),
  crs: z.string().optional().nullable(),
  resolution: z.object({
    x: z.number().optional().nullable(),
    y: z.number().optional().nullable()
  }).optional().nullable()
});
export type RasterWindowResult = z.infer<typeof RasterWindowResultSchema>;

export const RasterPreprocessingResultSchema = z.object({
  rasterId: z.string(),
  assetKey: z.string(),
  width: z.number(),
  height: z.number(),
  bandCount: z.number(),
  validPixelCount: z.number(),
  nodataPixelCount: z.number(),
  statistics: z.object({
    min: z.number(),
    max: z.number(),
    mean: z.number()
  }).nullable(),
  normalizationStatus: z.string(),
  crs: z.string().optional().nullable(),
  resolution: z.object({
    x: z.number().optional().nullable(),
    y: z.number().optional().nullable()
  }).optional().nullable(),
  processingOperation: z.string()
});
export type RasterPreprocessingResult = z.infer<typeof RasterPreprocessingResultSchema>;

export const SatelliteImageryResultSchema = z.object({
  imageryItems: z.array(ImageryMetadataSchema),
  imageryAssets: z.array(RasterAssetSchema).optional(),
  rasterMetadata: z.array(RasterMetadataSchema).optional()
});
export type SatelliteImageryResult = z.infer<typeof SatelliteImageryResultSchema>;

export type Evidence = {
  source: string;
  dataset: string;
  date: string | null;
  operation: string;
  confidence: number | null;
  provenance: string;
};

export type ToolResult<TOutput = unknown> = {
  status: 'SUCCESS' | 'FAILED' | 'NOT_IMPLEMENTED' | 'PENDING' | 'AMBIGUOUS' | 'SKIPPED';
  toolName: ToolName;
  message?: string;
  data?: TOutput;
  evidence?: Evidence[];
  error?: {
    code: string;
    message: string;
  };
};

export type ExecutionState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'NOT_IMPLEMENTED' | 'SKIPPED' | 'AMBIGUOUS';

export type StepExecution = {
  stepId: string;
  executionState: ExecutionState;
  toolResult?: ToolResult;
  message?: string;
};

export type OverallExecutionStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'NOT_IMPLEMENTED';

export type AnalysisResult = {
  query: StructuredQuery;
  plan: QueryPlanStep[];
  execution: StepExecution[];
  finalAnswer: string;
  evidence: Evidence[];
  overallStatus: OverallExecutionStatus;
};



export const RasterFeatureClassSchema = z.object({
  className: z.string(),
  threshold: z.string(),
  pixelCount: z.number(),
  areaSquareMeters: z.number().nullable(),
  percentage: z.number(),
  geometry: z.any() // GeoJSON
});

export const RasterFeatureAnalysisResultSchema = z.object({
  status: z.string(),
  analysisType: z.string().optional(),
  method: z.string().optional(),
  classes: z.array(RasterFeatureClassSchema).optional(),
  validPixelCount: z.number().optional(),
  totalPixelCount: z.number().optional(),
  nodataPixelCount: z.number().optional(),
  parameters: z.object({
    index: z.string(),
    redBand: z.string().nullable(),
    nirBand: z.string().nullable(),
    thresholds: z.any()
  }).optional()
});

export type RasterFeatureClass = z.infer<typeof RasterFeatureClassSchema>;
export type RasterFeatureAnalysisResult = z.infer<typeof RasterFeatureAnalysisResultSchema>;


export const ObjectDetectionResultSchema = z.object({
  status: z.string(),
  classesRequested: z.array(z.string()),
  classesDetected: z.array(z.string()),
  totalObjects: z.number(),
  objectsByClass: z.record(z.string(), z.number()),
  features: z.any().optional(), // GeoJSON FeatureCollection
  bbox: z.array(z.number()).optional(), // [minX, minY, maxX, maxY]
  
  // M25 / M26 Additions
  objects: z.any().optional(), 
  model: z.string().optional(),
  modelVersion: z.string().optional(),
  modelSource: z.string().optional(),
  modelLicense: z.string().optional(),
  confidenceThreshold: z.number().optional(),
  iouThreshold: z.number().optional(),
  inferenceStatus: z.string().optional(),
  inputRaster: z.string().optional(),
  tileCount: z.number().optional(),
  processingMetadata: z.record(z.string(), z.any()).optional(),
  runtimeAvailable: z.boolean().optional(),
  modelAvailable: z.boolean().optional(),
  runtimeMetadata: z.record(z.string(), z.any()).optional()
});

export type ObjectDetectionResult = z.infer<typeof ObjectDetectionResultSchema>;
