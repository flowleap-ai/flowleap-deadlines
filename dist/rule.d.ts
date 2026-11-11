import type { Calendars, Computation, EventCode, Rule, SetPeriod, TriggerInput } from './types.ts';
type Due = Omit<Extract<Computation, {
    ok: true;
}>, 'ok'>;
type Definition = Omit<Rule, 'compute' | 'setPeriod'>;
/**
 * `due` computes the due date of a trigger that the rule accepts, and may throw `CalendarMissing`. A
 * rule whose period the law fixes gives no `setPeriod`. A rule whose period the office sets in the
 * document gives `setPeriod`, and its `due` gets `periodMonths` after `compute` checked it.
 */
export type RuleDefinition = (Definition & {
    readonly setPeriod?: undefined;
    due(input: TriggerInput, calendars: Calendars): Due;
}) | (Definition & {
    readonly setPeriod: SetPeriod;
    due(input: TriggerInput, calendars: Calendars, periodMonths: number): Due;
});
/** Throws `RangeError` unless `value` has the form `<OFFICE>:<code>`, for example `EPO:R71(3)`. */
export declare function parseEventCode(value: string): EventCode;
/**
 * Makes a rule whose `compute` refuses input that the parse functions refuse (a caller in JavaScript
 * can pass any value), an event that is not a trigger of the rule, a document date outside the rule's
 * effective range, a period that the rule needs and does not get or that is outside its `setPeriod`,
 * and a due date that needs a calendar that is not loaded. Throws `RangeError` when `setPeriod` is not
 * a range of whole months from 1 up.
 */
export declare function defineRule(definition: RuleDefinition): Rule;
export {};
