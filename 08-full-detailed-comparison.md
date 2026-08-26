# Full detailed comparison — every factor — PS26167 (SatQuery AI) vs PS26143 (Oil Spill / Vessel Attribution)

This is the deep comparison file. Files 02/03/05 cover the same ground per-PS; this file puts every factor side by side in one place so you can scan across rows instead of across files.

## How to read the confidence tags
Every row is tagged so you know how much weight to put on it:
- **FACT** — directly confirmed by an official or primary source (see file 07 for the source).
- **ACAD** — supported by peer-reviewed or arXiv research, treated as reliable but not official.
- **INFERENCE** — a reasonable conclusion drawn from confirmed facts (e.g., sponsor's known mandate → likely PS intent), not confirmed by the PS text itself.
- **ASSUMPTION** — something we're taking as given because there's no way to verify it yet (e.g., your actual GPU spec, your actual AIS access).
- **ESTIMATE** — a quantitative or qualitative judgment call with reasoning shown, not a measured number.

Where a row's SatQuery/Oil-Spill columns look asymmetric in confidence, that's real — the two PS don't have equally verifiable information available, and papering over that with false symmetry would be dishonest.

---

## A. Problem definition & scope

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Official detailed spec published? | No — title only [FACT] | No — title only [FACT] |
| Sponsor | ISRO [FACT] | NTRO [FACT] |
| Sponsor's evident domain focus (from other PS in same catalogue) | Onboard vision, navigation, image correspondence, satellite ops [INFERENCE] | Signals/technical intelligence, forensics, attribution, cyber [INFERENCE] |
| Likely true point of the PS (not just its title) | A usable analyst-facing query tool over ISRO's own optical+SAR archive [INFERENCE] | Attribution (naming a vessel), not just environmental detection — MoES, not NTRO, would own pure detection [INFERENCE] |
| Number of distinct sub-problems bundled in the title | One (query→answer, with an implicit fusion requirement) | Two, chained (detect → attribute), of very different difficulty |
| Room for honest scope reduction if time runs short | High — can narrow to optical-only, drop SAR fusion, and still deliver a coherent demo | Medium — detection alone is a valid partial demo, but likely undersells NTRO's actual interest |

## B. Data landscape

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Core training data public and free? | Yes — RSVQA-LR/HR, DOTA, VRSBench [ACAD] | Yes for detection (OSD/M4D, SOS) [ACAD]; No for attribution (real AIS) [ASSUMPTION pending your check] |
| Registration/access friction | None for RSVQA/DOTA; Bhuvan may need light registration [ESTIMATE] | None for OSD/M4D/SOS; AISHub/MarineTraffic require account + likely paid tier for useful density [ESTIMATE] |
| Data volume available | RSVQA-HR alone: ~10,659 images, ~1.07M QA pairs [ACAD] | OSD/M4D: 1,002 train images; SOS: 8,070 patches [ACAD] — both small by modern DL standards but standard for this niche |
| Realistic demo-time imagery source | Sentinel-1/2 (free, current) or Bhuvan samples [ACAD/ESTIMATE] | Sentinel-1 (free, current) for the slick; AIS is the gap [ACAD/ASSUMPTION] |
| Data matches sponsor's real-world sensors? | Uncertain — public data is Western-sensor (Sentinel), ISRO uses Cartosat/RISAT; domain shift risk exists [ASSUMPTION/ESTIMATE] | Uncertain — public SAR data (Gulf of Mexico, Persian Gulf, Suez) is geographically foreign to Indian coastal waters; local sea-state/vessel-density differences plausible [ESTIMATE] |
| Label quality / annotation reliability | High — RSVQA is a long-established, widely cited benchmark [ACAD] | High for OSD/M4D (GIS-expert annotated) [ACAD]; N/A for attribution since no standard labeled attribution dataset exists at all |
| Class imbalance / rarity issues | Minor — RSVQA has broad question-type coverage [ACAD] | Significant — oil spills are rare events, all public datasets are small because real incidents are scarce [ACAD] |

## C. Models & technical approach

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Off-the-shelf open models available | Yes, several generations: GeoChat, RS-LLaVA, EarthGPT, VHM, SkySenseGPT [ACAD] | Yes for detection: DeepLabv3+, U-Net, SAM2-based (OilSAM2) [ACAD]; No standard model exists for attribution specifically |
| State of the art as of this research | SkySenseGPT closes zero-shot gap to ~13% of supervised baseline on RSVQA-HR [ACAD] | DeepLabv3+ reported 98.14% accuracy / 0.79 MIoU on a Suez Canal case study [ACAD] |
| Fine-tuning cost (compute/time) | Moderate — LoRA-based adaptation (RS-LLaVA-style) is achievable in 1-2 days on a single decent GPU [ESTIMATE] | Low for detection (segmentation nets train fast on small data) [ESTIMATE]; attribution has no model to fine-tune — it's a scoring/ranking algorithm you design, not a pretrained model you adapt |
| Architecture complexity of a competitive build | Moderate — VLM backbone + router + grounding overlay + abstention layer | Low for detection; Moderate-High for attribution (drift approximation + AIS ingestion + candidate scoring + uncertainty presentation) |
| Risk of "just re-running someone's GitHub repo" | Real — GeoChat is a popular hackathon base model, judges may recognize it | Lower — attribution has no popular off-the-shelf repo to be accused of copying, precisely because it's less solved |
| Backbone size / hardware fit risk | Needs checking against your actual GPU (ASSUMPTION until verified) — larger VLM backbones may not fit | Segmentation nets (U-Net/DeepLabv3+) are lightweight, low hardware risk [ESTIMATE] |

## D. Compute & infrastructure

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Minimum viable compute | 1 mid-range GPU (with LoRA fallback if constrained) [ESTIMATE] | 1 mid-range GPU for detection; attribution needs negligible GPU (it's mostly geospatial scoring logic, CPU-bound) [ESTIMATE] |
| Storage footprint | Moderate (VLM weights + fine-tuning data, tens of GB) [ESTIMATE] | Small (segmentation datasets are a few GB; AIS data volume depends entirely on access secured) [ESTIMATE] |
| External API dependency for the demo to work | None required — can run fully offline once weights are downloaded [ESTIMATE] | Yes if using real AIS via API — demo becomes dependent on a live/paid external service unless you cache data in advance [ESTIMATE] |
| Cloud cost for the week (rough) | Low — your own GPU compute, no paid API calls needed [ESTIMATE] | Low for detection; potentially non-zero if a paid AIS tier is required [ESTIMATE] |

## E. Team skill fit

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Matches stated team strength (GPU/CV/ML) | Direct match [ASSUMPTION, based on your stated resources] | Detection: direct match. Attribution: needs oceanography/GIS/geospatial-scoring skills not stated as present [ASSUMPTION] |
| Learning curve for the differentiating component | Moderate — agentic routing and grounding are learnable from existing papers/repos within days [ESTIMATE] | High — physically-informed drift approximation and AIS-domain literacy are less documented, more trial-and-error [ESTIMATE] |
| Risk of a skill gap becoming a blocking issue mid-week | Low-moderate | Moderate-high, specifically for the attribution component |

## F. Novelty & prior art

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Does the core concept already exist? | Yes, extensively (RSVQA since 2020, multiple VLM generations since 2024) [ACAD] | Detection: yes, extensively. Attribution: yes, at institutional level — EU JRC/EMSA operational since ~2010, method published 2015 (Longépé et al.) [ACAD/INST] |
| Is your specific combination novel? | Marginally — optical+SAR fusion with agentic routing and abstention is a reasonable differentiator, not a breakthrough [ESTIMATE] | Marginally — an accessible, explainable, India-focused approximation of an EU institutional method is a legitimate differentiator, arguably rarer than another VLM demo [ESTIMATE] |
| Defensibility of novelty claim if challenged by a research-literate judge | Moderate — "we integrate and extend GeoChat" is honest and defensible, but not a strong novelty claim on its own | Moderate-High — "we approximate a known institutional method at accessible scale, with explicit uncertainty" is a more defensible and rarer claim, if executed honestly |
| Likely number of competing SIH teams attempting a similar approach | Higher — VLM/chatbot demos are a popular hackathon pattern generally [ESTIMATE] | Lower — attribution logic is less of a template hackathon project [ESTIMATE] |

## G. Scientific validity & error risk

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| What does a wrong answer look like? | An incorrect or hallucinated response to a question | A wrongly-named real vessel, or a false-negative missed spill |
| Real-world consequence class of an error | Low-moderate (informational error, correctable, no third-party named) | Higher (naming a real ship is reputationally/legally loaded, even in a demo context) |
| Is the failure mode well-studied with known mitigations? | Yes — hallucination/abstention/calibration is an active, well-documented research area [ACAD] | Partially — uncertainty quantification exists generally, but "how to honestly present vessel-attribution confidence" is not a standardized, widely-taught pattern [ESTIMATE] |
| Ease of building in an honest uncertainty signal | Straightforward (confidence thresholding on model outputs) [ESTIMATE] | Requires deliberate design (ranked candidates + explicit scoring rationale), more engineering effort to get right [ESTIMATE] |

## H. Evaluation & benchmarking

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Standard, citable benchmark exists? | Yes — RSVQA-LR/HR accuracy figures are a recognized yardstick [ACAD] | Yes for detection (IoU/MIoU on OSD/M4D, SOS) [ACAD]; no standard benchmark exists for attribution accuracy specifically |
| Can you produce a real, honest number for the pitch? | Yes — "X% accuracy on held-out RSVQA split" is achievable and credible | Yes for detection (IoU); for attribution, you'll need to construct your own validation approach (e.g., against a documented historical spill case), which is more work but also more original |
| Risk of an unfalsifiable or hand-wavy metric being presented | Low, if you report real held-out numbers | Moderate — "our system ranks the right vessel in the top-3" is a claim that needs a genuine validation case, or it's just an unverified assertion |

## I. Demo & judge experience

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Live interactivity | High — a judge can type their own question in real time | Lower — mostly a pre-built map/overlay walkthrough, though a "drop a pin, see candidate vessels" interaction is possible with effort |
| Visual "wow" moment | A grounded, correct answer to a judge's own live question | A slick appearing on a map with ranked, confidence-scored vessel candidates |
| Most likely tough judge question | "How does this generalize beyond your training data?" | "Where did this AIS data come from?" / "How is this different from just guessing the nearest ship?" |
| How prepared are you to answer that tough question, given your current resources | Well — an honest domain-shift limitation slide covers this | Depends entirely on whether real AIS access gets secured this week |
| Format familiarity for judges (have they likely seen this kind of demo before) | Yes, VLM chatbot demos are now common at hackathons generally [ESTIMATE] | Less common — geospatial attribution demos are rarer in the general hackathon circuit [ESTIMATE] |

## J. Time economics (1-week feasibility)

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Core working loop achievable by when | Day 1-2 (stock model inference) | Day 2 (detection); attribution scorer realistically needs day 3-4 to be more than a stub |
| Highest-ROI use of remaining time | Differentiation layer (routing, grounding, abstention) + demo polish | Attribution scoring quality + honest uncertainty presentation |
| Lowest-ROI trap to avoid | Over-polishing the base VLM chat UI at the expense of the differentiation layer | Over-polishing detection accuracy at the expense of the attribution layer, which is the actual point |
| Realistic confidence of having a complete, demoable system by day 6 | High | Medium (high for detection-only; medium for a credible full detect+attribute loop, contingent on AIS access) |

## K. Strategic / longer-term value

| Parameter | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Skills built that transfer beyond this hackathon | VLM fine-tuning, multimodal fusion, agentic system design — broadly in-demand ML skills [ESTIMATE] | Geospatial data engineering, uncertainty-aware system design, domain-constrained modeling — narrower but valuable if you continue in remote sensing/maritime domains [ESTIMATE] |
| Plausible path beyond SIH (research paper, further project, portfolio piece) | Straightforward — fits neatly into the active RS-VLM research area, easy to continue and publish incremental results | Possible but requires either a genuine oceanography collaborator or accepting the approximation stays an approximation |
| Government/institutional relevance if it worked well | High (ISRO's own imagery pipeline) | High (NTRO's stated mandate), but also higher stakes if it's ever taken seriously for real attribution decisions — worth thinking about, not just technically |

---

## Weighted verdict under different priorities

Rather than one arbitrary combined score, here's how the recommendation holds up under different things a team might care about most:

- **Weighted toward pure technical/AI depth:** Close to a tie — both require real ML engineering; SatQuery edges out slightly because VLM fusion + agentic routing is a deeper single system, while oil spill's depth is split across two much easier and one much harder sub-problem.
- **Weighted toward feasibility in your actual 1-week window with your actual resources:** SatQuery wins clearly — no external data-access dependency, well-documented path.
- **Weighted toward novelty/differentiation:** Close to a tie, oil spill attribution arguably edges out — it's a rarer hackathon pattern and has a legitimate "accessible version of an institutional method" story, provided you can execute it honestly.
- **Weighted toward risk-adjusted value (probability of a working, credible demo × cost of things going wrong):** SatQuery wins — its failure modes are lower-consequence and better-studied, and it doesn't have a single point of failure (AIS access) outside your control.
- **Weighted toward sponsor/judge relevance if executed at an elite level:** Oil spill edges out — genuinely nailing attribution would impress NTRO judges more than another VLM demo would impress ISRO judges, precisely because it's harder and rarer. This is the scenario where oil spill is the higher-ceiling, higher-variance choice.

**Net reading:** SatQuery is the higher-floor, lower-ceiling, lower-risk choice. Oil spill is the lower-floor, higher-ceiling, higher-risk choice, with its floor almost entirely determined by one external factor (real AIS access) that you should resolve on day 0 before finalizing anything. This matches the recommendation in file 04 — nothing in this deeper pass overturns it, but it does sharpen the one lever (AIS access) that would.
