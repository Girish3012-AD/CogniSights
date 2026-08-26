# Risk register

Format: risk → why it matters → mitigation. Ordered roughly by how much it should worry you.

## SatQuery AI (PS26167)

1. **Compute doesn't fit your GPU.** GeoChat's backbone may exceed your available VRAM. → Confirm your actual GPU spec against GeoChat's published requirements on day one, before committing; fall back to RS-LLaVA (LoRA-based, lighter) if it doesn't fit.
2. **Low novelty gets noticed by judges who've seen other GeoChat-based demos.** This is a popular base model in RS-VLM hackathon projects generally. → Your pitch needs to lead with the integration story (optical+SAR routing, grounding, honest abstention), not "we built a VLM" — that framing invites the "isn't this just GeoChat?" question you don't want.
3. **Domain shift between public training data and ISRO's actual sensors.** Your fine-tuning data is Western-sensor (Sentinel etc.); ISRO's real imagery (Cartosat, RISAT) may look different enough to hurt accuracy. → State this limitation explicitly in your pitch rather than let a judge discover it; check Bhuvan for any downloadable ISRO-sensor samples to at least demo-test on realistic imagery.
4. **Hallucination in a live demo.** If a judge asks an out-of-distribution question, a confident wrong answer is worse than an honest "I'm not confident" — this is the most damaging live-demo failure mode for VQA-style systems specifically. → Implement even a simple confidence/abstention threshold; test it deliberately with a few adversarial questions before the demo.
5. **"Multimodal" turns out to mean something narrower once the real PS text appears.** → Don't over-invest in one narrow interpretation of "multimodal" (e.g., don't assume it's necessarily optical+SAR specifically) before the full spec drops; keep the architecture modular enough to re-target.

## Oil Spill / Attribution (PS26143)

1. **No real AIS access.** This is the single biggest risk to the whole PS. → Spend day one confirming what AIS access is actually obtainable (paid tier, institutional contact, AISHub partnership) before committing meaningful engineering time to the attribution half; if the answer is "none," either scope attribution down honestly (synthetic-but-disclosed data) or reconsider the PS.
2. **False attribution presented with unwarranted confidence.** Naming a real ship incorrectly, even in a demo, is a legally/reputationally loaded error class. → Always present ranked candidates with explicit confidence, never a single named "responsible vessel"; have a one-slide limitations explanation ready.
3. **Overclaiming physical drift modeling fidelity you don't have.** A simplified wind-drift approximation is honest and reasonable; presenting it as equivalent to real hydrodynamic hindcast modeling is not, and a domain-literate judge (this PS is NTRO-sponsored, so assume at least one judge knows this space) will catch it. → Be explicit that you're using a simplified approximation, and explain why that's still a reasonable and useful MVP.
4. **Detection-only demo mistaken for the full ask.** Since detection is the "easy" half, there's a real temptation to over-polish it and under-deliver on attribution. → Time-box detection work hard (1-2 days max) and protect the remaining time for the attribution/scoring layer, since that's very likely the actual point of an NTRO-sponsored PS.
5. **Judges ask about data provenance mid-demo.** "Where's this AIS feed from?" is a predictable, high-probability question given the nature of the PS. → Prepare a direct, honest answer in advance rather than improvising one live.

## Both PS — shared risks
- **The full PS spec dropping mid-week and changing scope.** → Check sih.gov.in daily; don't treat your current architecture as final until the real spec is out.
- **Team splitting effort across too many "impressive" features instead of one tight, working core loop.** → Decide the single demo moment you want (a judge typing a live question / a judge watching a slick get ranked against real-looking AIS tracks) and protect the time to make that moment solid, before adding anything else.
