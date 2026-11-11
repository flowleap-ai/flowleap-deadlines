import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { epoCalendars, parseEventCode, parseLocalDate, rules } from '../src/index.ts';

const casesDir = new URL('../cases/', import.meta.url);
const files = readdirSync(casesDir).filter((name) => name.endsWith('.json'));

test('every rule version has a golden case file', () => {
  const expected = rules.map((rule) => `${rule.id}.v${rule.version}.json`).sort();
  assert.deepEqual(files.sort(), expected);
});

for (const file of files) {
  const { rule: id, version, cases } = JSON.parse(readFileSync(new URL(file, casesDir), 'utf8'));
  const rule = rules.find((candidate) => candidate.id === id && candidate.version === version);

  for (const { name, input, expect } of cases) {
    test(`${id} v${version}: ${name}`, () => {
      const computation = rule.compute(
        {
          event: parseEventCode(input.event),
          documentDate: parseLocalDate(input.documentDate),
          receivedAt: input.receivedAt === null ? null : parseLocalDate(input.receivedAt),
          periodMonths: input.periodMonths,
        },
        epoCalendars,
      );
      if (expect.ok) {
        assert.deepEqual(computation, expect);
      } else {
        assert.equal(computation.ok, false);
        assert.equal(computation.error, expect.error);
        assert.match(computation.detail, /\S/);
      }
    });
  }
}
