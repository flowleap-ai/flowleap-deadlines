# FlowLeap deadlines

The rules engine that computes patent office deadlines for the FlowLeap Firm Record. Each rule is a small pure function with its legal sources. Each computation gives a due date and a trace that lists every step with its legal citation. No model and no service code computes a date: they call this library.

The library is TypeScript compiled to ESM JavaScript in `dist/`, with type declarations. It has no runtime dependencies. It runs on Node 22 or later.

> **No attorney has signed off a rule version yet.** Every rule has `reviewedBy: null`. Do not use a due date from this library as the only source for a real deadline. A person must check each date.

## Install

The repository commits `dist/`, so the install does not build. Pin a commit:

```bash
npm install github:flowleap-ai/flowleap-deadlines#<commit>
```

## Use

```js
import { epoCalendars, parseEventCode, parseLocalDate, rulesFor } from 'flowleap-deadlines';

const event = parseEventCode('EPO:R71(3)');
for (const rule of rulesFor(event)) {
  const computation = rule.compute({ event, documentDate: parseLocalDate('2025-08-24'), receivedAt: null }, epoCalendars);
  // { ok: true, due: '2026-01-02', trace: [...], notes: [], remedies: [] }
}
```

Parse each external value at your boundary. `parseLocalDate` accepts only a real date written `YYYY-MM-DD`. `parseEventCode` accepts only `<OFFICE>:<code>`. Both throw `RangeError` for other text.

`rulesFor(event)` gives the rule versions that the event triggers. An empty list means that no rule knows the event code. Your service must refuse that event loudly. It must not record it without a deadline.

`rules` lists every rule version. Old versions stay in the list, so you can recompute a stored deadline with the rule id and version that made it.

## The computation

A computation has one of two forms:

- `{ ok: true, due, trace, notes, remedies }`. `due` is the last day of the period. `trace` lists the steps. `notes` lists facts that a person must check. `remedies` lists the rule ids of the remedies when the period is missed (empty in version 1).
- `{ ok: false, error, detail }`. The library computes no date. `detail` tells a person what is missing.

Each trace step has `op`, `from`, `to` and `cite`:

| `op` | Step | Source |
|---|---|---|
| `delivery` | The document is deemed delivered on the date it bears. | Rule 126(2) EPC; OJ EPO 2023, A29 |
| `start` | The computation starts on the day after the delivery. | Rule 131(2) EPC |
| `add-period` | The period ends in the later month on the day with the same number. | The rule of the period; Rule 131(4) EPC |
| `month-end` | The later month has no day with that number, so the period ends on the last day of that month. This step replaces `add-period`. | The rule of the period; Rule 131(4) EPC |
| `closure-roll` | A period that ends on a closed day ends on the next day on which all filing offices are open. `from` and `to` are the same when the day is open. The citation names each calendar that the step read. | Rule 134(1) EPC; the OJ notice of each calendar |

The library computes the earliest safe date. When a law gives a later date that depends on a fact that the library cannot prove, the library gives a note and does not change the date. In version 1 this is the late receipt of Rule 126(2) EPC: when `receivedAt` is more than seven days after the document date, the note gives the number of extra days.

## Fail loud

The library never guesses a date. It refuses with a named error:

| Error | Cause |
|---|---|
| `calendar-missing` | The computation needs a calendar year that is not loaded, for example a due date in 2027. |
| `rule-not-effective` | The document date is before `effectiveFrom` or after `effectiveTo` of the rule version. |
| `unknown-event` | The event code is not a trigger of the rule. |

`calendars([...])` throws when two calendars have the same office and year, or when a calendar lists a day of another year. `rollClosure` throws `CalendarMissing` when it reaches a year without a calendar.

## Rules

