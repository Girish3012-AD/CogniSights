# SIH26162 — AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data

## 1. Basic Information

- **Problem Statement ID:** SIH26162
- **Official Title:** AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data
- **Organization:** National Technical Research Organisation (NTRO)
- **Category:** Software
- **Theme:** Miscellaneous
- **Status:** 🟢 Strong Candidate

## 2. Problem in Simple Words

Use satellite-derived thermal/active-fire information together with geographic context to identify and classify potentially important industrial fires or persistent thermal sources.

The key idea is not simply displaying a hotspot. A thermal anomaly can have multiple causes.

## 3. What Are We Building?

A monitoring platform that:
1. obtains satellite thermal/active-fire observations,
2. identifies thermal anomalies,
3. checks their geographic/industrial context,
4. studies persistence over time,
5. classifies/ranks the event,
6. displays the result and can generate alerts.

## 4. Input

Potential inputs:
- NASA FIRMS active-fire/thermal anomaly data
- Satellite imagery
- OpenStreetMap/geospatial information
- Historical observations
- Industrial facility/location information

The core concept is **not CCTV monitoring**.

## 5. Output

Possible output:
- Map of detected thermal anomalies
- Industrial/geographic context around each anomaly
- Classification/risk level
- Persistence/history
- Alert for potentially important events

Example:
> Potential industrial thermal event detected near an industrial facility.

## 6. Data Requirements

- Satellite thermal/active-fire observations
- Geographic coordinates and timestamps
- Industrial facility/map data
- Historical observations
- Optional higher-resolution satellite imagery for investigation

## 7. Data Availability

🟢 **Strong for initial development**

The PS itself specifies NASA FIRMS, OSM and satellite data. The main work is determining which products/resolutions are suitable and how well they support industrial-fire classification.

Important limitation: satellite observations are not continuous CCTV video. Revisit frequency, clouds and spatial resolution affect detection.

## 8. Proposed Technology Areas

- Machine Learning / Deep Learning
- Remote sensing
- GIS
- Time-series analysis
- Geospatial processing
- Anomaly detection
- Web GIS dashboard
- Alerting system

## 9. Possible Final Product

A continuously updated industrial thermal-event monitoring platform.

Possible workflow:

Satellite observation → FIRMS → anomaly detection → industrial context → temporal analysis → AI classification → risk assessment → dashboard/alert.

The product should complement, not replace, local industrial fire-safety systems.

## 10. Target Users

Potential users:
- Disaster-management authorities
- Industrial safety teams
- Government monitoring agencies
- Environmental monitoring organizations
- Emergency-response teams

## 11. Deployment Potential

🟢 **Very High**

A software system can consume existing satellite/data infrastructure without requiring deployment of cameras or sensors at every industrial site.

## 12. Major Challenges / Risks

- False positives
- Cloud/observation limitations
- Satellite spatial resolution
- Detection latency
- Distinguishing industrial fires from normal/persistent heat
- Limited ability to detect small/localized events

## 13. Innovation Opportunities

Do not simply reproduce a hotspot map.

Potential differentiation:
- temporal persistence analysis,
- industrial-context awareness,
- multi-source satellite/geospatial fusion,
- anomaly classification,
- risk prioritization,
- explainable alerts.

## 14. SIH Evaluation Assessment

| Criterion | Initial Assessment |
|---|---|
| Novelty | High |
| Complexity | High |
| Feasibility | High |
| Practicability | Very High |
| Sustainability | High |
| Scale of Impact | High |
| User Experience | High |
| Future Scope | High |

