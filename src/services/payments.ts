import Stripe from 'stripe';
import { centsToCurrency, Currency } from '../types.js';
import { createInvoice, markInvoicePaid, recordPayment } from '../db.js';

const STRIPE_SECRET = process.env.STRIPE_SECRET || '';
export const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;

export async function createPaymentLinkForInvoice(params: {
  invoiceId: number;
  amountCents: number;
  currency?: string;
  customerPhone: string;
  businessName: string;
  statementDescriptor?: string;
}): Promise<string> {
  if (!stripe) throw new Error('Stripe not configured');
  const currency = params.currency || Currency;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: currency as any,
          product_data: {
            name: `${params.businessName} Invoice #${params.invoiceId}`,
            description: `Payment for invoice ${params.invoiceId} (${centsToCurrency(params.amountCents)})`
          },
          unit_amount: params.amountCents
        },
        quantity: 1
      }
    ],
    metadata: {
      invoice_id: String(params.invoiceId),
      customer_phone: params.customerPhone
    },
    phone_number_collection: { enabled: true },
    success_url: process.env.PUBLIC_SUCCESS_URL || 'https://example.com/success',
    cancel_url: process.env.PUBLIC_CANCEL_URL || 'https://example.com/cancel'
  });
  if (!session.url) throw new Error('Failed to create Stripe checkout session');
  return session.url;
}

export async function createGenericPaymentLink(params: {
  businessId: number;
  businessName: string;
  customerId: number;
  customerPhone: string;
  amountCents: number;
  memo?: string;
  currency?: string;
}): Promise<{ invoiceId: number; url: string }> {
  const invoiceId = createInvoice(
    params.businessId,
    params.customerId,
    params.amountCents,
    params.currency || Currency,
    Math.floor(Date.now() / 1000) + 7 * 86400,
    params.memo
  );
  const url = await createPaymentLinkForInvoice({
    invoiceId,
    amountCents: params.amountCents,
    currency: params.currency,
    customerPhone: params.customerPhone,
    businessName: params.businessName
  });
  return { invoiceId, url };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  if (!stripe) throw new Error('Stripe not configured');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;
  if (endpointSecret) {
    event = stripe.webhooks.constructEvent(rawBody, signature || '', endpointSecret);
  } else {
    event = JSON.parse(rawBody.toString());
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = Number(session.metadata?.invoice_id);
    const amountCents = (session.amount_total as number | null) || 0;
    const currency = (session.currency as string | null) || Currency;
    if (invoiceId) {
      markInvoicePaid(invoiceId);
      // We do not know businessId/customerId from Stripe alone; caller should enrich or we store on metadata in future.
      recordPayment(0, 0, amountCents, currency, 'stripe', session.id, invoiceId);
    }
  }

  return { received: true };
}