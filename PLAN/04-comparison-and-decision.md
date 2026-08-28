# Comparison and decision

Scored against your actual constraints: GPU/cloud compute available, ML/CV-experienced team, ~1 week runway, no stated AIS-data access or oceanography background.

## Side-by-side on the factors that actually swing this outcome

| Factor | SatQuery AI (167) | Oil Spill / Attribution (143) |
|---|---|---|
| Core stack openly available | Yes — GeoChat, RS-LLaVA, RSVQA, SARLANG all public, documented | Detection half yes (OSD/M4D, SOS, DeepLabv3+); attribution half no comparable open stack |
| Data access risk | Low — Sentinel-1/2 + Bhuvan + RSVQA all free, no gatekeeping | Low for detection; **high** for attribution (real AIS is paid/institutional) |
| Domain expertise your team has claimed | Matches (ML/CV) directly | Detection matches; attribution needs oceanography/GIS, which is unclaimed |
| Novelty ceiling | Low-moderate — crowded research area, differentiation via integration/fusion/agentic routing | Detection: low (solved). Attribution: moderate — genuinely less crowded, but 15-year prior art at EU institutional level exists |
| Failure-mode severity if wrong | Wrong/hallucinated answer — annoying, well-studied mitigations exist | **Wrongly naming a real ship** — reputational/legal-adjacent error class, harder to present safely under time pressure |
| Demo interactivity | High — live text query, judge can improvise questions | Lower — largely a pre-built map/overlay walkthrough |
| Judge follow-up risk | "How does this generalize beyond your fine-tuning data?" — answerable honestly | "Where did this AIS data come from?" — the question you're least equipped to answer well without paid access |
| Sponsor fit / relevance if done well | Strong (matches ISRO's stated ask closely) | Strong (matches NTRO's attribution-focused mandate), but harder to execute credibly |
| 1-week completion confidence | High | Medium (detection: high; attribution: medium-low without AIS access) |

## Recommendation
**SatQuery AI (PS26167)**, at moderate-to-high confidence given current information. The deciding factors are data-access risk and failure-mode severity, not raw technical difficulty — both PS are technically tractable for your team, but the oil-spill PS's differentiating half is bottlenecked on a resource (real AIS data) you haven't confirmed access to, and its error mode is riskier to present honestly under a live-judge Q&A than a wrong VQA answer is.

## Explicit conditions that would flip this recommendation
Revisit this decision — don't just proceed on inertia — if any of the following become true:
1. **You get real, reasonably dense historical AIS access for Indian coastal waters this week** (paid tier, institutional contact, or a usable AISHub partnership). This removes the single biggest weakness of the oil-spill route and makes its rarer, more NTRO-relevant differentiation genuinely competitive.
2. **Someone on the team has real oceanography/GIS/hydrodynamic-modeling background**, even informally (a relevant course, a project, a contact who can sanity-check a drift model). This closes the domain-expertise gap that currently favors SatQuery.
3. **The full PS text drops on sih.gov.in and narrows PS26143's scope** to something that doesn't require hard attribution claims (e.g., "detect + visualize AIS proximity" without a "name the vessel" requirement) — this would substantially de-risk it.
4. **The full PS text drops and narrows PS26167's scope** to something outside the current open-model landscape (e.g., a specific ISRO internal sensor format/workflow you can't replicate with public data) — this would raise SatQuery's risk correspondingly.
5. **You discover a competing team at your institution or in your network already building the same GeoChat-fine-tune approach** — SatQuery's low novelty ceiling means this is a real risk; if it materializes, oil spill's rarer differentiation becomes relatively more attractive despite its own risks.

## What NOT to do, regardless of pick
- Don't present a single confident "the responsible vessel is X" claim if you go the oil-spill route — always ranked candidates with confidence.
- Don't claim your fine-tuned VLM "understands SAR" if you only trained/evaluated on optical data — be precise about what modalities you actually covered.
- Don't build a full 102-factor formal decision-matrix presentation for judges — that's a research-process artifact for your own team, not something a judge wants to sit through. Judges want the working system, the honest limitations slide, and a tight answer to "why does this matter and why should we trust it."
