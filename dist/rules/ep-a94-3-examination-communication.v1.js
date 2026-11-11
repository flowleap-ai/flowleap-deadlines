import { closureRollStep } from '../calendars.js';
import { addDays, addMonths, daysBetween, parseLocalDate, startDay } from '../date.js';
import { defineRule, parseEventCode } from '../rule.js';
const DELIVERY_GRACE_DAYS = 7;
/**
 * Article 94(3) EPC with Rule 71(1) EPC: the communication of the examining division invites the
 * applicant to reply within a period that the communication specifies. Rule 132(2) EPC limits that
 * period to two to four months, in certain circumstances up to six months. The caller reads the
 * period from the communication and gives it as `periodMonths`.
 */
export const epA94_3ExaminationCommunicationV1 = defineRule({
    id: 'ep.a94-3.examination-communication',
    version: 1,
    office: 'EPO',
    trigger: [parseEventCode('EPO:A94(3)')],
    effectiveFrom: parseLocalDate('2023-11-01'),
    effectiveTo: null,
    reviewedBy: null,
    setPeriod: { minMonths: 2, maxMonths: 6, cite: 'Rule 132(2) EPC' },
    legalSource: [
        { cite: 'Article 94 EPC', url: 'https://www.epo.org/en/legal/epc/2020/a94.html' },
        { cite: 'Rule 71 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r71.html' },
        { cite: 'Rule 126 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r126.html' },
        { cite: 'Rule 127 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r127.html' },
        { cite: 'Rule 131 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r131.html' },
        { cite: 'Rule 132 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r132.html' },
        { cite: 'Rule 134 EPC', url: 'https://www.epo.org/en/legal/epc/2020/r134.html' },
        { cite: 'OJ EPO 2022, A101', url: 'https://www.epo.org/en/legal/official-journal/2022/11/a101' },
        { cite: 'OJ EPO 2023, A29', url: 'https://www.epo.org/en/legal/official-journal/2023/03/a29' },
        { cite: 'Guidelines E-VIII, 1.2', url: 'https://www.epo.org/en/legal/guidelines-epc/2026/e_viii_1_2.html' },
    ],
    due({ documentDate, receivedAt }, calendars, periodMonths) {
        const expiry = addMonths(documentDate, periodMonths);
        const monthEnd = expiry.slice(8) !== documentDate.slice(8);
        const roll = closureRollStep('EPO', expiry, calendars);
        const period = `Article 94(3) EPC; Rule 71(1) EPC; Rule 132(2) EPC, ${periodMonths} months set in the communication; Rule 131(4) EPC`;
        const trace = [
            { op: 'delivery', from: documentDate, to: documentDate, cite: 'Rule 126(2) EPC; Rule 127(2) EPC; OJ EPO 2023, A29' },
            { op: 'start', from: documentDate, to: startDay(documentDate), cite: 'Rule 131(2) EPC' },
            monthEnd
                ? { op: 'month-end', from: documentDate, to: expiry, cite: `${period}, last day of the month` }
                : { op: 'add-period', from: documentDate, to: expiry, cite: period },
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
