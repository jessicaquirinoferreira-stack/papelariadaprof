import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { calculateShippingOptions, cleanDigits, formatCep } from './src/lib/commerce.ts';
import { SEED_DIGITAL_MATERIALS } from './src/data/seedData.ts';
import type { DigitalMaterial, StudentMaterialGrant, StudentProfile } from './src/types/store.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '4mb' }));

const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const dataDir = path.resolve(process.cwd(), '.data');
fs.mkdirSync(dataDir, { recursive: true });
const lmsStorePath = path.join(dataDir, 'lms-store.json');

interface StoredStudentRecord extends StudentProfile {
  passwordHash?: string;
}

interface LmsStoreFile {
  students: StoredStudentRecord[];
  materials: DigitalMaterial[];
  grants: StudentMaterialGrant[];
}

function createInitialLmsStore(): LmsStoreFile {
  return {
    students: [],
    materials: SEED_DIGITAL_MATERIALS,
    grants: [],
  };
}

function readLmsStore(): LmsStoreFile {
  try {
    if (!fs.existsSync(lmsStorePath)) {
      const initial = createInitialLmsStore();
      fs.writeFileSync(lmsStorePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(lmsStorePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LmsStoreFile>;
    return {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      materials:
        Array.isArray(parsed.materials) && parsed.materials.length > 0
          ? parsed.materials
          : SEED_DIGITAL_MATERIALS,
      grants: Array.isArray(parsed.grants) ? parsed.grants : [],
    };
  } catch {
    return createInitialLmsStore();
  }
}

function writeLmsStore(data: LmsStoreFile): void {
  fs.writeFileSync(lmsStorePath, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function sanitizeStudent(s: StoredStudentRecord): StudentProfile {
  const { passwordHash: _ignored, ...profile } = s;
  return profile;
}

function sanitizePublicMaterial(m: DigitalMaterial): DigitalMaterial {
  const { pdfUrl: _ignored, ...rest } = m;
  return rest;
}

function escapePdfText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function buildPrintablePdfBuffer(title: string, subtitle: string, lines: string[]): Buffer {
  const commands: string[] = [
    'BT',
    '/F1 20 Tf',
    '56 760 Td',
    `(${escapePdfText('Papelaria da Prof - Material Exclusivo')}) Tj`,
    '0 -28 Td',
    '/F1 15 Tf',
    `(${escapePdfText(title)}) Tj`,
    '0 -22 Td',
    '/F1 11 Tf',
    `(${escapePdfText(subtitle)}) Tj`,
    '0 -24 Td',
  ];

  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push('0 -18 Td');
  }
  commands.push('ET');
  const streamContent = commands.join('\n');

  const objects: string[] = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    `5 0 obj << /Length ${Buffer.byteLength(streamContent, 'utf8')} >> stream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 },
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
});

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email === 'admin@x.com' && password === 'admin4321') {
    res.json({
      ok: true,
      user: {
        email: 'admin@x.com',
        name: 'Administradora · Papelaria da Prof',
      },
    });
    return;
  }

  res.status(401).json({
    ok: false,
    error: 'Credenciais inválidas. Verifique o e-mail e a senha de acesso.',
  });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isPdf =
      file.mimetype === 'application/pdf' ||
      (file.originalname || '').toLowerCase().endsWith('.pdf');

    if (!isImage && !isVideo && !isPdf) {
      res.status(400).json({
        error:
          'Formato não suportado. Envie imagens (JPG, PNG, WebP), vídeos (MP4, WebM) ou apostilas em PDF.',
      });
      return;
    }

    const originalBytes = file.size;
    let finalBuffer = file.buffer;
    let contentType = isPdf ? 'application/pdf' : file.mimetype;
    let ext =
      path.extname(file.originalname || '').toLowerCase() ||
      (isImage ? '.webp' : isPdf ? '.pdf' : '.mp4');

    if (isImage) {
      finalBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 })
        .toBuffer();
      contentType = 'image/webp';
      ext = '.webp';
    } else if (isPdf) {
      ext = '.pdf';
    }

    const baseName =
      path
        .basename(file.originalname || 'midia', path.extname(file.originalname || ''))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'arquivo';

    const fileName = `${Date.now()}-${baseName}${ext}`;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken && blobToken.trim().length > 0) {
      const blob = await put(`papelaria-da-prof/${fileName}`, finalBuffer, {
        access: 'public',
        contentType,
        token: blobToken,
      });

      res.json({
        url: blob.url,
        storage: 'vercel-blob',
        originalBytes,
        optimizedBytes: finalBuffer.byteLength,
        format: contentType,
        fileName: file.originalname || fileName,
      });
      return;
    }

    const destPath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(destPath, finalBuffer);

    res.json({
      url: `/uploads/${fileName}`,
      storage: 'local-optimized',
      originalBytes,
      optimizedBytes: finalBuffer.byteLength,
      format: contentType,
      fileName: file.originalname || fileName,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Falha ao processar o arquivo enviado.' });
  }
});

app.get('/api/sample-pdf/:slug', (req, res) => {
  const slug = String(req.params.slug || 'apostila-exclusiva');
  const store = readLmsStore();
  const mat = store.materials.find((m) => m.slug === slug || m.id === slug);
  const title = mat ? mat.title : 'Apostila Exclusiva de Aula Particular';
  const subtitle = mat
    ? `${mat.levelOrSubject} | ${mat.recommendedAge} | ${mat.pagesCount} paginas`
    : 'Papelaria da Prof - Sao Jose do Rio Preto - SP';

  const buffer = buildPrintablePdfBuffer(title, subtitle, [
    'Material pedagogico exclusivo para alunos matriculados na Aula Particular.',
    'Licenca de uso individual para impressao domestica ou uso em atendimento.',
    '1. Organize um ambiente calmo, bem iluminado e com lapis colorido ou canetinha.',
    '2. Siga a sequencia proposta em aula com a Prof passo a passo.',
    '3. Ao finalizar, registre a evolucao no caderno de acompanhamento.',
    'Duvidas ou solicitacao de novos cadernos: @papelaria.da.prof',
  ]);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${slug}.pdf"`);
  res.send(buffer);
});

app.get('/api/lms/public-materials', (_req, res) => {
  const store = readLmsStore();
  res.json({
    materials: store.materials.filter((m) => m.active).map(sanitizePublicMaterial),
  });
});

app.post('/api/lms/students/register', (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const fullName = String(body.fullName || '').trim();
  const phone = String(body.phone || '').trim();
  const cpf = String(body.cpf || '').trim();
  const studentOrChildName = String(body.studentOrChildName || '').trim();
  const gradeOrAge = String(body.gradeOrAge || '').trim();
  const cityState = String(body.cityState || '').trim();
  const notes = String(body.notes || '').trim();
  const requestedUid = String(body.uid || '').trim();

  if (
    fullName.length < 3 ||
    !email.includes('@') ||
    phone.length < 8 ||
    cpf.length < 11 ||
    studentOrChildName.length < 2 ||
    gradeOrAge.length < 2 ||
    cityState.length < 2
  ) {
    res.status(400).json({ ok: false, error: 'Preencha todos os campos obrigatórios do cadastro.' });
    return;
  }

  if (!requestedUid && password.length < 6) {
    res.status(400).json({ ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  const store = readLmsStore();
  const existing = store.students.find((s) => s.email.toLowerCase() === email);
  if (existing) {
    res.status(409).json({
      ok: false,
      error: 'Já existe um aluno cadastrado com este e-mail. Faça login na aba Entrar.',
    });
    return;
  }

  const now = new Date().toISOString();
  const uid = requestedUid || `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: StoredStudentRecord = {
    uid,
    fullName,
    email,
    phone,
    cpf,
    studentOrChildName,
    gradeOrAge,
    cityState,
    ...(notes ? { notes } : {}),
    createdAt: now,
    updatedAt: now,
    ...(password ? { passwordHash: hashPassword(password) } : {}),
  };

  store.students = [record, ...store.students];
  writeLmsStore(store);

  res.json({
    ok: true,
    student: sanitizeStudent(record),
    grants: store.grants.filter((g) => g.studentId === uid),
  });
});

app.post('/api/lms/students/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const store = readLmsStore();
  const found = store.students.find((s) => s.email.toLowerCase() === email);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    res.status(401).json({
      ok: false,
      error: 'E-mail ou senha incorretos. Confira seus dados ou faça seu cadastro.',
    });
    return;
  }

  const grants = store.grants.filter(
    (g) => g.studentId === found.uid || g.studentEmail.toLowerCase() === email
  );
  res.json({
    ok: true,
    student: sanitizeStudent(found),
    grants,
  });
});

app.post('/api/lms/students/sync', (req, res) => {
  const body = req.body || {};
  const uid = String(body.uid || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if (!uid || !email) {
    res.status(400).json({ ok: false, error: 'UID e e-mail obrigatórios.' });
    return;
  }
  const store = readLmsStore();
  const idx = store.students.findIndex((s) => s.uid === uid || s.email.toLowerCase() === email);
  const now = new Date().toISOString();
  const nextRecord: StoredStudentRecord = {
    ...(idx >= 0 ? store.students[idx] : {}),
    uid: idx >= 0 ? store.students[idx].uid : uid,
    fullName: String(body.fullName || (idx >= 0 ? store.students[idx].fullName : 'Aluno(a)')).trim(),
    email,
    phone: String(body.phone || (idx >= 0 ? store.students[idx].phone : '')).trim(),
    cpf: String(body.cpf || (idx >= 0 ? store.students[idx].cpf : '')).trim(),
    studentOrChildName: String(
      body.studentOrChildName || (idx >= 0 ? store.students[idx].studentOrChildName : '')
    ).trim(),
    gradeOrAge: String(body.gradeOrAge || (idx >= 0 ? store.students[idx].gradeOrAge : '')).trim(),
    cityState: String(body.cityState || (idx >= 0 ? store.students[idx].cityState : '')).trim(),
    notes: body.notes ? String(body.notes).trim() : idx >= 0 ? store.students[idx].notes : undefined,
    createdAt: idx >= 0 ? store.students[idx].createdAt : String(body.createdAt || now),
    updatedAt: now,
  };

  if (idx >= 0) {
    store.students[idx] = nextRecord;
  } else {
    store.students = [nextRecord, ...store.students];
  }
  writeLmsStore(store);

  const grants = store.grants.filter(
    (g) => g.studentId === nextRecord.uid || g.studentEmail.toLowerCase() === email
  );
  res.json({ ok: true, student: sanitizeStudent(nextRecord), grants });
});

app.get('/api/lms/students/:studentId/grants', (req, res) => {
  const studentId = String(req.params.studentId || '').trim();
  const email = String(req.query.email || '').trim().toLowerCase();
  const store = readLmsStore();
  const grants = store.grants.filter(
    (g) =>
      g.studentId === studentId ||
      (email.length > 0 && g.studentEmail.toLowerCase() === email)
  );
  res.json({ grants });
});

app.get('/api/lms/admin/overview', (_req, res) => {
  const store = readLmsStore();
  res.json({
    students: store.students.map(sanitizeStudent),
    materials: store.materials,
    grants: store.grants,
  });
});

app.post('/api/lms/admin/materials', (req, res) => {
  const mat = req.body?.material as DigitalMaterial | undefined;
  if (!mat || !mat.id || !mat.title) {
    res.status(400).json({ ok: false, error: 'Dados da apostila inválidos.' });
    return;
  }
  const store = readLmsStore();
  const idx = store.materials.findIndex((m) => m.id === mat.id);
  const now = new Date().toISOString();
  const nextMat: DigitalMaterial = {
    ...mat,
    pdfUrl: mat.pdfUrl || (idx >= 0 ? store.materials[idx].pdfUrl : `/api/sample-pdf/${mat.slug}`),
    createdAt: idx >= 0 ? store.materials[idx].createdAt : mat.createdAt || now,
    updatedAt: now,
  };
  if (idx >= 0) {
    store.materials[idx] = nextMat;
  } else {
    store.materials = [nextMat, ...store.materials];
  }
  writeLmsStore(store);
  res.json({ ok: true, material: nextMat });
});

app.delete('/api/lms/admin/materials/:id', (req, res) => {
  const id = String(req.params.id || '');
  const store = readLmsStore();
  store.materials = store.materials.filter((m) => m.id !== id);
  writeLmsStore(store);
  res.json({ ok: true });
});

app.post('/api/lms/admin/grants', (req, res) => {
  const studentId = String(req.body?.studentId || '').trim();
  const materialIds = Array.isArray(req.body?.materialIds)
    ? (req.body.materialIds as string[])
    : [];
  const orderRef = req.body?.orderRef ? String(req.body.orderRef).trim() : '';
  const notes = req.body?.notes ? String(req.body.notes).trim() : '';

  const store = readLmsStore();
  const student = store.students.find((s) => s.uid === studentId);
  if (!student) {
    res.status(404).json({ ok: false, error: 'Aluno selecionado não encontrado.' });
    return;
  }
  if (materialIds.length === 0) {
    res.status(400).json({ ok: false, error: 'Selecione ao menos uma apostila ou PDF.' });
    return;
  }

  const now = new Date().toISOString();
  const createdOrUpdated: StudentMaterialGrant[] = [];

  for (const matId of materialIds) {
    const mat = store.materials.find((m) => m.id === matId);
    if (!mat) continue;
    const grantId = `grant-${student.uid}-${mat.id}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    const grant: StudentMaterialGrant = {
      id: grantId,
      studentId: student.uid,
      studentName: student.fullName,
      studentEmail: student.email,
      materialId: mat.id,
      materialTitle: mat.title,
      materialDescription: mat.description,
      levelOrSubject: mat.levelOrSubject,
      pagesCount: mat.pagesCount,
      coverImage: mat.coverImage,
      pdfUrl: mat.pdfUrl || `/api/sample-pdf/${mat.slug}`,
      fileName: mat.fileName || `${mat.slug}.pdf`,
      ...(orderRef ? { orderRef } : {}),
      ...(notes ? { notes } : {}),
      grantedAt: now,
    };

    const existingIdx = store.grants.findIndex((g) => g.id === grantId);
    if (existingIdx >= 0) {
      store.grants[existingIdx] = grant;
    } else {
      store.grants = [grant, ...store.grants];
    }
    createdOrUpdated.push(grant);
  }

  writeLmsStore(store);
  res.json({ ok: true, grants: createdOrUpdated, allGrants: store.grants });
});

app.delete('/api/lms/admin/grants/:id', (req, res) => {
  const id = String(req.params.id || '');
  const store = readLmsStore();
  store.grants = store.grants.filter((g) => g.id !== id);
  writeLmsStore(store);
  res.json({ ok: true });
});

app.get('/api/cep/:cep', async (req, res) => {
  const digits = cleanDigits(String(req.params.cep || ''));
  if (digits.length !== 8) {
    res.status(400).json({ error: 'CEP inválido. Informe 8 dígitos numéricos.' });
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const data = (await response.json()) as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        res.status(404).json({ error: 'CEP não encontrado na base dos Correios.' });
        return;
      }
      res.json({
        cep: data.cep || formatCep(digits),
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        source: 'viacep',
      });
      return;
    }
  } catch {
    // Graceful fallback below if offline or timeout occurs in restricted sandboxes
  }

  const prefix3 = Number(digits.slice(0, 3));
  const prefix2 = Number(digits.slice(0, 2));
  let city = 'São Paulo';
  let state = 'SP';
  let street = '';
  let neighborhood = '';

  if (prefix3 >= 150 && prefix3 <= 151) {
    city = 'São José do Rio Preto';
    state = 'SP';
    if (digits === '15010000') {
      street = 'Rua Bernardino de Campos';
      neighborhood = 'Centro';
    }
  } else if (prefix2 >= 11 && prefix2 <= 19) {
    city = 'Interior Paulista';
    state = 'SP';
  } else if (prefix2 >= 20 && prefix2 <= 28) {
    city = 'Rio de Janeiro';
    state = 'RJ';
  } else if (prefix2 >= 30 && prefix2 <= 39) {
    city = 'Belo Horizonte';
    state = 'MG';
  }

  res.json({
    cep: formatCep(digits),
    street,
    neighborhood,
    city,
    state,
    source: 'fallback',
  });
});

app.post('/api/shipping/quote', (req, res) => {
  const cep = String(req.body?.cep || '');
  const weightGrams = Number(req.body?.weightGrams) || 500;
  const subtotal = Number(req.body?.subtotal) || 0;
  const freeShippingThreshold = Number(req.body?.freeShippingThreshold) || 199;

  const options = calculateShippingOptions(cep, weightGrams, subtotal, freeShippingThreshold);
  if (options.length === 0) {
    res.status(400).json({ error: 'Informe um CEP válido com 8 dígitos.' });
    return;
  }
  res.json({ options });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`Papelaria da Prof server listening on http://localhost:${PORT}`);
  });
}

startServer();
