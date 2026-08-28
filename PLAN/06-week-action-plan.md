# Week action plan

You have ~1 week. This plan assumes a 6-person SIH team (standard SIH rule: exactly 6 students, min. 1 female member, same institute). Adjust role split to your actual team.

## Day 0 (today) — before committing fully
- [ ] Check sih.gov.in / sih2026.vuce.in manually for any update to PS26143 or PS26167's detailed spec. Re-read files 01/04 if anything changed.
- [ ] Confirm actual GPU spec (VRAM, count) against GeoChat's published requirements (needed for SatQuery route) — do this even if leaning oil-spill, since it costs 10 minutes and de-risks a pivot.
- [ ] Spend 1-2 hours confirming what real AIS access is actually obtainable this week (AISHub terms, MarineTraffic trial/paid tiers, any institutional contact). This single finding should be your tie-breaker per file 04 — don't skip it.
- [ ] Make the final PS call based on the above, using file 04's decision matrix and reversal conditions.

## If SatQuery AI (PS26167)

**Day 1** — Environment + baseline. Stand up GeoChat (or RS-LLaVA if VRAM-constrained) inference locally. Download RSVQA-LR/HR. Get a baseline query-answer loop working on stock weights, no fine-tuning yet — confirm the whole pipeline runs end to end before optimizing anything.

**Day 2** — Fine-tuning. LoRA-adapt on a curated RSVQA slice + a SAR-inclusive sample (SARLANG) so you can honestly answer both optical and SAR queries. Track eval accuracy against a held-out split so you have real numbers for the pitch.

**Day 3** — Differentiation layer. Build the agentic router (optical vs SAR vs comparison-question dispatch) and the grounding/bounding-box overlay in responses. This is where you separate from a generic GeoChat demo.

**Day 4** — Abstention + robustness. Add a confidence/abstention mechanism. Deliberately test with adversarial/out-of-distribution questions and fix the worst failure modes.

**Day 5** — UI + integration. Build the live-query interface (this is your demo centerpiece — prioritize it being genuinely responsive over feature count).

**Day 6** — Demo rehearsal + limitations slide. Run the live demo against team members playing skeptical judges. Write the one-slide honest-limitations explanation (domain shift, dataset provenance, what "multimodal" covers).

**Day 7** — Buffer. Fix whatever broke in rehearsal. Do not add new features this day.

## If Oil Spill / Attribution (PS26143)

**Day 1** — AIS access resolution (see Day 0 above — don't proceed past this without an answer) + environment setup. Download OSD/M4D and SOS datasets.

**Day 2** — Detection model. Train/fine-tune DeepLabv3+ or U-Net on OSD/M4D (+SOS if time allows). Time-box this hard — it's the "easy" half, don't over-invest.

**Day 3** — Attribution scorer v1. Build the wind-drift/proximity-based candidate-ranking function against whatever AIS data you secured (real or clearly-disclosed synthetic). Get a ranked-list-with-confidence output working end to end, even crudely.

**Day 4** — Attribution scorer v2 + validation. Sanity-check the scorer against a known real historical spill case if you can find public incident data to validate against (search for documented Indian-coast or nearby oil spill incidents with known responsible vessels, as a validation set). Refine scoring weights.

**Day 5** — Map UI. Build the slick-overlay + AIS-track + confidence visualization. This is your demo centerpiece.

**Day 6** — Demo rehearsal + limitations slide. Rehearse the "how attribution works and its limitations" explanation specifically — this is the highest-risk Q&A moment, practice it until it's tight. Have the AIS-provenance answer ready verbatim.

**Day 7** — Buffer. Fix what broke. No new features.

## Cross-cutting, regardless of branch
- Assign one team member explicitly to "watch sih.gov.in and re-read file 01/04 if the spec changes" for the whole week — don't let this fall through the cracks.
- Keep a running note of every honest limitation you're aware of — you'll want this for the pitch regardless of which PS, and it's much better to volunteer it than have a judge find it.
