import type { Calendars, Computation, EventCode, Rule, TriggerInput } from './types.ts';
type Due = Omit<Extract<Computation, {
    ok: true;
}>, 'ok'>;
export type RuleDefinition = Omit<Rule, 'compute'> & {
    /** Computes the due date of a trigger that the rule accepts. May throw `CalendarMissing`. */
    due(input: TriggerInput, calendars: Calendars): Due;
};
/** Throws `RangeError` unless `value` has the form `<OFFICE>:<code>`, for example `EPO:R71(3)`. */
export declare function parseEventCode(value: string): EventCode;
/**
 * Makes a rule whose `compute` refuses an event that is not a trigger of the rule, a document date
 * outside the rule's effective range, and a due date that needs a calendar that is not loaded.
 */
export declare function defineRule({ due, ...rule }: RuleDefinition): Rule;
export {};
