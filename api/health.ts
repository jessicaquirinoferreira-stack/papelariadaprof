import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PlzVSXUdkSXuzBcH_cMJWFamh4JkVWz2DBQedYqKOSb8isB';
  const storeId = process.env.BLOB_STORE_ID || 'store_PlzVSXUdkSXuzBcH';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      blobConfigured: Boolean(token),
      blobStoreId: storeId,
      runtime: 'vercel-serverless',
    })
  );
}
