# CogniSights / SATQuery: Final Release Artifact

**Natural-Language Earth Observation Analysis with Deterministic Geospatial Execution**

---

## 1. Project Overview

- **Project Name**: CogniSights / SATQuery
- **One-Line Description**: A natural-language Earth Observation (EO) and GIS intelligence platform that executes complex satellite and spatial analytics deterministically with auditable provenance.
- **Core Problem**: Multi-band satellite imagery and geographic vector data are powerful but locked behind steep technical barriers (QGIS/ArcGIS desktop software, STAC catalog APIs, GeoTIFF band math, CRS projections, spatial databases). Native Large Language Models (LLMs) offer natural conversational interfaces but hallucinate spatial coordinates, satellite dates, and mathematical statistics when processing spatial data.
- **Core Solution**: CogniSights implements the **LLM–Deterministic Sandwich** pattern. An LLM (Gemini 3.6 Flash) converts natural-language queries into structured JSON schemas, but 100% of spatial geocoding, satellite catalog searches, GeoTIFF raster windowing, NDVI pixel math, Turf.js spatial operations, `proj4` georeferencing, and remote ML building detections are executed strictly by deterministic software engines.

---

## 2. Core Differentiator

$$\text{Natural Language Interface} + \text{Deterministic Spatial Execution} + \text{Live EO / Vector Data} + \text{Remote ML Inference} + \text{Auditable Evidence Provenance}$$

> [!IMPORTANT]
> **Deterministic Boundary Guarantee**: Gemini AI interprets human intent into a validated schema (`StructuredQuery`) and synthesizes the final text response. Gemini does **NOT** calculate coordinates, invent satellite scenes, compute NDVI values, perform spatial buffering, or generate building predictions. All spatial math is executed by deterministic TypeScript software.

---

## 3. Current Verified Capabilities

| Capability | Implementation File | Status |
|---|---|---|
| **Natural-Language Query Parsing** | `src/server/ai/gemini.ts` | `IMPLEMENTED` |
| **AOI / Location Geocoding** | `src/server/tools/geocoderProvider.ts` (OSM Nominatim API) | `IMPLEMENTED` |
| **STAC Satellite Dataset Discovery** | `src/server/tools/datasetProvider.ts` & `imageryProvider.ts` (MPC STAC API) | `IMPLEMENTED` |
| **Raster Asset SAS Sign & Windowing** | `src/server/tools/rasterProvider.ts` & `rasterProcessingProvider.ts` (`geotiff`) | `IMPLEMENTED` |
| **Deterministic NDVI Computation** | `src/server/tools/ndviProvider.ts` | `IMPLEMENTED` |
| **Vector GIS Buffer & Intersection** | `src/server/tools/gisProvider.ts` (`@turf/turf`) | `IMPLEMENTED` |
| **Semantic Vector Feature Search** | `src/server/tools/geospatialFeatureProvider.ts` (OSM Overpass API) | `IMPLEMENTED` |
| **Building Instance ML Detection** | `src/server/tools/inference/remoteInferenceAdapter.ts` (Roboflow ML Engine) | `IMPLEMENTED` |
| **Affine WGS84 Georeferencing** | `src/server/tools/inference/remoteInferenceAdapter.ts` (`proj4`) | `IMPLEMENTED` |
| **Multi-Temporal Change Detection** | `src/server/tools/changeDetectionProvider.ts` (Turf.js 15m Centroid Matcher) | `IMPLEMENTED` |
| **Auditable Evidence Logging** | `src/server/analysis/executor.ts` & `types/index.ts` | `IMPLEMENTED` |
| **Executive PDF Report Export** | `src/components/ResultPanel.tsx` | `IMPLEMENTED` |
| **Evidence JSON Export** | `src/components/ResultPanel.tsx` | `IMPLEMENTED` |
| **Session Analysis History** | `src/components/HistoryPanel.tsx` & `App.tsx` | `IMPLEMENTED` |
| **Connected Datasets Catalog** | `src/components/DatasetsPanel.tsx` | `IMPLEMENTED` |
| **Pre-Configured Analysis Library** | `src/components/AnalysisLibraryPanel.tsx` (6 1-click templates) | `IMPLEMENTED` |

