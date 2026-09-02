import { History, Play, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { AnalysisResult } from "../types/index.js";

export interface HistoryItem {
  id: string;
  query: string;
  aoi: string;
  timestamp: string;
  result: AnalysisResult;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onNewQuery: () => void;
}

export function HistoryPanel({ history, onSelectHistory, onNewQuery }: HistoryPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Analysis Query History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review past geospatial queries executed during this session with full execution DAG trace and evidence audit.
          </p>
        </div>
        <button
          onClick={onNewQuery}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        >
          + New Query
        </button>
      </div>

      {history.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-white">
          <History className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No Query History Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Execute queries in the Query Explorer to automatically build your session history and auditable execution logs.
          </p>
          <button
            onClick={onNewQuery}
            className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
          >
            Start First Query
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const status = item.result.overallStatus;
            return (
              <div
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      "{item.query}"
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                        status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : status === "PARTIAL"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {status === "SUCCESS" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : status === "PARTIAL" ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                    <span><strong>AOI:</strong> {item.aoi || "Default"}</span>
                    <span><strong>Executed:</strong> {item.timestamp}</span>
                    <span><strong>Steps:</strong> {item.result.execution.length}</span>
                    <span><strong>Evidence Items:</strong> {item.result.evidence.length}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectHistory(item)}
                  className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-center"
                >
                  <Play className="w-3 h-3 text-blue-600" />
                  Load Result
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
