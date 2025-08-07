import Database from 'better-sqlite3';
const DB_PATH = process.env.SQLITE_PATH || './portal.sqlite';
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_ts INTEGER NOT NULL,
  UNIQUE (business_id, phone),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  start_ts INTEGER NOT NULL,
  end_ts INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_ts INTEGER NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  due_ts INTEGER NOT NULL,
  status TEXT NOT NULL,
  memo TEXT,
  created_ts INTEGER NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  invoice_id INTEGER,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  processor TEXT NOT NULL,
  external_id TEXT NOT NULL,
  created_ts INTEGER NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  business_id INTEGER,
  customer_id INTEGER,
  state_json TEXT NOT NULL,
  updated_ts INTEGER NOT NULL
);
`);
export function now() {
    return Math.floor(Date.now() / 1000);
}
export function getOrCreateBusiness(name) {
    const find = db.prepare('SELECT id FROM businesses WHERE name = ?').get(name);
    if (find)
        return find.id;
    const info = db.prepare('INSERT INTO businesses (name, timezone, created_ts) VALUES (?, ?, ?)').run(name, 'UTC', now());
    return Number(info.lastInsertRowid);
}
export function getOrCreateCustomer(businessId, phone, nameFallback = 'Customer') {
    const find = db.prepare('SELECT id FROM customers WHERE business_id = ? AND phone = ?').get(businessId, phone);
    if (find)
        return find.id;
    const info = db.prepare('INSERT INTO customers (business_id, name, phone, email, created_ts) VALUES (?, ?, ?, ?, ?)')
        .run(businessId, nameFallback, phone, null, now());
    return Number(info.lastInsertRowid);
}
export function upsertSession(phone, businessId, customerId, state) {
    const existing = db.prepare('SELECT id FROM user_sessions WHERE phone = ?').get(phone);
    const payload = JSON.stringify(state);
    if (existing) {
        db.prepare('UPDATE user_sessions SET business_id = ?, customer_id = ?, state_json = ?, updated_ts = ? WHERE id = ?')
            .run(businessId, customerId, payload, now(), existing.id);
    }
    else {
        db.prepare('INSERT INTO user_sessions (phone, business_id, customer_id, state_json, updated_ts) VALUES (?, ?, ?, ?, ?)')
            .run(phone, businessId, customerId, payload, now());
    }
}
export function getSession(phone) {
    const row = db.prepare('SELECT business_id, customer_id, state_json FROM user_sessions WHERE phone = ?').get(phone);
    if (!row)
        return { businessId: null, customerId: null, state: {} };
    return { businessId: row.business_id ?? null, customerId: row.customer_id ?? null, state: JSON.parse(row.state_json || '{}') };
}
export function listUpcomingAppointments(businessId, customerId, fromTs) {
    return db.prepare('SELECT * FROM appointments WHERE business_id = ? AND customer_id = ? AND start_ts >= ? AND status = ? ORDER BY start_ts ASC LIMIT 10')
        .all(businessId, customerId, fromTs, 'scheduled');
}
export function createAppointment(businessId, customerId, startTs, endTs, notes) {
    const conflict = db.prepare('SELECT id FROM appointments WHERE business_id = ? AND status = ? AND ((? < end_ts AND ? > start_ts))')
        .get(businessId, 'scheduled', startTs, endTs);
    if (conflict)
        throw new Error('Time slot not available');
    const info = db.prepare('INSERT INTO appointments (business_id, customer_id, start_ts, end_ts, status, notes, created_ts) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(businessId, customerId, startTs, endTs, 'scheduled', notes ?? null, now());
    return Number(info.lastInsertRowid);
}
export function cancelAppointment(apptId, customerId) {
    const appt = db.prepare('SELECT id, customer_id, status FROM appointments WHERE id = ?').get(apptId);
    if (!appt || appt.customer_id !== customerId || appt.status !== 'scheduled')
        return false;
    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run('cancelled', apptId);
    return true;
}
export function listOpenInvoices(businessId, customerId) {
    return db.prepare('SELECT * FROM invoices WHERE business_id = ? AND customer_id = ? AND status = ? ORDER BY created_ts ASC')
        .all(businessId, customerId, 'open');
}
export function getInvoice(invoiceId) {
    return db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
}
export function markInvoicePaid(invoiceId) {
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('paid', invoiceId);
}
export function createInvoice(businessId, customerId, amountCents, currency, dueTs, memo) {
    const info = db.prepare('INSERT INTO invoices (business_id, customer_id, amount_cents, currency, due_ts, status, memo, created_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(businessId, customerId, amountCents, currency, dueTs, 'open', memo ?? null, now());
    return Number(info.lastInsertRowid);
}
export function recordPayment(businessId, customerId, amountCents, currency, processor, externalId, invoiceId) {
    const info = db.prepare('INSERT INTO payments (business_id, customer_id, invoice_id, amount_cents, currency, processor, external_id, created_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(businessId, customerId, invoiceId ?? null, amountCents, currency, processor, externalId, now());
    return Number(info.lastInsertRowid);
}
//# sourceMappingURL=db.js.map