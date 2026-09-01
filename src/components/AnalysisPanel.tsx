import { StructuredQuery } from "../types/index.js";

import { StepExecution } from "../types/index.js";
export function AnalysisPanel({ query, execution }: { query: StructuredQuery, execution?: StepExecution[] }) {
  const aoiStep = execution?.find(e => e.stepId.includes('resolve_aoi'));
  const aoiData = aoiStep?.toolResult?.data as any;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-y-auto">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Structured Understanding</p>
      
      <div className="space-y-3">
        <div className="flex justify-between border-b border-slate-200 pb-1">
          <span className="text-xs text-slate-500">Intent</span>
          <span className="text-xs font-semibold text-blue-600 capitalize text-right max-w-[60%] truncate" title={query.intent}>{query.intent}</span>
        </div>

        <div className="flex justify-between border-b border-slate-200 pb-1">
          <span className="text-xs text-slate-500">Target</span>
          <span className="text-xs font-semibold capitalize">{query.target}</span>
        </div>
        
                {query.changeType && (
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-xs text-slate-500">Change Type</span>
            <span className="text-xs font-semibold text-rose-600 capitalize">{query.changeType.replace(/_/g, ' ')}</span>
          </div>
        )}
        
        {query.threshold !== undefined && query.threshold !== null && (
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-xs text-slate-500">Threshold</span>
            <span className="text-xs font-semibold">
              {query.operator === 'GREATER_THAN' ? '> ' : query.operator === 'LESS_THAN' ? '< ' : ''}
              {(query.threshold * 100).toFixed(0)}%
            </span>
          </div>
        )}

        <div className="flex justify-between border-b border-slate-200 pb-1">
          <span className="text-xs text-slate-500">Operation</span>
          <span className="text-xs font-semibold capitalize">{query.operation.replace(/_/g, ' ')}</span>
        </div>

        {(query.timeRange?.start || query.timeRange?.end) && (
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-xs text-slate-500">Temporal</span>
            <span className="text-xs font-semibold">
              {query.timeRange?.start || '*'} — {query.timeRange?.end || '*'}
            </span>
          </div>
        )}

        {query.location && (
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-xs text-slate-500">Location</span>
            <span className="text-xs font-semibold max-w-[60%] text-right truncate">
               {query.location.name || (query.location.coordinates ? query.location.coordinates.join(', ') : 'Not specified')}
            </span>
          </div>
        )}

        {query.spatialConstraint && Object.keys(query.spatialConstraint).length > 0 && (
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-xs text-slate-500">Spatial</span>
            <span className="text-xs font-semibold max-w-[60%] text-right truncate">
               {[query.spatialConstraint.relation, query.spatialConstraint.distance, query.spatialConstraint.referenceFeature].filter(Boolean).join(' ')}
            </span>
          </div>
        )}
      </div>

      {aoiStep && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Area of Interest</p>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-xs text-slate-500">Requested</span>
              <span className="text-xs font-semibold capitalize max-w-[60%] text-right truncate">{query.areaOfInterest?.label || query.location?.name || 'Not specified'}</span>
            </div>
            {aoiData && (
              <>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs text-slate-500">Resolved</span>
                  <span className="text-xs font-semibold max-w-[60%] text-right truncate" title={aoiData.label}>{aoiData.label}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs text-slate-500">Feature Type</span>
                  <span className="text-xs font-semibold capitalize">{aoiData.featureType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs text-slate-500">Bounding Box</span>
                  <span className="text-[10px] font-mono text-slate-600">
                    [{aoiData.bbox?.map((n: number) => n.toFixed(2)).join(', ')}]
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs text-slate-500">Provider</span>
                  <span className="text-xs font-semibold">{aoiData.provider}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-xs text-slate-500">Status</span>
              <span className={`text-xs font-bold ${
                aoiStep.executionState === 'SUCCESS' ? 'text-emerald-600' :
                aoiStep.executionState === 'AMBIGUOUS' ? 'text-amber-600' :
                'text-rose-600'
              }`}>
                {aoiStep.executionState === 'SUCCESS' ? 'VERIFIED' : aoiStep.executionState}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
