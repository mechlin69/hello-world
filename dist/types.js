import { z } from 'zod';
export const PhoneE164 = z.string().regex(/^\+[1-9]\d{1,14}$/);
export const Business = z.object({
    id: z.number(),
    name: z.string(),
    timezone: z.string().default('UTC'),
    createdTs: z.number()
});
export const Customer = z.object({
    id: z.number(),
    businessId: z.number(),
    name: z.string(),
    phone: PhoneE164,
    email: z.string().email().optional().nullable(),
    createdTs: z.number()
});
export const AppointmentStatus = z.enum(['scheduled', 'cancelled', 'completed']);
export const Appointment = z.object({
    id: z.number(),
    businessId: z.number(),
    customerId: z.number(),
    startTs: z.number(),
    endTs: z.number(),
    status: AppointmentStatus,
    notes: z.string().optional().nullable(),
    createdTs: z.number()
});
export const InvoiceStatus = z.enum(['draft', 'open', 'paid', 'void']);
export const Invoice = z.object({
    id: z.number(),
    businessId: z.number(),
    customerId: z.number(),
    amountCents: z.number(),
    currency: z.string(),
    dueTs: z.number(),
    status: InvoiceStatus,
    memo: z.string().optional().nullable(),
    createdTs: z.number()
});
export const Payment = z.object({
    id: z.number(),
    businessId: z.number(),
    customerId: z.number(),
    invoiceId: z.number().nullable(),
    amountCents: z.number(),
    currency: z.string(),
    processor: z.enum(['stripe']),
    externalId: z.string(),
    createdTs: z.number()
});
export const UserSession = z.object({
    id: z.number(),
    phone: PhoneE164,
    businessId: z.number().nullable(),
    customerId: z.number().nullable(),
    stateJson: z.string(),
    updatedTs: z.number()
});
export const Currency = 'usd';
export function centsToCurrency(amountCents) {
    return `$${(amountCents / 100).toFixed(2)}`;
}
//# sourceMappingURL=types.js.map