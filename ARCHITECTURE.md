# AegisVerify — Architecture

AI-powered vehicle verification / fraud-detection prototype (React + Vite + TypeScript + CSS Modules).

## Goals

- Demo the full inspection pipeline: **video → frames → model inference → aggregation → comparison → decision → report**.
- Explicitly separate **simulated model providers** (kind: `demo`) from real backend adapters (kind: `real`) so the
  student project can swap in real AI results later without touching the rest of the pipeline.
- Work fully offline (local SVGs, relative paths, `base: './'`).
- Arabic/English + RTL/LTR + Dark/Light, CSS Modules only.

## Tech stack

| Concern | Choice |
|---|---|
| UI | React 18 + TypeScript, CSS Modules, no UI framework |
| Build | Vite (`base: './'`), `dist/` output |
| Router | React Router (HashRouter for file:// compatibility) |
| Tests | Vitest (`src/**/*.test.ts`, node environment) |
| Video | `<video>` element seek + canvas capture (browser-native; ffmpeg/OpenCV only for sample generation) |
| Persistence | localStorage (SQLite can replace later for FR-7.1) |

## Layers

```
src/
├── theme/          CSS variables + data-theme (dark/light), ThemeProvider
├── i18n/           typed dictionaries (en/ar), RTL direction switching
├── types/          domain types (Booking, FrameResult, AggregatedResult, AnalysisSession…)
├── data/           mock-bookings.json (editable demo ground truth)
├── state/          DataContext — single source of truth for UI state + analysis orchestration
├── services/       pure logic, unit-tested
│   ├── videoSource.ts      VideoSource abstraction (recorded file / blob) + thumbnail capture
│   ├── frameExtractor.ts   seek + canvas -> FrameResult ImageData/DataURL
│   ├── models/             ModelProvider interface + demo/color providers (see below)
│   ├── aggregation.ts      per-model confidence filtering + majority/highest-confidence aggregation
│   ├── decisionEngine.ts   compare declared vs aggregated -> clean/fraud/review + reasons
│   ├── analysisRunner.ts   orchestrates full pipeline, persists session + frames + aggregated
│   ├── storage.ts          localStorage persistence + seeding helpers
│   ├── settings.ts         analysis settings defaults
│   └── importExport.ts     CSV parse (bookings) / export (results)
├── hooks/          useFrameImages (lazy frame image loading)
└── components/     common/ layout/ video/ booking/ analysis/ results/ summary/
    └── pages/      DashboardPage, ResultsPage, SummaryPage
```

## Analysis pipeline

```
Booking (declared plate/model/color)
   └─ VideoSource -> extractFrames(interval, maxFrames)
        └─ per frame: ModelProvider.predict(frame)  -> FrameResult[]
             └─ per model: aggregateModel(threshold, method) -> AggregatedResult
                  └─ decide(declared, aggregated, thresholds) -> AnalysisSession (final_decision + alert)
```

- **FR-3.1/FR-3.2** frame extraction: seek to evenly spaced times, draw to canvas, keep ImageData + DataURL.
- **FR-4.2/FR-4.8** aggregation: frames below the model's confidence threshold or with empty predictions are
  *excluded*; remaining frames vote (majority, ties broken by average confidence) or pick highest confidence.
- **FR-5.1–5.4** decision engine produces a level (`clean` / `fraud` / `review`), a reason string and per-element
  verdicts (`MATCH` / `MISMATCH` / `UNCLEAR`), translatable via i18n keys.
- Scenario ground truth (`mock-bookings.json`) drives demo providers AND the summary accuracy metrics
  (expected vs actual), without ever faking displayed model output.

## Model providers (isolation for backend integration)

`src/services/models/` exposes `createModelPipeline()` via a factory. Each provider implements `ModelProvider`
(`kind: 'demo' | 'real'`, `predict()`). Current adapters:

- `demoProvider.ts` — deterministic seeded predictions from demo ground truth; clearly labeled "Demo".
- `colorProvider.ts` — **real** pixel-based HSV analysis over a center ROI (no AI), verified against sample videos.
- `plateModel.ts` / `vehicleModel.ts` — thin wrappers over the demo provider (placeholder for real models).
- `models/index.ts` — switches per model type; swap to `kind: 'real'` when backend models are available.

> No AI result is ever invented as real: demo results are always marked demo. Aggregation, comparison,
> decision and frame extraction are real logic (NFR-4).

## State model (DataContext)

- `bookings` (mock + imported + added videos), `sessions` (completed/in-progress/failed), `selectedIds`,
  `filters`, `settings`, `running` (current batch run), `runSingle`/`runBatch`.
- UI subscribes once; pages render filtered/derived views. Analysis runs sequentially to avoid browser overload.

## Persistence (localStorage)

- Keys: `aegis.bookings`, `aegis.sessions`, `aegis.frames.<sessionId>`, `aegis.aggregated.<sessionId>`,
  `aegis.settings`, `aegis.lang`, `aegis.theme`.
- Frames (image data) are stored per session to keep them survivable across reloads.
- `storage.ts` also exposes `seedFromJson()`/`ensureSeeded()` to reset demo data (FR-1.4).

## Extending

1. **Real backend models**: implement `ModelProvider` with `kind: 'real'`, return `ModelPrediction[]` per frame,
   register in `models/index.ts`. No UI/pipeline change needed.
2. **SQLite (FR-7.1)**: replace localStorage calls behind `storage.ts` (or add an indexed backend adapter).
3. **Frames storage**: `frameExtractor`/`useFrameImages` already isolate image handling.
