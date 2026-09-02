# CogniSights / SATQuery: Comprehensive Technical Judge Defense & Q&A Guide

**Natural-Language Earth Observation Analysis with Deterministic Geospatial Execution**

---

## 1. 30-Second Project Answer

### "What is CogniSights?"

> CogniSights is an Earth Observation and GIS intelligence system that translates natural-language queries into automated analytical workflows. It uses an **LLM–Deterministic Sandwich** architecture: an LLM (Gemini 3.6 Flash) converts user prompts into structured JSON schemas, but all spatial buffering, geocoding, STAC satellite catalog discovery, GeoTIFF raster windowing, NDVI pixel math, and remote ML building detections are executed strictly by deterministic software. Every query generates an auditable JSON evidence report linking directly to STAC Item IDs, satellite pass timestamps, and model URIs.

---

## 2. Core Architecture Questions

### Q1: Why use an LLM at all?
**Answer**: Standard GIS tools require complex Python scripts, manual UI clicks, or SQL spatial queries that lock out non-technical domain users. We use an LLM solely to bridge the natural-language interface gap by interpreting user intent into a validated structured schema (`StructuredQuery`).

### Q2: What exactly does Gemini do?
**Answer**: Gemini performs exactly two text-processing tasks:
1. `parseQueryToStructured()`: Translates the user's natural-language query and optional location name into a validated `StructuredQuery` JSON object.
2. `generateFinalAnswer()`: Synthesizes a human-readable markdown summary from the executed step results and evidence context.

### Q3: What does Gemini NOT do?
**Answer**: Gemini does **not** geocode place names, search STAC catalogs, calculate bounding boxes, read GeoTIFF pixel arrays, compute NDVI statistics, run building detection models, perform spatial geometry buffering, or calculate polygon areas.

### Q4: How do you prevent the LLM from inventing coordinates?
**Answer**: All geographic coordinates and bounding boxes are retrieved directly from OpenStreetMap Nominatim API payloads during the `resolveAreaOfInterest` execution step. Coordinates are validated using `BoundingBoxSchema` and `GeoJSONGeometrySchema` Zod contracts.

### Q5: How is the execution plan generated?
**Answer**: The deterministic `createQueryPlan()` function in `planner.ts` inspects the validated `StructuredQuery` fields (target, operation, timeRange, spatialConstraint) and constructs a directed sequence of `QueryPlanStep` objects with explicit `dependsOn` linkage.

### Q6: Why use a Directed Acyclic Graph (DAG)?
**Answer**: A DAG guarantees deterministic execution order, prevents cyclic deadlocks, enforces strict dependency input resolution, and allows downstream steps to be safely skipped if an upstream dependency fails.

### Q7: How are dependencies between analysis steps handled?
**Answer**: In `executor.ts`, each step receives a `resolvedInput` object containing `dependencyOutputs`, which collects the executed data outputs of every step listed in its `dependsOn` array.

### Q8: What happens when one dependency fails?
**Answer**: If any step listed in a step's `dependsOn` array fails to achieve `ExecutionState === "SUCCESS"`, the executor immediately marks the downstream step as `SKIPPED` with an explanatory message, preventing cascading execution errors.

### Q9: Why not let the LLM directly call APIs via tool-calling?
**Answer**: Autonomous LLM tool-calling loops can suffer from nondeterministic execution paths, unbounded tool invocation loops, unpredictable payload structures, and high latency. Our deterministic planner generates a single, verifiable, bounded DAG upfront.

### Q10: What makes the system deterministic?
**Answer**: Once the `StructuredQuery` schema is parsed, 100% of spatial data resolution, API queries, raster decoding, array calculations, coordinate projections (`proj4`), geometry math (`@turf/turf`), and evidence logging execute using pure TypeScript functions and fixed mathematical algorithms.

---

## 3. Earth Observation & Data Questions

### Q11: Where does your imagery come from?
**Answer**: Satellite imagery and aerial orthoimagery metadata are searched live from the Microsoft Planetary Computer STAC Search API (`planetarycomputer.microsoft.com/api/stac/v1`). Signed SAS tokens are generated via `planetarycomputer.microsoft.com/api/sas/v1` to stream asset tiles directly.

### Q12: What is Microsoft Planetary Computer?
**Answer**: It is a public cloud repository host providing open access to multi-petabyte satellite data catalogs (Sentinel-2, Landsat, NAIP, IO-LULC) indexed via standardized STAC metadata specifications.

### Q13: Why use STAC (SpatioTemporal Asset Catalog)?
**Answer**: STAC provides a standardized RESTful API and JSON schema for querying spatial scenes across space (bounding box) and time (ISO datetime range), enabling vendor-neutral satellite catalog integration.