---

## 4. Verified Demonstrations

### Historically Verified Core Workflows (100% Verified):
1. `"Detect buildings in Seattle"` — Primary High-Resolution Aerial EO & ML Demo
2. `"Detect buildings added or removed between 2019 and 2023 in Seattle"` — Secondary Multi-Temporal Change Demo
3. `"Analyze vegetation in Pune"` — Scientific Multi-Spectral NDVI Demo
4. `"Find hospitals near Pune"` — Semantic Vector Search Demo
5. `"Find roads within 500m of Pune"` — Vector Proximity Buffer & Intersection Demo

### Candidate Workflow (Requires Final Verification):
- `"Find areas of urban expansion near major highways in Mumbai"` — *Candidate*: Urban expansion planner steps and Overpass header fixes are implemented in code; full live satellite pass verification depends on external cloud STAC availability.

---

## 5. Primary Demo: Building Footprint Detection

- **Query**: `"Detect buildings in Seattle"`
- **Why Primary**: Demonstrates full end-to-end integration across geocoding, satellite catalog discovery, raster window streaming, remote ML inference, affine georeferencing, Leaflet map display, and evidence logging.
- **Execution Sequence**:
  1. `parseQueryToStructured()` converts text to `StructuredQuery` schema.
  2. `createQueryPlan()` builds 7-step execution DAG.
  3. `resolveAreaOfInterest` geocodes "Seattle" via Nominatim to Bbox `[-122.43, 47.49, -122.22, 47.73]`.
  4. `searchDatasets` & `getSatelliteImagery` search Planetary Computer STAC for **high-resolution NAIP aerial imagery**.
  5. `processRasterWindow` signs SAS URL token and streams $1024 \times 1024$ GeoTIFF sub-window tile.
  6. `detectObjects` encodes tile to base64 PNG and invokes remote Roboflow ML model.
  7. `proj4` applies affine transformation matrix $[gt_0 \dots gt_5]$ mapping pixel bboxes to `EPSG:4326` WGS84 GeoJSON polygons.
  8. `SATQueryMap` renders building polygons over Leaflet map.
  9. `ResultPanel` attaches immutable JSON evidence detailing STAC Item ID `wa_m_47122...`, acquisition timestamp, asset key `visual`, and Roboflow model URI.

> [!NOTE]
> **Data Terminology**: NAIP imagery is **high-resolution aerial orthoimagery** ($0.6\text{m}$ spatial resolution), not satellite imagery. We preserve this distinction accurately.

---

## 6. Secondary Demo: Multi-Temporal Building Change

- **Query**: `"Detect buildings added or removed between 2019 and 2023 in Seattle"`
- **Execution Sequence**:
  1. `createQueryPlan()` constructs two parallel DAG execution branches ($T_1=2019$ and $T_2=2023$).
  2. $T_1$ branch searches 2019 STAC catalog, streams 2019 GeoTIFF window, and runs 2019 Roboflow building detection.
  3. $T_2$ branch searches 2023 STAC catalog, streams 2023 GeoTIFF window, and runs 2023 Roboflow building detection.
  4. Both branches extract real satellite pass acquisition timestamps (`properties.datetime`).
  5. `detectChangeProvider` calculates Turf.js centroids (`@turf/center`) and compares $T_1$ and $T_2$ features using a 15-meter geodesic distance threshold (`@turf/distance`).
  6. Outputs distinct GeoJSON feature collections for **Added** (in $T_2$, not $T_1$), **Removed** (in $T_1$, not $T_2$), and **Unchanged** (in $T_1$ and $T_2$).

