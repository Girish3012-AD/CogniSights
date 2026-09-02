import { Database, ExternalLink, ShieldCheck, Layers, Globe } from "lucide-react";

export function DatasetsPanel() {
  const datasets = [
    {
      id: "sentinel-2-l2a",
      name: "Sentinel-2 Level-2A",
      provider: "Microsoft Planetary Computer / ESA",
      type: "Multi-Spectral Satellite Imagery",
      resolution: "10m - 20m spatial resolution",
      bands: "12 Spectral Bands (B01-B12, incl. Red B04, NIR B08)",
      coverage: "Global coverage with 5-day revisit rate",
      license: "Open Data Commons / CC BY 4.0",
      url: "https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a",
      status: "ACTIVE"
    },
    {
      id: "naip",
      name: "National Agriculture Imagery Program (NAIP)",
      provider: "USDA / Microsoft Planetary Computer",
      type: "High-Resolution Aerial Orthoimagery",
      resolution: "0.6m - 1.0m spatial resolution",
      bands: "4 Bands (Red, Green, Blue, Near-Infrared)",
      coverage: "Continental United States (CONUS)",
      license: "Public Domain",
      url: "https://planetarycomputer.microsoft.com/dataset/naip",
      status: "ACTIVE"
    },
    {
      id: "osm-nominatim",
      name: "OpenStreetMap Nominatim Geocoding",
      provider: "OpenStreetMap Foundation",
      type: "Geocoding & Administrative Boundaries",
      resolution: "Global place-name & bounding box database",
      bands: "N/A (Geographic Bounding Boxes & Centroids)",
      coverage: "Global",
      license: "Open Database License (ODbL)",
      url: "https://nominatim.openstreetmap.org/",
      status: "ACTIVE"
    },
    {
      id: "osm-overpass",
      name: "OpenStreetMap Overpass Vector Features",
      provider: "OpenStreetMap Foundation",
      type: "Semantic Vector Network & Features",
      resolution: "Vector Nodes, Ways, and Polygons",
      bands: "Highways, Waterways, Amenities, Protected Areas",
      coverage: "Global",
      license: "Open Database License (ODbL)",
      url: "https://overpass-api.de/",
      status: "ACTIVE"
    },
    {
      id: "roboflow-building-ml",
      name: "Roboflow Building Instance Model",
      provider: "Remote Roboflow Inference API",
      type: "Remote Computer Vision Machine Learning Engine",
      resolution: "Pixel-level instance segmentation bounding boxes",
      bands: "RGB Base64 Tile Input",
      coverage: "Sub-window Satellite Tile Sampling",
      license: "Proprietary Remote Inference Model",
      url: "https://outline.roboflow.com/",
      status: "ACTIVE"
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-slate-50">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Geospatial & Satellite Dataset Catalog
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Connected live STAC satellite imagery catalogs, OpenStreetMap vector layers, and ML inference providers integrated into SATQuery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((ds) => (
          <div key={ds.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                  {ds.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {ds.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium">{ds.type}</p>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Provider:</span>
                  <span>{ds.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Resolution:</span>
                  <span>{ds.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Bands / Layers:</span>
                  <span className="truncate max-w-[200px]" title={ds.bands}>{ds.bands}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Coverage:</span>
                  <span>{ds.coverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">License:</span>
                  <span>{ds.license}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">ID: {ds.id}</span>
              <a
                href={ds.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Catalog Info <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
