import { StructuredQuery, QueryPlanStep, QueryPlanSchema, QueryPlan } from "../../types/index.js";

export function createQueryPlan(query: StructuredQuery): QueryPlanStep[] {
  const steps: QueryPlanStep[] = [];
  let currentOrder = 1;

  
  let aoiId: string | null = null;
  if (query.areaOfInterest || query.location) {
    aoiId = `step_${currentOrder++}_resolve_aoi`;
    const label = query.areaOfInterest?.label || query.location?.name || 'provided coordinates/bbox';
    steps.push({
      id: aoiId,
      order: currentOrder - 1,
      toolName: "resolveAreaOfInterest",
      operation: "geocode",
      description: `Resolve area of interest for ${label}.`,
      input: { areaOfInterest: query.areaOfInterest, location: query.location },
      dependsOn: [],
      status: "PENDING"
    });
  }

  // 1. Dataset search based on reference features or targets
  const datasetIds: string[] = [];
  
  // Search for target dataset
  let targetDatasetId: string;
  const targetLowerStr = query.target.toLowerCase();
  const isTargetSemantic = targetLowerStr.includes("road") || 
                           targetLowerStr.includes("highway") || 
                           targetLowerStr.includes("river") || 
                           targetLowerStr.includes("hospital") || 
                           targetLowerStr.includes("protected") ||
                           targetLowerStr.includes("agricultural");

  if (isTargetSemantic && !targetLowerStr.includes("buildings")) {
    targetDatasetId = `step_${currentOrder++}_search_target_features`;
    steps.push({
      id: targetDatasetId,
      order: currentOrder - 1,
      toolName: "searchGeospatialFeatures",
      operation: "search_features",
      description: `Search for geospatial features: ${query.target}.`,
      input: { featureType: query.target },
      dependsOn: aoiId ? [aoiId] : [],
      status: "PENDING"
    });
  } else {
    targetDatasetId = `step_${currentOrder++}_dataset_target`;
    steps.push({
      id: targetDatasetId,
      order: currentOrder - 1,
      toolName: "searchDatasets",
      operation: "search",
      description: `Search datasets for ${query.target}.`,
      input: { query: query.target },
      dependsOn: aoiId ? [aoiId] : [],
      status: "PENDING"
    });
    datasetIds.push(targetDatasetId);
  }

  let referenceDatasetId: string | null = null;
  if (query.spatialConstraint?.referenceFeature) {
    const refFeatureLower = query.spatialConstraint.referenceFeature.toLowerCase();
    
    // Check if it's a semantic feature type that we should search directly
    const isSemanticFeature = refFeatureLower.includes("road") || 
                              refFeatureLower.includes("highway") || 
                              refFeatureLower.includes("river") || 
                              refFeatureLower.includes("hospital") || 
                              refFeatureLower.includes("protected") ||
                              refFeatureLower.includes("agricultural");

    if (isSemanticFeature) {
      referenceDatasetId = `step_${currentOrder++}_search_features`;
      steps.push({
        id: referenceDatasetId,
        order: currentOrder - 1,
        toolName: "searchGeospatialFeatures",
        operation: "search_features",
        description: `Search for geospatial features: ${query.spatialConstraint.referenceFeature}.`,
        input: { featureType: query.spatialConstraint.referenceFeature },
        dependsOn: aoiId ? [aoiId] : [],
        status: "PENDING"
      });
    } else {
      referenceDatasetId = `step_${currentOrder++}_dataset_ref`;
      steps.push({
        id: referenceDatasetId,
        order: currentOrder - 1,
        toolName: "searchDatasets",
        operation: "search",
        description: `Search datasets for ${query.spatialConstraint.referenceFeature}.`,
        input: { query: query.spatialConstraint.referenceFeature },
        dependsOn: aoiId ? [aoiId] : [],
        status: "PENDING"
      });
      datasetIds.push(referenceDatasetId);
    }
  }

  // 2. Spatial buffer if distance is provided
  let bufferId: string | null = null;
  if (query.spatialConstraint?.distance && query.spatialConstraint?.relation) {
    bufferId = `step_${currentOrder++}_buffer`;
    // Buffer the reference feature if one was found; otherwise buffer the AOI itself.
    const bufferDep = referenceDatasetId ?? aoiId;
    // Infer units from the relation string (e.g. "within 500 meters" → "meters")
    const relationStr = String(query.spatialConstraint.relation).toLowerCase();
    const bufferUnits = (relationStr.includes("meter") || relationStr.includes(" m ")) ? "meters"
      : (relationStr.includes("kilometer") || relationStr.includes(" km")) ? "kilometers"
      : "meters"; // default to meters for safety (prevents 500 being treated as 500km)
    steps.push({
      id: bufferId,
      order: currentOrder - 1,
      toolName: "spatialBuffer",
      operation: "buffer",
      description: `Create a ${query.spatialConstraint.distance} ${query.spatialConstraint.relation} buffer.`,
      input: { distance: query.spatialConstraint.distance, units: bufferUnits, relation: query.spatialConstraint.relation },
      dependsOn: bufferDep ? [bufferDep] : [],
      status: "PENDING"
    });
  }

  // 3. Temporal imagery retrieval
  const imageryIds: string[] = [];
  
  // Default to retrieving imagery if target requires raster data
  const isRasterRequired = targetLowerStr.includes("building") || 
                           targetLowerStr.includes("vegetation") ||
                           targetLowerStr.includes("forest") ||
                           targetLowerStr.includes("agricultural") ||
                           targetLowerStr.includes("deforestation") ||
                           targetLowerStr.includes("urban") ||
                           targetLowerStr.includes("expansion") ||
                           targetLowerStr.includes("development") ||
                           targetLowerStr.includes("land cover");

  if (query.timeRange?.start || isRasterRequired) {
    const id = `step_${currentOrder++}_imagery_start`;
    const deps = [targetDatasetId];
    if (aoiId) deps.push(aoiId);
    steps.push({
      id,
      order: currentOrder - 1,
      toolName: "getSatelliteImagery",
      operation: "retrieve_imagery",
      description: query.timeRange?.start ? `Retrieve imagery for ${query.timeRange.start}.` : `Retrieve latest available satellite/aerial imagery.`,
      input: query.timeRange?.start ? { date: query.timeRange.start } : {},
      dependsOn: deps,
      status: "PENDING"
    });
    
    const readId = `step_${currentOrder++}_read_raster_start`;
    steps.push({
      id: readId,
      order: currentOrder - 1,
      toolName: "processRasterWindow",
      operation: "read_raster",
      description: query.timeRange?.start ? `Read raster window for ${query.timeRange.start}.` : `Read high-resolution raster window.`,
      input: {},
      dependsOn: [id].concat(aoiId ? [aoiId] : []),
      status: "PENDING"
    });
    
    const preprocId = `step_${currentOrder++}_preprocess_raster_start`;
    steps.push({
      id: preprocId,
      order: currentOrder - 1,
      toolName: "preprocessRaster",
      operation: "preprocess_raster",
      description: query.timeRange?.start ? `Preprocess raster window for ${query.timeRange.start}.` : `Preprocess raster window.`,
      input: {},
      dependsOn: [readId, id],
      status: "PENDING"
    });
    imageryIds.push(readId, preprocId);
  }
  
  if (query.timeRange?.end) {
    const id = `step_${currentOrder++}_imagery_end`;
    const deps = [targetDatasetId];
    if (aoiId) deps.push(aoiId);
    steps.push({
      id,
      order: currentOrder - 1,
      toolName: "getSatelliteImagery",
      operation: "retrieve_imagery",
      description: `Retrieve imagery for ${query.timeRange.end}.`,
      input: { date: query.timeRange.end },
      dependsOn: deps,
      status: "PENDING"
    });
    
    const readId = `step_${currentOrder++}_read_raster_end`;
    steps.push({
      id: readId,
      order: currentOrder - 1,
      toolName: "processRasterWindow",
      operation: "read_raster",
      description: `Read raster window for ${query.timeRange.end}.`,
      input: {},
      dependsOn: [id].concat(aoiId ? [aoiId] : []),
      status: "PENDING"
    });
    
    const preprocId2 = `step_${currentOrder++}_preprocess_raster_end`;
    steps.push({
      id: preprocId2,
      order: currentOrder - 1,
      toolName: "preprocessRaster",
      operation: "preprocess_raster",
      description: `Preprocess raster window for ${query.timeRange.end}.`,
      input: {},
      dependsOn: [readId, id],
      status: "PENDING"
    });
    imageryIds.push(readId, preprocId2);
  }

  // 4. Analysis operations (detection, change) based on target
  let analysisId: string | null = null;
  const opLower = query.operation.toLowerCase();
  const isVegetationChange = opLower === "vegetation_change_detection" || (query.changeType && query.changeType.includes("vegetation"));
  const isChange = opLower.includes("change") || targetLowerStr.includes("new") || targetLowerStr.includes("loss") || targetLowerStr.includes("expansion") || targetLowerStr.includes("deforestation");
  
  const detectionIds: string[] = [];

  if (targetLowerStr.includes("building") || targetLowerStr.includes("hospital") || targetLowerStr.includes("urban") || targetLowerStr.includes("car") || targetLowerStr.includes("ship") || targetLowerStr.includes("plane") || targetLowerStr.includes("vehicle") || targetLowerStr.includes("infrastructure") || targetLowerStr.includes("object")) {
    if (isChange && imageryIds.length === 4) { // Start read, Start preproc, End read, End preproc
      const detectStartId = `step_${currentOrder++}_detect_objects_start`;
      const depsStart = [targetDatasetId, imageryIds[0], imageryIds[1]];
      if (aoiId) depsStart.push(aoiId);
      steps.push({
        id: detectStartId,
        order: currentOrder - 1,
        toolName: "detectObjects",
        operation: "detect",
        description: `Detect ${query.target} for baseline.`,
        input: { target: query.target, timePoint: "start" },
        dependsOn: [...new Set(depsStart)],
        status: "PENDING"
      });
      detectionIds.push(detectStartId);

      const detectEndId = `step_${currentOrder++}_detect_objects_end`;
      const depsEnd = [targetDatasetId, imageryIds[2], imageryIds[3]];
      if (aoiId) depsEnd.push(aoiId);
      steps.push({
        id: detectEndId,
        order: currentOrder - 1,
        toolName: "detectObjects",
        operation: "detect",
        description: `Detect ${query.target} for comparison.`,
        input: { target: query.target, timePoint: "end" },
        dependsOn: [...new Set(depsEnd)],
        status: "PENDING"
      });
      detectionIds.push(detectEndId);
      
      analysisId = detectEndId;
    } else {
      const detectId = `step_${currentOrder++}_detect_objects`;
      const deps = [targetDatasetId, ...imageryIds];
      if (aoiId) deps.push(aoiId);
      
      steps.push({
        id: detectId,
        order: currentOrder - 1,
        toolName: "detectObjects",
        operation: "detect",
        description: `Detect ${query.target}.`,
        input: { target: query.target },
        dependsOn: [...new Set(deps)], // Deduplicate dependencies
        status: "PENDING"
      });
      analysisId = detectId;
      detectionIds.push(detectId);
    }
  } else if   (targetLowerStr.includes("vegetation") || targetLowerStr.includes("agricultural") || targetLowerStr.includes("forest") || targetLowerStr.includes("deforestation") || targetLowerStr.includes("ndvi")) {
    if (query.timeRange?.start && imageryIds.length > 0) {
        const readId = imageryIds[0];
        const analyzeId = `step_${currentOrder++}_analyze_raster_pixels`;
        steps.push({
           id: analyzeId,
           order: currentOrder - 1,
           toolName: "analyzeRasterPixels",
           operation: "analyze_raster_pixels",
           description: "Analyze deterministic pixel statistics",
           input: {},
           dependsOn: [readId],
           status: "PENDING"
        });
        analysisId = analyzeId;
        
        const ndviId = `step_${currentOrder++}_calculate_ndvi`;
        steps.push({
           id: ndviId,
           order: currentOrder - 1,
           toolName: "analyzeRasterFeatures",
           operation: "analyze_raster_features",
           description: "Calculate deterministic raster features from pixels",
           input: {},
           dependsOn: [readId],
           status: "PENDING"
        });
        analysisId = ndviId;
    } else {
        analysisId = targetDatasetId;
    }
  }
  
  if (!analysisId) {
    analysisId = targetDatasetId;
  }

    if (isVegetationChange) {
    const changeId = `step_${currentOrder++}_detect_vegetation_change`;
    let deps = analysisId ? [analysisId, ...imageryIds] : [...imageryIds];
    steps.push({
      id: changeId,
      order: currentOrder - 1,
      toolName: "detectVegetationChange",
      operation: "vegetation_change_detection",
      description: `Perform vegetation change analysis for ${query.target}.`,
      input: { 
        target: query.target,
        changeType: query.changeType,
        threshold: query.threshold,
        operator: query.operator
      },
      dependsOn: deps,
      status: "PENDING"
    });
    analysisId = changeId;
  } else if (isChange) {
    const changeId = `step_${currentOrder++}_detect_change`;
    let deps = analysisId ? [analysisId, ...imageryIds] : [...imageryIds];
    if (detectionIds.length === 2) {
      deps = [...detectionIds];
    }
    steps.push({
      id: changeId,
      order: currentOrder - 1,
      toolName: "detectChange",
      operation: "change_detection",
      description: `Perform change analysis for ${query.target}.`,
      input: { target: query.target },
      dependsOn: deps,
      status: "PENDING"
    });
    analysisId = changeId;
  }

  // 5. Spatial intersection if applicable
  let finalSpatialId = analysisId;
  if (bufferId || referenceDatasetId) {
    const intersectId = `step_${currentOrder++}_intersection`;
    const dependencies = [];
    if (analysisId) dependencies.push(analysisId);
    if (bufferId) dependencies.push(bufferId);
    else if (referenceDatasetId) dependencies.push(referenceDatasetId);
    
    steps.push({
      id: intersectId,
      order: currentOrder - 1,
      toolName: "spatialIntersection",
      operation: "intersect",
      description: "Intersect detected features with spatial constraints.",
      input: {},
      dependsOn: [...new Set(dependencies)],
      status: "PENDING"
    });
    finalSpatialId = intersectId;
  }

  // 6. Verification
  steps.push({
    id: `step_${currentOrder++}_verify`,
    order: currentOrder - 1,
    toolName: "verifyResult",
    operation: "verify",
    description: "Verify the analysis results.",
    input: {},
    dependsOn: finalSpatialId ? [finalSpatialId] : [],
    status: "PENDING"
  });

  const queryPlan: QueryPlan = { steps };
  
  // Validate the plan
  console.log("STEPS: ", JSON.stringify(steps.map(s => s.toolName)));
  const validation = QueryPlanSchema.safeParse(queryPlan);
  if (!validation.success) {
    throw new Error(`Generated invalid query plan: ${validation.error.message}`);
  }

  return validation.data.steps;
}
