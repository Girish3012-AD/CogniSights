import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../tools/registry.js", () => ({
  executeTool: vi.fn()
}));

vi.mock("../ai/gemini.js", () => ({
  parseQueryToStructured: vi.fn().mockResolvedValue({
    intent: "test",
    target: "buildings",
    operation: "detect"
  }),
  generateFinalAnswer: vi.fn().mockResolvedValue("Test answer")
}));

vi.mock("../planner/planner.js", () => ({
  createQueryPlan: vi.fn()
}));

import { handleQuery } from "./executor.js";
import { executeTool } from "../tools/registry.js";
import { createQueryPlan } from "../planner/planner.js";

const mockExecuteTool = executeTool as any;
const mockCreateQueryPlan = createQueryPlan as any;

const makeStep = (id: string, toolName: any, deps: string[] = []) => ({
  id, order: 1, toolName, operation: "op", description: "", input: {}, dependsOn: deps, status: "PENDING" as const
});

describe("executor overall status logic", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("SUCCESS when all steps succeed", async () => {
    mockCreateQueryPlan.mockReturnValue([
      makeStep("step_1_aoi", "resolveAreaOfInterest"),
      makeStep("step_2_ndvi", "calculateNDVI", ["step_1_aoi"]),
      makeStep("step_3_verify", "verifyResult", ["step_2_ndvi"])
    ]);
    mockExecuteTool.mockResolvedValue({ toolName: "resolveAreaOfInterest", status: "SUCCESS", evidence: [] });
    const result = await handleQuery("test", "Pune");
    expect(result.overallStatus).toBe("SUCCESS");
  });

  it("FAILED when core step is SKIPPED due to upstream FAILED", async () => {
    mockCreateQueryPlan.mockReturnValue([
      makeStep("step_1_aoi", "resolveAreaOfInterest"),
      makeStep("step_2_imagery", "getSatelliteImagery", ["step_1_aoi"]),
      makeStep("step_3_ndvi", "calculateNDVI", ["step_2_imagery"]),
      makeStep("step_4_verify", "verifyResult", ["step_3_ndvi"])
    ]);
    mockExecuteTool
      .mockResolvedValueOnce({ toolName: "resolveAreaOfInterest", status: "SUCCESS", evidence: [] })
      .mockResolvedValueOnce({ toolName: "getSatelliteImagery", status: "FAILED", evidence: [] });
    const result = await handleQuery("test", "Pune");
    expect(result.overallStatus).toBe("FAILED");
  });

  it("NOT_IMPLEMENTED when core step is NOT_IMPLEMENTED", async () => {
    mockCreateQueryPlan.mockReturnValue([
      makeStep("step_1_aoi", "resolveAreaOfInterest"),
      makeStep("step_2_detect", "detectObjects", ["step_1_aoi"]),
      makeStep("step_3_verify", "verifyResult", ["step_2_detect"])
    ]);
    mockExecuteTool
      .mockResolvedValueOnce({ toolName: "resolveAreaOfInterest", status: "SUCCESS", evidence: [] })
      .mockResolvedValueOnce({ toolName: "detectObjects", status: "NOT_IMPLEMENTED", evidence: [] });
    const result = await handleQuery("test", "Pune");
    expect(result.overallStatus).toBe("NOT_IMPLEMENTED");
  });

  it("PARTIAL when core succeeds but a non-core step fails", async () => {
    mockCreateQueryPlan.mockReturnValue([
      makeStep("step_1_aoi", "resolveAreaOfInterest"),
      makeStep("step_2_dataset", "searchDatasets", ["step_1_aoi"]),
      makeStep("step_3_ndvi", "calculateNDVI", ["step_1_aoi"]),
      makeStep("step_4_verify", "verifyResult", ["step_3_ndvi"])
    ]);
    mockExecuteTool
      .mockResolvedValueOnce({ toolName: "resolveAreaOfInterest", status: "SUCCESS", evidence: [] })
      .mockResolvedValueOnce({ toolName: "searchDatasets", status: "FAILED", evidence: [] })
      .mockResolvedValueOnce({ toolName: "calculateNDVI", status: "SUCCESS", evidence: [] })
      .mockResolvedValueOnce({ toolName: "verifyResult", status: "SUCCESS", evidence: [] });
    const result = await handleQuery("test", "Pune");
    expect(result.overallStatus).toBe("PARTIAL");
  });
});
