import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalendarMissing,
  addMonths,
  calendars,
  epo2025,
  epoCalendars,
  parseEventCode,
  parseLocalDate,
  rollClosure,
  rules,
  rulesFor,
  startDay,
} from '../src/index.ts';
import { defineRule } from '../src/rule.ts';

const day = parseLocalDate;

test('parseLocalDate accepts real dates and refuses other text', () => {
  assert.equal(day('2024-02-29'), '2024-02-29');
  assert.throws(() => day('2025-02-29'), RangeError);
  assert.throws(() => day('2025-2-1'), RangeError);
  assert.throws(() => day('2025-02-01T00:00'), RangeError);
});

test('addMonths keeps the day number, or takes the last day of a shorter month (R.131(4))', () => {
  assert.equal(addMonths(day('2025-01-31'), 1), '2025-02-28');
  assert.equal(addMonths(day('2024-01-31'), 1), '2024-02-29');
  assert.equal(addMonths(day('2025-11-30'), 4), '2026-03-30');
  assert.equal(addMonths(day('2025-08-31'), 31), '2028-03-31');
});

test('startDay is the day after the event (R.131(2))', () => {
  assert.equal(startDay(day('2025-12-31')), '2026-01-01');
});

test('rollClosure keeps an open day and rolls over weekends and closing days across the year end', () => {
  assert.equal(rollClosure('EPO', day('2025-07-03'), epoCalendars), '2025-07-03');
  assert.equal(rollClosure('EPO', day('2025-12-24'), epoCalendars), '2026-01-02');
});

test('rollClosure fails loud when the roll reaches a year without a calendar', () => {
  assert.throws(
    () => rollClosure('EPO', day('2027-12-24'), epoCalendars),
    (error) => error instanceof CalendarMissing && error.office === 'EPO' && error.year === 2028,
  );
});

test('calendars refuses two calendars for one year and a closed day of another year', () => {
  assert.throws(() => calendars([epo2025, epo2025]), /two calendars for EPO:2025/);
  const stray = { ...epo2025, year: 2024 };
  assert.throws(() => calendars([stray]), /a day of another year/);
});

test('parseEventCode refuses a code without an office', () => {
  assert.equal(parseEventCode('EPO:R71(3)'), 'EPO:R71(3)');
  assert.throws(() => parseEventCode('R71(3)'), RangeError);
});

test('rulesFor gives the rule versions that an event triggers, and none for an unknown event', () => {
  assert.deepEqual(rulesFor(parseEventCode('EPO:R71(3)')).map((rule) => `${rule.id} v${rule.version}`), [
    'ep.r71-3.grant-communication v1',
  ]);
  assert.deepEqual(rulesFor(parseEventCode('EPO:A94(3)')).map((rule) => `${rule.id} v${rule.version}`), [
    'ep.a94-3.examination-communication v1',
  ]);
  assert.deepEqual(rulesFor(parseEventCode('EPO:R161(1)')), []);
});

test('a rule tells whether the office sets its period and in which range', () => {
  assert.deepEqual(
    rules.map((rule) => [rule.id, rule.setPeriod]),
    [
      ['ep.r71-3.grant-communication', null],
      ['ep.a94-3.examination-communication', { minMonths: 2, maxMonths: 6, cite: 'Rule 132(2) EPC' }],
    ],
  );
});

test('a rule whose period the law fixes ignores periodMonths, as before the field existed', () => {
  const [rule] = rulesFor(parseEventCode('EPO:R71(3)'));
  const input = { event: parseEventCode('EPO:R71(3)'), documentDate: day('2025-03-03'), receivedAt: null };
  const before = rule.compute(input, epoCalendars);
  for (const periodMonths of [2, 7, 4.5, '4', null]) assert.deepEqual(rule.compute({ ...input, periodMonths }, epoCalendars), before);
});

test('the Art. 94(3) rule refuses a period that a JavaScript caller did not check, and names the period in the detail', () => {
  const [rule] = rulesFor(parseEventCode('EPO:A94(3)'));
  const at = (periodMonths) => rule.compute({ event: 'EPO:A94(3)', documentDate: '2026-06-09', receivedAt: null, periodMonths }, epoCalendars);
  for (const periodMonths of [Number.NaN, Infinity, '4', [4], 2.0000001]) {
    assert.equal(at(periodMonths).error, 'invalid-input', String(periodMonths));
    assert.match(at(periodMonths).detail, /^periodMonths: not a whole number of months: /);
  }
  assert.match(at(undefined).detail, /needs periodMonths.*Rule 132\(2\) EPC: 2 to 6 months/);
  assert.match(at(-4).detail, /a period of -4 months is outside Rule 132\(2\) EPC, which allows 2 to 6 months/);
  assert.equal(at(2).due, '2026-08-10');
  assert.equal(at(6).due, '2026-12-09');
});

