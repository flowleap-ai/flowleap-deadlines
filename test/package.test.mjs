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
