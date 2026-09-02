# CogniSights / SATQuery: Final Live Demonstration Strategy

This document provides the official live demonstration strategy for presenting CogniSights (SATQuery) to judges, technical evaluators, and stakeholders at the Smart India Hackathon (SIH) / ISRO evaluation.

---

## Section 1 — Demo Objective

The live demonstration must prove that CogniSights is a general natural-language Earth Observation (EO) and GIS intelligence system built on an **LLM–Deterministic Sandwich** architecture.

### Key Capabilities Demonstrated:
1. **Natural-Language Interaction**: User enters free-form text queries without writing SQL, Python, or GIS code.
2. **Real Geospatial Data**: Live location resolution via OpenStreetMap Nominatim and feature extraction via Overpass API.
3. **Real Satellite Imagery**: Live catalog discovery and sub-window image streaming from Microsoft Planetary Computer STAC.
4. **Deterministic Analysis**: Exact mathematical computations for NDVI indices and Turf.js spatial operations (buffer, intersection, area).
5. **Remote ML Inference**: Automated building instance detection on sub-window satellite tiles via Roboflow model endpoints.
6. **Temporal Change Detection**: Multi-temporal scene comparison across satellite acquisition dates using centroid distance matching.
7. **Auditable Evidence & Provenance**: Immutable JSON evidence trails detailing STAC Item IDs, satellite pass datetimes, and model provenance.
8. **Failure-Safe Architecture**: Graceful degradation returning `FAILED`, `NOT_IMPLEMENTED`, or `SKIPPED` statuses without stack traces or AI hallucinations.

---

## Section 2 — Recommended Demo Order

| Order | Query | Type | Duration | Architectural Components Demonstrated | Key Judge Takeaway |
|---|---|---|---|---|---|
| **1. Primary** | `"Detect buildings in Seattle"` | EO + ML Inference | ~45s | Geocoder, STAC Search, SAS Sign, GeoTIFF Window, Roboflow ML, `proj4` Georeferencing | Proves end-to-end LLM → STAC → ML → GeoJSON → Map pipeline |
| **2. Secondary** | `"Detect buildings added or removed between 2019 and 2023 in Seattle"` | Temporal Analysis | ~60s | Dual Temporal DAG Branches, STAC Timestamps, Independent ML, 15m Centroid Matcher | Proves multi-temporal scene comparison across real satellite acquisition dates |
| **3. Technical** | `"Analyze vegetation in Pune"` | Spectral Analysis | ~35s | Multi-Spectral Raster, 4-Band Array Reader, Deterministic NDVI Math, NoData Filter | Proves exact floating-point pixel math vs AI hallucinated numbers |
| **4. Optional** | `"Find roads within 500m of Pune"` | Vector GIS | ~25s | Nominatim AOI, Turf.js Geodesic Buffer, Overpass Highway Query, Spatial Intersection | Proves combined vector GIS buffering and network intersection |
| **5. Optional** | `"Find hospitals near Pune"` | Semantic Vector Search | ~20s | Overpass QL Query Parsing, OSM Amenity Vector Feature Extraction | Proves rapid semantic infrastructure discovery |

---

## Section 3 — Primary Demo: Seattle Building Detection

### Query: `"Detect buildings in Seattle"`

#### 1. Presenter Action:
Type `"Detect buildings in Seattle"` into the input box and click **Execute**.

#### 2. What Appears On Screen:
- Real-time step status list updating from `PENDING` to `SUCCESS`.
- Leaflet map centering on Seattle, displaying building detection GeoJSON polygons.
- Synthesized markdown summary displaying detection counts and location context.
- Evidence drawer displaying STAC item IDs, asset keys, and Roboflow model IDs.