test('no rule version has an attorney sign-off yet', () => {
  assert.deepEqual(
    rules.map((rule) => rule.reviewedBy),
    rules.map(() => null),
  );
});

const event = parseEventCode('TEST:E');
const window = {
  id: 'test.window',
  version: 1,
  office: 'EPO',
  trigger: [event],
  effectiveFrom: day('2025-01-01'),
  effectiveTo: day('2025-12-31'),
  reviewedBy: null,
  legalSource: [],
  due: ({ documentDate }) => ({ due: documentDate, trace: [], notes: [], remedies: [] }),
};

test('a rule with an end date refuses document dates after it', () => {
  const rule = defineRule(window);
  const at = (date) => rule.compute({ event, documentDate: day(date), receivedAt: null }, epoCalendars);
  assert.equal(at('2025-12-31').ok, true);
  assert.equal(at('2026-01-01').error, 'rule-not-effective');
});

test('a rule passes on an error that is not a missing calendar', () => {
  const rule = defineRule({
    ...window,
    due: () => {
      throw new TypeError('defect in the rule');
    },
  });
  assert.throws(() => rule.compute({ event, documentDate: day('2025-06-01'), receivedAt: null }, epoCalendars), TypeError);
});

test('compute refuses input that a JavaScript caller did not parse, and never gives a date for it', () => {
  const [rule] = rulesFor(parseEventCode('EPO:R71(3)'));
  const refused = (input, field) => {
    const computation = rule.compute(input, epoCalendars);
    assert.equal(computation.ok, false, JSON.stringify(input));
    assert.equal(computation.error, 'invalid-input', JSON.stringify(input));
    assert.match(computation.detail, new RegExp(`^${field}: RangeError: `), JSON.stringify(input));
  };
  const ok = { event: 'EPO:R71(3)', documentDate: '2025-03-03', receivedAt: null };
  assert.equal(rule.compute(ok, epoCalendars).due, '2025-07-03');
  for (const documentDate of ['2026-02-30', '2025-02-29', '2025-9-1', '2025-03-03T00:00', '', ' 2025-03-03', undefined, null, 20250303]) {
    refused({ ...ok, documentDate }, 'documentDate');
  }
  for (const receivedAt of ['2025-03-99', 'yesterday', '', undefined]) refused({ ...ok, receivedAt }, 'receivedAt');
  for (const event of ['', 'R71(3)', 'epo:R71(3)', undefined]) refused({ ...ok, event }, 'event');
  const { receivedAt: _, ...noReceivedAt } = ok;
  refused(noReceivedAt, 'receivedAt');
  const both = rule.compute({ ...ok, event: undefined, documentDate: '2026-02-30' }, epoCalendars);
  assert.match(both.detail, /^event: .*; documentDate: /);
});

test('a calendar of an unknown office is missing, never empty', () => {
  assert.throws(() => epoCalendars.calendar('USPTO', 2025), (error) => error instanceof CalendarMissing && error.office === 'USPTO');
});

test('a caller who changes rule.setPeriod does not change what compute accepts', () => {
  const [rule] = rulesFor(parseEventCode('EPO:A94(3)'));
  assert.throws(() => {
    rule.setPeriod.maxMonths = 99;
  }, TypeError);
  const input = { event: parseEventCode('EPO:A94(3)'), documentDate: day('2026-06-09'), receivedAt: null, periodMonths: 8 };
  assert.equal(rule.compute(input, epoCalendars).error, 'period-out-of-range');
});

test('defineRule refuses a setPeriod that is not a range of whole months from 1 up', () => {
  const due = ({ documentDate }) => ({ due: documentDate, trace: [], notes: [], remedies: [] });
  for (const [minMonths, maxMonths] of [[6, 2], [0, 4], [2.5, 4], [2, Number.NaN]]) {
    assert.throws(() => defineRule({ ...window, due, setPeriod: { minMonths, maxMonths, cite: 'test' } }), RangeError, `${minMonths} to ${maxMonths}`);
  }
  assert.deepEqual(defineRule({ ...window, due, setPeriod: { minMonths: 1, maxMonths: 1, cite: 'test' } }).setPeriod, { minMonths: 1, maxMonths: 1, cite: 'test' });
});
