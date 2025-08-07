import { z } from 'zod';

export const PhoneE164 = z.string().regex(/^\+[1-9]\d{1,14}$/);
export type PhoneE164 = z.infer<typeof PhoneE164>;

export const Business = z.object({
  id: z.number(),
  name: z.string(),
  timezone: z.string().default('UTC'),
  createdTs: z.number()
});
export type Business = z.infer<typeof Business>;

export const Customer = z.object({
  id: z.number(),
  businessId: z.number(),
  name: z.string(),
  phone: PhoneE164,
  email: z.string().email().optional().nullable(),
  createdTs: z.number()
});
export type Customer = z.infer<typeof Customer>;

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
export type Appointment = z.infer<typeof Appointment>;

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
export type Invoice = z.infer<typeof Invoice>;

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
export type Payment = z.infer<typeof Payment>;

export const UserSession = z.object({
  id: z.number(),
  phone: PhoneE164,
  businessId: z.number().nullable(),
  customerId: z.number().nullable(),
  stateJson: z.string(),
  updatedTs: z.number()
});
export type UserSession = z.infer<typeof UserSession>;

export type IncomingMessage = {
  from: PhoneE164;
  to?: PhoneE164 | string;
  body: string;
  businessHint?: number; // optional, set by routing layer
};

export type OutgoingMessage = {
  to: PhoneE164 | string;
  body: string;
};

export type ParsedCommand = {
  command: string;
  args: string[];
};

export const Currency = 'usd';

export function centsToCurrency(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}