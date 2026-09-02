import { Download } from "lucide-react";
import { AnalysisResult } from "../types/index.js";

interface ResultPanelProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

export function ResultPanel({ result, isLoading }: ResultPanelProps) {
  const detectStep = result?.execution.find(e => e.stepId.includes('detect_buildings'));
  const detectData = detectStep?.toolResult?.data as any;

  const changeStep = result?.execution.find(e => e.stepId.includes('detect_change'));
  const changeData = changeStep?.toolResult?.data as any;

  const vegChangeStep = result?.execution.find(e => e.stepId.includes('detect_vegetation_change'));

  const featureSearchStep = result?.execution.find(e => e.stepId.includes('search_features') || e.stepId.includes('search_target_features'));
  const featureSearchData = featureSearchStep?.toolResult?.data as any;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tool Outputs & Evidence</label>
        {result && (
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "satquery-evidence.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
          >
            <Download size={14} />
            Export Evidence
          </button>
        )}
      </div>
      
      {!result && !isLoading && (
         <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center opacity-60 h-32 mt-4">
           <span className="text-xs font-medium text-slate-400 italic text-center">Final answer and evidence generation will appear here upon plan completion.</span>
         </div>
      )}

      {isLoading && (
         <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center opacity-60 h-32 mt-4">
           <span className="text-xs font-medium text-slate-400 animate-pulse text-center">Generating plan and awaiting results...</span>
         </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <p className="text-sm text-slate-900 leading-relaxed mb-4 pb-4 border-b border-slate-200/50">
               {result.finalAnswer}
            </p>
            {result.execution.find(e => e.stepId.includes('resolve_aoi')) && (
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Area of Interest</h4>
                {(() => {
                  const aoiStep = result.execution.find(e => e.stepId.includes('resolve_aoi'));
                  const aoiData = aoiStep?.toolResult?.data as any;
                  if (aoiStep?.executionState === 'SUCCESS' && aoiData) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Status:</span>
                          <span className="text-emerald-600 font-bold">VERIFIED</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Resolved:</span>
                          <span className="truncate max-w-[200px]" title={aoiData.label}>{aoiData.label}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Provider:</span>
                          <span>{aoiData.provider}</span>
                        </div>
                      </div>
                    );
                  } else if (aoiStep?.executionState === 'AMBIGUOUS') {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                        <span className="font-bold">Status: AMBIGUOUS</span>
                        <p className="mt-1">Multiple locations matched the requested place name. Please specify the location.</p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800">
                        <span className="font-bold">Status: {aoiStep?.executionState}</span>
                        <p className="mt-1">Area of interest could not be resolved from the geographic provider.</p>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

                        
            {(() => {
               const imageryStep = result.execution.find(e => e.toolResult?.toolName === 'getSatelliteImagery');
               const rasterStep = result.execution.find(e => e.toolResult?.toolName === 'processRasterWindow');
               const imageryData = imageryStep?.toolResult?.data as any;
               const rasterData = rasterStep?.toolResult?.data as any;
               
               if (!imageryStep && !rasterStep) return null;
               
               return (
                 <div className="mb-4 pb-4 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Raster Window Processing</h4>
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                       <div className="flex justify-between">
                          <span className="font-medium">Raster Asset Identified:</span>
                          <span className={imageryStep?.executionState === 'SUCCESS' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-bold'}>
                             {imageryStep?.executionState === 'SUCCESS' ? '✓ Identified' : '○ Pending'}
                          </span>
                       </div>
                       <div className="flex justify-between">
                          <span className="font-medium">Raster Accessible:</span>
                          <span className={imageryData?.imageryAssets?.length > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400 font-bold'}>
                             {imageryData?.imageryAssets?.length > 0 ? '✓ Accessible' : '○ Unknown'}
                          </span>
                       </div>
                       
                       {rasterStep && (
                         <>
                           <div className="flex justify-between">
                              <span className="font-medium">AOI/Raster Overlap:</span>
                              <span className={rasterStep.executionState === 'SUCCESS' && rasterData?.pixelWindow ? 'text-emerald-600 font-bold' : (rasterStep.executionState === 'SUCCESS' && rasterData === null ? 'text-amber-600 font-bold' : 'text-slate-400 font-bold')}>
                                 {rasterStep.executionState === 'SUCCESS' ? (rasterData?.pixelWindow ? '✓ Overlap Confirmed' : '○ No Overlap') : '○ Pending'}
                              </span>
                           </div>
                           {rasterStep.executionState === 'SUCCESS' && rasterData && (
                             <>
                               <div className="flex justify-between">
                                  <span className="font-medium">Pixel Window Calculated:</span>
                                  <span className="text-emerald-600 font-bold">✓ Calculated</span>
                               </div>
                               <div className="flex justify-between">
                                  <span className="font-medium">Pixel Window Extracted:</span>
                                  <span className="text-emerald-600 font-bold">✓ Extracted</span>
                               </div>
                               <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] space-y-1 text-slate-500">
                                  <div className="flex justify-between"><span className="font-bold">Raster ID:</span> <span>{rasterData.rasterId}</span></div>
                                  <div className="flex justify-between"><span className="font-bold">Asset Key:</span> <span>{rasterData.assetKey}</span></div>
                                  <div className="flex justify-between"><span className="font-bold">Original Dim:</span> <span>{rasterData.width} x {rasterData.height}</span></div>
                                  {rasterData.dataType && <div className="flex justify-between"><span className="font-bold">Data Type:</span> <span>{rasterData.dataType}</span></div>}
                                  {rasterData.nodata !== undefined && rasterData.nodata !== null && <div className="flex justify-between"><span className="font-bold">NoData:</span> <span>{rasterData.nodata}</span></div>}
                                  <div className="flex justify-between"><span className="font-bold">Bands:</span> <span>{rasterData.bandCount}</span></div>
                                  <div className="flex justify-between"><span className="font-bold">CRS:</span> <span>{rasterData.crs}</span></div>
                                  <div className="flex justify-between"><span className="font-bold">Window Dim:</span> <span>{rasterData.pixelWindow.width} x {rasterData.pixelWindow.height}</span></div>
                               </div>
                             </>
                           )}
                           {rasterStep.executionState === 'SKIPPED' && (
                             <div className="mt-2 text-slate-500 italic">Raster extraction skipped due to upstream failure.</div>
                           )}
                           {rasterStep.executionState === 'FAILED' && (
                             <div className="mt-2 text-rose-600 font-medium">{rasterStep.message}</div>
                           )}
                         </>
                       )}
                    </div>
                 </div>
               );
            })()}

            {(() => {
               const analysisStep = result.execution.find(e => e.toolResult?.toolName === 'analyzeRasterPixels');
               if (!analysisStep) return null;
               
               const aData = analysisStep.toolResult?.data as any;
               const state = analysisStep.executionState;
               
               let statusText = "";
               let statusClass = "";
               if (state === "SUCCESS" && aData?.status === "SUCCESS") { statusText = "✓ VERIFIED"; statusClass = "text-emerald-600"; }
               else if (state === "SUCCESS" && aData?.status === "NO VALID PIXELS") { statusText = "○ NO VALID PIXELS"; statusClass = "text-amber-500"; }
               else if (state === "NOT_IMPLEMENTED") { statusText = "⚠ NOT IMPLEMENTED"; statusClass = "text-amber-600"; }
               else if (state === "FAILED") { statusText = "✕ FAILED"; statusClass = "text-rose-600"; }
               else if (state === "SKIPPED") { statusText = "↪ SKIPPED"; statusClass = "text-slate-400"; }
               else { statusText = state; statusClass = "text-slate-600"; }

               return (
                 <div className="mb-4 pb-4 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Raster Analysis</h4>
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                       <div className="flex justify-between font-medium">
                          <span>Analysis Status:</span>
                          <span className={`font-bold ${statusClass}`}>{statusText}</span>
                       </div>
                       
                       {aData && aData.status === "SUCCESS" && (
                         <>
                           <div className="flex justify-between">
                              <span className="font-bold">Total Pixels:</span>
                              <span>{aData.totalPixels}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Valid Pixels:</span>
                              <span>{aData.totalValidPixels}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">NoData Pixels:</span>
                              <span>{aData.totalNoDataPixels}</span>
                           </div>
                           
                           {aData.bands && aData.bands.map((b: any) => (
                             <div key={b.bandIndex} className="mt-2 pt-2 border-t border-slate-100">
                               <div className="font-bold mb-1">Band {b.bandIndex} {b.bandName ? `(${b.bandName})` : ""}</div>
                               <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                 <div className="flex justify-between"><span>Min:</span> <span>{b.minimum !== null ? b.minimum.toFixed(4) : "N/A"}</span></div>
                                 <div className="flex justify-between"><span>Max:</span> <span>{b.maximum !== null ? b.maximum.toFixed(4) : "N/A"}</span></div>
                                 <div className="flex justify-between"><span>Mean:</span> <span>{b.mean !== null ? b.mean.toFixed(4) : "N/A"}</span></div>
                                 <div className="flex justify-between"><span>Sum:</span> <span>{b.sum !== null ? b.sum.toFixed(4) : "N/A"}</span></div>
                                 <div className="flex justify-between"><span>Std Dev:</span> <span>{b.standardDeviation !== null ? b.standardDeviation.toFixed(4) : "N/A"}</span></div>
                               </div>
                             </div>
                           ))}
                           <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <div className="flex justify-between"><span>Method:</span> <span>{aData.analysisMethod}</span></div>
                           </div>
                         </>
                       )}
                    </div>
                 </div>
               );
            })()}

            {(() => {
               const featureStep = result.execution.find(e => e.toolResult?.toolName === 'analyzeRasterFeatures');
               if (!featureStep) return null;
               
               const fData = featureStep.toolResult?.data as any;
               const state = featureStep.executionState;
               
               let statusText = "";
               let statusClass = "";
               if (state === "SUCCESS" && fData?.status === "SUCCESS") { statusText = "✓ VERIFIED"; statusClass = "text-emerald-600"; }
               else if (state === "SUCCESS" && fData?.status === "NO VALID PIXELS") { statusText = "○ NO VALID PIXELS"; statusClass = "text-amber-500"; }
               else if (state === "NOT_IMPLEMENTED") { statusText = "⚠ NOT IMPLEMENTED"; statusClass = "text-amber-600"; }
               else if (state === "FAILED") { statusText = "✕ FAILED"; statusClass = "text-rose-600"; }
               else if (state === "SKIPPED") { statusText = "↪ SKIPPED"; statusClass = "text-slate-400"; }
               else { statusText = state; statusClass = "text-slate-600"; }
               
               return (
                 <div className="mb-4 pb-4 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Raster Feature Analysis</h4>
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                       <div className="flex justify-between font-medium">
                          <span>Analysis Status:</span>
                          <span className={`font-bold ${statusClass}`}>{statusText}</span>
                       </div>
                       
                       {fData && fData.status === "SUCCESS" && (
                         <>
                           <div className="flex justify-between">
                              <span className="font-bold">Analysis Type:</span>
                              <span>{fData.analysisType}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Method:</span>
                              <span>{fData.method}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Total Pixels:</span>
                              <span>{fData.totalPixelCount}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Valid Pixels:</span>
                              <span>{fData.validPixelCount}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">NoData Pixels:</span>
                              <span>{fData.nodataPixelCount}</span>
                           </div>
                           
                           {fData.parameters && (
                             <div className="mt-2 pt-2 border-t border-slate-100">
                               <div className="font-bold mb-1">Parameters</div>
                               <div className="flex justify-between text-[10px]"><span>Bands:</span> <span>{fData.parameters.redBand}, {fData.parameters.nirBand}</span></div>
                             </div>
                           )}

                           {fData.classes && fData.classes.length > 0 && (
                             <div className="mt-2 pt-2 border-t border-slate-100">
                               <div className="font-bold mb-1">Threshold Classes</div>
                               {fData.classes.map((cls: any, i: number) => (
                                 <div key={i} className="mb-2 last:mb-0">
                                    <div className="flex justify-between font-medium"><span>{cls.className}:</span> <span>{cls.threshold}</span></div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pl-2 border-l-2 border-slate-100 mt-1">
                                       <div className="flex justify-between"><span>Pixels:</span> <span>{cls.pixelCount}</span></div>
                                       <div className="flex justify-between"><span>Area:</span> <span>{cls.areaSquareMeters ? (cls.areaSquareMeters).toFixed(2) + ' sq m' : 'N/A'}</span></div>
                                       <div className="flex justify-between col-span-2"><span>Percentage:</span> <span>{cls.percentage ? cls.percentage.toFixed(2) + '%' : '0%'}</span></div>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </>
                       )}
                       {featureStep.toolResult?.evidence && featureStep.toolResult.evidence.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="font-bold mb-1">Evidence</div>
                            {featureStep.toolResult.evidence.map((ev: any, idx: number) => (
                              <div key={idx} className="text-[10px] text-slate-500 mb-1">
                                <div><span className="font-medium text-slate-600">Source:</span> {ev.source}</div>
                                <div><span className="font-medium text-slate-600">Operation:</span> {ev.operation}</div>
                                <div><span className="font-medium text-slate-600">Provenance:</span> {ev.provenance}</div>
                              </div>
                            ))}
                          </div>
                       )}
                    </div>
                 </div>
               );
            })()}

            {(() => {
               const objectStep = result.execution.find(e => e.toolResult?.toolName === 'detectObjects' || e.toolResult?.toolName === 'detectBuildings');
               if (!objectStep) return null;
               
               const oData = objectStep.toolResult?.data as any;
               const state = objectStep.executionState;
               const infStatus = oData?.inferenceStatus || state;
               
               let statusText = "";
               let statusClass = "";
               if (state === "SUCCESS" && oData?.totalObjects > 0) { statusText = "✓ SUCCESS (REAL INFERENCE)"; statusClass = "text-emerald-600"; }
               else if (state === "SUCCESS" && oData?.totalObjects === 0) { statusText = "○ NO_DETECTIONS"; statusClass = "text-amber-600"; }
               else if (state === "NOT_IMPLEMENTED" || infStatus === "NOT_IMPLEMENTED") { statusText = "⚠ NOT_IMPLEMENTED"; statusClass = "text-amber-600"; }
               else if (state === "FAILED" || infStatus === "FAILED") { statusText = "✕ FAILED"; statusClass = "text-rose-600"; }
               else if (infStatus === "INCOMPATIBLE") { statusText = "⊘ INCOMPATIBLE"; statusClass = "text-rose-500"; }
               else if (state === "SKIPPED") { statusText = "↪ SKIPPED"; statusClass = "text-slate-400"; }
               else { statusText = state; statusClass = "text-slate-600"; }
               
               return (
                 <div className="mb-4 pb-4 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Object Detection (Real Inference)</h4>
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                       <div className="flex justify-between font-medium">
                          <span>Inference Status:</span>
                          <span className={`font-bold ${statusClass}`}>{statusText}</span>
                       </div>
                       
                       {oData && state === "SUCCESS" && (
                         <>
                           <div className="flex justify-between">
                              <span className="font-bold">Model:</span>
                              <span>{oData.model || "External ML Model"} {oData.modelVersion ? `v${oData.modelVersion}` : ""}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Total Detections:</span>
                              <span className="font-semibold">{oData.totalObjects ?? 0}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Confidence Threshold:</span>
                              <span>{oData.confidenceThreshold !== undefined ? `${(oData.confidenceThreshold * 100).toFixed(0)}%` : "40%"}</span>
                           </div>
                           {oData.inputRaster && (
                             <div className="flex justify-between">
                                <span className="font-bold">Input Raster:</span>
                                <span className="truncate max-w-[180px]" title={oData.inputRaster}>{oData.inputRaster}</span>
                             </div>
                           )}
                           
                           {oData.objectsByClass && Object.keys(oData.objectsByClass).length > 0 && (
                             <div className="mt-2 pt-2 border-t border-slate-100">
                               <div className="font-bold mb-1">Detections by Class</div>
                               {Object.entries(oData.objectsByClass).map(([cls, count], i: number) => (
                                 <div key={i} className="flex justify-between">
                                    <span>{cls}:</span> <span>{String(count)}</span>
                                 </div>
                               ))}
                             </div>
                           )}
                         </>
                       )}
                       {state === 'NOT_IMPLEMENTED' || infStatus === 'NOT_IMPLEMENTED' ? (
                          <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-2 rounded">
                             <div className="font-bold mb-1 border-b border-amber-200 pb-1">Inference Diagnostics</div>
                             <div><span className="font-medium">Reason:</span> No external inference endpoint configured (INFERENCE_API_URL).</div>
                             <div className="italic mt-1">Real building detection safely bypassed to prevent synthetic hallucination.</div>
                          </div>
                       ) : state === 'FAILED' ? (
                          <div className="mt-2 text-[10px] text-rose-700 bg-rose-50 p-2 rounded">
                             <div className="font-bold mb-1 border-b border-rose-200 pb-1">Inference Diagnostics</div>
                             <div><span className="font-medium">Reason:</span> {oData?.processingMetadata?.error || objectStep.toolResult?.message || "Inference execution failed."}</div>
                          </div>
                       ) : objectStep.toolResult?.message && state !== 'SUCCESS' ? (
                          <div className="mt-2 text-[10px] text-slate-600 italic">
                             {objectStep.toolResult.message}
                          </div>
                       ) : null}
                       {objectStep.toolResult?.evidence && objectStep.toolResult.evidence.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="font-bold mb-1">Evidence</div>
                            {objectStep.toolResult.evidence.map((ev: any, idx: number) => (
                              <div key={idx} className="text-[10px] text-slate-500 mb-1">
                                <div><span className="font-medium text-slate-600">Source:</span> {ev.source}</div>
                                <div><span className="font-medium text-slate-600">Operation:</span> {ev.operation}</div>
                                <div><span className="font-medium text-slate-600">Provenance:</span> {ev.provenance}</div>
                              </div>
                            ))}
                          </div>
                       )}
                    </div>
                 </div>
               );
            })()}



            {(() => {
               const ndviStep = result.execution.find(e => e.toolResult?.toolName === 'calculateNDVI');
               if (!ndviStep) return null;
               
               const nData = ndviStep.toolResult?.data as any;
               const state = ndviStep.executionState;
               
               let statusText = "";
               let statusClass = "";
               if (state === "SUCCESS" && nData?.status === "SUCCESS") { statusText = "✓ VERIFIED"; statusClass = "text-emerald-600"; }
               else if (state === "SUCCESS" && nData?.status === "NO VALID PIXELS") { statusText = "○ NO VALID PIXELS"; statusClass = "text-amber-500"; }
               else if (state === "NOT_IMPLEMENTED") { statusText = "⚠ NOT IMPLEMENTED"; statusClass = "text-amber-600"; }
               else if (state === "FAILED") { statusText = "✕ FAILED"; statusClass = "text-rose-600"; }
               else if (state === "SKIPPED") { statusText = "↪ SKIPPED"; statusClass = "text-slate-400"; }
               else { statusText = state; statusClass = "text-slate-600"; }

               return (
                 <div className="mb-4 pb-4 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">NDVI Analysis</h4>
                    <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                       <div className="flex justify-between font-medium">
                          <span>Analysis Status:</span>
                          <span className={`font-bold ${statusClass}`}>{statusText}</span>
                       </div>
                       
                       {nData && nData.status === "SUCCESS" && (
                         <>
                           <div className="flex justify-between">
                              <span className="font-bold">RED Band:</span>
                              <span>Band {nData.redBand?.index} {nData.redBand?.name ? `(${nData.redBand.name})` : ""}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">NIR Band:</span>
                              <span>Band {nData.nirBand?.index} {nData.nirBand?.name ? `(${nData.nirBand.name})` : ""}</span>
                           </div>
                           <div className="flex justify-between mt-2">
                              <span className="font-bold">Valid Pixels:</span>
                              <span>{nData.validPixelCount}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="font-bold">Invalid Pixels:</span>
                              <span>{nData.invalidPixelCount}</span>
                           </div>
                           
                           <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                              <div className="flex justify-between"><span>Min NDVI:</span> <span>{nData.minimum !== null ? nData.minimum.toFixed(4) : "N/A"}</span></div>
                              <div className="flex justify-between"><span>Max NDVI:</span> <span>{nData.maximum !== null ? nData.maximum.toFixed(4) : "N/A"}</span></div>
                              <div className="flex justify-between"><span>Mean NDVI:</span> <span>{nData.mean !== null ? nData.mean.toFixed(4) : "N/A"}</span></div>
                              <div className="flex justify-between"><span>Median NDVI:</span> <span>{nData.median !== null ? nData.median.toFixed(4) : "N/A"}</span></div>
                              <div className="flex justify-between"><span>Std Dev:</span> <span>{nData.standardDeviation !== null ? nData.standardDeviation.toFixed(4) : "N/A"}</span></div>
                           </div>
                           
                           <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <div className="flex justify-between"><span>Method:</span> <span>{nData.analysisMethod}</span></div>
                           </div>
                         </>
                       )}
                    </div>
                 </div>
               );
            })()}

            {vegChangeStep && (
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Vegetation Change Analysis</h4>
                {vegChangeStep.executionState === 'NOT_IMPLEMENTED' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                     <span className="font-bold">Status: NOT_IMPLEMENTED</span>
                     <p className="mt-1">Vegetation analysis is not yet available because spectral pixel-level computation is not connected.</p>
                     <p className="mt-1 text-[10px] uppercase font-bold tracking-wider opacity-60">Agricultural mask: OSM farmland</p>
                  </div>
                ) : vegChangeStep.executionState === 'SUCCESS' ? (
                   <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                      <span className="font-bold text-emerald-600">Status: SUCCESS</span>
                   </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-xs">
                     <span className="font-medium text-slate-600">Status: {vegChangeStep.executionState}</span>
                     <p className="text-slate-500 mt-1">Vegetation change detection failed or was skipped.</p>
                  </div>
                )}
              </div>
            )}

            {changeStep && (
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Temporal Analysis</h4>
                {changeStep.executionState === 'SUCCESS' && changeData ? (
                  <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Status:</span>
                      <span className="text-emerald-600 font-bold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Baseline:</span>
                      <span>{changeData.baselineDate}</span>
                    </div>
                    <div className="flex justify-between mb-2 pb-2 border-b border-slate-100">
                      <span className="font-medium">Comparison:</span>
                      <span>{changeData.comparisonDate}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Added:</span>
                      <span className="text-rose-600 font-bold">{changeData.summary.addedCount}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Removed:</span>
                      <span className="text-blue-600 font-bold">{changeData.summary.removedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Unchanged:</span>
                      <span className="text-slate-500 font-bold">{changeData.summary.unchangedCount}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-xs">
                     <span className="font-medium text-slate-600">Status: {changeStep.executionState}</span>
                     <p className="text-slate-500 mt-1">Temporal change detection failed or was skipped due to missing baseline/comparison data.</p>
                  </div>
                )}
              </div>
            )}

            {!changeStep && detectStep && (
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Building Detection</h4>
                {detectStep.executionState === 'SUCCESS' && detectData ? (
                  <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Status:</span>
                      <span className="text-emerald-600 font-bold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Building Count:</span>
                      <span>{detectData.count}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Provider:</span>
                      <span>{detectData.source}</span>
                    </div>
                    {detectData.imageryId && (
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">Imagery ID:</span>
                        <span className="truncate max-w-[150px]" title={detectData.imageryId}>{detectData.imageryId}</span>
                      </div>
                    )}
                    {detectData.acquisitionDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Acquisition Date:</span>
                        <span>{detectData.acquisitionDate}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-xs">
                     <span className="font-medium text-slate-600">Status: {detectStep.executionState}</span>
                     <p className="text-slate-500 mt-1">Building detection infrastructure is not currently available or was skipped.</p>
                  </div>
                )}
              </div>
            )}

            {featureSearchStep && (
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Semantic Feature Search</h4>
                {featureSearchStep.executionState === 'SUCCESS' && featureSearchData ? (
                  <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Status:</span>
                      <span className="text-emerald-600 font-bold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Features Returned:</span>
                      <span>{featureSearchData.features?.length || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-xs">
                     <span className="font-medium text-slate-600">Status: {featureSearchStep.executionState}</span>
                     <p className="text-slate-500 mt-1">Semantic feature search failed or was skipped.</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {result.evidence.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center opacity-70">
                  <span className="text-xs font-medium text-slate-500 italic">No evidence generated. Tools are not implemented yet.</span>
                </div>
              ) : (
                result.evidence.map((ev, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-md">
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Tool: {ev.operation}()</span>
                          <span className="text-xs font-medium text-slate-700 mt-0.5">{ev.source}</span>
                       </div>
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ev.confidence ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                          {ev.confidence ? `${Math.round(ev.confidence * 100)}% CONF` : 'DETERMINISTIC'}
                       </span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/50">
                       <div>
                         <p className="text-[9px] text-slate-400 uppercase font-bold">Dataset</p>
                         <p className="text-[11px] font-medium">{ev.dataset}</p>
                       </div>
                       <div>
                         <p className="text-[9px] text-slate-400 uppercase font-bold">Provenance</p>
                         <p className="text-[11px] font-medium">{ev.provenance}</p>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
