import 'dotenv/config';
import { handleQuery } from '../src/server/analysis/executor.js';

async function runTest() {
  const query = process.argv[2] || "Detect buildings in Seattle";
  const aoi = process.argv[3] || "Seattle";
  console.log(`\n=== RUNNING TEST: "${query}" (AOI: ${aoi}) ===`);
  const start = Date.now();
  const res = await handleQuery(query, aoi);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`OVERALL STATUS: ${res.overallStatus} (Time: ${elapsed}s)`);
  console.log(`STEPS (${res.execution.length}):`);
  for (const s of res.execution) {
    const toolName = s.toolResult?.toolName || 'N/A';
    const msg = s.toolResult?.message || s.message || '';
    console.log(`  - [${s.executionState}] Step: ${s.stepId} | Tool: ${toolName} | Msg: ${msg}`);
  }
  console.log(`EVIDENCE COUNT: ${res.evidence.length}`);
  if (res.evidence.length > 0) {
    console.log(`EVIDENCE SAMPLE:`, JSON.stringify(res.evidence[0], null, 2));
  }
}

runTest().catch(console.error);
