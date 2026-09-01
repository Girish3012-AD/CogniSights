import { RasterAsset, RasterMetadata, ImageryMetadata, Evidence } from "../../types/index.js";

// We want to select optical imagery bands or the visual rendering.
const PREFERRED_ASSET_KEYS = ["visual", "rendered_preview", "B04", "B08", "image"];

export async function processRasterAssets(
  stacFeatures: any[]
): Promise<{ assets: RasterAsset[], metadata: RasterMetadata[], evidence: Evidence[], errors: string[] }> {
  const assets: RasterAsset[] = [];
  const metadata: RasterMetadata[] = [];
  const evidence: Evidence[] = [];
  const errors: string[] = [];

  for (const feature of stacFeatures) {
    if (!feature.assets) continue;

    let selectedAssetKey: string | null = null;
    let selectedAssetInfo: any = null;

    // 1. Try to find a preferred asset
    for (const key of PREFERRED_ASSET_KEYS) {
      if (feature.assets[key]) {
        // Must be some kind of image or tiff
        const type = feature.assets[key].type || "";
        if (type.includes("image/tiff") || type.includes("image/jp2") || type.includes("application/x-hdf5")) {
          selectedAssetKey = key;
          selectedAssetInfo = feature.assets[key];
          break;
        }
      }
    }

    // 2. Fallback to any georeferenced raster asset if none of preferred found
    if (!selectedAssetKey) {
      for (const [key, assetInfo] of Object.entries<any>(feature.assets)) {
         const type = assetInfo.type || "";
         if (type.includes("image/tiff") || type.includes("image/jp2") || type.includes("application/x-hdf5")) {
           selectedAssetKey = key;
           selectedAssetInfo = assetInfo;
           break;
         }
      }
    }

    if (!selectedAssetKey || !selectedAssetInfo) continue;

    // 3. MPC SAS Token Signing
    let signedHref = selectedAssetInfo.href;
    try {
      const signUrl = `https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=${encodeURIComponent(selectedAssetInfo.href)}`;
      const signRes = await fetch(signUrl);
      if (signRes.ok) {
        const signData = await signRes.json() as any;
        if (signData && signData.href) {
          signedHref = signData.href;
        }
      } else {
        errors.push(`Failed to sign asset ${selectedAssetKey} for item ${feature.id}`);
        continue;
      }
    } catch (e: any) {
      errors.push(`SAS sign error: ${e.message}`);
      continue;
    }

    // 4. Validate Asset Access
    try {
      // Use HEAD request to validate if the raster asset is actually accessible without downloading it
      const accessRes = await fetch(signedHref, { method: 'HEAD' });
      if (!accessRes.ok) {
         errors.push(`Raster asset ${selectedAssetKey} for item ${feature.id} returned HTTP ${accessRes.status} on access test`);
         continue;
      }
    } catch (e: any) {
      errors.push(`Raster access test error for ${feature.id}: ${e.message}`);
      continue;
    }

    // 5. Build RasterAsset descriptor
    const rAsset: RasterAsset = {
      id: `${feature.id}_${selectedAssetKey}`,
      itemId: feature.id,
      collection: feature.collection,
      assetKey: selectedAssetKey,
      href: signedHref,
      mediaType: selectedAssetInfo.type,
      roles: selectedAssetInfo.roles,
      platform: feature.properties?.platform,
      acquisitionDate: feature.properties?.datetime,
      bbox: feature.bbox,
      geometry: feature.geometry,
      bands: selectedAssetInfo['eo:bands']?.map((b: any) => b.name) || undefined,
      source: "Microsoft Planetary Computer",
      provenance: `STAC Item ${feature.id} / Asset ${selectedAssetKey}`
    };
    assets.push(rAsset);

    // 6. Extract RasterMetadata natively from STAC asset metadata (if provided by MPC)
    // We avoid doing a full GDAL/geotiff read for now to keep it lightweight, pulling directly from provider STAC metadata
    const projShape = selectedAssetInfo['proj:shape']; // [height, width]
    const projTransform = selectedAssetInfo['proj:transform']; // 6 element array
    const projEpsg = selectedAssetInfo['proj:epsg'];
    const rasterBands = selectedAssetInfo['raster:bands'] || feature.properties?.['raster:bands'];

    const rMeta: RasterMetadata = {
       width: projShape ? projShape[1] : null,
       height: projShape ? projShape[0] : null,
       crs: projEpsg ? `EPSG:${projEpsg}` : null,
       transform: projTransform || null,
       bounds: feature.bbox || null,
       bandCount: selectedAssetInfo['eo:bands'] ? selectedAssetInfo['eo:bands'].length : (rasterBands ? rasterBands.length : null),
       bandNames: selectedAssetInfo['eo:bands']?.map((b: any) => b.name) || null,
       dataType: rasterBands && rasterBands[0] ? rasterBands[0].data_type : null,
       nodata: rasterBands && rasterBands[0] ? rasterBands[0].nodata : null,
       resolution: rasterBands && rasterBands[0] ? rasterBands[0].spatial_resolution : null,
       fileFormat: selectedAssetInfo.type || null
    };
    metadata.push(rMeta);

    // 7. Push evidence
    evidence.push({
      source: "Microsoft Planetary Computer",
      dataset: `Raster Asset: ${feature.collection || 'unknown'} / ${selectedAssetKey}`,
      date: feature.properties?.datetime || new Date().toISOString().split('T')[0],
      operation: "raster_asset_access",
      confidence: null,
      provenance: rAsset.provenance
    });
  }

  return { assets, metadata, evidence, errors };
}
