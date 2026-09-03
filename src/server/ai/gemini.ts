/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { StructuredQuery, StructuredQuerySchema } from "../../types/index.js";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini request timeout")), 15000)
        )
      ]);
      return result;
    } catch (error: any) {
      const msg = error.message || "";
      const isTransient =
        msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") ||
        msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("fetch failed") || msg.includes("timeout") ||
        msg.includes("502") || msg.includes("500") ||
        error.status === 503 || error.status === 429 || error.status === 500;
      if (isTransient && attempt < maxRetries - 1) {
        attempt++;
        let delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        const retryMatch = msg.match(/retry in (\d+)/i);
        if (retryMatch) delay = parseInt(retryMatch[1]) * 1000 + 500;
        delay = Math.min(delay, 5000); // cap at 5s for fast fallback
        console.warn(`Gemini transient error (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Gemini: maximum retries reached");
}

function fallbackParseQuery(nlQuery: string, aoiStr?: string): StructuredQuery {
  const lower = nlQuery.toLowerCase();
  let locationName = aoiStr || "Seattle";

  const locMatch = nlQuery.match(/in\s+([A-Za-z\s,]+)$/i) ||
                   nlQuery.match(/near\s+([A-Za-z\s,]+)$/i) ||
                   nlQuery.match(/of\s+([A-Za-z\s,]+)$/i);
  if (locMatch && locMatch[1]) {
    const rawLoc = locMatch[1].trim();
    if (rawLoc.length > 1 && !rawLoc.includes("between") && !rawLoc.includes("500m")) {
      locationName = rawLoc;
    }
  }

  let timeRange: { start?: string; end?: string } | undefined;
  const yearMatch = nlQuery.match(/between\s+(\d{4})\s+and\s+(\d{4})/i);
  if (yearMatch) {
    timeRange = { start: yearMatch[1], end: yearMatch[2] };
  }

  let spatialConstraint: { relation?: string; distance?: string | number; referenceFeature?: string } | undefined;
  const distMatch = nlQuery.match(/within\s+([0-9]+(?:\.[0-9]+)?)\s*(m|km|meters|kilometers)?/i);
  if (distMatch) {
    const distNum = parseFloat(distMatch[1]);
    const distUnits = /km|kilometers?/i.test(distMatch[2] || '') ? 'kilometers' : 'meters';
    spatialConstraint = {
      relation: `within ${distNum} ${distUnits}`,
      distance: distNum,
      referenceFeature: lower.includes("road") || lower.includes("highway") ? "roads" : undefined
    };
  }

  if (lower.includes("building") && (lower.includes("change") || lower.includes("added") || lower.includes("removed"))) {
    return {
      intent: "change_detection",
      target: "buildings",
      operation: "detect_change",
      timeRange: timeRange || { start: "2019", end: "2023" },
      location: { name: locationName },
      areaOfInterest: { label: locationName }
    };
  }

  if (lower.includes("building")) {
    return {
      intent: "object_detection",
      target: "buildings",
      operation: "detect_objects",
      timeRange,
      location: { name: locationName },
      areaOfInterest: { label: locationName }
    };
  }

  if (lower.includes("vegetation") || lower.includes("ndvi") || lower.includes("forest") || lower.includes("crop")) {
    return {
      intent: "raster_analysis",
      target: "vegetation",
      operation: "vegetation_analysis",
      timeRange: timeRange || (lower.includes("change") ? { start: "2019", end: "2023" } : undefined),
      location: { name: locationName },
      areaOfInterest: { label: locationName }
    };
  }

  if (lower.includes("hospital") || lower.includes("medical")) {
    return {
      intent: "feature_search",
      target: "hospitals",
      operation: "search_features",
      location: { name: locationName },
      areaOfInterest: { label: locationName }
    };
  }

  if (lower.includes("road") || lower.includes("highway")) {
    return {
      intent: "proximity_analysis",
      target: "roads",
      operation: "proximity_analysis",
      spatialConstraint,
      location: { name: locationName },
      areaOfInterest: { label: locationName }
    };
  }

  return {
    intent: "general_analysis",
    target: lower.includes("urban") ? "urban expansion" : "features",
    operation: lower.includes("urban") ? "proximity_analysis" : "search_features",
    location: { name: locationName },
    areaOfInterest: { label: locationName }
  };
}

export async function parseQueryToStructured(nlQuery: string, aoiStr?: string): Promise<StructuredQuery> {
  let response;
  try {
    let prompt = `Parse the following geospatial query into a structured JSON representation.\nQuery: ${nlQuery}`;
    if (aoiStr) {
      prompt += `\nExplicit Area of Interest provided by user: ${aoiStr}. Map this directly to the areaOfInterest field if applicable. Do NOT invent a bounding box. Do NOT guess coordinates. If the AOI provided is a place name, put it in areaOfInterest.label. If it's a bounding box string, parse it to areaOfInterest.bbox. If you cannot confidently resolve the bounding box, leave it empty. Let the geocoder handle place names.`;
    }
    response = await withRetry(() => getAiClient().models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert geospatial query parser. Extract intent, target, operation, temporal constraints, and spatial constraints. For vegetation change or threshold queries, explicitly extract changeType (e.g. 'vegetation_loss'), threshold as a decimal (e.g., 30% -> 0.30), and operator ('GREATER_THAN', 'LESS_THAN', 'EQUAL'). Do not confuse general 'loss' with 'vegetation_loss' unless it specifically targets vegetation, forest, or agriculture. If operation is vegetation change, set operation to 'vegetation_change_detection'. Extract timeRange.start and timeRange.end explicitly (e.g. '2019', '2026') as strings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, description: "Overall intent of the query" },
            target: { type: Type.STRING, description: "The primary object or feature being analyzed" },
            operation: { type: Type.STRING, description: "The geospatial operation to perform" },
            timeRange: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.STRING },
                end: { type: Type.STRING },
              },
            },
            spatialConstraint: {
              type: Type.OBJECT,
              properties: {
                relation: { type: Type.STRING },
                distance: { type: Type.STRING },
                referenceFeature: { type: Type.STRING },
              },
            },
            location: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Explicit named location (e.g. Pune, Maharashtra)" },
                coordinates: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: "Explicit coordinate pair [lat, lon]"
                }
              }
            },
            areaOfInterest: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                bbox: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER }
                }
              }
            },
            filters: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            changeType: { type: Type.STRING, description: "Type of change, e.g., 'vegetation_loss', 'deforestation'" },
            threshold: { type: Type.NUMBER, description: "Numeric threshold value (e.g., 30% becomes 0.30, 50% becomes 0.50)" },
            operator: { type: Type.STRING, description: "Comparison operator: 'GREATER_THAN', 'LESS_THAN', or 'EQUAL'" },
            requestedOutput: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["intent", "target", "operation"],
        },
      },
    }));

    const jsonStr = response.text?.trim() || "{}";
    const parsedJson = JSON.parse(jsonStr);
    const validationResult = StructuredQuerySchema.safeParse(parsedJson);
    if (validationResult.success) {
      return validationResult.data;
    }
  } catch (error: any) {
    console.warn("Gemini parseQueryToStructured failed (falling back to rule-based parser):", error.message);
  }

  return fallbackParseQuery(nlQuery, aoiStr);
}

