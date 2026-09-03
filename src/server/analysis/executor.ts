import { AnalysisResult, StepExecution, Evidence, OverallExecutionStatus, ExecutionState } from "../../types/index.js";
import { parseQueryToStructured, generateFinalAnswer } from "../ai/gemini.js";
import { createQueryPlan } from "../planner/planner.js";
import { executeTool } from "../tools/registry.js";

export async function handleQuery(nlQuery: string, aoi?: string, localizedContext?: { imagePaths: string[] }): Promise<AnalysisResult> {
  // 1. Query Understanding
  const structuredQuery = await parseQueryToStructured(nlQuery, aoi);

  // 2. Query Plan
  const plan = createQueryPlan(structuredQuery);

  // 3. Execution & Evidence generation
  const executionSteps: StepExecution[] = [];
  const evidence: Evidence[] = [];
  const stepResults = new Map<string, any>();
  const stepStates = new Map<string, ExecutionState>();
  
  for (const step of plan) {
    // Check dependencies
    let canExecute = true;
    const failedDeps: string[] = [];
    
    for (const dep of step.dependsOn) {
      const depState = stepStates.get(dep);
      if (depState !== "SUCCESS") {
        canExecute = false;
        failedDeps.push(dep);
      }
    }

    if (!canExecute) {
      const state: ExecutionState = "SKIPPED";
      stepStates.set(step.id, state);
      executionSteps.push({
        stepId: step.id,
        executionState: state,
        message: `Skipped because dependency step(s) did not succeed: ${failedDeps.join(', ')}`
      });
      continue;
    }

    // Resolve inputs
    const dependencyOutputs: Record<string, any> = {};
    for (const dep of step.dependsOn) {
      dependencyOutputs[dep] = stepResults.get(dep);
    }
    const resolvedInput = {
      ...(typeof step.input === 'object' && step.input !== null ? step.input : {}),
      dependencyOutputs
    };

    // Execute
    try {
      const result = await executeTool(step.toolName, resolvedInput);
      const state: ExecutionState = result.status as ExecutionState;
      
      stepStates.set(step.id, state);
      stepResults.set(step.id, result.data);
      
      executionSteps.push({
        stepId: step.id,
        executionState: state,
        toolResult: result,
      });
      
      if (result.evidence && result.evidence.length > 0) {
        evidence.push(...result.evidence);
      }
    } catch (error: any) {
      const state: ExecutionState = "FAILED";
      stepStates.set(step.id, state);
      executionSteps.push({
        stepId: step.id,
        executionState: state,
        message: `Execution failed: ${error.message}`
      });
    }
  }

  // Determine overall status based on the final core (non-verify) step
  const coreSteps = executionSteps.filter(s => !s.stepId.includes('_verify'));
  const coreStep = coreSteps[coreSteps.length - 1];
  const coreState = coreStep?.executionState;

  let overallStatus: OverallExecutionStatus;
  if (!coreStep) {
    overallStatus = 'FAILED';
  } else if (coreState === 'SUCCESS') {
    const hasNonCoreFailure = executionSteps.some(s =>
      !s.stepId.includes('_verify') && s.stepId !== coreStep.stepId &&
      (s.executionState === 'FAILED' || s.executionState === 'NOT_IMPLEMENTED')
    );
    overallStatus = hasNonCoreFailure ? 'PARTIAL' : 'SUCCESS';
  } else if (coreState === 'NOT_IMPLEMENTED') {
    overallStatus = 'NOT_IMPLEMENTED';
  } else {
    // FAILED or SKIPPED core step = overall FAILED
    overallStatus = 'FAILED';
  }

  // 4. Final Answer
  const finalAnswer = await generateFinalAnswer(nlQuery, { plan, executionSteps, overallStatus });

  return {
    query: structuredQuery,
    plan,
    execution: executionSteps,
    finalAnswer,
    evidence,
    overallStatus
  };
}
