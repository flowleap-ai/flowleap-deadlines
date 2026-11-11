import { CalendarMissing } from './calendars.ts';
import { parseLocalDate } from './date.ts';
import type { Calendars, Computation, ComputationError, EventCode, Rule, SetPeriod, TriggerInput } from './types.ts';

type Due = Omit<Extract<Computation, { ok: true }>, 'ok'>;

type Definition = Omit<Rule, 'compute' | 'setPeriod'>;

/**
 * A rule whose period the law fixes gives no `setPeriod`. A rule whose period the office sets in the
 * document gives `setPeriod`, and its `due` gets `periodMonths` after `compute` checked it.
 */
export type RuleDefinition =
  | (Definition & {
      readonly setPeriod?: undefined;
      /** Computes the due date of a trigger that the rule accepts. May throw `CalendarMissing`. */
      due(input: TriggerInput, calendars: Calendars): Due;
    })
  | (Definition & {
      readonly setPeriod: SetPeriod;
      /** Computes the due date of a trigger that the rule accepts. May throw `CalendarMissing`. */
      due(input: TriggerInput, calendars: Calendars, periodMonths: number): Due;
    });

/** Throws `RangeError` unless `value` has the form `<OFFICE>:<code>`, for example `EPO:R71(3)`. */
export function parseEventCode(value: string): EventCode {
  if (!/^[A-Z]+:\S+$/.test(value)) throw new RangeError(`not an event code of the form OFFICE:code: ${JSON.stringify(value)}`);
  return value as EventCode;
}

/**
 * Makes a rule whose `compute` refuses input that the parse functions refuse (a caller in JavaScript
 * can pass any value), an event that is not a trigger of the rule, a document date outside the rule's
 * effective range, a period that the rule needs and does not get or that is outside its `setPeriod`,
 * and a due date that needs a calendar that is not loaded.
 */
export function defineRule(definition: RuleDefinition): Rule {
  const { due: _due, setPeriod, ...rule } = definition;
  return {
    ...rule,
    setPeriod: setPeriod ?? null,
    compute(input, calendars) {
      const invalid = invalidInput(input);
      if (invalid !== null) return refuse('invalid-input', invalid);
      if (!rule.trigger.includes(input.event)) {
        return refuse('unknown-event', `${rule.id} v${rule.version} does not trigger on ${input.event}`);
      }
      if (input.documentDate < rule.effectiveFrom || (rule.effectiveTo !== null && input.documentDate > rule.effectiveTo)) {
        return refuse(
          'rule-not-effective',
          `${rule.id} v${rule.version} applies to document dates from ${rule.effectiveFrom} to ${rule.effectiveTo ?? 'no end date'}; the document date is ${input.documentDate}`,
        );
      }
      let due: () => Due;
      if (definition.setPeriod === undefined) {
        due = () => definition.due(input, calendars);
      } else {
        const months = periodMonths(input.periodMonths, definition.setPeriod, `${rule.id} v${rule.version}`);
        if (typeof months !== 'number') return months;
        due = () => definition.due(input, calendars, months);
      }
      try {
        return { ok: true, ...due() };
      } catch (error) {
        if (error instanceof CalendarMissing) return refuse('calendar-missing', error.message);
        throw error;
      }
    },
  };
}

/** The checked period of a rule with `setPeriod`, or the refusal. A JavaScript caller can pass any value. */
function periodMonths(value: unknown, range: SetPeriod, rule: string): number | Computation {
  if (value === undefined || value === null) {
    return refuse(
      'period-missing',
      `${rule} needs periodMonths, the period in whole months that the document sets (${range.cite}: ${range.minMonths} to ${range.maxMonths} months)`,
    );
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return refuse('invalid-input', `periodMonths: not a whole number of months: ${typeof value} ${String(value)}`);
  }
  if (value < range.minMonths || value > range.maxMonths) {
    return refuse(
      'period-out-of-range',
      `${rule}: a period of ${value} months is outside ${range.cite}, which allows ${range.minMonths} to ${range.maxMonths} months`,
    );
  }
  return value;
}

function invalidInput({ event, documentDate, receivedAt }: TriggerInput): string | null {
  const problems = [
    check('event', () => parseEventCode(event)),
    check('documentDate', () => parseLocalDate(documentDate)),
    check('receivedAt', () => receivedAt === null || parseLocalDate(receivedAt)),
  ].filter((problem) => problem !== null);
  return problems.length === 0 ? null : problems.join('; ');
}

function check(field: string, parse: () => unknown): string | null {
  try {
    parse();
    return null;
  } catch (error) {
    return `${field}: ${String(error)}`;
  }
}

function refuse(error: ComputationError, detail: string): Computation {
  return { ok: false, error, detail };
}
