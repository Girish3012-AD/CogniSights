# SIH26167 — SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries

## 1. Basic Information

- **Problem Statement ID:** SIH26167
- **Official Title:** SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries
- **Organization:** Indian Space Research Organisation (ISRO)
- **Category:** Software
- **Theme:** Space Technology
- **Status:** 🟢 Strong Candidate

## 2. Problem in Simple Words

Build an interactive AI assistant that can understand multimodal remote-sensing imagery and answer questions about it using text queries.

## 3. What Are We Building?

A geospatial AI application where a user can provide or select remote-sensing imagery and ask questions in natural language.

A possible system could:
- understand objects and regions in the imagery,
- answer natural-language questions,
- identify relevant regions,
- compare multiple images when temporal analysis is needed,
- provide visual evidence for its answer.

## 4. Input

Possible inputs:
- Remote-sensing / satellite imagery
- Natural-language user query
- Multiple images when comparison or change analysis is requested

## 5. Output

Possible outputs:
- Natural-language answer
- Highlighted/segmented regions relevant to the query
- Detected objects or changes
- Visual evidence and confidence/explanation

Example:
> "Identify the major roads."

The system could return the imagery with relevant road regions highlighted.

## 6. Data Requirements

- Remote-sensing imagery
- Potentially multi-temporal imagery
- Image annotations/instruction data for domain-specific AI components
- Geospatial metadata where required

## 7. Data Availability

🟡 **Good, but requires verification.**

Public remote-sensing imagery and research datasets exist. The harder part is obtaining suitable image-question-answer/instruction data and ensuring the model is properly grounded in geospatial imagery.

Historical imagery can support training/evaluation and comparison. Operationally, new imagery can be ingested whenever the selected source makes it available.

## 8. Proposed Technology Areas

- Computer Vision
- Vision-Language Models
- Image segmentation / object detection
- Change detection
- Geospatial/GIS processing
- Natural Language Processing
- Python backend
- Web-based interface

## 9. Possible Final Product

A geospatial intelligence platform that allows users to query remote-sensing imagery in natural language, visualize detected objects/regions, compare imagery, and receive evidence-backed answers.

Potential extensions:
- disaster monitoring
- urban development monitoring
- agriculture
- environmental monitoring

## 10. Target Users

Potential users include:
- Government departments
- GIS/remote-sensing analysts
- Disaster-management teams
- Urban planners
- Environmental monitoring teams
- Researchers

## 11. Deployment Potential

🟢 **High**

The software can potentially operate as a platform consuming available remote-sensing data sources. Deployment does not necessarily require installing specialized hardware.

Main requirement: reliable imagery sources and a sufficiently accurate, grounded AI system.

## 12. Major Challenges / Risks

- Domain-specific VLM performance
- Grounding answers in actual image evidence
- Spatial reasoning
- Availability of suitable multimodal training data
- Satellite imagery resolution and revisit frequency
- Avoiding hallucinated answers

## 13. Innovation Opportunities

A stronger direction could combine:
- natural-language querying,
- visual grounding,
- temporal comparison,
- change detection,
- geospatial reasoning,
- evidence-backed answers.

## 14. SIH Evaluation Assessment

| Criterion | Initial Assessment |
|---|---|
| Novelty | High |
| Complexity | High |
| Feasibility | Medium–High |
| Practicability | High |
| Sustainability | High |
| Scale of Impact | High |
| User Experience | High |
| Future Scope | Very High |




