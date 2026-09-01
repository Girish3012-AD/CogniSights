/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { QueryInput } from './components/QueryInput.js';
import { AnalysisPanel } from './components/AnalysisPanel.js';
import { ExecutionPanel } from './components/ExecutionPanel.js';
import { ResultPanel } from './components/ResultPanel.js';
import { SATQueryMap } from './components/map/SATQueryMap.js';
import { AnalysisResult } from './types/index.js';

export default function App() {
  const [query, setQuery] = useState('');
  const [aoiQuery, setAoiQuery] = useState('Pune');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nlQuery: query, aoi: aoiQuery })
      });
      if (!res.ok) {
        let errorMessage = "An error occurred";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await res.text();
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-sm font-medium text-slate-600">Home</span>
            <span className="text-xs">/</span>
            <span className="text-sm font-medium text-slate-900">Query Explorer</span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md bg-white hover:bg-slate-50">Export Plan</button>
            <button className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors">Save Workspace</button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 p-0 overflow-hidden relative">
          
          <div className="col-span-1 md:col-span-7 flex flex-col border-r border-slate-200 p-6 space-y-6 overflow-y-auto">
            <QueryInput 
              value={query} 
              onChange={setQuery} 
              aoiValue={aoiQuery}
              onAoiChange={setAoiQuery}
              onSubmit={handleAnalyze} 
              isLoading={isLoading} 
            />

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {(result || isLoading) && (
              <section className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Query Analysis & Planning</label>
                  {isLoading ? (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 uppercase">Planning State: Active</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase">Planning State: Complete</span>
                  )}
                </div>
                {result && (
                  <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[300px]">
                    <AnalysisPanel query={result.query} execution={result.execution} />
                    <ExecutionPanel plan={result.plan} execution={result.execution} />
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="col-span-1 md:col-span-5 flex flex-col bg-slate-100 border-l border-slate-200 overflow-hidden absolute md:relative inset-0 md:inset-auto pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100 z-0">
            <div className="h-3/5 bg-slate-800 relative shrink-0">
              <SATQueryMap result={result} isLoading={isLoading} />
            </div>
            <div className="flex-1 p-6 bg-white overflow-y-auto border-t border-slate-200 h-2/5">
              <ResultPanel result={result} isLoading={isLoading} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
