# Source ledger

All sources retrieved 26 Aug 2026 via web search/fetch. Type key: OFF = official/primary, SEC = secondary/aggregator, ACAD = peer-reviewed or arXiv preprint, INST = institutional report.

## SIH 2026 PS facts
| Source | Type | URL | Used for |
|---|---|---|---|
| SIH 2026 Official Master Catalogue (BlinkNBuild compilation) | SEC (community-compiled from OFF) | https://www.blinknbuild.in/Assets/SIH_2026_All_226_Problem_Statements_Master_Catalogue.pdf | Primary source for both PS titles, sponsors, themes, deadlines |
| SIH 2026 PS tracker (vuce.in) | SEC | https://sih2026.vuce.in/en | Cross-confirmation, daily-refresh snapshot dated 2026-08-21 |
| SIH 2026 PS mirror (GitHub, vedantchalke36) | SEC | https://github.com/vedantchalke36/sih-2026-problem-statements | Cross-confirmation |
| Official SIH portal | OFF | https://sih.gov.in/sih2026PS | Attempted direct fetch — blocked by bot detection during this research; check manually in browser |

## SatQuery AI / remote sensing VLM landscape
| Source | Type | URL | Used for |
|---|---|---|---|
| RSVQA (Lobry et al.) | ACAD | IEEE TGRS vol. 58 no. 12, 2020 | Foundational RS-VQA benchmark/dataset |
| GeoChat (Kuckreja et al.) | ACAD | https://arxiv.org/abs/2311.15826 | Primary recommended open model for the build |
| RS-LLaVA (Bazi et al.) | ACAD | DOI 10.3390/rs16091477 | Lighter LoRA-based fallback model |
| SARLANG-1M | ACAD | https://arxiv.org/pdf/2504.03254 | SAR-specific VLM benchmark |
| "Vision-Language Modeling Meets Remote Sensing" survey | ACAD | https://arxiv.org/pdf/2505.14361 | Benchmark landscape (EarthGPT, VHM, SkySenseGPT context) |
| "Vision-Language Models in Remote Sensing" survey | ACAD | https://arxiv.org/pdf/2305.05726 | RSVQA history and accuracy figures |

## Oil spill detection landscape
| Source | Type | URL | Used for |
|---|---|---|---|
| Oil Spill Identification dataset (Krestenitis et al.), aka OSD/M4D | ACAD/dataset | https://zenodo.org/records/3497086 | Primary recommended detection dataset |
| Deep-SAR Oil Spill (SOS) dataset | ACAD (cited via) | https://arxiv.org/pdf/2412.08116 , https://arxiv.org/pdf/2503.12404 | Secondary detection dataset |
| LADOS dataset | ACAD/dataset | https://zenodo.org/records/15888341 | Optional UAV/optical angle |
| DeepLabv3+ Suez Canal study | ACAD | DOI 10.1038/s41598-025-03028-1 | Detection accuracy benchmark (98.14% acc, 0.79 MIoU) |
| OilSAM2 | ACAD | https://arxiv.org/pdf/2603.10231 | 2026 SOTA-adjacent detection approach |

## AIS + vessel attribution landscape
| Source | Type | URL | Used for |
|---|---|---|---|
| Longépé et al., "Polluter identification with spaceborne radar imagery, AIS and forward drift modeling" (2015) | ACAD/INST | agris.fao.org/search/en/records/65dea4454c5aef494fdcfe8a | The core prior-art method (forward drift simulation vs backtracking) |
| EU JRC, "Satellite Monitoring of Illicit Maritime Pollution: Backtracking Towards Source Identification" (JRC52276, 2010) | INST | https://publications.jrc.ec.europa.eu/repository/handle/JRC52276 | Confirms operational EU-level precedent, deflates novelty claim |
| CLEAR vessel trajectory platform (SIGMOD '26) | ACAD | https://arxiv.org/pdf/2602.08482 | AIS data-quality challenges (gaps, heterogeneity) |
| DTIC report on mystery oil spills | INST | https://apps.dtic.mil/sti/html/tr/ADA518461/index.html | Confirms real-world difficulty of un-attributed spills as an ongoing operational problem |

## Notes on source quality
- The SIH catalogue is a community compilation, not sih.gov.in directly — official portal blocked automated access during this research. Cross-confirmed across three independent trackers, all agreeing on title/sponsor/theme/deadline, which gives reasonable confidence, but re-verify directly on sih.gov.in in-browser before quoting these facts to judges as "official."
- All academic sources are either peer-reviewed (journal DOIs) or arXiv preprints from recognized labs (MBZUAI, IEEE-affiliated groups) — treat arXiv-only sources as credible but not yet peer-reviewed where that distinction matters (e.g., don't cite SARLANG-1M's exact numbers as "peer-reviewed state of the art" without checking its current publication status).
