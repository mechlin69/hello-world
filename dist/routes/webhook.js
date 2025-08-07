import express from 'express';
import bodyParser from 'body-parser';
import { handleIncoming } from '../conversation/engine.js';
import { handleStripeWebhook } from '../services/payments.js';
export const router = express.Router();
// Generic webhook: { from, to, body }
router.post('/msg', async (req, res) => {
    try {
        const { from, to, body } = req.body || {};
        if (!from || !body)
            return res.status(400).json({ error: 'from and body required' });
        const out = await handleIncoming({ from, to, body });
        res.json(out);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Twilio form-encoded webhook
router.post('/twilio', bodyParser.urlencoded({ extended: false }), async (req, res) => {
    const from = req.body?.From;
    const to = req.body?.To;
    const body = req.body?.Body;
    if (!from || !body)
        return res.type('text/plain').send('Missing');
    const out = await handleIncoming({ from, to, body });
    // Respond with TwiML
    res.type('text/xml').send(`<Response><Message>${escapeXml(out.body)}</Message></Response>`);
});
// Stripe webhook (raw body)
router.post('/stripe', bodyParser.raw({ type: '*/*' }), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const result = await handleStripeWebhook(req.body, sig);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
function escapeXml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
//# sourceMappingURL=webhook.js.map