| Rule | Version | Trigger | Period | Effective | Legal source |
|---|---|---|---|---|---|
| `ep.r71-3.grant-communication` | 1 | `EPO:R71(3)` | 4 months from the date the document bears, then Rule 134(1) | from 2023-11-01 | [R.71](https://www.epo.org/en/legal/epc/2020/r71.html), [R.126](https://www.epo.org/en/legal/epc/2020/r126.html), [R.131](https://www.epo.org/en/legal/epc/2020/r131.html), [R.134](https://www.epo.org/en/legal/epc/2020/r134.html), [OJ EPO 2023, A29](https://www.epo.org/en/legal/official-journal/2023/03/a29) |

Version 1 starts on 1 November 2023 because the delivery rule of Rule 126(2) EPC changed on that day. Version 1 does not compute remedies, a disruption under Rule 134(2) EPC, or an extension under Rule 134(5) EPC.

## Calendars

Rule 134(1) EPC extends a period that ends on a day on which at least one EPO filing office (Munich, The Hague, Berlin) is closed. The library treats every Saturday and Sunday as a closed day. Each calendar lists the other closing days of one year, copied from the EPO notice for that year. A day on which only one filing office is closed is in the list.

| Calendar | Source | File |
|---|---|---|
| EPO 2025 | [OJ EPO 2024, A91](https://www.epo.org/en/legal/official-journal/2024/10/a91) | `src/calendars/epo-2025.ts` |
| EPO 2026 | [OJ EPO 2025, A40](https://www.epo.org/en/legal/official-journal/2025/06/a40) | `src/calendars/epo-2026.ts` |

The EPO closure from 24 December 2025 to 1 January 2026 is in these two calendars. A period that ends in it ends on 2 January 2026, as the [EPO notice of 11 December 2025](https://www.epo.org/en/service-support/website-updates/epo-offices-closed-24-december-2025-1-january-2026) states.

## Golden cases

`cases/<rule id>.v<version>.json` holds the golden cases of one rule version. Each case has the trigger input and the expected result: the due date, the trace and the notes, or the error. The test runner computes each case with the shipped calendars and compares. The tests fail when a rule version has no case file.

The cases of `ep.r71-3.grant-communication` version 1:

| Case | Document date | Due date |
|---|---|---|
| Plain period | 2025-09-30 | 2026-01-30 |
| Month end, 30 October | 2025-10-30 | 2026-03-02 (28 February is a Saturday) |
| Month end, 31 October | 2025-10-31 | 2026-03-02 (28 February is a Saturday) |
| Month end in a month of 30 days | 2025-12-31 | 2026-04-30 |
| Saturday | 2025-06-11 | 2025-10-13 |
| Closing day that is not a weekend (Ascension Day) | 2025-01-29 | 2025-05-30 |
| 24 December 2025, in the closure | 2025-08-24 | 2026-01-02 |
| 1 January 2026, in the closure | 2025-09-01 | 2026-01-02 |
| Receipt 11 days after the document date | 2025-03-03 | 2025-07-03, with a late-receipt note |
| Receipt 7 days after the document date | 2025-03-03 | 2025-07-03, no note |
| Document date before 1 November 2023 | 2023-10-31 | `rule-not-effective` |
| Due date in 2027 | 2026-09-15 | `calendar-missing` |
| Event `EPO:R161(1)` | 2025-03-03 | `unknown-event` |

## Add a rule version

1. Do not change a released rule version. A change of the law, or of our reading of it, is a new version.
2. Add the file `src/rules/<rule id>.v<version>.ts`. Make the rule with `defineRule`. Give the legal sources with their URLs, `effectiveFrom`, `effectiveTo`, the triggers, and `reviewedBy`. When the new version replaces an old one, set `effectiveTo` of the old version to the day before `effectiveFrom` of the new version.
3. Add the rule to `rules` in `src/index.ts`.
4. Write `cases/<rule id>.v<version>.json` first. Derive each expected date from the legal text, not from a run of the code.
5. Run `npm run build` and `npm test`. Commit `dist/` with the source.

## Add a calendar

1. Find the EPO notice of the closing days of the year in the Official Journal.
2. Copy each closing day other than Saturday and Sunday into `src/calendars/epo-<year>.ts`, with its name. Cite the notice and its URL in `source`.
3. Add the calendar to `epoCalendars` in `src/index.ts`, and add a golden case that needs it.

## Develop

```bash
npm ci
npm run build
npm test
```

`npm test` runs the tests with `node --test` on the TypeScript source. It fails when line, branch or function coverage of `src/` is below 100 %. The package test imports the built `dist/`, so build first. CI runs the build and the tests on Node 22 and 24, and fails when `dist/` differs from the build of `src/`.

## Sources

The closing days and the legal citations come from the European Patent Office: the European Patent Convention, OJ EPO 2023, A29, OJ EPO 2024, A91, OJ EPO 2025, A40, and the EPO notice of 11 December 2025, all on [epo.org](https://www.epo.org). Source: European Patent Office.

## License

MIT. See [LICENSE](LICENSE).
