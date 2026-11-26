import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = process.env.BLOB_STORE_ID || 'store_PlzVSXUdkSXuzBcH';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      blobConfigured: Boolean(token),
      blobStoreId: storeId,
      infinitePayConfigured: Boolean(process.env.INFINITEPAY_API_KEY),
      runtime: 'vercel-serverless',
    })
  );
}
