# Official PS facts (sourced)

## PS26143
- **Title (verbatim, official catalogue):** "Leveraging satellite imagery to determine Oil spills at sea along with AIS data correlations to identify vessel responsible for the spill."
- **Track:** Software
- **Theme:** Space Technology
- **Sponsoring organization:** National Technical Research Organisation (NTRO)
- **Prize:** ₹1,00,000 INR (idea-stage; standard across all 226 PS — not indicative of PS-specific priority)
- **Submission deadline:** 20 September 2026
- **Source:** SIH 2026 Official Master Catalogue (community-compiled from sih.gov.in), retrieved 26 Aug 2026: https://www.blinknbuild.in/Assets/SIH_2026_All_226_Problem_Statements_Master_Catalogue.pdf — cross-confirmed against a second independent scrape at https://sih2026.vuce.in/en (daily-refreshed mirror of sih.gov.in, snapshot dated 2026-08-21) and a third GitHub mirror (vedantchalke36/sih-2026-problem-statements).
- **Status of detailed spec:** NOT YET PUBLISHED. The catalogue's per-theme detail section includes full Background/Problem Statement/Proposed Solution/Expected Outcomes text for some PS (e.g., SIH26101, SIH26104, SIH26105, SIH26106, SIH26149 all have multi-paragraph specs) but PS26143 was not reached with expanded text as of this retrieval. Treat the title as the only confirmed requirement.

## PS26167
- **Title (verbatim, official catalogue):** "SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries"
- **Track:** Software
- **Theme:** Space Technology
- **Sponsoring organization:** Indian Space Research Organisation (ISRO)
- **Prize:** ₹1,00,000 INR (same caveat as above)
- **Submission deadline:** 20 September 2026
- **Source:** Same three-way cross-confirmation as PS26143 above.
- **Status of detailed spec:** NOT YET PUBLISHED, same situation as PS26143.

## What "not yet published" means for you
Multiple current SIH-evaluator commentary sources (YouTube, evaluator-run PS explorer sites) independently note that SIH 2026's official portal is, at this stage, only giving a title and a short/vague paragraph for many PS, with fuller detail expected closer to the internal college-round deadline. This is not unique to these two PS. Practically:
- Do not build a requirement-traceability matrix and present it as if it reflects verified official scope — it would be reasoning from a title, not a spec.
- Do build against the plain-English meaning of the title, informed by the sponsor's known operational mandate (see files 02/03), and stay flexible to re-scope in week 2 once real text appears.
- Check https://sih2026.vuce.in/en (unofficial but fast-updating, refreshes ~daily from sih.gov.in) or the official https://sih.gov.in/sih2026PS directly — note the official portal blocked automated fetching during this research (bot detection), so check it manually in a browser.

## Sponsor context (informs likely intent, not confirmed requirements)
- **NTRO** — India's technical intelligence agency; mandate covers signals intelligence, technical surveillance, and related analytics (inferred from NTRO's other SIH26xxx PS in the same catalogue: cyber forensics, dark-web de-anonymization, network security auditing, cryptographic analysis — all attribution/intelligence-flavored). This supports reading PS26143's emphasis as being on the **attribution** half (who did it), not just detection, since pure environmental detection would more naturally sit with MoES (which sponsors PS26057 marine-debris SAR detection, ocean/weather PS) rather than NTRO.
- **ISRO** — space agency; PS26167 sits alongside other ISRO PS in the same catalogue about satellite navigation, onboard vision, and image correspondence (e.g., SIH26166, Chandrayaan-2 image correspondence), consistent with ISRO wanting a genuinely useful analyst-facing tool over their own optical/SAR archive (Cartosat, RISAT/EOS-family, Resourcesat), not a generic open-domain VLM demo.

## Other India-context facts worth having on hand
- ISRO's public/semi-public geospatial data portal is **Bhuvan** (bhuvan.nrsc.gov.in) — worth checking directly for what optical/SAR sample imagery is downloadable without special authorization, since this determines whether you can plausibly demo on "ISRO-like" imagery rather than only Western open datasets (Sentinel, Landsat).
- Sentinel-1 (SAR) and Sentinel-2 (optical) imagery is free and immediately downloadable from the Copernicus Open Access Hub / Copernicus Browser — no institutional relationship needed, good fallback for both PS if Bhuvan access is friction-heavy.
