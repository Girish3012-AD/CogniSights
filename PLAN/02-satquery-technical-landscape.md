# PS26167 SatQuery AI — technical landscape

## The core problem, decoded
"Interactive vision-language assistant... through text queries" = a chatbot that takes a remote sensing image (or a region of one) plus a natural-language question, and returns a grounded answer. "Multimodal" almost certainly means optical + SAR fusion, since that's ISRO's own sensor mix (Cartosat = optical, RISAT/EOS-04 family = SAR). This is the Remote Sensing Visual Question Answering (RSVQA) / grounded-VLM research area — NOT a green field. Your job is integration, fine-tuning, and demo polish on top of an existing open stack, not inventing new architecture.

## Maturity assessment
This is a **crowded, fast-moving, well-funded research area** as of 2024-2026. That cuts both ways:
- Good: everything you need — pretrained backbones, instruction-tuning datasets, benchmarks, published training recipes — is public. A working prototype in a week is realistic.
- Bad: novelty ceiling is low. Multiple published models already do most of what "SatQuery AI" as titled would need. Your differentiation has to come from integration quality (fusion, grounding, honest abstention, agentic routing) and India/ISRO-specific framing, not from a novel core idea.

## Key open models (chronological, most relevant first)
- **RSVQA** (Lobry et al., 2020, IEEE TGRS) — the foundational RS-VQA paper and dataset; RNN+ResNet-152 baseline, ~84% accuracy on the low-resolution split. Not a modern LLM-based system but the benchmark everything after it is measured against. Paper: IEEE TGRS vol. 58, no. 12, 2020.
- **GeoChat** (Kuckreja et al., MBZUAI, CVPR 2024) — "the first versatile remote sensing VLM that offers multitask conversational capabilities with high-resolution RS images," supports image-level AND region-level dialogue, and can visually ground objects by spatial coordinates in its responses. This is the single best starting point for a 1-week build: open weights, published instruction-tuning dataset built by extending existing RS image-text pairs, and a documented benchmark. Paper: arXiv:2311.15826 (https://arxiv.org/abs/2311.15826).
- **RS-LLaVA** (Bazi et al., 2024, Remote Sensing journal) — LLaVA adapted to RS via LoRA for joint captioning + VQA. Good fallback if GeoChat's setup proves too heavy for your compute/time budget — LoRA fine-tuning is cheaper. DOI: 10.3390/rs16091477.
- **EarthGPT, VHM, SkySenseGPT** — later 2024-2025 models that progressively close the zero-shot gap on RSVQA-HR/LR benchmarks (SkySenseGPT gets within ~13% of supervised baselines zero-shot). Useful as comparison points in your report/pitch ("we build on the GeoChat lineage, benchmarked against SkySenseGPT-class performance") even if you don't fine-tune them directly.
- **SARLANG-1M** (2025, arXiv:2504.03254) — a large SAR-specific vision-language benchmark, directly relevant since ISRO's "multimodal" almost certainly wants SAR included, not just optical. If you only have time to adapt one model to SAR specifically, use this as your SAR-side benchmark/eval set.
- **GeoRSCLIP / Git-RSCLIP** — CLIP-family models pretrained on RS image-text pairs; useful as a lightweight retrieval/embedding backbone if a full VLM fine-tune is too slow, or for a retrieval-augmented fallback path.

## Datasets (all public, no special access needed)
- **RSVQA-LR / RSVQA-HR** — the standard VQA benchmark pair (low-res from Sentinel-2, high-res from aerial imagery), original RSVQA release. Use for training/eval of the core QA loop.
- **DOTA** — object detection in aerial images, useful for the grounding/localization component (GeoChat's instruction data is partly built by extending datasets like this).
- **VRSBench** — a 2024/2025 versatile RS vision-language benchmark (referenced in current literature) if you want a second, more recent eval set beyond RSVQA.
- **Sentinel-1/2 imagery** — free via Copernicus Open Access Hub for real, current, high-quality optical+SAR pairs to demo on (not just static benchmark images).
- **Bhuvan (ISRO)** — check for downloadable Cartosat/Resourcesat/RISAT sample scenes to make the demo visually "ISRO-branded" rather than generically Western-satellite.

## What a credible 1-week build actually looks like
1. Stand up GeoChat (or RS-LLaVA if compute-constrained) inference locally, verify it runs on RSVQA-style queries out of the box.
2. Fine-tune / LoRA-adapt lightly on a curated slice of RSVQA + a SAR-inclusive set (SARLANG samples) so the demo can answer both optical and SAR queries — this is your "multimodal" claim, made honestly.
3. Add a thin agentic layer on top: query router that decides "is this an optical question, a SAR question, or a comparison question," calls the right sub-path, and composes an answer with a grounding box overlay. This is where your differentiation lives — most public GeoChat demos don't do optical/SAR routing.
4. Add an explicit abstention/confidence signal (even a simple thresholded softmax-based "I'm not confident about this" is enough) — judges in AI-heavy tracks specifically probe for hallucination handling, and having ANY answer here beats having none.
5. Wrap in a clean UI where a judge can type their own question live — this is the single highest-leverage demo investment, since live interactivity is what separates a "wow" demo from a slide deck.

## Where this can go wrong
- GeoChat's base LLM backbone is not small — check your actual GPU VRAM against its published requirements before committing; if it doesn't fit, fall back to RS-LLaVA's LoRA-based approach, which is lighter.
- "Multimodal remote sensing" could, once the real PS text drops, mean something more specific ISRO already has in mind (e.g., specific sensor pairs, specific analyst workflow) — stay flexible, don't over-invest in one narrow interpretation before checking sih.gov.in again.
- Domain shift: your fine-tuning data is public/Western-sensor; if ISRO's hidden eval set uses genuinely different-looking Cartosat/RISAT imagery, expect a real accuracy drop. Mention this honestly in your pitch rather than overclaiming generalization — judges will respect an honest limitations slide more than an overclaim that gets caught by a follow-up question.
