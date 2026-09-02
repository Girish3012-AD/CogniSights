# CogniSights / SATQuery: SIH / ISRO Problem-Solution Mapping

This document provides a factual mapping between Smart India Hackathon (SIH) / ISRO geospatial problem requirements and the verified, implemented capabilities of CogniSights (SATQuery).

---

## Section 1 — Problem Statement

- **Target Focus**: SIH / ISRO Problem Statement 26167 — Natural Language Geospatial Querying & Remote Sensing Intelligence System.
- **Repository Availability Note**: The raw verbatim text of Problem Statement 26167 is not stored as a standalone file in the local repository codebase. This mapping is derived from verified codebase implementations, verified architecture documentation (`docs/ARCHITECTURE.md`), and audit logs (`M41.1` & `M41.2`).
- **Core Problem Challenges Addressed**:
  1. Bridging natural-language queries with complex Earth Observation (EO) and GIS pipelines.
  2. Eliminating manual search across satellite image catalogs, vector databases, and GIS tooling.
  3. Processing multi-spectral satellite imagery and vector layers deterministically without AI hallucination.
  4. Detecting objects (e.g., buildings) and temporal changes while preserving auditable provenance.

---

## Section 2 — Requirement → Solution Matrix

| Problem Requirement | CogniSights Solution | Actual Implementation | Evidence / Demo | Status |
|---|---|---|---|---|
| **Natural Language Query Parsing** | Converts free-form text into a structured intent schema. | `src/server/ai/gemini.ts` via Gemini 3.6 Flash parsing to `StructuredQuerySchema`. | All queries | `IMPLEMENTED` |
| **Geocoding & AOI Resolution** | Resolves geographic location names to coordinates and bounding boxes. | `src/server/tools/geocoderProvider.ts` via OpenStreetMap Nominatim API. | Seattle, Pune AOIs | `DEPENDS ON EXTERNAL SERVICE` |
| **Satellite Imagery Discovery** | Automated search for satellite imagery by bounding box and date range. | `src/server/tools/imageryProvider.ts` via Microsoft Planetary Computer STAC Search API. | NAIP / Sentinel-2 search | `DEPENDS ON EXTERNAL SERVICE` |
| **Raster Data Access & Sampling** | Signs SAS tokens and extracts sub-window GeoTIFF pixel arrays. | `src/server/tools/rasterProvider.ts` & `rasterProcessingProvider.ts`. | GeoTIFF window sampling | `IMPLEMENTED` |
| **Spectral Index Computation (NDVI)** | Computes mathematical vegetation index $(NIR - Red)/(NIR + Red)$ over valid pixels. | `src/server/tools/ndviProvider.ts`. | Pune Vegetation Analysis | `IMPLEMENTED` |
| **OSM Semantic Vector Search** | Fetches roads, rivers, hospitals, and land-use vector features. | `src/server/tools/geospatialFeatureProvider.ts` via OpenStreetMap Overpass API. | Pune Hospitals & Roads | `DEPENDS ON EXTERNAL SERVICE` |
| **Vector GIS Buffer & Intersection** | Computes spatial buffers, polygon intersections, and geodesic area ($m^2$). | `src/server/tools/gisProvider.ts` using Turf.js deterministic geometry engine. | Pune 500m Road Buffer | `IMPLEMENTED` |
| **Building Instance Detection** | Detects building footprints from satellite sub-window raster tiles using ML. | `src/server/tools/inference/remoteInferenceAdapter.ts` via Roboflow API & `proj4` georeferencer. | Seattle Building Detection | `DEPENDS ON EXTERNAL SERVICE` |
| **Temporal Change Detection** | Compares T1 and T2 building detections using centroid matching ($15\text{m}$). | `src/server/tools/changeDetectionProvider.ts`. | Seattle 2019 vs 2023 Change | `IMPLEMENTED` |
| **Auditable Evidence & Provenance** | Attaches immutable source URIs, STAC IDs, asset keys, and timestamps to outputs. | `src/server/analysis/executor.ts` & `types/index.ts`. | JSON Evidence Export | `IMPLEMENTED` |