export async function generateFinalAnswer(nlQuery: string, planExecutionSummary: any): Promise<string> {
  try {
    const response = await withRetry(() => getAiClient().models.generateContent({
      model: "gemini-3.6-flash",
      contents: `User Query: ${nlQuery}\n\nExecution Summary: ${JSON.stringify(planExecutionSummary, null, 2)}\n\nGenerate a final answer for the user based strictly on the execution summary.`,
      config: {
        systemInstruction: "You are SATQuery, a geospatial AI platform. Provide a professional summary of the analysis steps. Follow these strict rules:\n1. Distinguish between 'satellite imagery metadata retrieval' and 'satellite-derived building detection'. If only metadata was retrieved, do not claim satellite imagery was analyzed.\n2. Distinguish between 'OSM building footprints' and 'satellite-derived detections'. If OSM data was used, state it clearly.\n3. If a tool was NOT_IMPLEMENTED, FAILED, or SKIPPED, do not claim the requested geographic analysis was completed, and do not invent findings.\n4. Explain what was successfully executed and what remains unavailable.",
      },
    }));

    return response.text || "Execution completed successfully.";
  } catch (error: any) {
    console.warn("Gemini final answer generation failed (fallback to rule-based summary):", error.message);
    const status = planExecutionSummary?.overallStatus || "UNKNOWN";
    const steps = planExecutionSummary?.executionSteps || [];
    const successSteps = steps.filter((s: any) => s.executionState === "SUCCESS").length;
    return `Query "${nlQuery}" executed with status: ${status}. (${successSteps}/${steps.length} pipeline steps succeeded).`;
  }
}
