import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AnalysisResult } from '../../types/index.js';
import { extractMapData, MapLayer } from './utils.js';

// Component to handle automatic viewport fitting
function MapBounds({ layers, aoi }: { layers: MapLayer[], aoi: any }) {
  const map = useMap();
  
  useEffect(() => {
    const allGeoJsons = layers.filter(l => l.visible && l.geometry).map(l => l.geometry);
    if (allGeoJsons.length > 0 || aoi) {
      const group = new L.FeatureGroup();
      
      if (aoi) {
        const aoiLayer = L.geoJSON(aoi);
        group.addLayer(aoiLayer);
      }
      
      allGeoJsons.forEach(geo => {
        const layer = L.geoJSON(geo);
        group.addLayer(layer);
      });
      
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [layers, aoi, map]);

  return null;
}

export function SATQueryMap({ result, isLoading }: { result: AnalysisResult | null, isLoading: boolean }) {
  const { aoi, layers: initialLayers } = extractMapData(result);
  const [layers, setLayers] = useState<MapLayer[]>(initialLayers);

  useEffect(() => {
    setLayers(initialLayers);
  }, [result]);

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const aoiStep = result?.execution.find(e => e.stepId.includes('resolve_aoi'));
  const isFailed = result?.execution.some(e => e.executionState === 'FAILED');
  const isAmbiguous = aoiStep?.executionState === 'AMBIGUOUS';

  return (
    <div className="absolute inset-0 bg-slate-100 flex flex-col">
      
      {/* Map Area */}
      <div className="flex-1 relative">
        {(() => {
          if (!result) return null;
          const ndviStep = result.execution.find(e => e.toolResult?.toolName === 'calculateNDVI' && e.executionState === 'SUCCESS' && (e.toolResult.data as any)?.status === 'SUCCESS');
          const objectStepSuccess = result.execution.find(e => e.toolResult?.toolName === 'detectObjects' && e.executionState === 'SUCCESS' && (e.toolResult.data as any)?.status === 'SUCCESS');
          const objectStepUnavail = result.execution.find(e => e.toolResult?.toolName === 'detectObjects' && e.executionState === 'NOT_IMPLEMENTED');
          const featureStep = result.execution.find(e => e.toolResult?.toolName === 'analyzeRasterFeatures' && e.executionState === 'SUCCESS' && (e.toolResult.data as any)?.status === 'SUCCESS');
          const rasterStep = result.execution.find(e => e.toolResult?.toolName === 'analyzeRasterPixels' && e.executionState === 'SUCCESS' && (e.toolResult.data as any)?.status === 'SUCCESS');
          const satStep = result.execution.find(e => e.toolResult?.toolName === 'getSatelliteImagery' && e.executionState === 'SUCCESS');
          
          let text = "";
          if (objectStepSuccess) text = "Building detections available — map integration pending";
          else if (objectStepUnavail) text = "Building detection visualization unavailable";
          else if (featureStep) text = "Raster feature visualization — map integration pending";
          else if (ndviStep) text = "NDVI statistics available — raster visualization pending.";
          else if (rasterStep) text = "Raster statistics available — raster visualization pending.";
          else if (satStep) text = "Satellite raster visualization — pending map raster integration";
          else return null;

          return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full shadow-lg opacity-80 backdrop-blur-md">
              {text}
            </div>
          );
        })()}

        {isLoading ? (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm">
             <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
             <p className="mt-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Analyzing Geospatial Data...</p>
          </div>
        ) : (!result && layers.length === 0) ? (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-50">
             <p className="text-sm font-medium text-slate-500">Run a query to visualize geographic results.</p>
          </div>
        ) : isAmbiguous ? (
           <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-amber-50">
             <p className="text-sm font-medium text-amber-600">Location is ambiguous. No authoritative geometry is displayed.</p>
           </div>
        ) : isFailed && layers.length === 0 ? (
           <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-rose-50">
             <p className="text-sm font-medium text-rose-600">Geographic resolution failed. No result geometry is available.</p>
           </div>
        ) : null}

        <MapContainer 
          center={[20, 78]} // Default center (India roughly)
          zoom={4} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapBounds layers={layers} aoi={aoi} />

          {layers.map(layer => (
            layer.visible && layer.geometry && (
              <GeoJSON 
                key={layer.id + '_' + layer.visible} 
                pointToLayer={(feature, latlng) => {
                  return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: layer.fillColor,
                    color: layer.color,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                  });
                }} // Re-render when toggled or updated
                data={layer.geometry} 
                style={{
                  color: layer.color,
                  weight: layer.weight,
                  fillColor: layer.fillColor,
                  fillOpacity: layer.sourceTool === 'resolveAreaOfInterest' ? 0.05 : 0.4
                }}
                onEachFeature={(feature, leafletLayer) => {
                  if (feature.properties) {
                    const props = Object.entries(feature.properties)
                      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                      .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                      .join('<br/>');
                    if (props) {
                      leafletLayer.bindPopup(`<div class="text-xs max-h-48 overflow-y-auto">${props}</div>`);
                    }
                  }
                }}
              />
            )
          ))}
        </MapContainer>
      </div>

      {/* Layer Control Panel */}
      {layers.length > 0 && (
        <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-md border border-slate-200 w-64 max-h-[calc(100%-2rem)] flex flex-col">
          <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Map Layers</h3>
          </div>
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {layers.map(layer => (
              <div key={layer.id} className="flex items-center justify-between group">
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input 
                    type="checkbox" 
                    checked={layer.visible}
                    onChange={() => toggleLayer(layer.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="flex items-center gap-2 flex-1 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-sm shrink-0 border" 
                      style={{ 
                        backgroundColor: layer.sourceTool === 'resolveAreaOfInterest' ? 'transparent' : layer.fillColor, 
                        borderColor: layer.color,
                        borderWidth: layer.sourceTool === 'resolveAreaOfInterest' ? '2px' : '1px'
                      }}
                    ></span>
                    <span className="text-xs font-medium text-slate-700 truncate">{layer.name}</span>
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{layer.featureCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
