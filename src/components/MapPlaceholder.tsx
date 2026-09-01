export function MapPlaceholder() {
  return (
    <div className="absolute inset-0 bg-slate-800">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            Map
          </div>
          <p className="text-xs font-mono text-slate-500">Map visualization — integration pending</p>
          <p className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-widest">AOI: Pending Query</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded border border-white/10">
        <div className="flex flex-col gap-2">
          <div className="w-6 h-6 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition-colors"></div>
          <div className="w-6 h-6 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition-colors"></div>
        </div>
      </div>
    </div>
  );
}
