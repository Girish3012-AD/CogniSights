# Pass 12: Red Team Analysis

For every top candidate, we ask: **WHY SHOULD WE NOT CHOOSE THIS?**

### SIH26001: Landslide Risk Monitoring
- **Why we should NOT choose this**: The software alone cannot predict landslides. It relies entirely on deploying physical sensors (soil moisture, tiltmeters) across treacherous terrain. If the hardware isn't deployed or fails, the software is useless. 
- **Data Barrier**: Real-time high-resolution satellite imagery is incredibly expensive and rare.
- **Differentiation**: Many generic GIS dashboard projects exist. Hard to stand out unless the predictive AI is genuinely novel.

### SIH26003: Cognitive Gaming for Dementia
- **Why we should NOT choose this**: Clinical efficacy of "brain training games" is highly debated in medical literature. We run the risk of building "snake oil."
- **Adoption Barrier**: Elderly dementia patients in rural NER may lack the digital literacy or motor skills to use mobile tablets.
- **Differentiation**: There are thousands of memory games on the App Store.

### SIH26009: Manganese Reserve Identification
- **Why we should NOT choose this**: We are software engineers, not geologists. Building a model that predicts sub-surface minerals from surface satellite data is a PhD-level geophysics problem. 
- **Data Barrier**: Training this model requires massive amounts of historical drilling data overlaid with historical satellite data, which MOIL may not provide during the hackathon.
- **Misleading AI Opportunity**: AI cannot magically see underground; it can only find surface correlations which may be statistically weak.

### SIH26011: 3D ULPIN Property Mapping
- **Why we should NOT choose this**: Immense technical complexity in parsing unstructured 3D point cloud data and matching it to legal cadastral maps.
- **Regulatory Barrier**: Property rights are a state subject in India. Legal frameworks for 3D volumetric rights do not exist yet, making this a purely academic exercise for now.
- **Data Barrier**: High-resolution LiDAR of Indian cities is restricted and hard to obtain.

### SIH26002: Smart Logistics for NER
- **Why we should NOT choose this**: It’s basically "Google Maps with weather warnings." Heavy reliance on external APIs (IMD, GPS tracking).
- **Adoption Barrier**: Relies on truck drivers and field officials actively using the app to report blockages.

### SIH26006: Freight Forecasting Model
- **Why we should NOT choose this**: Freight forecasting is influenced by macro-geopolitics, black swan events, and global economics—things a simple ML model cannot predict well.
- **Systemic Impact**: Only helps SAIL save money, doesn't directly improve the lives of average citizens compared to disaster management or healthcare.