#### 3. Presenter Explanation:
> *"Notice that I typed a simple natural-language question. CogniSights did not hardcode Seattle's coordinates. It resolved the bounding box from OpenStreetMap Nominatim, discovered satellite imagery from Microsoft Planetary Computer, streamed high-resolution raster pixels, and submitted them to a remote building instance segmentation model. Finally, it georeferenced those pixel bounding boxes into geographic WGS84 polygons using affine projection transforms."*

#### 4. Internal Workflow:
```
Natural Language → StructuredQuery → Deterministic Planner → DAG
  └─► Step 1: Nominatim Geocoding → Seattle Bbox: [-122.43, 47.49, -122.22, 47.73]
  └─► Step 2: STAC Catalog Search → NAIP / Sentinel-2 catalog match
  └─► Step 3: STAC Item Search → Item ID: wa_m_47122...
  └─► Step 4: SAS Sign & GeoTIFF Sub-window Read (1024x1024 sample)
  └─► Step 5: PNG Tile Encoding & Roboflow Remote ML Inference
  └─► Step 6: proj4 Pixel-to-WGS84 Affine Transform → GeoJSON Polygons
  └─► Step 7: Evidence Log Attachment & Synthesis
```

#### 5. Evidence to Highlight:
Open the **Evidence & Provenance Export** panel and point out:
- `source`: `"Microsoft Planetary Computer"`
- `dataset`: STAC Item ID and asset key (`visual`)
- `date`: Real satellite pass acquisition timestamp (`properties.datetime`)
- `provenance`: Direct URL link to Planetary Computer STAC Item

#### 6. What Makes It Trustworthy:
- Coordinates came from Nominatim API, not LLM memory.
- Imagery came from Planetary Computer STAC search, not stored images.
- Detections came from Roboflow ML model, not LLM predictions.

#### 7. What NOT to Claim:
- Do **NOT** claim 100% building detection accuracy.
- Do **NOT** call detections "ground truth" (they are model-derived predictions).

---

## Section 4 — Secondary Demo: Temporal Building Change

### Query: `"Detect buildings added or removed between 2019 and 2023 in Seattle"`

#### Presenter Explanation:
> *"CogniSights handles temporal queries by constructing independent parallel execution branches. The planner creates a T1 branch for 2019 and a T2 branch for 2023. Each branch retrieves its own satellite scene and performs independent ML building detection. The change detection provider then compares centroid distances using a 15-meter threshold to classify buildings into Added, Removed, and Unchanged layers."*

#### Key Highlights to Show:
- **Dual Temporal Branches**: Point out DAG execution steps for both 2019 and 2023.
- **Actual Acquisition Timestamps**: Show that evidence records contain exact satellite acquisition dates for 2019 and 2023 scenes.
- **Centroid Matching**: Explain that matching is performed by Turf.js centroid distance calculations ($15\text{m}$ threshold), generating distinct GeoJSON layers for added, removed, and unchanged features.

> [!WARNING]
> **Presenter Disclaimer**: Explicitly inform judges that change detection outputs represent algorithmic spatial comparisons between two satellite passes, not physically verified municipal construction records.

---

## Section 5 — Secondary Technical Demo: Pune Vegetation Analysis

### Query: `"Analyze vegetation in Pune"`

#### Presenter Explanation:
> *"To analyze vegetation, CogniSights does not ask an LLM to guess vegetation density. It retrieves multi-spectral satellite imagery from Planetary Computer, extracts raw Red and Near-Infrared (NIR) pixel arrays from the GeoTIFF raster window, and computes the Normalized Difference Vegetation Index (NDVI) pixel-by-pixel using the exact formula (NIR - Red) / (NIR + Red). NoData pixels and zero denominators are strictly excluded, producing verifiable statistical summaries (mean, median, P25, P75)."*

#### Key Highlights to Show:
- **Deterministic Math**: Explain that NDVI statistics are calculated directly over `Float32Array` pixel data.
- **Spectral Asset Requirement**: Explain that if NIR bands are missing, CogniSights returns `NOT_IMPLEMENTED` rather than fabricating fake NDVI numbers.

