# SIH 2026 — Shortlisted Problem Statements Comparison

> **Purpose:** Initial team-level screening of five shortlisted SIH problem statements.  

---

## 1. Shortlist at a Glance

| # | PS ID | Problem Statement | Domain | Organization | Theme | Initial Status |
|---|---|---|---|---|---|---|
| 1 | **SIH26167** | **SatQuery AI** — Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries | GeoAI / Computer Vision / VLM | ISRO | Space Technology | 🟢 **Strong Candidate** |
| 2 | **SIH26162** | **AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data** | Remote Sensing / AI / GIS / Safety | NTRO | Miscellaneous | 🟢 **Strong Candidate** |
| 3 | **SIH26153** | **AI based Network Attack Forecasting from Network Traffic Data** | Cybersecurity / AI / Time Series | NTRO | Blockchain & Cybersecurity | 🟢 **Strong Candidate** |
| 4 | **SIH26074** | **Downscaling of weather forecast from Block level to Panchayat level... for agro-meteorological advisory services** | Weather / Agriculture / Spatiotemporal AI | MoES | Disaster Management | 🟡 **Data Verification Required** |
| 5 | **SIH26038** | **Explainable AI for Diabetic Retinopathy Screening in Rural India** | Medical AI / Computer Vision | MathWorks | Clean & Green Technology | 🟠 **High Validation Risk** |

---

# 2. Side-by-Side Comparison

| Parameter | 🛰️ SatQuery AI | 🔥 Industrial Fire Detection | 🛡️ Network Attack Forecasting | 🌦️ Weather Downscaling | 👁️ Diabetic Retinopathy |
|---|---|---|---|---|---|
| **PS ID** | SIH26167 | SIH26162 | SIH26153 | SIH26074 | SIH26038 |
| **Core problem** | Understand and query remote-sensing imagery using natural language | Detect/classify industrial fires and persistent thermal sources | Forecast network attack risk from traffic behaviour | Downscale block-level weather information to Panchayat level | Screen diabetic retinopathy from retinal images with explainability |
| **Main input** | Satellite/remote-sensing imagery + text query | FIRMS/thermal observations + satellite/geospatial data | Network traffic/flow data + historical observations | Block-level weather forecasts + observations + geographic data | Retinal/fundus image |
| **Main output** | Natural-language answer + visual grounding/highlighting | Thermal-event detection + classification/risk + map/alert | Attack-risk trend + early warning + explanation | Panchayat-level weather information + uncertainty/advisory | DR prediction + visual explanation |
| **Real-time dependency** | 🟡 Depends on imagery source/revisit | 🟡 Near-real-time satellite observations | 🟢 Potentially real-time | 🟢 Important for operational forecasting | 🔴 Not inherently real-time |
| **Historical data usefulness** | 🟢 High for training/comparison | 🟢 High for persistence/training | 🟢 High | 🟢 High for training/validation | 🟢 High |
| **Public data for development** | 🟡 Good, domain-specific data needs verification | 🟢 Strong | 🟢 Strong | 🟡 Exact required resolution/access needs verification | 🟢 Public research datasets exist |
| **Need private data?** | Not necessarily | Not necessarily | Not for initial development; real deployment needs operational telemetry | Exact validation pipeline must be verified | Not necessarily for initial research |
| **Technical depth** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐½ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **AI/ML scope** | VLM + CV + segmentation + change detection | CV/ML + anomaly detection + geospatial AI | ML/DL + anomaly detection + time-series forecasting | Spatiotemporal ML/DL | CNN/DL + XAI |
| **Software-product potential** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Deployment potential** | 🟢 High | 🟢 Very High | 🟢 High | 🟢 High* | 🟠 Moderate / high validation barrier |
| **Real-world impact** | ⭐⭐⭐⭐½ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scalability** | 🟢 High | 🟢 High | 🟢 High | 🟢 Very High | 🟢 High technically / harder clinically |
| **Main weakness** | VLM grounding + suitable multimodal data | Satellite resolution/revisit + false positives | Forecasting is harder than detection; generalization | Panchayat-level validation/data availability | Clinical validation and generalization |
| **Biggest question to verify** | Can we obtain enough suitable data and build reliable visual grounding? | Can satellite observations reliably distinguish industrial fires/thermal sources? | Can we genuinely forecast attacks rather than only classify existing attacks? | Do we have the exact block-level inputs and Panchayat-level ground truth needed? | Can performance generalize sufficiently for meaningful clinical use? |
| **Final-product vision** | Geospatial AI assistant | Industrial thermal-event monitoring & alert platform | Proactive cyber-risk early-warning platform | Panchayat-level weather intelligence & advisory platform | Explainable retinal screening assistant |
| **Overall risk** | 🟡 Medium | 🟡 Medium | 🟡 Medium–High | 🟠 High until data is verified | 🔴 High validation risk |

