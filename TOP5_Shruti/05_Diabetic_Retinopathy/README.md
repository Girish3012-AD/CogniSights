# SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India

## 1. Basic Information

- **Problem Statement ID:** SIH26038
- **Official Title:** Explainable AI for Diabetic Retinopathy Screening in Rural India
- **Organization:** MathWorks
- **Category:** Software
- **Theme:** Clean & Green Technology
- **Status:** 🟠 Technically Strong but High Validation Risk

## 2. Problem in Simple Words

Use retinal/fundus images to screen for diabetic retinopathy and provide an explanation of which image regions influenced the AI prediction.

## 3. What Are We Building?

A retinal-image screening assistant:

Retinal image → image-quality check → deep-learning prediction → severity assessment → explainability → screening report.

The system should be positioned carefully as a screening/research-support system unless properly clinically validated.

## 4. Input

- Retinal/fundus photograph
- Potentially image metadata where available

## 5. Output

Possible output:
- DR classification/severity
- Confidence/uncertainty
- Visual explanation such as highlighted regions
- Screening-oriented report

The exact clinical interpretation must not be overstated without appropriate validation.

## 6. Data Requirements

Potential public research datasets include:
- APTOS 2019
- IDRiD
- Other retinal-image datasets

IDRiD is particularly relevant to explainability because it includes expert annotations for retinal lesions in addition to disease grading.

## 7. Data Availability

🟡 **Public research data exists**

The team does not necessarily need to obtain patient images directly from a hospital for initial research/development.

However, public datasets are not automatically sufficient for making strong clinical deployment claims. Differences in populations, cameras, image quality and clinical settings can create domain-shift and generalization problems.

## 8. Proposed Technology Areas

- CNN / Deep Learning
- Transfer learning
- Computer Vision
- Image preprocessing
- Explainable AI
- Grad-CAM/attention-based visualization
- Web application

## 9. Possible Final Product

A research-grade explainable retinal screening platform that predicts DR severity and visually indicates regions that influenced the model.

A future clinical version would require substantially stronger independent validation and appropriate clinical/regulatory processes.

## 10. Target Users

Potential users:
- Ophthalmic screening programs
- Healthcare professionals
- Researchers
- Medical institutions

## 11. Deployment Potential

🟠 **Moderate / High validation barrier**

The software itself is deployable, but meaningful clinical deployment requires much more than model accuracy on a public dataset.

## 12. Major Challenges / Risks

- Clinical validation
- Dataset representativeness
- Image-quality variation
- Dataset shift
- False negatives/false positives
- Explainability reliability
- Privacy and regulatory considerations

## 13. Innovation Opportunities

Potential differentiation:
- image-quality assessment,
- severity prediction,
- lesion-aware explainability,
- uncertainty estimation,
- cross-dataset validation,
- transparent screening reports.

## 14. SIH Evaluation Assessment

| Criterion | Initial Assessment |
|---|---|
| Novelty | Medium–High |
| Complexity | Very High |
| Feasibility | Medium |
| Practicability | Medium |
| Sustainability | High |
| Scale of Impact | Very High |
| User Experience | High |
| Future Scope | High |


## 16. Status

🟠 **Technically Strong but High Validation Risk**
