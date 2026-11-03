import { CalendarMissing } from './calendars.ts';
import type { Calendars, Computation, ComputationError, EventCode, Rule, TriggerInput } from './types.ts';

type Due = Omit<Extract<Computation, { ok: true }>, 'ok'>;

export type RuleDefinition = Omit<Rule, 'compute'> & {
  /** Computes the due date of a trigger that the rule accepts. May throw `CalendarMissing`. */
  due(input: TriggerInput, calendars: Calendars): Due;
};

/** Throws `RangeError` unless `value` has the form `<OFFICE>:<code>`, for example `EPO:R71(3)`. */
export function parseEventCode(value: string): EventCode {
  if (!/^[A-Z]+:\S+$/.test(value)) throw new RangeError(`not an event code of the form OFFICE:code: ${JSON.stringify(value)}`);
  return value as EventCode;
}

/**
 * Makes a rule whose `compute` refuses an event that is not a trigger of the rule, a document date
 * outside the rule's effective range, and a due date that needs a calendar that is not loaded.
 */
export function defineRule({ due, ...rule }: RuleDefinition): Rule {
  return {
    ...rule,
    compute(input, calendars) {
      if (!rule.trigger.includes(input.event)) {
        return refuse('unknown-event', `${rule.id} v${rule.version} does not trigger on ${input.event}`);
      }
      if (input.documentDate < rule.effectiveFrom || (rule.effectiveTo !== null && input.documentDate > rule.effectiveTo)) {
        return refuse(
          'rule-not-effective',
          `${rule.id} v${rule.version} applies to document dates from ${rule.effectiveFrom} to ${rule.effectiveTo ?? 'no end date'}; the document date is ${input.documentDate}`,
        );
      }
      try {
        return { ok: true, ...due(input, calendars) };
      } catch (error) {
        if (error instanceof CalendarMissing) return refuse('calendar-missing', error.message);
        throw error;
      }
    },
  };
}

function refuse(error: ComputationError, detail: string): Computation {
  return { ok: false, error, detail };
}
