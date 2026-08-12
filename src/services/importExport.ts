import type { Booking, ScenarioType, SessionRecord } from '../types';
import { decisionToVerdict, expectedForScenario, isDecisionCorrect } from './decisionEngine';

export const CSV_COLUMNS = [
  'video_id',
  'video_path',
  'plate_declared',
  'model_declared',
  'color_declared',
  'scenario_type',
] as const;

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: CsvRow = {};
    header.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export function bookingsFromCsv(text: string): Booking[] {
  const rows = parseCsv(text);
  const bookings: Booking[] = [];
  for (const row of rows) {
    if (!CSV_COLUMNS.every((c) => row[c])) continue;
    const scenario = row.scenario_type.toLowerCase();
    if (scenario !== 'clean' && scenario !== 'fraud' && scenario !== 'unclear') continue;
    bookings.push({
      video_id: row.video_id,
      video_path: row.video_path,
      plate_declared: row.plate_declared,
      model_declared: row.model_declared,
      color_declared: row.color_declared,
      scenario_type: scenario as ScenarioType,
      description: row.description || undefined,
    });
  }
  return bookings;
}

export function sessionsToCsv(records: SessionRecord[]): string {
  const headers = [
    'video_id',
    'booking_plate',
    'detected_plate',
    'booking_model',
    'detected_model',
    'booking_color',
    'detected_color',
    'confidence',
    'decision',
    'scenario_type',
    'expected_result',
    'actual_result',
    'correct',
  ];
  const lines = [headers.join(',')];
  for (const r of records) {
    const plate = r.aggregated.find((a) => a.model_type === 'plate');
    const model = r.aggregated.find((a) => a.model_type === 'model');
    const color = r.aggregated.find((a) => a.model_type === 'color');
    const booking = r.booking;
    const scenario = booking?.scenario_type ?? r.session.scenario_type;
    const expected = expectedForScenario(scenario);
    const actual = decisionToVerdict(r.session.final_decision);
    const correct = isDecisionCorrect(scenario, r.session.final_decision);
    const conf = Math.max(plate?.confidence ?? 0, model?.confidence ?? 0, color?.confidence ?? 0);
    lines.push(
      [
        r.session.video_id,
        booking?.plate_declared ?? '',
        plate?.final_predicted_value ?? '',
        booking?.model_declared ?? '',
        model?.final_predicted_value ?? '',
        booking?.color_declared ?? '',
        color?.final_predicted_value ?? '',
        (conf * 100).toFixed(0),
        r.session.final_decision,
        scenario,
        expected,
        actual,
        correct ? 'yes' : 'no',
      ].join(','),
    );
  }
  return lines.join('\n');
}