### Q14: How do you select a suitable dataset?
**Answer**: `searchDatasetsProvider` queries the STAC `/collections` endpoint and ranks collections based on keyword scoring against query targets (e.g. mapping building/aerial targets to NAIP, vegetation targets to Sentinel-2, or land cover targets to IO-LULC). If no keywords match, it safely defaults to top optical catalogs (`sentinel-2-l2a`, `naip`).

### Q15: How do you verify that imagery intersects the Area of Interest (AOI)?
**Answer**: Spatial bounding boxes `[minLon, minLat, maxLon, maxLat]` derived from Nominatim geocoding are passed directly to the STAC `/search` API payload as `bbox` filter parameters.

### Q16: How do you handle different spatial resolutions?
**Answer**: Native pixel resolutions (`spatial_resolution` or `proj:transform`) are extracted directly from STAC asset metadata. When windowing raster sub-tiles for inference, pixel sample sizes are dynamically calculated using target image dimensions.

### Q17: Why is NAIP used for building detection?
**Answer**: NAIP (National Agriculture Imagery Program) provides high-resolution aerial orthoimagery ($0.6\text{m} - 1.0\text{m}$ per pixel), which is necessary to resolve individual building footprints.

### Q18: Why is Sentinel-2 used for vegetation analysis?
**Answer**: Sentinel-2 satellite imagery provides multi-spectral coverage including dedicated Red (Band 4) and Near-Infrared (Band 8) bands required for NDVI calculation, with global 5-day revisit cycles.

### Q19: What happens when suitable imagery is unavailable?
**Answer**: `getSatelliteImagery` returns `status: "SUCCESS"` with `data.imageryItems: []` and message `"No matching satellite imagery STAC items were found."` Downstream raster processing steps safely receive no items and exit with clean status messages.

### Q20: How do you handle different Coordinate Reference Systems (CRS)?
**Answer**: Native EPSG codes (e.g. `EPSG:32610` for UTM zone 10N) and 6-element affine transform matrices `[gt_0 ... gt_5]` are read from STAC asset metadata (`proj:epsg`, `proj:transform`). `proj4` converts pixel coordinates to `EPSG:4326` WGS84 GeoJSON polygons.

### Q21: How do you preserve actual acquisition dates?
**Answer**: `ImageryMetadata` extracts exact satellite pass timestamps directly from STAC item properties (`feature.properties.datetime`). These dates are retained in evidence logs and never modified to match requested query year ranges.

### Q22: How do you handle cloud cover?
**Answer**: *Current Status*: Cloud cover percentages (`eo:cloud_cover`) are stored in `ImageryMetadata` and exposed in evidence logs. *Limitation*: Automated cloud masking algorithms (e.g., SCL scene classification masking) are not currently implemented in this code version.

### Q23: Can the system work outside the US for building detection?
**Answer**: *Current Capability*: NAIP high-resolution aerial imagery ($0.6\text{m}$) is available primarily over the Continental United States (CONUS). Outside CONUS, the system uses Sentinel-2 ($10\text{m}$), where building instance detection quality is limited by lower spatial resolution.

### Q24: Is NAIP satellite imagery?
**Answer**: **No.** NAIP imagery is high-resolution aerial orthoimagery acquired via aircraft sensors by the USDA, not satellite imagery. We explicitly maintain this distinction.

---

## 4. Raster & GIS Questions

### Q25: How do you read GeoTIFF data?
**Answer**: We use the native `geotiff` JavaScript library in `rasterProcessingProvider.ts` to parse Cloud-Optimized GeoTIFF (COG) headers, extract band descriptors, and decode raw pixel arrays.

### Q26: Why process only raster windows instead of entire scenes?
**Answer**: Full satellite GeoTIFF scenes often exceed $500\text{MB} - 2\text{GB}$ in size. Extracting bounded sub-window tiles over the AOI prevents server memory crashes and reduces network streaming latency.

### Q27: What is the maximum raster processing bound?
**Answer**: `maxTotalPixels` is strictly capped at $4096 \times 4096$ pixels ($16.7\text{M}$ px). When raster windows exceed $1024 \times 1024$, `rasterProcessingProvider.ts` samples a representative $1024 \times 1024$ center sub-window.

### Q28: How do you convert raster pixel coordinates to geographic coordinates?
**Answer**: `pixelToGeographic()` applies the 6-element affine matrix transform:

$$X_{geo} = gt_0 + x \cdot gt_1 + y \cdot gt_2$$

$$Y_{geo} = gt_3 + x \cdot gt_4 + y \cdot gt_5$$

