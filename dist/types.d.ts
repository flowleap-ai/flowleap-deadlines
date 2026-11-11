declare const brand: unique symbol;
export type Branded<T, B extends string> = T & {
    readonly [brand]: B;
};
/** A calendar date without a time zone, `YYYY-MM-DD`. Make one with `parseLocalDate`. */
export type LocalDate = Branded<string, 'LocalDate'>;
/** The stable name of a rule, for example `ep.r71-3.grant-communication`. */
export type RuleId = Branded<string, 'RuleId'>;
/** An office event code, `<OFFICE>:<code>`, for example `EPO:R71(3)`. Make one with `parseEventCode`. */
export type EventCode = Branded<string, 'EventCode'>;
export type OfficeCode = 'EPO';
export type Source = {
    readonly cite: string;
    readonly url: string;
};
export type TriggerInput = {
    readonly event: EventCode;
    /** The date that the office document bears. */
    readonly documentDate: LocalDate;
    /** The date on which the document reached the addressee, when known. */
    readonly receivedAt: LocalDate | null;
    /**
     * The period in whole months that the office document sets. Only a rule with `setPeriod` reads it,
     * and refuses the trigger without it. A rule whose period the law fixes ignores it.
     */
    readonly periodMonths?: number;
};
export type TraceStep = {
    readonly op: 'delivery' | 'start' | 'add-period' | 'month-end' | 'closure-roll';
    readonly from: LocalDate;
    readonly to: LocalDate;
    readonly cite: string;
};
export type Note = {
    readonly kind: 'late-receipt';
    readonly text: string;
    readonly cite: string;
};
export type ComputationError = 'invalid-input' | 'calendar-missing' | 'unknown-event' | 'rule-not-effective' | 'period-missing' | 'period-out-of-range';
/** The whole months, ends included, that the law allows for a period that the office sets in the document. */
export type SetPeriod = {
    readonly minMonths: number;
    readonly maxMonths: number;
    readonly cite: string;
};
export type Computation = {
    readonly ok: true;
    readonly due: LocalDate;
    readonly trace: readonly TraceStep[];
    readonly notes: readonly Note[];
    readonly remedies: readonly RuleId[];
} | {
    readonly ok: false;
    readonly error: ComputationError;
    readonly detail: string;
};
export type Rule = {
    readonly id: RuleId;
    /** A change of the law or of its reading is a new version. Old versions stay. */
    readonly version: number;
    readonly legalSource: readonly Source[];
    /** The rule applies to a trigger whose document date is in this range, ends included. */
    readonly effectiveFrom: LocalDate;
    readonly effectiveTo: LocalDate | null;
    readonly office: OfficeCode;
    readonly trigger: readonly EventCode[];
    /** The allowed range of `periodMonths` when the office sets the period; `null` when the law fixes it. */
    readonly setPeriod: SetPeriod | null;
    /** `null` until a qualified attorney signs off this version. */
    readonly reviewedBy: {
        readonly attorney: string;
        readonly date: LocalDate;
    } | null;
    compute(input: TriggerInput, calendars: Calendars): Computation;
};
export type ClosedDay = {
    readonly date: LocalDate;
    readonly name: string;
};
/**
 * The days of one year on which at least one filing office of the office is closed, apart from
 * Saturdays and Sundays, copied from the office's published notice.
 */
export type Calendar = {
    readonly office: OfficeCode;
    readonly year: number;
    readonly closedDays: readonly ClosedDay[];
    readonly source: Source;
};
export type Calendars = {
    /** Throws `CalendarMissing` when no calendar for that office and year is loaded. */
    calendar(office: OfficeCode, year: number): Calendar;
};
export {};
