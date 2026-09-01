import { QueryPlanStep, StepExecution } from "../types/index.js";

interface ExecutionPanelProps {
  plan: QueryPlanStep[];
  execution: StepExecution[];
}

export function ExecutionPanel({ plan, execution }: ExecutionPanelProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return 'border-emerald-500 text-emerald-500';
      case 'NOT_IMPLEMENTED': return 'border-amber-500 text-amber-500';
      case 'FAILED': return 'border-rose-500 text-rose-500';
      case 'SKIPPED': return 'border-slate-300 text-slate-400 opacity-60';
      default: return 'border-slate-200 text-slate-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return '✓';
      case 'NOT_IMPLEMENTED': return <div className="w-2 h-2 bg-amber-500 rounded-full mx-auto" />;
      case 'FAILED': return '!';
      case 'SKIPPED': return '⊘';
      default: return '-';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-y-auto">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Execution Plan</p>
      <div className="space-y-2">
        {plan.map((step, idx) => {
          const exec = execution.find(e => e.stepId === step.id);
          const state = exec?.executionState;
          const colorClass = getStatusColor(state);
          const isPending = !exec || state === 'PENDING' || state === 'RUNNING';

          return (
            <div key={step.id} className={`flex items-center justify-between gap-3 py-1.5 border-l-2 pl-3 ${colorClass} ${state === 'SKIPPED' ? 'grayscale' : ''}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="w-4 shrink-0 text-center text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {getStatusIcon(state)}
                </div>
                <div className="flex flex-col w-full">
                  <div className={`text-[11px] ${isPending ? 'opacity-50 italic text-slate-500' : (state === 'SKIPPED' ? 'line-through text-slate-500' : 'font-medium text-slate-900')}`}>
                    <span className="text-slate-400 mr-2">{idx + 1}.</span>
                    {step.description}
                  </div>
                  {step.dependsOn && step.dependsOn.length > 0 && (
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      ↳ Depends on: {step.dependsOn.join(', ')}
                    </div>
                  )}
                  {exec?.message && state !== 'SUCCESS' && (
                    <div className="text-[9px] text-slate-500 mt-1 italic">
                      {exec.message}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 hidden sm:block shrink-0">
                 {step.toolName}()
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
