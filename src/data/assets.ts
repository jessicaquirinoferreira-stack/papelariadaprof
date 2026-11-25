/**
 * Vercel Blob Storage configuration & assets mapping
 * Connected store: store_PlzVSXUdkSXuzBcH
 */

export const VERCEL_BLOB_BASE = 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com';
export const VERCEL_BLOB_STORE_ID = 'store_PlzVSXUdkSXuzBcH';

export const BLOB_ASSETS = {
  logo: `${VERCEL_BLOB_BASE}/images/logo-papelaria.png`,
  aboutAtelier: `${VERCEL_BLOB_BASE}/images/about-atelier.svg`,
  apostilaLeitura: `${VERCEL_BLOB_BASE}/images/apostila-leitura.svg`,
  apostilaMatematica: `${VERCEL_BLOB_BASE}/images/apostila-matematica.svg`,
  apostilaPsico: `${VERCEL_BLOB_BASE}/images/apostila-psico.svg`,
  apostilaRedacao: `${VERCEL_BLOB_BASE}/images/apostila-redacao.svg`,
  prodPlanner: `${VERCEL_BLOB_BASE}/images/prod-planner.svg`,
  prodAlfabetizacao: `${VERCEL_BLOB_BASE}/images/prod-alfabetizacao.svg`,
  assistant: `${VERCEL_BLOB_BASE}/images/assistente-prof-mel.png`,
  lilianPhoto: `${VERCEL_BLOB_BASE}/images/professora-lilian-foto.jpg`,
  lilianPhotoPostimg: 'https://i.postimg.cc/PxFgk2TJ/5517991996136-s-whatsapp-net-2A46835020BBB46E7261.jpg',
} as const;

export const BLOB_PDFS = {
  alfabetizacao: `${VERCEL_BLOB_BASE}/pdfs/apostila-alfabetizacao.pdf`,
  matematica: `${VERCEL_BLOB_BASE}/pdfs/apostila-matematica-ludica.pdf`,
  professoras: `${VERCEL_BLOB_BASE}/pdfs/apostila-pdf-professoras.pdf`,
  portugues: `${VERCEL_BLOB_BASE}/pdfs/apostila-portugues-1-5.pdf`,
  producaoTextual: `${VERCEL_BLOB_BASE}/pdfs/apostila-producao-textual.pdf`,
  silabas: `${VERCEL_BLOB_BASE}/pdfs/apostila-silabas-leitura.pdf`,
} as const;