### Q29: What is WGS84?
**Answer**: `EPSG:4326` (WGS84) is the standard global geographic coordinate reference system using latitude and longitude decimal degrees.

### Q30: What role does proj4 play?
**Answer**: `proj4` projects transformed affine coordinate pairs $(X_{geo}, Y_{geo})$ from projected projected CRS (e.g. UTM meters) into `EPSG:4326` WGS84 decimal degrees.

### Q31: What role does Turf.js play?
**Answer**: `@turf/turf` executes all deterministic vector geometry operations: spatial buffering (`buffer`), polygon intersection (`intersect`), geodesic area calculation (`area`), and centroid distance matching (`distance`, `center`).

### Q32: How are spatial buffers calculated?
**Answer**: `spatialBufferProvider` receives geometry and distance inputs, validates unit types (`meters`, `kilometers`), and invokes `turf.buffer()`, outputting a valid MultiPolygon.

### Q33: How are spatial intersections calculated?
**Answer**: `spatialIntersectionProvider` converts feature collections into MultiPolygons and invokes `turf.intersect()`. If features do not overlap, it returns `status: "SUCCESS"` with `data: null` and message `"No intersection found."`

### Q34: How is NoData handled?
**Answer**: `nodata` raster values are extracted from GeoTIFF band metadata (`raster:bands`). During pixel analysis and NDVI calculations, any pixel matching `nodata`, `NaN`, or `null` is excluded from valid statistics.

### Q35: How do you prevent excessive memory use?
**Answer**: By enforcing hard bounds: $1024 \times 1024$ sub-window tile caps, $4096 \times 4096$ max pixel limits, $500$ telemetry log caps, and garbage-collecting transient `TypedArray` buffers after execution.

### Q36: Why is deterministic GIS preferable to asking an LLM to calculate geometry?
**Answer**: LLMs cannot perform continuous spatial topology operations or floating-point geometry math; asking an LLM to compute spatial intersections results in hallucinated coordinates and invalid GeoJSON.

---

## 5. NDVI & Scientific Analysis Questions

### Q37: What is NDVI?
**Answer**: Normalized Difference Vegetation Index (NDVI) is a scientific index quantifying vegetation health and greenness by comparing red light absorption with near-infrared reflectance.

### Q38: What exact formula do you use?
**Answer**:

$$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$

### Q39: Which bands are used?
**Answer**: In 4-band aerial/satellite imagery (e.g. NAIP or 4-band Planet), Red is Band 0 (index 0) and Near-Infrared is Band 3 (index 3). In Sentinel-2 L2A, Red is Band 4 and NIR is Band 8.

### Q40: Why Red and Near-Infrared?
**Answer**: Chlorophyll strongly absorbs Red light for photosynthesis and strongly reflects Near-Infrared energy. The ratio accentuates live green vegetation while suppressing background soil and water.

### Q41: Does Gemini calculate NDVI?
**Answer**: **No.** Gemini does not calculate or estimate NDVI. `calculateNDVI()` iterates directly over pixel typed arrays (`Float32Array` / `Uint16Array`) to compute exact mathematical values.

### Q42: How do you handle division by zero?
**Answer**: If $\text{NIR} + \text{Red} === 0$, the denominator check in `ndviProvider.ts` marks the pixel as invalid (`invalidCount++`) and skips division.

### Q43: How do you handle NoData / NaN values?
**Answer**: Pixels matching `nodata`, `Number.isNaN(r)`, or `Number.isNaN(n)` are excluded before ratio evaluation. Floating-point precision outputs are clamped to $[-1.0, 1.0]$.

### Q44: What statistics are produced?
**Answer**: Minimum, maximum, mean, median (P50), 25th percentile (P25), 75th percentile (P75), total pixel count, valid pixel count, and invalid pixel count.

### Q45: Can the same architecture support other spectral indices?
**Answer**: *Extensibility*: Yes. The deterministic raster engine architecture can be extended to compute NDWI (Water Index) or NDBI (Built-Up Index) by swapping band indices. *Current Status*: Only NDVI is currently implemented in `ndviProvider.ts`.

---

## 6. Machine Learning Questions

### Q46: What ML model performs building detection?
**Answer**: An instance segmentation model hosted via a remote Roboflow API endpoint (`outline.roboflow.com/buildings-instance-segmentation-gspp9/1`).

### Q47: Where does the model run?
**Answer**: Inference runs remotely on the configured Roboflow API server endpoint.

### Q48: Is inference local or remote?
**Answer**: Remote HTTP API inference via `remoteInferenceAdapter.ts`.

