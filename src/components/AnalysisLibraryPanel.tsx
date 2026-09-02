import { Activity, Play, Sparkles, MapPin } from "lucide-react";

export interface TemplateQuery {
  title: string;
  query: string;
  aoi: string;
  description: string;
  category: "Building Detection" | "Temporal Change" | "Vegetation Analytics" | "Vector GIS";
  badge: string;
}

interface AnalysisLibraryPanelProps {
  onRunTemplate: (template: TemplateQuery) => void;
}

export function AnalysisLibraryPanel({ onRunTemplate }: AnalysisLibraryPanelProps) {
  const templates: TemplateQuery[] = [
    {
      title: "Seattle Building Footprint Detection",
      query: "Detect buildings in Seattle",
      aoi: "Seattle",
      description: "Queries high-resolution aerial imagery over Seattle and executes remote computer-vision instance segmentation to output georeferenced building polygons.",
      category: "Building Detection",
      badge: "High Resolution ML"
    },
    {
      title: "Seattle Temporal Building Change (2019 - 2023)",
      query: "Detect buildings added or removed between 2019 and 2023 in Seattle",
      aoi: "Seattle",
      description: "Constructs dual temporal DAG branches across 2019 and 2023 scenes, running independent ML detection and 15m centroid distance matching.",
      category: "Temporal Change",
      badge: "Multi-Temporal DAG"
    },
    {
      title: "Pune Vegetation & NDVI Statistical Analysis",
      query: "Analyze vegetation in Pune",
      aoi: "Pune",
      description: "Retrieves multi-spectral satellite imagery, reads Red (B04) and NIR (B08) pixel arrays, and computes exact mathematical NDVI statistics (min, max, mean, median, P25, P75).",
      category: "Vegetation Analytics",
      badge: "Deterministic Math"
    },
    {
      title: "Pune Major Highway 500m Buffer & Intersection",
      query: "Find roads within 500m of Pune",
      aoi: "Pune",
      description: "Computes a 500-meter geodesic spatial buffer around Pune's AOI polygon and intersects OpenStreetMap major highway vector networks.",
      category: "Vector GIS",
      badge: "Turf.js Geodesic"
    },
    {
      title: "Pune Hospital & Infrastructure Search",
      query: "Find hospitals near Pune",
      aoi: "Pune",
      description: "Parses semantic amenity queries to search OpenStreetMap Overpass vector databases for hospital amenity nodes and polygon boundaries.",
      category: "Vector GIS",
      badge: "OSM Overpass QL"
    },
    {
      title: "Mumbai Urban Expansion Near Major Highways",
      query: "Find areas of urban expansion near major highways in Mumbai",
      aoi: "Mumbai",
      description: "Combines geocoding, optical satellite imagery discovery, OpenStreetMap highway vector search, and sub-window raster detection.",
      category: "Building Detection",
      badge: "Full Pipeline"
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-slate-50">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Pre-Configured Analysis Library
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Select pre-audited Earth Observation & vector GIS template queries to execute live DAG pipeline analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tmpl, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                  {tmpl.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">{tmpl.title}</h3>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-800">
                "{tmpl.query}"
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{tmpl.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                AOI: {tmpl.aoi}
              </span>
              <button
                onClick={() => onRunTemplate(tmpl)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3 h-3 text-blue-400" />
                Run Query
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