---

## Section 3 — Core Value Proposition

CogniSights provides a dependable bridge between human language and remote-sensing analytical engines:
1. **Natural Language Interaction**: Eliminates complex SQL/Python GIS boilerplate by translating user queries into execution plans.
2. **Automated Satellite Asset Discovery**: Connects directly to STAC catalogs to locate relevant satellite imagery based on bounding boxes and temporal constraints.
3. **Geographic & Spatial Reasoning**: Dynamically resolves location boundaries and applies Turf.js spatial operations (buffer, intersection, area).
4. **Deterministic Spectral Analysis**: Computes exact vegetation indices (NDVI) using floating-point pixel math without artificial intelligence guessing.
5. **Machine-Learning Feature Extraction**: Integrates computer-vision models to extract building footprints from satellite tiles.
6. **Temporal Analysis**: Tracks feature additions and removals across independent imagery dates.
7. **Complete Provenance**: Every output is traceable to specific STAC Item IDs, satellite pass datetimes, model identifiers, and source API endpoints.

---

## Section 4 — Technical Differentiation

CogniSights uses a specialized **LLM–Deterministic Sandwich** architecture:

$$\text{Natural Language} \xrightarrow{\text{Gemini AI}} \text{Structured Query} \xrightarrow{\text{Deterministic Engine}} \text{Verified Data \& GIS Math} \xrightarrow{\text{Gemini AI}} \text{Summary Response}$$

### Why CogniSights Differs from Asking an LLM Directly:
- **No Hallucinated Coordinates**: Geocoding and bounding boxes come strictly from Nominatim API payloads.
- **No Hallucinated Satellite Images**: Imagery items and asset links come strictly from Planetary Computer STAC catalog responses.
- **No Hallucinated Calculations**: NDVI values, polygon areas, and spatial buffers are computed by deterministic TypeScript math libraries (`@turf/turf`, `Float32Array`).
- **No Hallucinated Predictions**: Building footprints are generated by a dedicated computer vision model (`Roboflow`), not an LLM.
- **Auditable Evidence Trail**: Outputs include verifiable evidence records detailing STAC item IDs, asset names, and acquisition dates.

---

## Section 5 — Capability Mapping

1. **Natural Language Query Understanding**
   - *Solves*: Interpreting unstructured user input into analytical parameters.
   - *Implementation*: `src/server/ai/gemini.ts` using Gemini 3.6 Flash.
   - *Limitation*: Relies on LLM schema parsing accuracy for complex multi-nested conditions.
2. **AOI / Geocoding**
   - *Solves*: Converting place names (e.g. "Seattle", "Pune") into geographic bounding boxes.
   - *Implementation*: `src/server/tools/geocoderProvider.ts` via Nominatim API.
   - *Limitation*: Dependent on OpenStreetMap Nominatim service uptime.
3. **OSM Semantic Vector Search**
   - *Solves*: Locating ground infrastructure (roads, hospitals, rivers).
   - *Implementation*: `src/server/tools/geospatialFeatureProvider.ts` via Overpass API.
   - *Limitation*: Large query areas may be constrained by Overpass server execution timeouts.
4. **Satellite Imagery Discovery**
   - *Solves*: Locating satellite imagery covering an AOI within a specified date window.
   - *Implementation*: `src/server/tools/imageryProvider.ts` via Planetary Computer STAC.
   - *Limitation*: Dependent on cloud provider catalog coverage.
5. **Raster Window Processing**
   - *Solves*: Streaming and reading raster sub-window pixel data from cloud GeoTIFFs.
   - *Implementation*: `src/server/tools/rasterProcessingProvider.ts` using `geotiff`.
   - *Limitation*: Sub-window size capped at $1024 \times 1024$ pixels to prevent server memory exhaustion.
6. **Normalized Difference Vegetation Index (NDVI)**
   - *Solves*: Quantifying vegetation health and density.
   - *Implementation*: `src/server/tools/ndviProvider.ts`.
   - *Limitation*: Requires multi-spectral imagery assets containing Red and NIR bands.
