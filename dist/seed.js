import { getOrCreateBusiness, getOrCreateCustomer, createInvoice, now, db } from './db.js';
const businessId = getOrCreateBusiness(process.env.DEFAULT_BUSINESS_NAME || 'ServiceCo');
const phone = process.env.SEED_CUSTOMER_PHONE || '+15555550123';
const customerId = getOrCreateCustomer(businessId, phone, 'First Customer');
const due = now() + 3 * 86400;
const invoiceId = createInvoice(businessId, customerId, 15000, 'usd', due, 'Initial service');
const apptStart = now() + 5 * 86400;
db.prepare('INSERT INTO appointments (business_id, customer_id, start_ts, end_ts, status, notes, created_ts) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(businessId, customerId, apptStart, apptStart + 3600, 'scheduled', 'Seed appointment', now());
// eslint-disable-next-line no-console
console.log(JSON.stringify({ businessId, customerId, invoiceId, phone }, null, 2));
//# sourceMappingURL=seed.js.map