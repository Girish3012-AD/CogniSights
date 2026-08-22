# SIH26153 — AI based Network Attack Forecasting from Network Traffic Data

## 1. Basic Information

- **Problem Statement ID:** SIH26153
- **Official Title:** AI based Network Attack Forecasting from Network Traffic Data
- **Organization:** National Technical Research Organisation (NTRO)
- **Category:** Software
- **Theme:** Blockchain & Cybersecurity
- **Status:** 🟢 Strong Candidate

## 2. Problem in Simple Words

Instead of only detecting an attack after suspicious activity occurs, use network traffic behaviour over time to forecast attack risk.

## 3. What Are We Building?

A cybersecurity monitoring system that:
- receives network-flow/traffic features,
- analyzes behaviour over time,
- detects anomalies,
- models the trend of risk,
- provides an early-warning signal,
- explains why risk is increasing.

## 4. Input

Possible inputs:
- Network-flow records
- Traffic statistics/features
- Timestamps
- Protocol/connection information
- Historical labelled network traffic

For development, public cybersecurity datasets can be used.

For real deployment, the system would eventually consume telemetry from the organization where it is installed.

## 5. Output

Possible output:
- Current network risk
- Attack-risk trend
- Early warning
- Detected anomaly
- Explanation of important contributing traffic patterns

Example:
> Risk increased from low to high over recent traffic windows.

## 6. Data Requirements

Possible public development datasets include:
- CIC-IDS2017
- CSE-CIC-IDS2018
- UNSW-NB15
- TON_IoT

Important distinction:
**public benchmark data is suitable for development/testing, but it is not the same as real operational network data.**

## 7. Data Availability

🟢 **Good for development**

Several public intrusion-detection/network-security datasets exist.

The major research challenge is not simply detecting known attacks; it is proving that the forecasting system can generalize to different environments and previously unseen traffic/attack patterns.

## 8. Proposed Technology Areas

- Machine Learning
- Deep Learning
- Time-series modelling
- Anomaly detection
- Network security
- Feature engineering
- Explainable AI
- Streaming/real-time data processing
- Security dashboard

## 9. Possible Final Product

A network-security early-warning platform that monitors network behaviour and provides current anomaly detection plus a temporal attack-risk forecast.

Possible workflow:

Network telemetry → feature extraction → time windows → anomaly analysis → forecasting model → risk trend → alert/dashboard.

## 10. Target Users

- Security Operations Centres
- Enterprise security teams
- Network administrators
- Government/critical-infrastructure security teams
- Cybersecurity analysts

## 11. Deployment Potential

🟢 **High**

The software can eventually be integrated with network monitoring infrastructure.

However, real-world deployment requires validation using appropriate operational network data and careful handling of false alarms.

## 12. Major Challenges / Risks

- Forecasting vs simple detection
- Dataset shift
- Unseen/novel attacks
- False positives
- Prediction horizon
- Generalization across networks
- Live telemetry integration

## 13. Innovation Opportunities

A weak implementation would simply classify network traffic as normal/attack.

A stronger direction is:
- temporal risk modelling,
- early-warning windows,
- cross-dataset generalization,
- unseen-attack robustness,
- explainable risk factors,
- continuous monitoring.

## 14. SIH Evaluation Assessment

| Criterion | Initial Assessment |
|---|---|
| Novelty | High |
| Complexity | Very High |
| Feasibility | Medium–High |
| Practicability | High |
| Sustainability | High |
| Scale of Impact | High |
| User Experience | High |
| Future Scope | Very High |


