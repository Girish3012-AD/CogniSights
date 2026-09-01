import { ToolResult } from "../../types/index.js";

export async function detectVegetationChangeProvider(input: any): Promise<ToolResult<any>> {
  // Check upstream dependencies
  let hasImagery = false;
  let hasMask = false;

  if (input.dependencyOutputs) {
    for (const [depId, depOutput] of Object.entries(input.dependencyOutputs)) {
      if (Array.isArray(depOutput)) {
        hasImagery = true;
      }
      if (depOutput && typeof depOutput === 'object' && (depOutput as any).type === 'FeatureCollection') {
        hasMask = true;
      }
    }
  }

  // The milestone explicitly states:
  // "If the current STAC provider only retrieves metadata and does NOT retrieve usable spectral imagery bands:
  // DO NOT fake NDVI."
  // "The tool should return: NOT_IMPLEMENTED with a precise explanation such as:
  // 'Vegetation index computation requires spectral imagery assets that are not yet connected.'"
  
  return {
    toolName: "detectVegetationChange",
    status: "NOT_IMPLEMENTED",
    message: "Vegetation index computation requires spectral imagery assets that are not yet connected.",
    evidence: []
  };
}