### Q49: How does the raster become model input?
**Answer**: `encodeRasterToBase64Png()` normalizes the GeoTIFF pixel array according to band dynamic range, encodes the image as an RGBA PNG buffer using `pngjs`, and converts it to a base64 string inside the `RemoteInferenceRequest` JSON payload.

### Q50: How do you transform model pixel predictions into map coordinates?
**Answer**: `convertBboxToGeoJSONPolygon()` and `convertPixelPolygonToGeoJSONPolygon()` apply native affine transform matrices $[gt_0 ... gt_5]$ to pixel vertices $(x, y)$ and project the resulting coordinates into `EPSG:4326` WGS84 GeoJSON polygons using `proj4`.

### Q51: What confidence threshold is used?
**Answer**: A configurable confidence threshold defaulting to $0.40$ ($40\%$). Detections below this score are filtered out.

### Q52: How do you validate model output?
**Answer**: Response JSON payloads are validated against `RemoteInferenceResponseSchema` (Zod). Invalid structures or missing detection properties trigger schema error fallbacks.

### Q53: What happens if the inference service fails?
**Answer**: `remoteInferenceAdapter.ts` retries transient HTTP errors (429, 500, 503, timeout) up to 3 times. If unconfigured or unavailable, it returns `status: "NOT_IMPLEMENTED"` with diagnostic reason `"INFERENCE_API_URL environment variable is not configured"` without crashing the server.

### Q54: What are the model's precision / recall / F1 / IoU metrics?
**Answer**: **Not Measured.** Independent precision, recall, F1, or IoU benchmark metrics have not been formally evaluated against a ground-truth dataset in this repository. We do not invent accuracy figures.

### Q55: How do you know the detected buildings are actually correct?
**Answer**: Detections represent model-derived predictions based on Roboflow instance segmentation weights. They are presented as machine predictions, not verified ground truth.

### Q56: Can the model work globally?
**Answer**: The remote ML model operates on high-resolution RGB/NIR PNG tiles ($0.6\text{m} - 1.0\text{m}$). Performance depends on input tile resolution and regional building architecture styles.

### Q57: Why not deploy the model locally?
**Answer**: Remote inference reduces server build dependencies (no native PyTorch/C++ CUDA bindings required in Node.js runtime). *Future Scope*: Local ONNX runtime execution is a planned future enhancement.

### Q58: What are current ML limitations?
**Answer**: Sub-window sampling cap ($1024 \times 1024$), dependence on remote API endpoint availability, and lower detection recall on low-resolution imagery ($10\text{m}$ Sentinel-2).

---

## 7. Temporal Change Detection Questions

### Q59: How does temporal analysis work?
**Answer**: `planner.ts` creates two parallel DAG branches ($T_1$ start date and $T_2$ end date). Each branch independently searches STAC, extracts GeoTIFF windows, and runs remote ML inference. `changeDetectionProvider.ts` then compares $T_1$ and $T_2$ detection feature collections.

### Q60: Are the two images actually independent?
**Answer**: Yes. $T_1$ and $T_2$ trigger separate STAC catalog queries filtered by different ISO date ranges, returning distinct satellite/aerial pass scenes.

### Q61: How are dates selected?
**Answer**: Start and end years/dates are extracted from `query.timeRange` (e.g. `start: "2019"`, `end: "2023"`).

### Q62: What happens if the requested date has no imagery?
**Answer**: The imagery search step returns `status: "SUCCESS"` with 0 items, causing downstream raster reading and object detection steps to be safely skipped.

### Q63: How are buildings matched between dates?
**Answer**: `detectChangeProvider` calculates Turf.js centroid coordinates (`@turf/center`) for every $T_1$ polygon and compares them against $T_2$ polygon centroids using geodesic distance (`@turf/distance`).

### Q64: Why use a 15-meter threshold?
**Answer**: `MATCH_THRESHOLD_METERS = 15` accounts for minor georeferencing alignment variations and building centroid offsets across different satellite pass angles.

### Q65: What does Added mean?
**Answer**: A building polygon detected in the $T_2$ scene that has no matching $T_1$ building centroid within 15 meters.

### Q66: What does Removed mean?
**Answer**: A building polygon detected in the $T_1$ scene that has no matching $T_2$ building centroid within 15 meters.

### Q67: What does Unchanged mean?
**Answer**: A building polygon whose centroid in $T_1$ matches a $T_2$ building centroid within 15 meters.

### Q68: Does Added / Removed prove real construction or demolition?
**Answer**: **No.** Added/Removed classifications represent model-derived feature footprint comparisons between two satellite acquisitions. They do not constitute physically verified municipal construction or demolition records.