---

## Section 6 — Optional Vector GIS Demos

### A. `"Find roads within 500m of Pune"`
- **Highlights**: Demonstrates Turf.js spatial buffer ($500\text{m}$) applied to Pune's AOI polygon, combined with Overpass highway vector feature queries and spatial intersections.

### B. `"Find hospitals near Pune"`
- **Highlights**: Demonstrates rapid semantic vector search querying OpenStreetMap Overpass API for `amenity=hospital`.

---

## Section 7 — 3-Minute Live Demo Script

- **0:00 - 0:30 (Problem & Vision)**:
  > *"Judges, standard LLMs cannot process satellite imagery or perform spatial mathematics, resulting in hallucinated coordinates and unreliable answers. CogniSights solves this through an LLM–Deterministic Sandwich architecture: LLMs understand language, but deterministic software and specialized ML models do all the heavy lifting."*

- **0:30 - 1:30 (Primary Demo Execution)**:
  > *"Watch as I type 'Detect buildings in Seattle'. CogniSights parses the intent, geocodes Seattle via Nominatim, searches Microsoft Planetary Computer STAC for imagery, streams a GeoTIFF sub-window, runs Roboflow building detection, and project coordinates to WGS84 GeoJSON polygons."*

- **1:30 - 2:15 (Map & Provenance)**:
  > *"Here on the Leaflet map, you see real building footprint polygons. Look at the evidence panel: every result includes actual satellite acquisition timestamps, STAC Item IDs, and model provenance. Nothing is fabricated."*

- **2:15 - 3:00 (Summary & Differentiation)**:
  > *"CogniSights delivers accurate, auditable geospatial intelligence by keeping AI out of calculations and grounding every answer in real Earth Observation data. Thank you."*

---

## Section 8 — 5-Minute Live Demo Script

- **0:00 - 0:45**: Architecture introduction & LLM–Deterministic Sandwich concept.
- **0:45 - 2:00**: Primary Demo (`"Detect buildings in Seattle"`) — STAC imagery, ML inference, georeferencing, Leaflet map.
- **2:00 - 3:15**: Secondary Temporal Demo (`"Detect buildings added or removed between 2019 and 2023 in Seattle"`) — Dual DAG branches, centroid matching, Added/Removed layers.
- **3:15 - 4:15**: Technical Demo (`"Analyze vegetation in Pune"`) — Multi-spectral raster reading, exact NDVI math $(NIR - Red)/(NIR + Red)$, statistical summary.
- **4:15 - 5:00**: Evidence JSON Export review, failure handling explanation (`FAILED` / `NOT_IMPLEMENTED`), and Q&A.

---

## Section 9 — Judge Q&A Talking Points

1. **What does CogniSights actually do?**
   > *CogniSights translates natural-language geospatial questions into deterministic DAG execution plans that query live OpenStreetMap features, STAC satellite imagery catalogs, GeoTIFF rasters, and computer-vision ML models.*
2. **Why use an LLM at all?**
   > *LLMs excel at natural language understanding and converting user intent into structured JSON schemas, as well as synthesizing text summaries. We use LLMs ONLY for language tasks.*
3. **Why not let the LLM perform GIS calculations?**
   > *LLMs cannot reliably process raw multiband raster arrays or perform precise spatial geometry calculations. Letting LLMs do spatial math causes severe hallucinations.*
4. **Where does satellite imagery come from?**
   > *Live STAC catalog searches on Microsoft Planetary Computer API (`planetarycomputer.microsoft.com`).*
5. **Is the satellite imagery real?**
   > *Yes. CogniSights signs SAS tokens, streams real GeoTIFF raster sub-windows, and logs exact STAC Item IDs and satellite pass timestamps.*
6. **How is building detection performed?**
   > *Sub-window raster pixels are encoded as PNG tiles and processed by a remote Roboflow instance segmentation model. The resulting pixel bounding boxes are projected to WGS84 GeoJSON polygons using `proj4` affine matrices.*
