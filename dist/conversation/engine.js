import { getOrCreateBusiness, getOrCreateCustomer, listOpenInvoices } from '../db.js';
import { createGenericPaymentLink } from '../services/payments.js';
import { bookAppointment, listAppointmentsText, parseDateTimeToEpoch, cancelAppointmentText } from '../services/scheduling.js';
import { statementSummaryText } from '../services/statements.js';
import { centsToCurrency } from '../types.js';
const DEFAULT_BIZ_NAME = process.env.DEFAULT_BUSINESS_NAME || 'ServiceCo';
export async function handleIncoming(msg) {
    const businessId = getOrCreateBusiness(DEFAULT_BIZ_NAME);
    const customerId = getOrCreateCustomer(businessId, msg.from);
    const text = (msg.body || '').trim();
    if (!text)
        return reply(msg, mainMenu());
    const [cmd, ...rest] = text.split(/\s+/);
    const upper = cmd.toUpperCase();
    switch (upper) {
        case 'MENU':
        case 'HELP':
            return reply(msg, mainMenu());
        case 'PROFILE': {
            if (!rest.length)
                return reply(msg, 'Send PROFILE Your Name | your@email.com');
            const combined = rest.join(' ');
            const [name, email] = combined.split('|').map(s => s.trim());
            // Simple update
            // Note: better validation omitted for brevity
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { db } = await import('../db.js');
            db.prepare('UPDATE customers SET name = ?, email = ? WHERE id = ?').run(name || 'Customer', email || null, customerId);
            return reply(msg, 'Profile updated.');
        }
        case 'BOOK': {
            if (!rest.length)
                return reply(msg, 'Usage: BOOK YYYY-MM-DD HH:MM');
            const ts = parseDateTimeToEpoch(rest.join(' '), 'UTC');
            if (!ts)
                return reply(msg, 'Could not parse date/time. Example: BOOK 2025-01-31 14:00');
            try {
                const apptId = bookAppointment({ businessId, customerId, startTs: ts });
                return reply(msg, `Booked appointment #${apptId} at ${new Date(ts * 1000).toLocaleString()}`);
            }
            catch (e) {
                return reply(msg, `Unable to book: ${e.message}`);
            }
        }
        case 'MY':
            if (rest[0]?.toUpperCase() === 'APPTS') {
                return reply(msg, listAppointmentsText(businessId, customerId));
            }
            return reply(msg, mainMenu());
        case 'CANCEL': {
            const id = Number(rest[0]);
            if (!id)
                return reply(msg, 'Usage: CANCEL <AppointmentId>');
            return reply(msg, cancelAppointmentText(id, customerId));
        }
        case 'PAY': {
            // PAY or PAY <invoiceId> or PAY AMOUNT 125.00
            if (rest[0]?.toUpperCase() === 'AMOUNT') {
                const dollars = Number(rest[1]);
                if (!dollars || dollars <= 0)
                    return reply(msg, 'Usage: PAY AMOUNT 125.00');
                const amountCents = Math.round(dollars * 100);
                if (!process.env.STRIPE_SECRET)
                    return reply(msg, 'Payments not configured.');
                const { invoiceId, url } = await createGenericPaymentLink({
                    businessId,
                    businessName: DEFAULT_BIZ_NAME,
                    customerId,
                    customerPhone: msg.from,
                    amountCents
                });
                return reply(msg, `Pay ${centsToCurrency(amountCents)} for invoice #${invoiceId}: ${url}`);
            }
            const open = listOpenInvoices(businessId, customerId);
            if (!open.length)
                return reply(msg, 'You have no open invoices.');
            if (rest.length) {
                const invId = Number(rest[0]);
                const found = open.find(i => i.id === invId);
                if (!found)
                    return reply(msg, 'That invoice is not open.');
                if (!process.env.STRIPE_SECRET)
                    return reply(msg, 'Payments not configured.');
                const url = await createPaymentLinkForInvoiceWrapper(found.id, found.amount_cents, msg.from);
                return reply(msg, `Pay invoice #${found.id} (${centsToCurrency(found.amount_cents)}): ${url}`);
            }
            const list = open.map(i => `#${i.id} - ${centsToCurrency(i.amount_cents)} due ${new Date(i.due_ts * 1000).toLocaleDateString()}`).join('\n');
            return reply(msg, 'Open invoices:\n' + list + '\nPay: PAY <InvoiceId> or PAY AMOUNT 100.00');
        }
        case 'STATEMENT': {
            return reply(msg, statementSummaryText(businessId, customerId));
        }
        default:
            return reply(msg, mainMenu());
    }
}
function reply(msg, body) {
    return { to: msg.from, body };
}
function mainMenu() {
    return [
        'Welcome to the Service Portal (text-only). Reply with:',
        'PROFILE Your Name | email@example.com',
        'BOOK YYYY-MM-DD HH:MM',
        'MY APPTS',
        'CANCEL <AppointmentId>',
        'PAY [<InvoiceId>] | PAY AMOUNT 100.00',
        'STATEMENT',
        'HELP or MENU'
    ].join('\n');
}
async function createPaymentLinkForInvoiceWrapper(invoiceId, amountCents, phone) {
    const { createPaymentLinkForInvoice } = await import('../services/payments.js');
    return createPaymentLinkForInvoice({
        invoiceId,
        amountCents,
        customerPhone: phone,
        businessName: DEFAULT_BIZ_NAME
    });
}
//# sourceMappingURL=engine.js.map