\* Weather Downscaling deployment potential depends strongly on verifying the required operational data pipeline.

---


# 4. Data Availability — Critical Comparison

| PS | Development Data | Real-World Data Problem | Confidence |
|---|---|---|---|
| **SatQuery AI** | Public remote-sensing imagery exists; multimodal/domain-specific data needs investigation | Need reliable imagery + suitable query/annotation data | 🟡 |
| **Industrial Fire** | NASA FIRMS + satellite/geospatial sources specified by PS | Resolution, revisit frequency and industrial-event labels | 🟢 |
| **Network Attack** | Multiple public cybersecurity datasets | Need operational telemetry for real deployment/generalization | 🟢 |
| **Weather Downscaling** | Weather datasets/services exist | Exact Panchayat-level validation data is the key uncertainty | 🟡 |
| **Diabetic Retinopathy** | Public retinal datasets exist | Clinical/generalization validation | 🟡/🟠 |

---


# 6. Strengths vs Main Caveat

| PS | Biggest Strength | Biggest Caveat |
|---|---|---|
| 🛰️ **SatQuery AI** | Excellent combination of VLM + CV + geospatial intelligence | Need to establish suitable multimodal data and reliable grounding |
| 🔥 **Industrial Fire** | Very clear product workflow + strong data foundation + high impact | Satellite limitations and false positives |
| 🛡️ **Network Attack** | Extremely strong AI/cybersecurity depth + proactive-security potential | Must prove genuine forecasting and generalization |
| 🌦️ **Weather Downscaling** | Massive agricultural/social impact + advanced spatiotemporal AI | Exact data/validation pipeline must be verified |
| 👁️ **Diabetic Retinopathy** | Strong deep-learning + explainability problem | Clinical validation/generalization is difficult |

---

# 7. Current Buckets

### 🟢 Strongest Candidates

**1. SatQuery AI**

Strong combination of:
- technical depth
- product potential
- AI novelty
- geospatial applications
- future scope

**2. Industrial Fire Detection**

Strong combination of:
- clearly defined workflow
- strong real-world impact
- identifiable data sources
- high deployment potential

**3. Network Attack Forecasting**

Strong combination of:
- cybersecurity relevance
- high technical depth
- proactive AI
- strong future product potential

---

### 🟡 Strong but Data Verification Required

**4. Weather Downscaling**

Could potentially move into the top group if the team verifies:

- exact input data
- spatial/temporal resolution
- Panchayat-level validation data
- accessibility for development
- operational/current-data pipeline

---

### 🟠 Technically Excellent but High Validation Risk

**5. Diabetic Retinopathy**

Excellent AI problem with public research datasets, but the team must be careful not to confuse:

> **"We can build an accurate model on a public dataset"**

with

> **"We have a clinically deployable medical system."**

---


# 9. Preliminary Overall View

| Position | PS | Why |
|---|---|---|
| 🥇 **1** | **SatQuery AI** | Strong balance of innovation, AI depth, product potential and future scope |
| 🥈 **2** | **Industrial Fire Detection** | Strong data/product/deployment combination and very clear real-world impact |
| 🥉 **3** | **Network Attack Forecasting** | Excellent technical depth and future scope, but forecasting/generalization are challenging |
| 4 | **Weather Downscaling** | Potentially extremely impactful, but data verification could change its position significantly |
| 5 | **Diabetic Retinopathy** | Technically excellent and impactful, but clinical validation creates the largest deployment barrier |

---

The team can make the final selection based on **what can realistically become a strong, meaningful and defensible SIH solution**, not simply which PS sounds interesting.
