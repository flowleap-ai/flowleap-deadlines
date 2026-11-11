// An oracle written from the legal text and the OJ notices, without the date or calendar code of
// src/. It uses integer arithmetic only (no Date) and its own copy of the closing days, one column
// per filing office, as the notices print them. The engine must agree with it on every date.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epoCalendars, parseEventCode, parseLocalDate, rollClosure, rules } from '../src/index.ts';

const M = 'Munich';
const H = 'The Hague';
const B = 'Berlin';

// OJ EPO 2024, A91 (2025), OJ EPO 2025, A40 (2026) and OJ EPO 2026, A30 (2027):
// https://www.epo.org/en/legal/official-journal/2024/10/a91, https://www.epo.org/en/legal/official-journal/2025/06/a40
// and https://www.epo.org/en/legal/official-journal/2026/06/a30. Date, then the offices that are closed.
const NOTICES = {
  2025: {
    cite: 'OJ EPO 2024, A91',
    days: [
      ['01.01.2025', M, H, B],
      ['06.01.2025', M],
      ['18.04.2025', M, H, B],
      ['21.04.2025', M, H, B],
      ['01.05.2025', M, B],
      ['05.05.2025', H],
      ['29.05.2025', M, H, B],
      ['09.06.2025', M, H, B],
      ['19.06.2025', M],
      ['15.08.2025', M],
      ['03.10.2025', M, B],
      ['24.12.2025', M, H, B],
      ['25.12.2025', M, H, B],
      ['26.12.2025', M, H, B],
      ['29.12.2025', M, H, B],
      ['30.12.2025', M, H, B],
      ['31.12.2025', M, H, B],
    ],
  },
  2026: {
    cite: 'OJ EPO 2025, A40',
    days: [
      ['01.01.2026', M, H, B],
      ['06.01.2026', M],
      ['03.04.2026', M, H, B],
      ['06.04.2026', M, H, B],
      ['27.04.2026', H],
      ['01.05.2026', M, B],
      ['05.05.2026', H],
      ['14.05.2026', M, H, B],
      ['25.05.2026', M, H, B],
      ['04.06.2026', M],
      ['24.12.2026', M, H, B],
      ['25.12.2026', M, H, B],
      ['28.12.2026', M, H, B],
      ['29.12.2026', M, H, B],
      ['30.12.2026', M, H, B],
      ['31.12.2026', M, H, B],
    ],
  },
  2027: {
    cite: 'OJ EPO 2026, A30',
    days: [
      ['01.01.2027', M, H, B],
      ['06.01.2027', M],
      ['08.03.2027', B],
      ['26.03.2027', M, H, B],
      ['29.03.2027', M, H, B],
      ['27.04.2027', H],
      ['05.05.2027', H],
      ['06.05.2027', M, H, B],
      ['17.05.2027', M, H, B],
      ['27.05.2027', M],
      ['01.11.2027', M],
      ['24.12.2027', M, H, B],
      ['27.12.2027', M, H, B],
      ['28.12.2027', M, H, B],
      ['29.12.2027', M, H, B],
      ['30.12.2027', M, H, B],
      ['31.12.2027', M, H, B],
    ],
  },
};

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const monthLength = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const pad = (n, w = 2) => String(n).padStart(w, '0');
const fmt = ({ y, m, d }) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
const parse = (s) => ({ y: +s.slice(0, 4), m: +s.slice(5, 7), d: +s.slice(8, 10) });
const next = ({ y, m, d }) =>
  d < monthLength(y, m) ? { y, m, d: d + 1 } : m < 12 ? { y, m: m + 1, d: 1 } : { y: y + 1, m: 1, d: 1 };

