import { db } from '../db.js';
import { centsToCurrency } from '../types.js';

export function statementSummaryText(businessId: number, customerId: number): string {
  const open = db.prepare('SELECT id, amount_cents, currency, due_ts FROM invoices WHERE business_id = ? AND customer_id = ? AND status = ? ORDER BY due_ts ASC')
    .all(businessId, customerId, 'open') as any[];
  const paid = db.prepare('SELECT id, amount_cents, currency, created_ts FROM invoices WHERE business_id = ? AND customer_id = ? AND status = ? ORDER BY created_ts DESC LIMIT 5')
    .all(businessId, customerId, 'paid') as any[];
  const lines: string[] = [];
  const totalCents = open.reduce((s, i) => s + i.amount_cents, 0);
  lines.push(`Open invoices: ${open.length} (Total ${centsToCurrency(totalCents)})`);
  if (open.length) {
    lines.push('Open:');
    for (const inv of open) {
      lines.push(`#${inv.id} - ${centsToCurrency(inv.amount_cents)} due ${new Date(inv.due_ts*1000).toLocaleDateString()}`);
    }
  }
  if (paid.length) {
    lines.push('Recent paid:');
    for (const inv of paid) {
      lines.push(`#${inv.id} - ${centsToCurrency(inv.amount_cents)} paid ${new Date(inv.created_ts*1000).toLocaleDateString()}`);
    }
  }
  return lines.join('\n');
}