import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { router as webhookRouter } from './routes/webhook.js';
import './db.js';
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/webhook', webhookRouter);
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Text Portal listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map