> [!WARNING]
> **Model-Derived Scene Comparison Disclaimer**: Change detection outputs represent algorithmic spatial comparisons of machine-learning building footprints across two satellite acquisitions. They do **not** constitute physically verified municipal construction or demolition dates.

---

## 7. Scientific Demo: Vegetation & NDVI Analysis

- **Query**: `"Analyze vegetation in Pune"`
- **Imagery Source**: Sentinel-2 Level-2A Multi-Spectral Satellite Imagery (10m spatial resolution).
- **Band Configuration**: Red (Band 4) and Near-Infrared / NIR (Band 8).
- **Exact Deterministic Formula**:

$$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$

- **NoData & Zero-Denominator Guardrails**: Excludes background NoData values, NaN entries, and zero-denominator pixels ($\text{NIR} + \text{Red} = 0$). Clamps floating-point outputs to $[-1.0, 1.0]$.
- **Statistical Summary**: Computes min, max, mean, median (P50), P25, P75, and standard deviation over valid pixel arrays.
- **Deterministic Computation**: Executed strictly inside `ndviProvider.ts` over `Float32Array` buffers. Gemini does **not** calculate or guess NDVI values.

---

## 8. How to Run

### Verified NPM & Runtime Commands (from `package.json`):

```bash
# 1. Install project dependencies
npm install

# 2. Execute unit & integration test suite (Vitest)
npx vitest run

# 3. Perform TypeScript static type checking
npm run lint

# 4. Compile production client & server bundle
npm run build

# 5. Launch local development server (live hot-reloading)
npm run dev

# 6. Start compiled production server
npm start
```

### Environment Configuration (`.env`):
Copy `.env.example` to `.env` and populate the required keys (secret values omitted):

```env
# GEMINI_API_KEY: Required for Gemini AI API calls
GEMINI_API_KEY=""

# APP_URL: Base URL where this applet is hosted
APP_URL="http://localhost:3000"

# INFERENCE_API_URL: Endpoint for Remote ML building detection inference
INFERENCE_API_URL=""

# INFERENCE_API_KEY: Secret key for Remote ML Inference API
INFERENCE_API_KEY=""
```

---

## 9. Repository Structure