### Q69: How do you handle different image resolutions between dates?
**Answer**: Each temporal branch performs native affine matrix georeferencing to WGS84 decimal degrees. Centroid distance matching is performed in geographic space regardless of original pixel sizes.

### Q70: What are the biggest sources of false change?
**Answer**: Cloud shadows, seasonal vegetation canopy cover obscuring roofs, sensor off-nadir viewing angles, and ML detection misses in either scene.

---

## 8. Security & Privacy Questions

### Q71: Where are API keys stored?
**Answer**: API keys (`GEMINI_API_KEY`, `INFERENCE_API_KEY`, `INFERENCE_API_URL`) are stored in server-side environment variables (`.env`). `.env` is ignored by `.gitignore`.

### Q72: Can the browser see Gemini credentials?
**Answer**: **No.** Gemini API client initialization occurs strictly on the Express Node.js server. The browser communicates only with `/api/query`.

### Q73: Can the browser see inference credentials?
**Answer**: **No.** Remote Roboflow API credentials and endpoint headers are managed exclusively inside `remoteInferenceAdapter.ts` on the server.

### Q74: How do you validate external input?
**Answer**: Natural-language inputs, parsed queries, bounding boxes, GeoJSON geometries, and inference response payloads are validated against strict Zod schemas (`StructuredQuerySchema`, `GeoJSONGeometrySchema`, `RemoteInferenceResponseSchema`).

### Q75: What is SSRF and how do you address it?
**Answer**: Server-Side Request Forgery (SSRF) occurs when an attacker forces a server to make unauthorized HTTP requests. We sanitize URLs via `RemoteInferenceAdapter.sanitizeUrl()` and restrict external HTTP requests strictly to trusted domain origins (Planetary Computer, Overpass, Nominatim, Roboflow).

### Q76: What happens if an external API returns malicious or malformed data?
**Answer**: Zod schema parsing (`safeParse`) fails immediately, returning a safe `status: "FAILED"` result with an error message without executing unsafe operations.

### Q77: How do you limit resource consumption?
**Answer**: Hard limits enforced: $4096 \times 4096$ max pixels, $1024 \times 1024$ tile sampling, 500 telemetry log caps, max 3 retries, and 30s per-attempt timeouts.

### Q78: How do retries work?
**Answer**: `fetchWithRetry` intercepts transient HTTP errors (429, 408, 500, 502, 503, 504), respects `Retry-After` headers, and applies exponential backoff with jitter up to max 3 retries.

### Q79: What happens when an external provider is unavailable?
**Answer**: The step returns explicit `status: "FAILED"` or `status: "NOT_IMPLEMENTED"`. Downstream steps skip gracefully.

### Q80: What sensitive information is included in evidence exports?
**Answer**: **None.** Evidence records contain only public STAC Item IDs, asset keys, acquisition timestamps, provider names, and confidence metrics. SAS tokens, API keys, and authorization headers are stripped.

### Q81: Is user satellite data stored permanently?
**Answer**: No. Sub-window GeoTIFF pixel buffers are processed in-memory and garbage-collected after query execution.

### Q82: Is the system secure?
**Answer**: CogniSights implements robust security controls (server-side secret isolation, Zod validation, SSRF URL sanitization, resource caps). Security depends on maintaining safe environment variables and third-party API availability.

---

## 9. Reliability & Performance Questions

### Q83: How long does a query take?
**Answer**: Query execution latency ranges from $\approx 2\text{s}$ for vector searches to $\approx 8\text{s} - 15\text{s}$ for full STAC image discovery, GeoTIFF windowing, and remote ML inference.

### Q84: Why can latency vary?
**Answer**: Latency depends on external network response times from OpenStreetMap, Microsoft Planetary Computer COG streaming, and remote ML inference API queue times.

### Q85: What causes the largest latency?
**Answer**: Streaming Cloud-Optimized GeoTIFF (COG) byte ranges over remote HTTP connections and remote ML model inference execution.

### Q86: How do retries work under heavy network load?
**Answer**: `fetchWithRetry` applies exponential backoff ($1\text{s}, 2\text{s}, 4\text{s} \dots$ capped at $15\text{s}$) with random jitter to prevent thundering herd problems on external providers.

### Q87: What happens on timeout?
**Answer**: Per-attempt timeouts ($30\text{s}$ Gemini/Overpass, $15\text{s}$ STAC/Inference, $10\text{s}$ Nominatim) trigger an AbortSignal, aborting the pending HTTP request and falling back to retry or failure status.

### Q88: Can the system handle many simultaneous users?
**Answer**: The Node.js Express server executes asynchronous non-blocking I/O. Each query runs its own isolated DAG instance. High parallel load is constrained by server CPU memory and external API rate limits.

