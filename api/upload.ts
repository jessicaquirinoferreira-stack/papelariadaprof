import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

interface MulterRequest extends IncomingMessage {
  file?: Express.Multer.File;
  body?: { folder?: string };
}

function runMulter(req: MulterRequest, res: ServerResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('file')(req as never, res as never, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: MulterRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  try {
    await runMulter(req, res);

    if (!req.file) {
      sendJson(res, 400, { error: 'Nenhum arquivo enviado.' });
      return;
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!blobToken) {
      sendJson(res, 503, {
        error:
          'Configure a variável BLOB_READ_WRITE_TOKEN na Vercel ou cole a URL direta do PDF/imagem no campo ao lado.',
      });
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

    const blob = await put(`${folder}/${safeFileName}`, req.file.buffer, {
      access: 'public',
      token: blobToken,
      contentType: req.file.mimetype,
    });

    sendJson(res, 200, {
      url: blob.url,
      fileName: originalName,
      fileSizeBytes: req.file.size,
      storage: 'vercel-blob',
    });
  } catch (error) {
    console.error('Vercel upload error:', error);
    sendJson(res, 500, { error: 'Falha ao processar upload do arquivo.' });
  }
}