7. **High-Resolution Dataset Selection**
   - *Solves*: Selecting suitable STAC collections based on query targets.
   - *Implementation*: `src/server/tools/datasetProvider.ts`.
   - *Limitation*: Term matching based on query keywords.
8. **Building Detection**
   - *Solves*: Extracting individual building footprints from high-resolution imagery.
   - *Implementation*: `src/server/tools/inference/remoteInferenceAdapter.ts` & `buildingDetectionProvider.ts`.
   - *Limitation*: Output quality depends on remote model weights. Detections are model-derived predictions, not ground truth.
9. **Temporal Change Detection**
   - *Solves*: Comparing feature footprints across two distinct acquisition dates ($T_1$ vs $T_2$).
   - *Implementation*: `src/server/tools/changeDetectionProvider.ts`.
   - *Limitation*: Evaluates model-derived changes using centroid distance thresholds ($15\text{m}$); does not independently verify physical ground-truth construction without field data.
10. **GIS Buffering, Intersection, & Area Calculation**
    - *Solves*: Spatial proximity analysis and geometric measurement.
    - *Implementation*: `src/server/tools/gisProvider.ts` via `@turf/turf`.
    - *Limitation*: Geometry inputs must conform strictly to WGS84 GeoJSON specifications.
11. **Evidence & Provenance Logging**
    - *Solves*: Ensuring transparency, repeatability, and auditability.
    - *Implementation*: `src/server/analysis/executor.ts` & `types/index.ts`.
    - *Limitation*: Sanitized to exclude private API keys or security tokens.
12. **Failure Handling**
    - *Solves*: Preventing pipeline crashes and masking errors.
    - *Implementation*: `executor.ts` & provider modules.
    - *Limitation*: Returns explicit `FAILED`, `NOT_IMPLEMENTED`, or `SKIPPED` statuses.
13. **Security Architecture**
    - *Solves*: Protecting API credentials and preventing unauthorized resource usage.
    - *Implementation*: `.env` server isolation, Zod input validation, URL sanitization, and resource bounds.
    - *Limitation*: Server-side environment configuration required.

---

## Section 6 — Demonstrable Use Cases

### A. "Detect buildings in Seattle"
- **User Query**: `"Detect buildings in Seattle"`
- **Execution Flow**: Geocode Seattle → STAC Dataset Search → STAC Item Search → Read GeoTIFF Window → Remote Roboflow ML Inference → `proj4` Affine Georeferencing to WGS84 Polygons → Evidence Generation.
- **Actual Data Sources**: Nominatim, Planetary Computer STAC, Roboflow Building Segmentation Model.
- **Output Type**: `ObjectDetectionResult` containing GeoJSON Polygon features and confidence scores.
- **Honest Claim**: Model-derived building detection over sampled satellite imagery window with full STAC provenance.
- **Important Limitation**: Detections are predictions from a computer vision model, not ground-truth tax records.

### B. "Detect buildings added or removed between 2019 and 2023 in Seattle"
- **User Query**: `"Detect buildings added or removed between 2019 and 2023 in Seattle"`
- **Execution Flow**: Dual DAG Branches ($T_1=2019, T_2=2023$) → Independent STAC Searches → Independent Raster Reads → Independent ML Detections → Centroid Distance Match ($15\text{m}$) → Added / Removed / Unchanged Feature Collections.
- **Actual Data Sources**: Planetary Computer STAC (2019 & 2023 scenes), Roboflow ML Model.
- **Output Type**: `ChangeDetectionResult` with distinct feature collections for added, removed, and unchanged buildings.
- **Honest Claim**: Algorithmic comparison of ML building footprints between two satellite acquisitions.
- **Important Limitation**: Represents model-derived changes between satellite passes, not physically verified construction or demolition dates.