### Q89: What are current scalability limitations?
**Answer**: Node.js single-thread event loop memory caps under high concurrent raster tile encoding, and external API rate limits (e.g. Nominatim 1 req/sec policy).

### Q90: Why not cache everything?
**Answer**: Satellite catalogs contain multi-petabyte dynamic datasets. *Future Scope*: Spatial bounding box tile caching is planned for production caching.

### Q91: What happens if Nominatim fails?
**Answer**: `resolveAreaOfInterest` returns `status: "FAILED"`. Downstream spatial steps skip safely.

### Q92: What happens if Overpass fails?
**Answer**: `searchGeospatialFeatures` returns `status: "FAILED"`. Vector intersection steps skip safely.

### Q93: What happens if Planetary Computer fails?
**Answer**: `getSatelliteImagery` returns `status: "FAILED"`. Downstream raster processing steps skip safely.

### Q94: What happens if Roboflow fails?
**Answer**: `detectObjects` returns `status: "NOT_IMPLEMENTED"` or `"FAILED"`. Change detection steps skip safely.

### Q95: What happens if Gemini fails?
**Answer**: `parseQueryToStructured` retries up to 3 times with exponential backoff. If all fail, the server returns an HTTP 500 JSON error.

---

## 10. Evidence & Trust Questions

### Q96: What exactly is stored in the evidence?
**Answer**: Source provider name, dataset identifier, date, operation name, confidence score, and provenance string.

### Q97: Can a judge trace the imagery used?
**Answer**: **Yes.** Evidence logs contain the exact Microsoft Planetary Computer STAC Item ID and direct catalog URL.

### Q98: Can you identify the STAC item?
**Answer**: Yes (e.g. `STAC Item wa_m_47122...`).

### Q99: Can you identify the raster asset?
**Answer**: Yes (e.g. Asset key `visual` or `B04`).

### Q100: Can you identify the acquisition timestamp?
**Answer**: Yes (e.g. `2023-07-15T18:22:04Z`).

### Q101: Can you identify the model/provider used?
**Answer**: Yes (e.g. `Endpoint: outline.roboflow.com | Model: Remote Building Detection Model v1.0.0`).

### Q102: How is provenance different from simply showing a result?
**Answer**: Provenance provides auditable metadata tracing every output polygon or index statistic back to its raw scientific source scene, pass date, and sensor key.

### Q103: Can the analysis be reproduced?
**Answer**: **Yes.** Re-executing the query against the same STAC Item ID and bounding box using deterministic GIS tools yields identical polygon coordinates and NDVI statistics.

### Q104: What parts are deterministic?
**Answer**: DAG plan construction, Nominatim geocoding, STAC item query filtering, SAS URL signing, GeoTIFF pixel decoding, NDVI array math, `proj4` affine transformations, Turf.js spatial operations, 15m centroid matching, and evidence generation.

---

## 11. Competitive Questions

### Q105: Why not just use ChatGPT / Gemini directly?
**Answer**: Native LLMs cannot stream multi-gigabyte GeoTIFF arrays, decode satellite bands, calculate geodesic polygon buffers, or run machine learning inference. Pure LLMs hallucinate coordinates and dates.

### Q106: Why not use QGIS?
**Answer**: QGIS requires manual desktop installation, complex GUI navigation, manual STAC searches, and custom Python scripting. CogniSights automates the pipeline via natural language.

### Q107: Why not build a normal GIS application?
**Answer**: Traditional GIS web apps require users to manually select layers, configure buffer tool sliders, and write SQL spatial queries. CogniSights enables conversational access for non-technical domain users.

### Q108: Why not use a pure computer-vision pipeline?
**Answer**: Pure computer-vision pipelines lack natural-language flexibility, automated multi-catalog discovery, and multi-modal vector/raster integration.

### Q109: What is your unique contribution?
**Answer**: The **LLM–Deterministic Sandwich** architecture: combining conversational NLP flexibility with rigorous, verifiable, deterministic geospatial execution and auditable evidence provenance.

### Q110: What makes this suitable for non-technical users?
**Answer**: Users type natural-language questions (e.g. *"Analyze vegetation in Pune"*); CogniSights handles all catalog queries, band math, and GIS buffering automatically.

### Q111: What makes this suitable for scientific / engineering workflows?
**Answer**: Exact floating-point pixel math, Zod schema contracts, `proj4` affine georeferencing, and immutable JSON evidence trails detailing exact STAC scene IDs and satellite pass timestamps.

---

## 12. Hard & Trick Questions

