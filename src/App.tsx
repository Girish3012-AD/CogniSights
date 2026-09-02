/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar, SidebarTab } from './components/Sidebar.js';
import { QueryInput } from './components/QueryInput.js';
import { AnalysisPanel } from './components/AnalysisPanel.js';
import { ExecutionPanel } from './components/ExecutionPanel.js';
import { ResultPanel } from './components/ResultPanel.js';
import { SATQueryMap } from './components/map/SATQueryMap.js';
import { HistoryPanel, HistoryItem } from './components/HistoryPanel.js';
import { DatasetsPanel } from './components/DatasetsPanel.js';
import { AnalysisLibraryPanel, TemplateQuery } from './components/AnalysisLibraryPanel.js';
import { AnalysisResult } from './types/index.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [query, setQuery] = useState('');
  const [aoiQuery, setAoiQuery] = useState('Pune');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const runAnalysis = async (targetQuery: string, targetAoi: string) => {
    if (!targetQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nlQuery: targetQuery, aoi: targetAoi })
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
      const data: AnalysisResult = await res.json();
      setResult(data);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        query: targetQuery,
        aoi: targetAoi,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: data
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    runAnalysis(query, aoiQuery);
  };

  const handleNewQuery = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setActiveTab('explorer');
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setAoiQuery(item.aoi);
    setResult(item.result);
    setError(null);
    setActiveTab('explorer');
  };

  const handleRunTemplate = (template: TemplateQuery) => {
    setQuery(template.query);
    setAoiQuery(template.aoi);
    setActiveTab('explorer');
    runAnalysis(template.query, template.aoi);
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'explorer': return 'Query Explorer';
      case 'history': return 'Analysis History';
      case 'datasets': return 'Dataset Catalog';
      case 'library': return 'Analysis Library';
      default: return 'Query Explorer';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewQuery={handleNewQuery}
        historyCount={history.length}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-sm font-medium text-slate-600">Home</span>
            <span className="text-xs">/</span>
            <span className="text-sm font-bold text-slate-900">{getBreadcrumbTitle()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewQuery}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition-colors"
            >
              + Reset Query
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              Explore Templates
            </button>
          </div>
        </header>

        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            onSelectHistory={handleSelectHistory}
            onNewQuery={handleNewQuery}
          />
        )}

        {activeTab === 'datasets' && <DatasetsPanel />}

        {activeTab === 'library' && (
          <AnalysisLibraryPanel onRunTemplate={handleRunTemplate} />
        )}

        {activeTab === 'explorer' && (
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
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {(result || isLoading) && (
                <section className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Query Analysis & Planning
                    </label>
                    {isLoading ? (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 uppercase">
                        Planning State: Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                        Planning State: Complete
                      </span>
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
        )}
      </main>
    </div>
  );
}