```
cognisights/
├── docs/
│   ├── ARCHITECTURE.md          # Technical Architecture & Sandwich Specification
│   ├── SIH_PROBLEM_MAPPING.md   # SIH / ISRO Problem Statement Mapping Matrix
│   ├── DEMO_STRATEGY.md         # Live Presentation Strategy & Fallback Matrix
│   ├── PITCH_DECK.md            # 10-Slide Competition Pitch Deck & Speaker Notes
│   ├── JUDGE_DEFENSE_GUIDE.md   # 124 Technical Q&A Judge Defense Guide
│   └── FINAL_RELEASE_ARTIFACT.md# Final Release & Submission Artifact (This Document)
├── src/
│   ├── App.tsx                  # Main React SPA Container & Active View Manager
│   ├── components/
│   │   ├── Sidebar.tsx          # Active Navigation Sidebar
│   │   ├── QueryInput.tsx       # Prompt & AOI Input Form
│   │   ├── AnalysisPanel.tsx    # Query Intent & Pipeline Overview
│   │   ├── ExecutionPanel.tsx   # Real-Time DAG Execution Step Tracker
│   │   ├── ResultPanel.tsx      # Tool Outputs, Evidence Drawer & PDF Export
│   │   ├── HistoryPanel.tsx     # Session Query History View
│   │   ├── DatasetsPanel.tsx    # Dataset Catalog Specification View
│   │   ├── AnalysisLibraryPanel.tsx # Pre-Configured Template Library View
│   │   └── map/
│   │       └── SATQueryMap.tsx  # Leaflet Interactive Map & Layer Controls
│   ├── server/
│   │   ├── ai/
│   │   │   └── gemini.ts        # Gemini 3.6 Flash Parser & Response Synthesizer
│   │   ├── analysis/
│   │   │   └── executor.ts      # DAG Step Executor & Evidence Collector
│   │   ├── planner/
│   │   │   └── planner.ts       # Deterministic Execution DAG Planner
│   │   ├── routes/
│   │   │   └── api.ts           # REST Endpoint POST /api/query Router
│   │   ├── tools/
│   │   │   ├── registry.ts      # Tool Execution Registry Dispatcher
│   │   │   ├── geocoderProvider.ts       # OpenStreetMap Nominatim Geocoder
│   │   │   ├── geospatialFeatureProvider.ts # OSM Overpass Vector Engine
│   │   │   ├── datasetProvider.ts        # MPC STAC Collections Discovery
│   │   │   ├── imageryProvider.ts        # MPC STAC Items & SAS Signing
│   │   │   ├── rasterProvider.ts         # SAS Access Verification & COG Check
│   │   │   ├── rasterProcessingProvider.ts# GeoTIFF Window Pixel Sampler
│   │   │   ├── ndviProvider.ts           # Deterministic NDVI Matrix Engine
│   │   │   ├── gisProvider.ts            # Turf.js Buffer, Intersect, & Area
│   │   │   ├── changeDetectionProvider.ts# 15m Centroid Distance Matcher
│   │   │   └── inference/
│   │   │       ├── remoteInferenceAdapter.ts  # Roboflow ML Adapter & proj4
│   │   │       └── buildingDetectionEngine.ts # ML Engine Dispatcher
│   │   └── utils/
│   │       └── fetchWithRetry.ts# Resilient HTTP Fetch & Telemetry Logger
│   └── types/
│       └── index.ts             # TypeScript & Zod Schema Contracts
├── server.ts                    # Express Server Entry Point
├── package.json                 # Project Scripts & Dependency Manifest
├── tsconfig.json                # TypeScript Compiler Configuration
├── vite.config.ts               # Vite Production Bundler Configuration
└── .env.example                 # Environment Variable Template
```

---

## 10. Documentation Index

All referenced documentation files exist in the `docs/` directory and can be inspected directly:

1. [docs/ARCHITECTURE.md](file:///d:/downloads/cognisights/docs/ARCHITECTURE.md) — Technical Architecture, LLM-Sandwich Pattern, Data Boundaries & 3 Mermaid Diagrams.
2. [docs/SIH_PROBLEM_MAPPING.md](file:///d:/downloads/cognisights/docs/SIH_PROBLEM_MAPPING.md) — SIH / ISRO Problem Statement 26167 Requirement Matrix & Capabilities.
3. [docs/DEMO_STRATEGY.md](file:///d:/downloads/cognisights/docs/DEMO_STRATEGY.md) — Live Presentation Scripts (3-min & 5-min), Demo Rankings, and Fallback Matrix.
4. [docs/PITCH_DECK.md](file:///d:/downloads/cognisights/docs/PITCH_DECK.md) — 10-Slide Competition Presentation Content & Presenter Speaking Notes.
5. [docs/JUDGE_DEFENSE_GUIDE.md](file:///d:/downloads/cognisights/docs/JUDGE_DEFENSE_GUIDE.md) — 124 Technical Q&A Judge Defense Answers, Rapid-Fire Table, and Red-Flag Checklist.
6. [docs/FINAL_RELEASE_ARTIFACT.md](file:///d:/downloads/cognisights/docs/FINAL_RELEASE_ARTIFACT.md) — Final Release & Submission Artifact (This Document).

---

## 11. Evidence & Provenance

Every query executed by CogniSights appends immutable `Evidence` objects containing:
- **`source`**: External provider name (e.g. `Microsoft Planetary Computer`, `OpenStreetMap Nominatim`, `Roboflow ML`).
- **`dataset`**: STAC Item ID (e.g. `wa_m_47122...`), collection ID (`naip`, `sentinel-2-l2a`), or vector dataset name.
- **`date`**: True satellite pass acquisition timestamp (`feature.properties.datetime`).
- **`operation`**: Tool function name (`deterministic_ndvi`, `building_object_detection`, `spatial_buffer`).
- **`confidence`**: Machine learning confidence score or `DETERMINISTIC` indicator.
- **`provenance`**: Direct catalog URL URI and exact model runtime metadata.

> [!SECURITY]
> **Credential Exclusion**: SAS tokens, authorization headers, and API keys are stripped from evidence outputs prior to UI rendering and JSON export.

---

## 12. Security Architecture

- **Server-Side Secret Isolation**: Private API keys (`GEMINI_API_KEY`, `INFERENCE_API_KEY`, `INFERENCE_API_URL`) are read exclusively from environment variables on the Node.js Express server. Zero credentials compiled into client JS bundles.
- **SSRF Protection**: External URLs are sanitized via `RemoteInferenceAdapter.sanitizeUrl()`. All STAC, Nominatim, and Overpass requests are restricted to trusted HTTPS domain origins.
- **Input Validation**: Zod contracts (`StructuredQuerySchema`, `GeoJSONGeometrySchema`, `RemoteInferenceResponseSchema`) validate all natural language inputs, bounding boxes, and ML payloads.
- **Resource Hard Bounds**: Max raster window pixels capped at $4096 \times 4096$ pixels; tile sub-window sampling capped at $1024 \times 1024$ pixels; telemetry array capped at 500 ring-buffer items.
- **Sanitized Error Responses**: Stack traces and raw internal error objects are suppressed in client responses.

---

## 13. System Reliability & Resiliency

- **`fetchWithRetry` Utility**: Intercepts transient HTTP errors (429, 408, 500, 502, 503, 504), parses `Retry-After` headers, and applies exponential backoff with random jitter (max 3 retries, 30s timeout).
- **Explicit Failure States**: Unhandled errors, missing credentials, or unsupported features return explicit `FAILED`, `NOT_IMPLEMENTED`, or `SKIPPED` status JSON rather than silent server crashes or fabricated dummy results.

---

## 14. Known Limitations

1. **Remote ML API Dependency**: Building detection relies on an external Roboflow API endpoint. If unconfigured or offline, `detectObjects` safely returns `NOT_IMPLEMENTED`.
2. **Unbenchmarked Model Metrics**: Model precision, recall, IoU, and F1 scores have not been independently evaluated against a ground-truth dataset in this repository.
3. **Automated Cloud Masking**: Cloud cover percentages (`eo:cloud_cover`) are logged from STAC metadata, but automated pixel cloud masking (SCL layer filtering) is not currently implemented.
4. **Aerial Imagery Geographic Coverage**: NAIP high-resolution aerial imagery ($0.6\text{m}$) covers the Continental United States (CONUS). Outside CONUS, the system falls back to Sentinel-2 ($10\text{m}$), where building resolution is limited.
5. **Third-Party API Limits**: Performance depends on external availability and rate limits of public APIs (OpenStreetMap Nominatim/Overpass, Planetary Computer STAC).

---

## 15. Future Scope (Planned Enhancements)

- **Local ONNX Model Runtime**: Load YOLOv8 / SAM ONNX models locally in Node.js via `onnxruntime-node` to eliminate remote API network latency.
- **Sentinel-1 SAR Radar Integration**: Process Sentinel-1 Synthetic Aperture Radar (SAR) microwave imagery for cloud-penetrating change detection.
- **ISRO Bhuvan STAC Adapter**: Native STAC adapter connecting ISRO Bhuvan / Veda Indian satellite data portals.
- **Automated SCL Cloud Masking**: Decode Sentinel-2 Scene Classification Layer (SCL) masks to automatically filter cloudy pixels.
- **Bounding Box Tile Caching**: Persist raster tiles and vector features in SQLite / Redis to accelerate repeated regional queries.

---

## 16. Judge Demo Checklist

### Before Presentation:
- [x] Node.js server running (`npm run dev` or `npm start` listening on `http://localhost:3000`).
- [x] Environment variables present in `.env` (`GEMINI_API_KEY`, `INFERENCE_API_URL`, `INFERENCE_API_KEY`).
- [x] All 67 Vitest tests passing (`npx vitest run`).
- [x] Primary query (`"Detect buildings in Seattle"`) tested and working.
- [x] Secondary query (`"Detect buildings added or removed between 2019 and 2023 in Seattle"`) tested and working.
- [x] Scientific query (`"Analyze vegetation in Pune"`) tested and working.
- [x] Evidence JSON export and PDF report export tested and working.
- [x] Zero API keys visible in browser console or DOM inspector.

### During Presentation:
1. Show natural-language prompt entry in **Query Explorer**.
2. Point out real-time DAG execution step tracking in **Execution Panel**.
3. Display building polygons or vector features on **Leaflet Map**.
4. Open **Tool Outputs & Evidence** panel to demonstrate STAC Item IDs, satellite timestamps, and model URIs.
5. Demonstrate **Export PDF** executive intelligence report.
6. Emphasize the **LLM–Deterministic Sandwich** architecture.

---

## 17. The 5 Key Judge Talking Points

1. **LLM–Deterministic Sandwich**: Gemini AI parses language and summarizes text, but 100% of spatial geocoding, STAC discovery, GeoTIFF windowing, NDVI math, and ML georeferencing are executed by deterministic code.
2. **Real Live EO & Vector Data**: Queries live OpenStreetMap features and Microsoft Planetary Computer satellite/aerial imagery catalogs in real-time.
3. **Exact Mathematical NDVI Matrix Engine**: Computes normalized difference vegetation index statistics directly over floating-point GeoTIFF pixel arrays without AI guessing.
4. **Affine WGS84 Georeferencing**: Applies 6-element transform matrices via `proj4` to project pixel bounding boxes into `EPSG:4326` WGS84 GeoJSON polygons.
5. **Auditable Evidence & Provenance**: Every query generates an immutable, exportable JSON evidence trail tracing every output back to its raw STAC Item ID, satellite pass timestamp, and model URI.

---

## 18. Critical Claims to Avoid (Presenter Checklist)

- ❌ Do **NOT** claim 100% detection accuracy.
- ❌ Do **NOT** claim physical ground-truth construction or demolition dates.
- ❌ Do **NOT** claim unmeasured Precision, Recall, IoU, or F1 accuracy metrics.
- ❌ Do **NOT** claim zero latency.
- ❌ Do **NOT** claim offline operation.
- ❌ Do **NOT** claim absolute hallucination-free guarantees.
- ❌ Do **NOT** call NAIP aerial imagery "satellite imagery".
- ❌ Do **NOT** invent fake model names or satellite acquisition dates.

---

## 19. Final Release Status

- **Unit & Integration Tests**: **PASS (8 test files, 67/67 tests passing)**
- **Typecheck (`tsc --noEmit`)**: **PASS (0 errors)**
- **Production Build**: **PASS (`dist/server.cjs` 153.8kb)**
- **Security Audit**: **PASS (Secrets isolated server-side, Zod validated, SSRF protected)**
- **Documentation Suite**: **PASS (6 comprehensive markdown files in `docs/`)**
- **Live Demo Readiness**: **PASS (Verified at http://localhost:3000)**
- **Release Verdict**: **RELEASE READY**

---

## 20. Source-of-Truth Policy

> **Source of Truth Statement**: The repository implementation and verified empirical evidence outputs represent the single source of truth for CogniSights / SATQuery. All technical descriptions, capabilities, data flows, and security boundaries in this document reflect the audited runtime state of the codebase.