### C. "Analyze vegetation in Pune"
- **User Query**: `"Analyze vegetation in Pune"`
- **Execution Flow**: Geocode Pune → STAC Imagery Search → Read 4-Band Raster Window → Deterministic NDVI Matrix Calculation → Statistical Summary.
- **Actual Data Sources**: Nominatim, Planetary Computer STAC (Sentinel-2 / NAIP multi-spectral imagery).
- **Output Type**: `NDVIResult` with min, max, mean, median, P25, P75, and valid pixel counts.
- **Honest Claim**: Exact mathematical calculation of NDVI over non-NoData raster pixels.
- **Important Limitation**: Requires multi-spectral assets containing Red and NIR bands; 3-band RGB imagery returns `NOT_IMPLEMENTED`.

### D. "Find hospitals near Pune"
- **User Query**: `"Find hospitals near Pune"`
- **Execution Flow**: Geocode Pune → Parse Semantic Query (`amenity=hospital`) → Query Overpass API → Parse Geometry → Evidence Generation.
- **Actual Data Sources**: OpenStreetMap Overpass API.
- **Output Type**: `GeoJSONFeatureCollection` (Points / Polygons).
- **Honest Claim**: Direct retrieval of community-mapped hospital infrastructure from OpenStreetMap.
- **Important Limitation**: Coverage depends on OpenStreetMap contributor mapping completeness in Pune.

### E. "Find roads within 500m of Pune"
- **User Query**: `"Find roads within 500m of Pune"`
- **Execution Flow**: Geocode Pune → Turf.js $500\text{m}$ Buffer on Pune Polygon → Overpass Highway Query → Turf.js Spatial Intersection → Evidence Generation.
- **Actual Data Sources**: OpenStreetMap Nominatim, OpenStreetMap Overpass API.
- **Output Type**: Intersected `GeoJSONFeatureCollection` of road LineStrings.
- **Honest Claim**: Geodesic spatial buffer and vector intersection executed deterministically.
- **Important Limitation**: Bounded by Overpass query result size caps.

---

## Section 7 — Trustworthiness & Provenance

CogniSights enforces a strict trust model:
1. **Actual STAC Acquisition Datetimes**: Timestamps associated with satellite imagery reflect true metadata timestamps (`properties.datetime`), distinct from user query date ranges.
2. **STAC Metadata Provenance**: Every raster asset retains its catalog Item ID, collection name, asset key, and source URL.
3. **Remote Model Provenance**: Machine learning detections include model name, model version, and confidence thresholds reported by the remote inference engine.
4. **Deterministic Math Transformations**: Spatial projections (`proj4`), NDVI matrix calculations, and Turf.js spatial operations are executed by deterministic code.
5. **Zod Schema Validation**: All external API payloads, query structures, and GeoJSON features are validated against strict Zod schemas.
6. **Exportable Evidence JSON**: Every query generates an auditable JSON evidence report containing data source, dataset ID, date, operation, confidence, and provenance strings.
7. **Explicit Failure States**: Unhandled errors, missing credentials, or unsupported features return explicit `FAILED`, `NOT_IMPLEMENTED`, or `SKIPPED` statuses rather than synthetic fallback values.

> [!CAUTION]
> **Prediction Transparency Statement**: Building footprint detections and temporal change maps are model-derived predictions generated by computer vision algorithms, not ground-truth field surveys.

---

## Section 8 — Verified Limitations

1. **Model Accuracy Measurement**: Remote ML model precision, recall, IoU, and F1 scores have not been independently evaluated against a ground-truth benchmark dataset in this repository.
2. **Ground-Truth Field Data**: No physical field-survey ground-truth dataset is included in the codebase.
3. **Third-Party Service Uptime**: Performance depends on external availability of OpenStreetMap Nominatim, Overpass API, Microsoft Planetary Computer, and Roboflow endpoints.
4. **Spectral Band Dependencies**: NDVI computation requires multi-spectral imagery assets containing Red and NIR bands; single-band or 3-band RGB assets cannot compute NDVI and return `NOT_IMPLEMENTED`.
5. **Sub-Window Sampling Limit**: Raster window sampling is capped at $1024 \times 1024$ pixels to enforce server memory and payload stability.

