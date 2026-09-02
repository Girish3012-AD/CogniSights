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


async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isTransient = error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("high demand") || error.status === 503;
      if (isTransient && attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Gemini API busy (503). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Maximum retries reached");
}

export async function parseQueryToStructured(nlQuery: string, aoiStr?: string): Promise<StructuredQuery> {
  let response;
  try {
    let prompt = `Parse the following geospatial query into a structured JSON representation.\nQuery: ${nlQuery}`;
    if (aoiStr) {
      prompt += `\nExplicit Area of Interest provided by user: ${aoiStr}. Map this directly to the areaOfInterest field if applicable. Do NOT invent a bounding box. Do NOT guess coordinates. If the AOI provided is a place name, put it in areaOfInterest.label. If it's a bounding box string, parse it to areaOfInterest.bbox. If you cannot confidently resolve the bounding box, leave it empty. Let the geocoder handle place names.`;
    }
    response = await withRetry(() => getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
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
  } catch (error: any) {
    throw new Error(`Gemini API Error: ${error.message}`);
  }

  const jsonStr = response.text?.trim() || "{}";
  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch (error: any) {
    throw new Error(`Failed to parse AI output as JSON: ${error.message}`);
  }

  const validationResult = StructuredQuerySchema.safeParse(parsedJson);
  if (!validationResult.success) {
    throw new Error(`AI output failed schema validation: ${validationResult.error.message}`);
  }

  return validationResult.data;
}

export async function generateFinalAnswer(nlQuery: string, planExecutionSummary: any): Promise<string> {
  try {
    const response = await withRetry(() => getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
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