### Q112: "Your LLM can still hallucinate. So why call this trustworthy?"
**Answer**: Gemini is restricted strictly to intent parsing and text summary. Gemini is **never** permitted to calculate coordinates, generate imagery, compute NDVI, or create model detections. All analytical outputs are computed by deterministic TypeScript math libraries and verified remote ML models.

### Q113: "If the ML model is wrong, isn't the entire answer wrong?"
**Answer**: The system isolates model predictions as machine hypotheses, exposing confidence thresholds in evidence logs. The underlying satellite imagery provenance and raw GeoTIFF metadata remain 100% verified regardless of model confidence.

### Q114: "You depend on multiple public APIs. What happens during judging if one goes down?"
**Answer**: `fetchWithRetry` applies exponential backoff. If an API remains unavailable, CogniSights gracefully degrades to an explicit `FAILED` or `NOT_IMPLEMENTED` status without server crashes or fake fallback results.

### Q115: "Why should ISRO trust an external ML API?"
**Answer**: The remote ML architecture is fully decoupled via `remoteInferenceAdapter.ts`. In an ISRO production environment, the adapter can be reconfigured to point to an internal on-premise ISRO model endpoint.

### Q116: "How do you prove your detected buildings are real?"
**Answer**: Detections are model-derived predictions overlaying live satellite imagery. We do not claim physical field-survey ground truth; output polygons reflect predictions from the computer vision engine.

### Q117: "Why don't you provide accuracy numbers (Precision / Recall / F1)?"
**Answer**: Independent accuracy metrics have not been formally measured against a ground-truth benchmark dataset in this repository. We strictly refuse to invent fake benchmark figures.

### Q118: "What happens if two dates have different image quality?"
**Answer**: Each temporal branch performs native affine matrix georeferencing independently. Centroid distance matching ($15\text{m}$) is performed in geographic decimal degrees regardless of pixel size variations.

### Q119: "What happens with clouds?"
**Answer**: Cloud cover percentages (`eo:cloud_cover`) are extracted from STAC metadata and logged. Automated pixel cloud masking (SCL scene classification) is a planned future enhancement.

### Q120: "Can this work on Indian cities for building detection?"
**Answer**: *Current Capability*: NAIP high-resolution aerial imagery ($0.6\text{m}$) covers CONUS. Over Indian cities like Pune/Mumbai, the system accesses Sentinel-2 ($10\text{m}$), where building detection is limited by lower spatial resolution. *Extensibility*: Connecting an Indian high-res satellite catalog (e.g. Cartosat) would enable full high-res building detection globally.

### Q121: "What would you change for production deployment?"
**Answer**: Deploy local ONNX ML model runtimes on GPU nodes, implement spatial tile caching, add SCL satellite cloud masking, and connect official Indian satellite data portals (e.g., ISRO Bhuvan STAC endpoints).

### Q122: "What is the biggest limitation of your current system?"
**Answer**: Reliance on remote HTTP endpoints for building detection inference and high-resolution imagery coverage boundaries outside CONUS.

### Q123: "What is the biggest technical innovation?"
**Answer**: The **LLM–Deterministic Sandwich** pattern—eliminating AI spatial hallucination by enforcing a strict boundary between natural-language parsing and deterministic spatial execution.

### Q124: "What would you build next?"
**Answer**: Local ONNX model runtime integration, Sentinel-1 SAR radar change detection for cloud-penetrating imagery, and ISRO Bhuvan STAC catalog adapters.

---

## 13. Rapid-Fire Answers (20 Most Likely Judge Questions)

