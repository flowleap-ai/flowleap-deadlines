import { CalendarMissing } from './calendars.js';
import { parseLocalDate } from './date.js';
/** Throws `RangeError` unless `value` has the form `<OFFICE>:<code>`, for example `EPO:R71(3)`. */
export function parseEventCode(value) {
    if (!/^[A-Z]+:\S+$/.test(value))
        throw new RangeError(`not an event code of the form OFFICE:code: ${JSON.stringify(value)}`);
    return value;
}
/**
 * Makes a rule whose `compute` refuses input that the parse functions refuse (a caller in JavaScript
 * can pass any value), an event that is not a trigger of the rule, a document date outside the rule's
 * effective range, and a due date that needs a calendar that is not loaded.
 */
export function defineRule({ due, ...rule }) {
    return {
        ...rule,
        compute(input, calendars) {
            const invalid = invalidInput(input);
            if (invalid !== null)
                return refuse('invalid-input', invalid);
            if (!rule.trigger.includes(input.event)) {
                return refuse('unknown-event', `${rule.id} v${rule.version} does not trigger on ${input.event}`);
            }
            if (input.documentDate < rule.effectiveFrom || (rule.effectiveTo !== null && input.documentDate > rule.effectiveTo)) {
                return refuse('rule-not-effective', `${rule.id} v${rule.version} applies to document dates from ${rule.effectiveFrom} to ${rule.effectiveTo ?? 'no end date'}; the document date is ${input.documentDate}`);
            }
            try {
                return { ok: true, ...due(input, calendars) };
            }
            catch (error) {
                if (error instanceof CalendarMissing)
                    return refuse('calendar-missing', error.message);
                throw error;
            }
        },
    };
}
function invalidInput({ event, documentDate, receivedAt }) {
    const problems = [
        check('event', () => parseEventCode(event)),
        check('documentDate', () => parseLocalDate(documentDate)),
        check('receivedAt', () => receivedAt === null || parseLocalDate(receivedAt)),
    ].filter((problem) => problem !== null);
    return problems.length === 0 ? null : problems.join('; ');
}
function check(field, parse) {
    try {
        parse();
        return null;
    }
    catch (error) {
        return `${field}: ${String(error)}`;
    }
}
function refuse(error, detail) {
    return { ok: false, error, detail };
}
