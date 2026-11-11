import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epoCalendars, parseEventCode, parseLocalDate, rulesFor } from 'flowleap-deadlines';

test('the built package computes a due date through its exports', () => {
  const [rule] = rulesFor(parseEventCode('EPO:R71(3)'));
  const computation = rule.compute(
    { event: parseEventCode('EPO:R71(3)'), documentDate: parseLocalDate('2025-08-24'), receivedAt: null },
    epoCalendars,
  );
  assert.equal(computation.due, '2026-01-02');
});

test('the built package computes an Art. 94(3) due date from the period in the communication', () => {
  const event = parseEventCode('EPO:A94(3)');
  const [rule] = rulesFor(event);
  const computation = rule.compute({ event, documentDate: parseLocalDate('2026-06-09'), receivedAt: null, periodMonths: 4 }, epoCalendars);
  assert.equal(computation.due, '2026-10-09');
  assert.equal(rule.compute({ event, documentDate: parseLocalDate('2026-06-09'), receivedAt: null }, epoCalendars).error, 'period-missing');
});