---

## Section 9 — Future Scope

### Currently Implemented:
- Gemini natural-language query parsing and response synthesis.
- Nominatim geocoding & Overpass vector feature search.
- Planetary Computer STAC imagery discovery & SAS token signing.
- GeoTIFF raster window reading & deterministic NDVI calculation.
- Roboflow remote building detection & affine WGS84 georeferencing.
- Deterministic 1-to-1 centroid matching for temporal change detection.
- Turf.js spatial buffer, intersection, and area calculations.
- Immutably logged JSON evidence export.

### Future / Proposed Scope (Not Currently Implemented):
- Onboard local ONNX model runtime execution to eliminate remote inference network dependencies.
- Multi-temporal Synthetic Aperture Radar (SAR) Sentinel-1 change detection for cloud-covered areas.
- Automated spatial tile caching and offline raster persistence.
- Integration of custom user-uploaded GeoJSON / Shapefile ground-truth validation datasets.

---

## Section 10 — 30-Second Judge Answer

> CogniSights is a natural-language geospatial intelligence system that translates user queries into deterministic analysis plans. It searches live OpenStreetMap features and Microsoft Planetary Computer satellite imagery, reads GeoTIFF raster pixels, computes exact NDVI mathematics, orchestrates computer-vision building detection, and performs temporal change matching. Crucially, CogniSights uses an LLM only for language interpretation and final text summary, while all spatial calculations, imagery fetches, and GIS operations are executed by deterministic code with full auditable evidence trails.

---

## Section 11 — 2-Minute Technical Answer

> **Problem**: Standard LLMs cannot process multi-gigabyte satellite imagery or perform spatial mathematics, resulting in hallucinated coordinates, fake dates, and unreliable claims.
> 
> **Solution**: CogniSights implements an **LLM–Deterministic Sandwich** architecture.
> 
> **Architecture**: An LLM (Gemini 3.6 Flash) converts natural-language queries into a structured JSON schema. A deterministic planner converts this schema into a Directed Acyclic Graph (DAG) execution plan.
> 
> **Real Data Integration**: The execution engine queries live APIs—OpenStreetMap Nominatim for geocoding, Overpass for vector features, and Microsoft Planetary Computer for STAC satellite catalogs.
> 
> **Deterministic Processing**: Satellite raster windows are accessed via SAS tokens and processed locally using GeoTIFF decoders. NDVI is computed mathematically using exact floating-point pixel formulas $(NIR - Red)/(NIR + Red)$. Spatial buffering and intersections are computed using Turf.js, while pixel detections are georeferenced to WGS84 coordinates using `proj4` affine transformations.
> 
> **Machine Learning & Change Detection**: High-resolution tiles are submitted to a remote ML inference API for building detection. Temporal change detection compares feature sets across acquisitions using 15-meter centroid distance matching.
> 
> **Evidence & Limitations**: Every query generates an auditable JSON evidence export. CogniSights clearly labels detections as model-derived predictions rather than ground truth, and gracefully returns `NOT_IMPLEMENTED` or `FAILED` statuses when services or spectral bands are unavailable.

---

## Section 12 — Mapping Status Summary

- **Document File**: `docs/SIH_PROBLEM_MAPPING.md`
- **Official Problem Statement Source**: `Not Found` (No local raw text file of Problem Statement 26167 in repository; mapped using verified implementation audit facts).
- **Requirements Mapped**: 10 requirements.
- **Implemented Count**: 6 requirements (`IMPLEMENTED`).
- **External Dependencies Count**: 4 requirements (`DEPENDS ON EXTERNAL SERVICE`).
- **Verified Demos**: 5 core workflows (Seattle Buildings, Seattle Temporal Change, Pune Vegetation, Pune Hospitals, Pune Roads).
- **Unsupported Claims Removed**: Hallucinated ground truth, unverified F1 accuracy metrics, fabricated satellite acquisition dates, and direct LLM spatial calculations.
