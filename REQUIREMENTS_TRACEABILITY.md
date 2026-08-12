# Requirements Traceability

Maps every requirement from `المتطلبات_النهائية_نظام_كشف_تحايل_الفحص_1.md` to implementation.

Legend: ✅ Done (implemented) · 🟡 Partial / demo-level · ⬜ Not started.

## Functional requirements

| ID | Requirement | Implementation | Status |
|---|---|---|---|
| FR-1.1 | Import mock booking data (CSV/JSON): plate_declared, model_declared, color_declared | `src/data/mock-bookings.json`, `importExport.bookingsFromCsv()` (CSV import modal in Header) | ✅ |
| FR-1.2 | Demo scenarios: clean case + fraud case (mismatch with declared vs detected) | `mock-bookings.json` scenarios `clean`/`fraud`; extra `unclear` for unreadable plate | ✅ |
| FR-1.3 | Ability to choose scenario for the demo | ScenarioType per booking + `AddVideoModal` scenario picker | ✅ |
| FR-1.4 | Mock data editable via file/UI before running demo | CSV import (Header) + Add Video (UI) + `storage.seedFromJson()` reset | ✅ |
| FR-2.1 | Import video list (dropdown/source) | `AddVideoModal` (recorded file picker), `videoSource.ts` | ✅ |
| FR-2.2 | Attach booking data to video | Booking joined to session by `video_id` throughout pipeline | ✅ |
| FR-2.3 | Play mp4 videos | `<video>` playback in `VideoThumbnail`/results | ✅ |
| FR-2.4 | Select videos ("batch select") | Checkbox selection on Dashboard + Batch action bar + `runBatch` | ✅ |
| FR-3.1 | Extract frames at interval (e.g. 0.5/1s) | `frameExtractor.ts` + setting `frameIntervalSeconds` (0.5/1) | ✅ |
| FR-3.2 | Limit max frames (e.g. 10–15) | setting `maxFrames` (10/15) | ✅ |
| FR-3.3 | (Optional) manual frame selection (skip/replace) | Frames marked included/excluded; exclusion visual in `FrameStrip` + aggregation. Full manual frame picker ⬜ | 🟡 |
| FR-3.4 | Show extracted frames with model inference | `FrameStrip`, `ModelResultCard` per-frame table with prediction/confidence | ✅ |
| FR-4.1 | Each frame has a model prediction + confidence | `FrameResult` (`predicted_value`, `confidence_score`) | ✅ |
| FR-4.2 | Aggregate frame predictions (Majority Voting / highest confidence) | `aggregation.ts` (`majority` with avg-confidence tie-break, `highest-confidence`) | ✅ |
| FR-4.3 | Compare frame results (declared vs detected) | `FrameStrip`/`ModelResultCard` show per-frame declared vs detected | ✅ |
| FR-4.4 | Aggregate per model | `aggregateModel()` per model type → `AggregatedResult` | ✅ |
| FR-4.5 | Compare per-model result | `ComparisonTable` | ✅ |
| FR-4.6 | Per-model match/mismatch with user-facing info | Element verdicts `MATCH`/`MISMATCH`/`UNCLEAR` + alert detail | ✅ |
| FR-4.7 | Final decision: all match → "no fraud", mismatch → alert, unclear → review | `decisionEngine.ts` (`clean`/`fraud`/`review`) + `DecisionBanner` | ✅ |
| FR-4.8 | Confidence threshold per model | `settings.thresholds.plate/model/color`, applied in filtering | ✅ |
| FR-5.1 | Dashboard shows analysis results vs booking | `DashboardPage` stats + video cards status | ✅ |
| FR-5.2 | Decision levels (match / partial / none) | `DecisionLevel` (`clean`/`fraud`/`review`) + verdict tones | ✅ |
| FR-5.3 | Summary messages (no fraud / alert / review) | `decisionEngine` reasons + i18n `decision.*` | ✅ |
| FR-5.4 | Detailed mismatch with declared vs detected values | `AlertDetails` (e.g. declared Toyota Corolla vs detected Honda Civic) | ✅ |
| FR-6.1 | Main dashboard: stats + video list + analysis | `DashboardPage` (stat cards + grid + controls) | ✅ |
| FR-6.2 | Sidebar: stats + video list + decision summary | `Sidebar` (counts, recent results, legend) | ✅ |
| FR-6.3 | (Optional) frame thumbnails | `FrameStrip` thumbnails on Results page | ✅ |
| FR-6.4 | Batch analysis with progress and results summary | `runBatch` + `AnalysisProgress` + `SummaryPage`/`SummaryTable` | ✅ |
| FR-7.1 | Store results (SQLite or JSON/CSV) | localStorage persistence (`storage.ts`); CSV export; SQLite swap point documented | 🟡 |
| FR-7.2 | Review/export analysis history | `Sidebar` recent sessions, `SummaryPage`, CSV export | ✅ |

## Non-functional requirements

| ID | Requirement | Implementation | Status |
|---|---|---|---|
| NFR-1 | Performance (videos ≤ 20–30 s) | Frame cap (10–15) + downscaled captures (max 960px) + lazy image loading | ✅ |
| NFR-2 | Offline operation | No CDN (local SVG icons/fonts), local videos, `base: './'` | ✅ |
| NFR-3 | Data accuracy | Real frame extraction/color analysis; deterministic demo providers; accuracy metric on Summary | ✅ |
| NFR-4 | Demo data support ("no faking") | Demo providers clearly labeled; aggregation/comparison/decision are real | ✅ |

## Demo scenarios covered

| Scenario | Booking | Video | Expected |
|---|---|---|---|
| clean | VID-001 (KLM-8832, White) / VID-002 (QWE-2245, Black) | vid001 (white), vid002 (black) | clean |
| fraud-color | VID-003 | declared Blue vs detected Red (vid003 red) | fraud |
| fraud-model | VID-004 | declared Toyota Corolla vs detected Honda Civic | fraud |
| fraud-plate | VID-005 | declared ABC-9999 vs detected KLM-8832 | fraud |
| unclear | VID-006 | plate not readable (empty prediction) | review |
