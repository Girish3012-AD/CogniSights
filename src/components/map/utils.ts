import { AnalysisResult } from "../../types/index.js";

export type MapLayer = {
  id: string;
  name: string;
  sourceTool: string;
  geometry: any;
  featureCount: number;
  status: string;
  visible: boolean;
  color: string;
  fillColor: string;
  weight: number;
};

export function extractMapData(result: AnalysisResult | null): { aoi: any | null, layers: MapLayer[] } {
  if (!result) return { aoi: null, layers: [] };
  
  const layers: MapLayer[] = [];
  let aoi: any = null;

  for (const step of result.execution) {
    if (step.executionState !== 'SUCCESS' || !step.toolResult || !step.toolResult.data) {
      continue;
    }
    
    const toolName = step.toolResult.toolName;
    const data = step.toolResult.data as any;
    const planStep = result.plan.find(p => p.id === step.stepId);

    if (toolName === 'resolveAreaOfInterest') {
      aoi = data.geometry || null;
      if (aoi) {
        layers.push({
          id: step.stepId,
          name: 'Area of Interest',
          sourceTool: toolName,
          geometry: aoi,
          featureCount: 1,
          status: step.executionState,
          visible: true,
          color: '#3b82f6', // blue-500
          fillColor: 'transparent',
          weight: 2
        });
      }
    } else if (toolName === 'searchGeospatialFeatures') {
      if (data.features && data.features.length > 0) {
        const featureType = (planStep?.input as any)?.featureType || 'Features';
        const name = planStep?.description?.replace('Search for geospatial features: ', '') || featureType;
        
        let color = '#8b5cf6'; // violet-500
        const strData = JSON.stringify(data).toLowerCase();
        if (strData.includes('water') || strData.includes('river')) color = '#0ea5e9'; // sky-500
        if (strData.includes('road')) color = '#f59e0b'; // amber-500
        if (strData.includes('hospital')) color = '#ef4444'; // red-500
        if (strData.includes('agricultural') || strData.includes('farmland')) color = '#84cc16'; // lime-500
        if (strData.includes('protected')) color = '#10b981'; // emerald-500
        
        layers.push({
          id: step.stepId,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          sourceTool: toolName,
          geometry: data,
          featureCount: data.features.length,
          status: step.executionState,
          visible: true,
          color,
          fillColor: color,
          weight: 2
        });
      }
    } else if (toolName === 'spatialBuffer') {
      if (data.features && data.features.length > 0) {
        layers.push({
          id: step.stepId,
          name: planStep?.description || 'Spatial Buffer',
          sourceTool: toolName,
          geometry: data,
          featureCount: data.features.length,
          status: step.executionState,
          visible: true,
          color: '#6366f1', // indigo-500
          fillColor: '#6366f1',
          weight: 1
        });
      }
    } else if (toolName === 'spatialIntersection') {
      if (data.features && data.features.length > 0) {
        layers.push({
          id: step.stepId,
          name: 'Spatial Intersection',
          sourceTool: toolName,
          geometry: data,
          featureCount: data.features.length,
          status: step.executionState,
          visible: true,
          color: '#ec4899', // pink-500
          fillColor: '#ec4899',
          weight: 2
        });
      }
    } else if (toolName === 'detectBuildings' || toolName === 'detectObjects') {
      const featureSet = data.features || data.buildings;
      if (featureSet && featureSet.features && featureSet.features.length > 0) {
        const tPoint = (planStep?.input as any)?.timePoint;
        layers.push({
          id: step.stepId,
          name: `Detected Buildings (${tPoint || 'Unknown'})`,
          sourceTool: toolName,
          geometry: featureSet,
          featureCount: data.totalObjects || data.detectionCount || featureSet.features.length,
          status: step.executionState,
          visible: true,
          color: '#f97316', // orange-500
          fillColor: '#f97316',
          weight: 1
        });
      }
    } else if (toolName === 'getSatelliteImagery') {
      if (data.imageryItems && data.imageryItems.length > 0) {
        // Take the first image as representative
        const item = data.imageryItems[0];
        if (item.geometry) {
           layers.push({
             id: step.stepId,
             name: 'Raster Scene Bounds',
             sourceTool: toolName,
             geometry: item.geometry,
             featureCount: 1,
             status: step.executionState,
             visible: true,
             color: '#f43f5e', // rose-500
             fillColor: 'transparent',
             weight: 2
           });
        }
      }
    } else if (toolName === 'detectChange') {
      if (data.added && data.added.features && data.added.features.length > 0) {
        layers.push({
          id: `${step.stepId}_added`,
          name: 'Added Buildings',
          sourceTool: toolName,
          geometry: data.added,
          featureCount: data.summary?.addedCount || data.added.features.length,
          status: step.executionState,
          visible: true,
          color: '#10b981', // emerald-500
          fillColor: '#10b981',
          weight: 2
        });
      }
      if (data.removed && data.removed.features && data.removed.features.length > 0) {
        layers.push({
          id: `${step.stepId}_removed`,
          name: 'Removed Buildings',
          sourceTool: toolName,
          geometry: data.removed,
          featureCount: data.summary?.removedCount || data.removed.features.length,
          status: step.executionState,
          visible: true,
          color: '#ef4444', // red-500
          fillColor: '#ef4444',
          weight: 2
        });
      }
      if (data.unchanged && data.unchanged.features && data.unchanged.features.length > 0) {
        layers.push({
          id: `${step.stepId}_unchanged`,
          name: 'Unchanged Buildings',
          sourceTool: toolName,
          geometry: data.unchanged,
          featureCount: data.summary?.unchangedCount || data.unchanged.features.length,
          status: step.executionState,
          visible: false, // Default hidden for unchanged
          color: '#94a3b8', // slate-400
          fillColor: '#94a3b8',
          weight: 1
        });
      }
    }
  }

  return { aoi, layers };
}
