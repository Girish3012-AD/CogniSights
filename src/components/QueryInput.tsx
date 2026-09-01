import { Search, Sparkles } from "lucide-react";

interface QueryInputProps {
  aoiValue?: string;
  onAoiChange?: (val: string) => void;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const EXAMPLES = [
  { label: "New Buildings", text: "Find new buildings within 2 km of major roads between 2020 and 2026." },
  { label: "Vegetation Loss", text: "Find agricultural areas with vegetation loss greater than 30% between 2019 and 2026." },
  { label: "Urban Expansion", text: "Find areas of urban expansion near major highways." },
  { label: "Deforestation", text: "Find deforestation within 5 km of protected areas." }
];

export function QueryInput({ value, onChange, aoiValue, onAoiChange, onSubmit, isLoading }: QueryInputProps) {
  return (
    <section className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Analysis Area</label>
        <input 
          type="text"
          value={aoiValue || ''}
          onChange={(e) => onAoiChange?.(e.target.value)}
          placeholder="e.g. Pune, India or [minLon, minLat, maxLon, maxLat]"
          className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white shadow-sm text-sm outline-none focus:border-blue-500 transition-colors"
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Natural Language Query</label>
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your geospatial question..."
          className="w-full p-4 pb-14 border border-slate-200 rounded-xl bg-white shadow-sm text-sm leading-relaxed outline-none ring-2 ring-transparent group-focus-within:ring-blue-500/20 group-focus-within:border-blue-500 transition-all resize-none h-32 text-slate-900"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          className="absolute right-4 bottom-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Analyze</span>
          )}
        </button>
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => onChange(ex.text)}
            className="text-[10px] text-slate-500 font-medium py-1 px-2 bg-slate-100 rounded uppercase cursor-pointer hover:bg-slate-200 transition-colors text-left"
          >
            {ex.label}
          </button>
        ))}
      </div>
          </div>
    </section>
  );
}
