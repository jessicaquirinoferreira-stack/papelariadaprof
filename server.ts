import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  createInfinitePayCheckoutLink,
  verifyInfinitePayPayment,
} from './server/infinitepay';

dotenv.config();

const PORT = 3000;
const app = express();

const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

app.get('/api/health', (_req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = process.env.BLOB_STORE_ID || 'store_PlzVSXUdkSXuzBcH';
  res.json({
    ok: true,
    blobConfigured: Boolean(token),
    blobStoreId: storeId,
    infinitePayConfigured: Boolean(process.env.INFINITEPAY_API_KEY),
  });
});

app.post('/api/infinitepay/create-checkout', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Dados do pedido inválidos.' });
      return;
    }
    const result = await createInfinitePayCheckoutLink({
      orderId: String(body.orderId),
      items: body.items,
      discount: Number(body.discount || 0),
      paymentType: body.paymentType === 'credit_card' ? 'credit_card' : 'pix',
      installments: Number(body.installments || 1),
      redirectUrl: String(body.redirectUrl || ''),
      webhookUrl: body.webhookUrl ? String(body.webhookUrl) : undefined,
      customer: body.customer,
    });
    res.json(result);
  } catch (error) {
    console.error('InfinitePay create-checkout error:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao iniciar checkout da InfinitePay.',
    });
  }
});

app.post('/api/infinitepay/check-payment', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.orderId) {
      res.status(400).json({ error: 'orderId é obrigatório.' });
      return;
    }
    const check = await verifyInfinitePayPayment({
      orderNsu: String(body.orderId),
      slug: body.slug ? String(body.slug) : undefined,
      transactionNsu: body.transactionNsu ? String(body.transactionNsu) : undefined,
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : undefined,
    });
    res.json(check);
  } catch (error) {
    console.error('InfinitePay check-payment error:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao verificar pagamento na InfinitePay.',
    });
  }
});

app.post('/api/infinitepay/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const orderNsu = String(body.order_nsu || '').trim();
    const slug = String(body.invoice_slug || body.slug || '').trim();
    const transactionNsu = String(body.transaction_nsu || '').trim();
    const receiptUrl = String(body.receipt_url || '').trim();

    if (orderNsu) {
      await verifyInfinitePayPayment({
        orderNsu,
        slug,
        transactionNsu,
        receiptUrl,
      });
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('InfinitePay webhook error:', error);
    res.status(200).json({ received: true });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const originalName = req.file.originalname || 'arquivo';
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 60);
    const safeFileName = `${Date.now()}-${baseName}${ext}`;
    const folder = req.body?.folder === 'pdfs' ? 'pdfs' : 'images';

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (blobToken) {
      try {
        const blob = await put(`${folder}/${safeFileName}`, req.file.buffer, {
          access: 'public',
          token: blobToken,
          contentType: req.file.mimetype,
        });
        res.json({
          url: blob.url,
          fileName: originalName,
          fileSizeBytes: req.file.size,
          storage: 'vercel-blob',
        });
        return;
      } catch (blobErr) {
        console.error('Vercel Blob put error in server.ts:', blobErr);
      }
    }

    const targetFolder = path.join(uploadsDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    const targetPath = path.join(targetFolder, safeFileName);
    fs.writeFileSync(targetPath, req.file.buffer);

    res.json({
      url: `/uploads/${folder}/${safeFileName}`,
      fileName: originalName,
      fileSizeBytes: req.file.size,
      storage: 'local',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Falha ao processar upload do arquivo.' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Papelaria da Prof server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
