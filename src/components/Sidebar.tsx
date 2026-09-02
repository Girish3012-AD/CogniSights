import { Compass, Database, History, PlusCircle, Activity } from "lucide-react";

export type SidebarTab = 'explorer' | 'history' | 'datasets' | 'library';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onNewQuery: () => void;
  historyCount?: number;
}

export function Sidebar({ activeTab, onTabChange, onNewQuery, historyCount = 0 }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen shrink-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold italic shadow-md">S</div>
        <div>
          <h1 className="text-white font-bold text-xl tracking-tight">SATQuery</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">CogniSights Engine</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2 flex flex-col">
        <button
          onClick={onNewQuery}
          className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-left shadow-sm font-semibold text-sm mb-4"
        >
          <span className="w-5 h-5 flex items-center justify-center opacity-90"><PlusCircle className="w-4 h-4" /></span>
          <span>New Query</span>
        </button>

        <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Navigation
        </div>

        <button
          onClick={() => onTabChange('explorer')}
          className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm text-left font-medium ${
            activeTab === 'explorer'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4" />
            <span>Query Explorer</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm text-left font-medium ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <History className="w-4 h-4" />
            <span>History</span>
          </div>
          {historyCount > 0 && (
            <span className="text-[10px] font-bold bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded-full">
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('datasets')}
          className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm text-left font-medium ${
            activeTab === 'datasets'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4" />
            <span>Datasets</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm text-left font-medium ${
            activeTab === 'library'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4" />
            <span>Analysis Library</span>
          </div>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">API Status</p>
            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">ONLINE</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Gemini AI Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