7. **How is temporal change detection performed?**
   > *The planner creates independent DAG branches for dates T1 and T2. Building footprints detected in both scenes are compared using Turf.js 15-meter centroid distance matching to compute Added, Removed, and Unchanged feature sets.*
8. **How do you prevent hallucinated coordinates?**
   > *All coordinates and bounding boxes are retrieved directly from OpenStreetMap Nominatim payloads, not generated by an LLM.*
9. **How do you prove where results came from?**
   > *Every tool appends immutable `Evidence` objects containing data sources, STAC Item IDs, asset keys, acquisition dates, model IDs, and provenance URIs into an exportable JSON report.*
10. **What happens if an external API fails?**
    > *CogniSights uses a resilient retry layer (`fetchWithRetry`) with exponential backoff. If an API remains unavailable, the system returns explicit `FAILED` or `NOT_IMPLEMENTED` statuses without masking errors or inventing fake results.*
11. **Are building change detections ground truth?**
    > *No. They are model-derived comparisons between two satellite acquisitions. We explicitly communicate this limitation.*
12. **What are current system limitations?**
    > *Raster window sampling is capped at $1024 \times 1024$ pixels, remote inference depends on network endpoint availability, and NDVI requires spectral assets containing NIR bands.*
13. **What makes this different from traditional desktop GIS software?**
    > *Traditional GIS requires manual layer downloads, catalog searches, and Python/QGIS scripting. CogniSights automates the entire discovery, processing, and visualization pipeline through natural language.*

---

## Section 10 — Demo Failure Plan

| Failure Scenario | Presenter Fallback Strategy | What NOT to Do |
|---|---|---|
| **Gemini API Error / Throttled** | Switch to second query or show pre-built architecture diagram (`docs/ARCHITECTURE.md`) while retry completes. | Do **NOT** simulate or fake Gemini JSON responses. |
| **Planetary Computer STAC Timeout** | Pivot to Vector GIS demo (`"Find roads within 500m of Pune"` or `"Find hospitals near Pune"`). | Do **NOT** display hardcoded satellite images. |
| **Roboflow Inference Endpoint Unavailable** | Point out that system gracefully returns `NOT_IMPLEMENTED` with clear explanation, demonstrating safety. | Do **NOT** create mock building boxes. |
| **Overpass API Throttled (HTTP 429/503)** | Show the primary Building Detection demo (`"Detect buildings in Seattle"`). | Do **NOT** invent fake road networks. |
| **Slow Network Connection** | Explain `fetchWithRetry` exponential backoff and point judges to completed step status logs. | Do **NOT** refresh the page frantically. |

---

## Section 11 — Pre-Demo Verification Checklist

- [ ] `.env` file present on server with valid `GEMINI_API_KEY`, `INFERENCE_API_URL`, and `INFERENCE_API_KEY`.
- [ ] Server successfully built (`npm run build`).
- [ ] Server running in production mode (`npm start` listening on `http://localhost:3000`).
- [ ] Browser open to `http://localhost:3000` with map rendering cleanly.
- [ ] Evidence export drawer verified working.
- [ ] Zero API keys exposed in browser console or DOM inspector.
- [ ] Network connection verified active.

---

## Section 12 — Claims to Avoid

- **Do NOT claim 100% detection accuracy**: Model performance depends on remote inference weights.
- **Do NOT claim physical ground-truth construction dates**: Change maps represent scene footprint comparisons across satellite passes.
- **Do NOT claim zero-latency performance**: Live cloud API queries and image downloads require network time.
- **Do NOT claim offline capability**: System requires network connections for STAC, Nominatim, Overpass, and Roboflow APIs.
- **Do NOT claim capabilities not present in code**: Only demonstrate verified capabilities documented in `docs/ARCHITECTURE.md` and `docs/SIH_PROBLEM_MAPPING.md`.