// Zeller's congruence: 0 is Saturday, 1 is Sunday.
function zeller({ y, m, d }) {
  const mm = m < 3 ? m + 12 : m;
  const yy = m < 3 ? y - 1 : y;
  const k = yy % 100;
  const j = Math.floor(yy / 100);
  return (d + Math.floor((13 * (mm + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
}

const closedByNotice = new Map();
for (const [year, notice] of Object.entries(NOTICES)) {
  for (const [ddmmyyyy, ...offices] of notice.days) {
    assert.ok(offices.length > 0);
    const [d, m, y] = ddmmyyyy.split('.');
    assert.equal(y, year);
    closedByNotice.set(`${y}-${m}-${d}`, offices);
  }
}

class NoNotice extends Error {}

/** Rule 134(1) EPC: closed when at least one filing office is closed. Weekends close all three. */
function oracleClosed(date) {
  if (!(date.y in NOTICES)) throw new NoNotice(String(date.y));
  return zeller(date) <= 1 || closedByNotice.has(fmt(date));
}

/** A period of `months` from the deemed delivery: Rule 126(2)/127(2), Rule 131(2) and (4), Rule 134(1) EPC, from the text. */
function oracle(documentDate, months) {
  if (documentDate < '2023-11-01') return { error: 'rule-not-effective' };
  const doc = parse(documentDate);
  const m0 = doc.m + months;
  const y = doc.y + Math.floor((m0 - 1) / 12);
  const m = ((m0 - 1) % 12) + 1;
  const plain = { y, m, d: Math.min(doc.d, monthLength(y, m)) };
  try {
    let due = plain;
    const years = new Set();
    for (;;) {
      years.add(due.y);
      if (!oracleClosed(due)) break;
      due = next(due);
    }
    return { plain: fmt(plain), due: fmt(due), monthEnd: plain.d !== doc.d, years: [...years] };
  } catch (error) {
    if (error instanceof NoNotice) return { error: 'calendar-missing' };
    throw error;
  }
}

const rule = rules.find((r) => r.id === 'ep.r71-3.grant-communication' && r.version === 1);
const event = parseEventCode('EPO:R71(3)');

test('the oracle agrees with OJ EPO 2023, A29, example 1: 13 November 2023 plus four months is 13 March 2024', () => {
  assert.equal(oracle('2023-11-13', 4).error, 'calendar-missing');
  assert.equal(fmt(parse('2024-03-13')), '2024-03-13');
  assert.equal(zeller(parse('2024-03-13')), 4); // Wednesday, an open day
});

test('the oracle weekday matches known weekdays', () => {
  assert.equal(zeller(parse('2025-05-29')), 5); // Thursday, Ascension Day
  assert.equal(zeller(parse('2026-02-28')), 0); // Saturday
  assert.equal(zeller(parse('2026-03-01')), 1); // Sunday
});

test('the shipped calendars list exactly the notice days of each year, all offices together', () => {
  for (const year of [2025, 2026, 2027]) {
    const shipped = epoCalendars.calendar('EPO', year);
    assert.equal(shipped.source.cite, NOTICES[year].cite);
    const fromNotice = [...closedByNotice.keys()].filter((k) => k.startsWith(`${year}-`)).sort();
    assert.deepEqual(shipped.closedDays.map((d) => d.date).sort(), fromNotice);
  }
});

test('rollClosure agrees with the oracle on every day of 2025, 2026 and 2027', () => {
  let checked = 0;
  for (let day = parse('2025-01-01'); day.y < 2028; day = next(day)) {
    const date = fmt(day);
    let expected = day;
    let missing = false;
    try {
      while (oracleClosed(expected)) expected = next(expected);
    } catch (error) {
      if (!(error instanceof NoNotice)) throw error;
      missing = true;
    }
    if (missing) assert.throws(() => rollClosure('EPO', parseLocalDate(date), epoCalendars), { name: 'CalendarMissing' }, date);
    else assert.equal(rollClosure('EPO', parseLocalDate(date), epoCalendars), fmt(expected), date);
    checked++;
  }
  assert.equal(checked, 1095);
});

test('the engine agrees with the oracle for every document date from 2023-09-01 to 2027-12-31', () => {
  const counts = { due: 0, 'calendar-missing': 0, 'rule-not-effective': 0 };
  for (let day = parse('2023-09-01'); fmt(day) <= '2027-12-31'; day = next(day)) {
    const documentDate = fmt(day);
    const expected = oracle(documentDate, 4);
    const got = rule.compute({ event, documentDate: parseLocalDate(documentDate), receivedAt: null }, epoCalendars);
    if (expected.error !== undefined) {
      assert.equal(got.ok, false, documentDate);
      assert.equal(got.error, expected.error, documentDate);
      counts[expected.error]++;
      continue;
    }
    assert.equal(got.ok, true, documentDate);
    assert.equal(got.due, expected.due, documentDate);
    assert.ok(got.due >= expected.plain, `${documentDate}: the due date is before the plain four-month date`);
    assert.equal(oracleClosed(parse(got.due)), false, `${documentDate}: the due date is a closed day`);
    const [delivery, start, period, roll] = got.trace;
    assert.deepEqual([delivery.op, start.op, period.op, roll.op], [
      'delivery',
      'start',
      expected.monthEnd ? 'month-end' : 'add-period',
      'closure-roll',
    ]);
    assert.deepEqual([delivery.from, delivery.to], [documentDate, documentDate]);
    assert.deepEqual([start.from, start.to], [documentDate, fmt(next(day))]);
    assert.deepEqual([period.from, period.to], [documentDate, expected.plain]);
    assert.deepEqual([roll.from, roll.to], [expected.plain, expected.due]);
    assert.equal(roll.cite, ['Rule 134(1) EPC', ...expected.years.map((y) => NOTICES[y].cite)].join('; '), documentDate);
    assert.deepEqual(got.notes, []);
    counts.due++;
  }
  // Before 2023-11-01: 61 days. Due in 2025 to 2027: document dates 2024-09-01 to 2027-08-23. The rest
  // ends in 2024 (305 days), or in 2028 or rolls from 24 December 2027 into 2028 (130 days).
  assert.deepEqual(counts, { due: 1087, 'calendar-missing': 435, 'rule-not-effective': 61 });
});

test('a document date on the 28th to 31st of each month of 2024 to 2027 ends on that day or the last day of the month', () => {
  for (const year of [2024, 2025, 2026, 2027]) {
    for (let month = 1; month <= 12; month++) {
      for (const d of [28, 29, 30, 31]) {
        if (d > monthLength(year, month)) continue;
        const documentDate = `${year}-${pad(month)}-${pad(d)}`;
        const expected = oracle(documentDate, 4);
        if (expected.error !== undefined) continue;
        const got = rule.compute({ event, documentDate: parseLocalDate(documentDate), receivedAt: null }, epoCalendars);
        assert.equal(got.trace[2].to, expected.plain, documentDate);
        assert.equal(got.due, expected.due, documentDate);
      }
    }
  }
});

const a94 = rules.find((r) => r.id === 'ep.a94-3.examination-communication' && r.version === 1);
const a94Event = parseEventCode('EPO:A94(3)');

test('the Art. 94(3) rule agrees with the oracle for every document date from 2023-09-01 to 2027-12-31 and every period of 2 to 6 months', () => {
  let checked = 0;
  for (let months = 2; months <= 6; months++) {
    for (let day = parse('2023-09-01'); fmt(day) <= '2027-12-31'; day = next(day)) {
      const documentDate = fmt(day);
      const expected = oracle(documentDate, months);
      const got = a94.compute({ event: a94Event, documentDate: parseLocalDate(documentDate), receivedAt: null, periodMonths: months }, epoCalendars);
      const where = `${documentDate} + ${months} months`;
      checked++;
      if (expected.error !== undefined) {
        assert.equal(got.error, expected.error, where);
        continue;
      }
      assert.equal(got.due, expected.due, where);
      const [, , period, roll] = got.trace;
      assert.equal(period.op, expected.monthEnd ? 'month-end' : 'add-period', where);
      assert.deepEqual([period.to, roll.from, roll.to], [expected.plain, expected.plain, expected.due], where);
      assert.match(period.cite, new RegExp(`Rule 132\\(2\\) EPC, ${months} months set in the communication`), where);
      assert.equal(roll.cite, ['Rule 134(1) EPC', ...expected.years.map((y) => NOTICES[y].cite)].join('; '), where);
    }
  }
  assert.equal(checked, 5 * 1583);
});