| Question | 10-Second Rapid Answer |
|---|---|
| **1. What is CogniSights?** | A natural-language Earth Observation platform using deterministic GIS and satellite processing. |
| **2. Does Gemini calculate coordinates?** | No. Coordinates come strictly from OpenStreetMap Nominatim API geocoding payloads. |
| **3. Does Gemini calculate NDVI?** | No. NDVI is calculated using exact pixel matrix math $(NIR - Red)/(NIR + Red)$. |
| **4. Where is satellite imagery stored?** | Querying live catalogs on Microsoft Planetary Computer STAC APIs. |
| **5. Is NAIP satellite imagery?** | No. NAIP is USDA high-resolution aerial orthoimagery ($0.6\text{m}$). |
| **6. How are buildings detected?** | GeoTIFF tiles are base64 PNG encoded and processed by a remote Roboflow ML model. |
| **7. How are building pixels mapped to Lat/Lon?** | `proj4` applies 6-element affine transform matrices to project pixel coordinates to WGS84 decimal degrees. |
| **8. How does change detection work?** | Parallel DAG branches detect buildings in T1 & T2, comparing centroids via Turf.js ($15\text{m}$ threshold). |
| **9. Does building change prove demolition?** | No. It is an algorithmic comparison of model footprints across satellite passes, not municipal ground truth. |
| **10. Where are API keys stored?** | Strictly on the server in `.env`. Zero credentials are sent to the client browser. |
| **11. What is your pixel processing limit?** | Capped at $4096 \times 4096$ max pixels, with $1024 \times 1024$ sub-window tile sampling. |
| **12. How do retries work?** | `fetchWithRetry` applies exponential backoff (max 3 retries, 30s timeout) on transient HTTP errors. |
| **13. What happens if an API goes down?** | The step returns an explicit `FAILED` or `NOT_IMPLEMENTED` status without crashing. |
| **14. Can a judge verify the results?** | Yes. Exportable evidence JSON contains STAC Item IDs, satellite timestamps, and model URIs. |
| **15. What vector GIS tools are used?** | `@turf/turf` for geodesic buffers, spatial polygon intersections, and area calculations ($m^2$). |
| **16. What vector data source is used?** | OpenStreetMap Overpass QL for highways, waterways, amenities, and boundaries. |
| **17. Why is this better than ChatGPT?** | ChatGPT cannot stream GeoTIFFs, decode bands, calculate buffers, or project pixels. |
| **18. Why is this better than QGIS?** | It automates catalog search, raster windowing, ML inference, and mapping via natural language. |
| **19. What is your model accuracy?** | Not measured against ground truth in this repo; we do not fabricate F1 or IoU numbers. |
| **20. What is the core differentiator?** | The LLM–Deterministic Sandwich: natural language interface with 100% deterministic spatial math. |

---

## 14. The 5 Answers to Memorize

1. **What is CogniSights?**
   > *"CogniSights is a natural-language geospatial intelligence platform. It uses AI solely to interpret queries and summarize text, while all imagery searches, raster pixel decoding, NDVI calculations, ML detections, and GIS spatial math are executed by deterministic software."*

2. **Why the LLM–Deterministic Sandwich?**
   > *"Because LLMs hallucinate when asked to compute spatial geometry or process binary satellite arrays. The sandwich pattern gives non-technical users a conversational interface while guaranteeing 100% mathematically verifiable spatial outputs."*

3. **Where does actual geospatial computation happen?**
   > *"On our Node.js server engine using specialized spatial libraries—`@turf/turf` for vector GIS math, `proj4` for affine coordinate transformations, `geotiff` for COG sub-window array decoding, and Roboflow for remote ML model inference."*

4. **How do you establish provenance?**
   > *"Every query execution appends an immutable evidence record logging the raw STAC Item ID, satellite pass timestamp, asset key, provider URI, and model confidence score into an exportable JSON audit trail."*

5. **What is the biggest limitation?**
   > *"Dependence on third-party public API endpoints and the boundary of high-resolution aerial imagery outside CONUS. If an API is unavailable, CogniSights gracefully returns explicit `FAILED` or `NOT_IMPLEMENTED` statuses rather than fabricating results."*

---

## 15. Red-Flag Claims (Presenter Avoidance Checklist)

Never state any of the following claims:
- ❌ *"Our system is 100% accurate."*
- ❌ *"Our pipeline has zero hallucinations."*
- ❌ *"Building detections represent physical ground-truth construction or demolition dates."*
- ❌ *"Our ML model has X% Precision / Recall / IoU / F1 score."*
- ❌ *"The system operates with zero latency."*
- ❌ *"CogniSights works completely offline without internet."*
- ❌ *"NAIP is satellite imagery."*
- ❌ *"Gemini computed the NDVI numbers."*
- ❌ *"Gemini calculated the building coordinates."*
- ❌ *"Our system has cloud-penetrating radar masking."*
- ❌ *"Our security is 100% unhackable."*

---

## 16. Judge Conversation Strategy

1. **Never Bluff**: If a judge asks a question about an unverified feature (e.g., *"Do you support SAR radar imagery?"*), answer honestly: *"Radar SAR processing is not currently implemented in this version; it is part of our planned future scope."*
2. **Distinguish Current vs. Future**: Always state clearly what is currently working in code vs. what represents architectural extensibility.
3. **Redirect Weaknesses to Architectural Differentiators**: If challenged on third-party API dependencies or model precision, pivot to our trust model: *"That is exactly why we log immutable evidence trails and return explicit `NOT_IMPLEMENTED` statuses—so users always know the exact operational limits of the underlying data."*
4. **Emphasize Deterministic Verification**: Remind judges that 100% of spatial calculations and raster array math are verifiable and reproducible.
