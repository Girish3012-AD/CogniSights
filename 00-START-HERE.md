# SIH 2026 — PS26167 (SatQuery AI) vs PS26143 (Oil Spill / Vessel Attribution)
Research folder — built 26 Aug 2026. Team: GPU/cloud compute available, CV/ML experience, ~1 week runway.

## How to use this folder
Read in this order:
1. `01-official-ps-facts.md` — what is actually officially known, sourced. Read first — it tells you what's real vs assumed.
2. `02-satquery-technical-landscape.md` — models/datasets/papers for the VQA route.
3. `03-oilspill-technical-landscape.md` — models/datasets/papers for the SAR+AIS route.
4. `04-comparison-and-decision.md` — the actual decision matrix, recommendation, and conditions that would flip it.
5. `05-risk-register.md` — top risks for whichever you pick, with mitigations.
6. `06-week-action-plan.md` — day-by-day plan, both branches, so you can start today regardless of final pick.
7. `07-source-ledger.md` — every source used, with link, type, and what it was used for. Check this before citing anything to a judge.

Update these files as you learn more this week — don't start a parallel set of notes. Add dated entries rather than deleting superseded conclusions, so the reasoning trail stays intact.

## One-paragraph verdict (expand in file 04)
Recommendation: **PS26167 SatQuery AI**, on current evidence, for a GPU/CV-strong team with ~1 week. Reasoning in short: both PS have strong prior art (neither is a "we invented this" story), but SatQuery's entire stack — models, datasets, fine-tuning recipes — is open and reproducible today, its failure mode (a wrong/hallucinated answer) is well-studied and demo-recoverable, and its demo format (live text query → grounded answer) plays well to judges. Oil spill's detection half is equally solved and open, but its differentiating half — vessel attribution — is bottlenecked on AIS data access and oceanographic drift modeling your team hasn't claimed, and its failure mode (wrongly naming a real ship) is a higher-consequence error to present under time pressure. This flips if you get real historical AIS access for Indian waters this week, or if someone on the team has oceanography/GIS modeling depth — see file 04 for the exact reversal conditions.

## Critical caveat that overrides everything else here
As of 26 Aug 2026, **neither PS26167 nor PS26143 has a published Background / Expected Solution section on sih.gov.in** — both exist only as the one-line title in the official master catalogue. Everything technical in this folder is built from the plain meaning of the title plus the sponsoring organization's known domain (ISRO for 167, NTRO for 143), not from a verified detailed spec. Re-check sih.gov.in daily; when the full PS text drops, revisit file 04's assumptions before finalizing.
