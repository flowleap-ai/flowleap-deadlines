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
 * effective range, a period that the rule needs and does not get or that is outside its `setPeriod`,
 * and a due date that needs a calendar that is not loaded. Throws `RangeError` when `setPeriod` is not
 * a range of whole months from 1 up.
 */
export function defineRule(definition) {
    const { due: _due, setPeriod: _setPeriod, ...rule } = definition;
    const name = `${rule.id} v${rule.version}`;
    let setPeriod = null;
    let dueOf;
    if (definition.setPeriod === undefined) {
        dueOf = (input, calendars) => definition.due(input, calendars);
    }
    else {
        const range = checkedRange(definition.setPeriod, name);
        setPeriod = range;
        dueOf = (input, calendars) => {
            const months = periodMonths(input.periodMonths, range, name);
            return typeof months === 'number' ? definition.due(input, calendars, months) : months;
        };
    }
    return {
        ...rule,
        setPeriod,
        compute(input, calendars) {
            const invalid = invalidInput(input);
            if (invalid !== null)
                return refuse('invalid-input', invalid);
            if (!rule.trigger.includes(input.event))
                return refuse('unknown-event', `${name} does not trigger on ${input.event}`);
            if (input.documentDate < rule.effectiveFrom || (rule.effectiveTo !== null && input.documentDate > rule.effectiveTo)) {
                return refuse('rule-not-effective', `${name} applies to document dates from ${rule.effectiveFrom} to ${rule.effectiveTo ?? 'no end date'}; the document date is ${input.documentDate}`);
            }
            try {
                const result = dueOf(input, calendars);
                return 'ok' in result ? result : { ok: true, ...result };
            }
            catch (error) {
                if (error instanceof CalendarMissing)
                    return refuse('calendar-missing', error.message);
                throw error;
            }
        },
    };
}
/** A frozen copy, so that a caller who changes `rule.setPeriod` cannot change what `compute` accepts. */
function checkedRange({ minMonths, maxMonths, cite }, rule) {
    if (!Number.isInteger(minMonths) || !Number.isInteger(maxMonths) || minMonths < 1 || minMonths > maxMonths) {
        throw new RangeError(`${rule}: setPeriod must be whole months with 1 <= minMonths <= maxMonths, not ${minMonths} to ${maxMonths}`);
    }
    return Object.freeze({ minMonths, maxMonths, cite });
}
/** The checked period of a rule with `setPeriod`, or the refusal. A JavaScript caller can pass any value. */
function periodMonths(value, range, rule) {
    if (value === undefined || value === null) {
        return refuse('period-missing', `${rule} needs periodMonths, the period in whole months that the document sets (${range.cite}: ${range.minMonths} to ${range.maxMonths} months)`);
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return refuse('invalid-input', `periodMonths: not a whole number of months: ${typeof value} ${String(value)}`);
    }
    if (value < range.minMonths || value > range.maxMonths) {
        return refuse('period-out-of-range', `${rule}: a period of ${value} months is outside ${range.cite}, which allows ${range.minMonths} to ${range.maxMonths} months`);
    }
    return value;
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
