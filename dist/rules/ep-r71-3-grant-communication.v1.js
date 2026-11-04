import { closureRollStep } from '../calendars.js';
import { addDays, addMonths, daysBetween, parseLocalDate, startDay } from '../date.js';
import { defineRule, parseEventCode } from '../rule.js';
const PERIOD_MONTHS = 4;
const DELIVERY_GRACE_DAYS = 7;
/**
 * Rule 71(3) EPC: the communication of the text intended for grant sets a period of four months to
 * pay the fee for grant and publishing and to file the translations of the claims.
 */
export const epR71_3GrantCommunicationV1 = defineRule({
    id: 'ep.r71-3.grant-communication',
    version: 1,
    office: 'EPO',
    trigger: [parseEventCode('EPO:R71(3)')],
    effectiveFrom: parseLocalDate('2023-11-01'),
    effectiveTo: null,
    reviewedBy: null,
    legalSource: [
        { cite: 'Rule 71 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r71.html' },
        { cite: 'Rule 126 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r126.html' },
        { cite: 'Rule 127 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r127.html' },
        { cite: 'Rule 131 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r131.html' },
        { cite: 'Rule 134 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r134.html' },
        { cite: 'OJ EPO 2022, A101', url: 'https://www.epo.org/en/legal/official-journal/2022/11/a101' },
        { cite: 'OJ EPO 2023, A29', url: 'https://www.epo.org/en/legal/official-journal/2023/03/a29' },
    ],
    due({ documentDate, receivedAt }, calendars) {
        const expiry = addMonths(documentDate, PERIOD_MONTHS);
        const monthEnd = expiry.slice(8) !== documentDate.slice(8);
        const roll = closureRollStep('EPO', expiry, calendars);
        const trace = [
            { op: 'delivery', from: documentDate, to: documentDate, cite: 'Rule 126(2) EPC; Rule 127(2) EPC; OJ EPO 2023, A29' },
            { op: 'start', from: documentDate, to: startDay(documentDate), cite: 'Rule 131(2) EPC' },
            monthEnd
                ? { op: 'month-end', from: documentDate, to: expiry, cite: 'Rule 71(3) EPC; Rule 131(4) EPC, last day of the month' }
                : { op: 'add-period', from: documentDate, to: expiry, cite: 'Rule 71(3) EPC; Rule 131(4) EPC' },
            roll,
        ];
        const notes = [];
        const lateDays = receivedAt === null ? 0 : daysBetween(documentDate, receivedAt);
        if (lateDays > DELIVERY_GRACE_DAYS) {
            notes.push({
                kind: 'late-receipt',
                cite: 'Rule 126(2) EPC; Rule 127(2) EPC',
                text: `The document reached the addressee on ${receivedAt}, ${lateDays} days after the date it bears. If the EPO establishes this, the period ends ${days(lateDays - DELIVERY_GRACE_DAYS)} after ${expiry}, on ${addDays(expiry, lateDays - DELIVERY_GRACE_DAYS)}, and Rule 134(1) EPC then applies to that day. The due date does not include this extension.`,
            });
        }
        return { due: roll.to, trace, notes, remedies: [] };
    },
});
function days(count) {
    return count === 1 ? '1 day' : `${count} days`;
}
