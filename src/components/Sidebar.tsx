import { Compass, Database, History, PlusCircle, Settings, Activity } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold italic">S</div>
        <h1 className="text-white font-bold text-xl tracking-tight">SATQuery</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 flex flex-col">
        <button className="flex items-center gap-3 px-3 py-2 bg-blue-600/10 text-blue-400 rounded-md hover:bg-blue-600/20 transition-colors text-left">
          <span className="w-5 h-5 flex items-center justify-center opacity-70"><PlusCircle className="w-4 h-4" /></span>
          <span className="text-sm font-medium">New Query</span>
        </button>

        <div className="mt-8 mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Navigation
        </div>

        <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm text-left">
          <History className="w-4 h-4" />
          History
        </button>

        <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm text-left">
          <Database className="w-4 h-4" />
          Datasets
        </button>

        <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm text-left">
          <Activity className="w-4 h-4" />
          Analysis Library
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 p-3 rounded-lg">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">API Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-xs text-slate-300">Gemini Connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
