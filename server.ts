import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

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
  const token = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PlzVSXUdkSXuzBcH_cMJWFamh4JkVWz2DBQedYqKOSb8isB';
  const storeId = process.env.BLOB_STORE_ID || 'store_PlzVSXUdkSXuzBcH';
  res.json({
    ok: true,
    blobConfigured: Boolean(token),
    blobStoreId: storeId,
  });
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

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PlzVSXUdkSXuzBcH_cMJWFamh4JkVWz2DBQedYqKOSb8isB';
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
