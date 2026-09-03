import { handleQuery } from '../src/server/analysis/executor.js';

async function run() {
  process.stdout.write('--- TEST: Pune Vegetation (NDVI) ---\n');
  try {
    const res = await handleQuery('Analyze vegetation in Pune', 'Pune');
    process.stdout.write('STATUS: ' + res.overallStatus + '\n');
    process.stdout.write('STEPS: ' + res.execution.length + '\n');
    for (const s of res.execution) {
      const tool = (s.toolResult as any)?.toolName || (s as any).toolName || 'N/A';
      const msg = ((s.toolResult as any)?.message || (s as any).message || '').substring(0, 150);
      process.stdout.write('  Step: ' + s.stepId + ' | Tool: ' + tool + ' | State: ' + s.executionState + '\n');
      process.stdout.write('    Msg: ' + msg + '\n');
    }
  } catch (e: any) {
    process.stdout.write('ERROR: ' + e.message + '\n');
  }
}

run().then(() => {
  process.stdout.write('DONE\n');
  process.exit(0);
}).catch((e) => {
  process.stdout.write('FATAL: ' + e.message + '\n');
  process.exit(1);
});
