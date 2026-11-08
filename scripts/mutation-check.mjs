// Applies one likely bug at a time to src/, runs the tests, and restores the file. Every mutation must
// make the tests fail. Run: node scripts/mutation-check.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const MUTATIONS = [
  ['src/date.ts', 'Math.min(day, lastDay)', 'day', 'R.131(4): no last-day-of-month clamp'],
  ['src/date.ts', 'Math.min(day, lastDay)', 'lastDay', 'R.131(4): always the last day of the month'],
  ['src/date.ts', 'month - 1 + months', 'month + months', 'R.131(4): one month too many'],
  ['src/date.ts', 'return addDays(event, 1);', 'return event;', 'R.131(2): start on the event day'],
  ['src/date.ts', 'days * MS_PER_DAY', '(days + 1) * MS_PER_DAY', 'addDays off by one'],
  ['src/calendars.ts', 'day === 0 || day === 6 || ', '', 'R.134(1): weekends open'],
  ['src/calendars.ts', 'day === 0 || day === 6', 'day === 0', 'R.134(1): Saturday open'],
  ['src/calendars.ts', 'day === 0 || day === 6', 'day === 6', 'R.134(1): Sunday open'],
  ['src/calendars.ts', ' || closedDays.some((closed) => closed.date === date)', '', 'R.134(1): calendar ignored'],
  ['src/calendars.ts', 'while (isClosed(office, day, calendars)) day = addDays(day, 1);', 'if (isClosed(office, day, calendars)) day = addDays(day, 1);', 'R.134(1): roll one day only'],
  ['src/calendars.ts', 'year <= yearOf(to)', 'year < yearOf(to)', 'trace: last calendar not cited'],
  ['src/calendars.ts', 'yearOf(date));\n  const day', 'yearOf(date) - 1);\n  const day', 'calendar of the wrong year'],
  ['src/calendars/epo-2025.ts', "      ['2025-05-05', 'Liberation Day'],\n", '', 'calendar: one-office day dropped (2025)'],
  ['src/calendars/epo-2026.ts', "      ['2026-04-27', \"King's Day\"],\n", '', 'calendar: one-office day dropped (2026)'],
  ['src/calendars/epo-2026.ts', "      ['2026-01-01', \"New Year's Day\"],\n", '', 'calendar: New Year dropped'],
  ['src/calendars/epo-2027.ts', "      ['2027-03-08', \"International Women's Day\"],\n", '', 'calendar: one-office day dropped (2027)'],
  ['src/calendars/epo-2027.ts', "['2027-11-01', \"All Saints' Day\"]", "['2027-11-02', \"All Saints' Day\"]", 'calendar: wrong day (2027)'],
  ['src/calendars/epo-2025.ts', "['2025-12-29', 'Bridging day']", "['2025-12-22', 'Bridging day']", 'calendar: wrong day'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', 'const PERIOD_MONTHS = 4;', 'const PERIOD_MONTHS = 2;', 'R.71(3): wrong period'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', 'const DELIVERY_GRACE_DAYS = 7;', 'const DELIVERY_GRACE_DAYS = 10;', 'R.126(2): ten-day rule'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', 'lateDays > DELIVERY_GRACE_DAYS', 'lateDays >= DELIVERY_GRACE_DAYS', 'R.126(2): note at exactly seven days'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', 'return { due: roll.to,', 'return { due: expiry,', 'due without the R.134(1) roll'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', "parseLocalDate('2023-11-01')", "parseLocalDate('2023-11-02')", 'effectiveFrom one day late'],
  ['src/rules/ep-r71-3-grant-communication.v1.ts', "parseLocalDate('2023-11-01')", "parseLocalDate('2023-10-31')", 'effectiveFrom one day early'],
  ['src/rule.ts', "if (invalid !== null) return refuse('invalid-input', invalid);", '', 'unparsed input accepted'],
  ['src/rule.ts', 'input.documentDate < rule.effectiveFrom', 'input.documentDate <= rule.effectiveFrom', 'effectiveFrom excluded'],
  ['src/rule.ts', "if (error instanceof CalendarMissing) return refuse('calendar-missing', error.message);", "if (error instanceof CalendarMissing) return { ok: true, due: input.documentDate, trace: [], notes: [], remedies: [] };", 'missing calendar gives a date'],
];

const survivors = [];
for (const [file, from, to, name] of MUTATIONS) {
  const original = readFileSync(file, 'utf8');
  if (!original.includes(from)) throw new Error(`mutation "${name}" does not apply to ${file}`);
  writeFileSync(file, original.replace(from, to));
  let killed = false;
  try {
    execFileSync(process.execPath, ['--test', ...(process.env.TESTS ?? 'test/engine.test.mjs test/golden.test.mjs test/oracle.test.mjs').split(' ')], { stdio: 'ignore' });
  } catch {
    killed = true;
  } finally {
    writeFileSync(file, original);
  }
  console.log(`${killed ? 'killed  ' : 'SURVIVED'} ${name}`);
  if (!killed) survivors.push(name);
}
if (survivors.length > 0) {
  console.error(`${survivors.length} mutation(s) survived`);
  process.exit(1);
}
