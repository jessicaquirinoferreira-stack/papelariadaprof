import { Coupon, Material, MaterialFile, Product, StoreSettings } from '../types';

export const PDF_CATEGORIES = [
  'Alfabetização para Anos Iniciais',
  'Português (1º ao 5º ano)',
  'Matemática (1º ao 5º ano)',
  'PDF para Professoras',
] as const;

export const DEFAULT_ABOUT_TEXT = `Olá! Sou a Professora Lilian, educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.

Sou formada em Pedagogia pela UNIRP, desde 2018, e pós-graduada em Alfabetização e Letramento e Libras. Tenho mais de oito anos de experiência na área da educação, atuando diretamente com crianças da Educação Infantil e do Ensino Fundamental.

Ao longo da minha trajetória, compreendi que cada criança possui seu próprio ritmo, suas habilidades e suas particularidades. Por isso, acredito em uma educação individualizada, acolhedora e significativa, que respeita o tempo de cada aluno e transforma dificuldades em conquistas.

Atualmente, minha atuação profissional vai além da sala de aula. Trabalho com aulas particulares, sou responsável por um espaço pedagógico voltado ao desenvolvimento infantil.

Como profissional da área busco oferecer estratégias e recursos que despertem o interesse em aprender, respeitando as necessidades individuais de cada aluno.

Meu propósito é transformar a aprendizagem em uma experiência positiva, porque toda criança merece ser respeitada em seu processo de desenvolvimento e incentivada a alcançar seu melhor potencial.

Com carinho,

Professora Lilian`;

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Papelaria da Prof',
  whatsappNumber: '5517991996136',
  instagramUrl: 'https://www.instagram.com/casinha.abc?dmpr=MTBtZXk1ano5MzY2Yg==',
  instagramHandle: '@casinha.abc',
  contactEmail: 'lilianluquezzi0@gmail.com',
  businessHours: 'Segunda a Sexta, das 09h às 18h · Sábados das 09h às 13h',
  heroTitle: 'Recursos pedagógicos em PDF prontos para imprimir e transformar o aprendizado',
  heroSubtitle:
    'Feitos com afeto por mim, Professora Lilian, para ajudar mamães e professoras no dia a dia. Materiais digitais prontos para baixar, imprimir e tornar cada momento de estudo muito mais leve e eficaz.',
  freeShippingThreshold: 0,
  assistantName: 'Prof. Lilian',
  categories: [...PDF_CATEGORIES],
  aboutTitle: 'Quem sou eu – Professora Lilian',
  aboutSubtitle: 'Educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.',
  aboutPhotoUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/professora-lilian-foto.jpg',
  aboutText: DEFAULT_ABOUT_TEXT,
  aboutCredentials: [
    'Pedagoga formada pela UNIRP (desde 2018)',
    'Pós-graduada em Alfabetização e Letramento e Libras',
    '+8 anos de experiência na Educação Infantil e Fundamental',
    'Aulas particulares e Espaço Pedagógico Infantil',
  ],
};

// Loja 100% digital em PDF (sem produtos físicos)
export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_MATERIALS: Material[] = [
  {
    id: 'mat-alfabetizacao-anos-iniciais',
    title: 'Apostila Alfabetização para Anos Iniciais',
    description:
      'Material digital completo com 48 páginas prontas para imprimir: consciência fonológica, vogais, encontros vocálicos, famílias silábicas e leitura inicial com apoio visual lúdico.',
    category: 'Alfabetização para Anos Iniciais',
    price: 39.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/apostila-leitura.svg',
    pagesCount: 48,
    stock: 999,
    featured: true,
    active: true,
    salesCount: 68,
  },
  {
    id: 'mat-silabas-leitura-inicial',
    title: 'Caderno Sílabas Simples & Complexas',
    description:
      '40 páginas com trilhas de leitura, caça-sílabas, formação de palavras e pequenas frases ilustradas para consolidar a alfabetização nos anos iniciais.',
    category: 'Alfabetização para Anos Iniciais',
    price: 32.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/prod-alfabetizacao.svg',
    pagesCount: 40,
    stock: 999,
    featured: true,
    active: true,
    salesCount: 54,
  },
  {
    id: 'mat-portugues-1-ao-5',
    title: 'Combo Português Completo (1º ao 5º ano)',
    description:
      '56 páginas organizadas por níveis do 1º ao 5º ano com interpretação de texto, ortografia, gramática aplicada e atividades práticas para sala de aula ou reforço em casa.',
    category: 'Português (1º ao 5º ano)',
    price: 44.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/apostila-redacao.svg',
    pagesCount: 56,
    stock: 999,
    featured: true,
    active: true,
    salesCount: 61,
  },
  {
    id: 'mat-oficina-producao-texto',
    title: 'Oficina de Leitura e Produção Textual (1º ao 5º ano)',
    description:
      '38 roteiros guiados com bancos de palavras, organizadores visuais e propostas criativas de escrita e interpretação para todo o Ensino Fundamental I.',
    category: 'Português (1º ao 5º ano)',
    price: 36.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/apostila-psico.svg',
    pagesCount: 38,
    stock: 999,
    featured: false,
    active: true,
    salesCount: 39,
  },
  {
    id: 'mat-matematica-ludica',
    title: 'Apostila Matemática Lúdica (1º ao 5º ano)',
    description:
      '46 páginas com situações-problema ilustradas, sistema decimal, quatro operações, frações iniciais e desafios progressivos do 1º ao 5º ano.',
    category: 'Matemática (1º ao 5º ano)',
    price: 39.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/apostila-matematica.svg',
    pagesCount: 46,
    stock: 999,
    featured: true,
    active: true,
    salesCount: 57,
  },
  {
    id: 'mat-pdf-para-professoras',
    title: 'Kit Planejamento & Organização — PDF para Professoras',
    description:
      '52 páginas em PDF editável para imprimir quantas vezes quiser: plano de aula semanal, pauta de acompanhamento de alunos, calendário escolar, capas e bilhetes para famílias.',
    category: 'PDF para Professoras',
    price: 34.9,
    coverUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/images/prod-planner.svg',
    pagesCount: 52,
    stock: 999,
    featured: true,
    active: true,
    salesCount: 49,
  },
];

export const DEFAULT_MATERIAL_FILES: Record<string, MaterialFile> = {
  'mat-alfabetizacao-anos-iniciais': {
    materialId: 'mat-alfabetizacao-anos-iniciais',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-alfabetizacao.pdf',
    pdfFileName: 'Apostila-Alfabetizacao-Anos-Iniciais-PapelariaDaProf.pdf',
    fileSizeBytes: 1840,
  },
  'mat-silabas-leitura-inicial': {
    materialId: 'mat-silabas-leitura-inicial',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-silabas-leitura.pdf',
    pdfFileName: 'Caderno-Silabas-Leitura-PapelariaDaProf.pdf',
    fileSizeBytes: 1810,
  },
  'mat-portugues-1-ao-5': {
    materialId: 'mat-portugues-1-ao-5',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-portugues-1-5.pdf',
    pdfFileName: 'Combo-Portugues-1-ao-5-Ano-PapelariaDaProf.pdf',
    fileSizeBytes: 1860,
  },
  'mat-oficina-producao-texto': {
    materialId: 'mat-oficina-producao-texto',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-producao-textual.pdf',
    pdfFileName: 'Oficina-Leitura-Producao-Textual-PapelariaDaProf.pdf',
    fileSizeBytes: 1830,
  },
  'mat-matematica-ludica': {
    materialId: 'mat-matematica-ludica',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-matematica-ludica.pdf',
    pdfFileName: 'Apostila-Matematica-1-ao-5-Ano-PapelariaDaProf.pdf',
    fileSizeBytes: 1820,
  },
  'mat-pdf-para-professoras': {
    materialId: 'mat-pdf-para-professoras',
    pdfUrl: 'https://plzvsxudksxuzbch.public.blob.vercel-storage.com/pdfs/apostila-pdf-professoras.pdf',
    pdfFileName: 'Kit-PDF-para-Professoras-PapelariaDaProf.pdf',
    fileSizeBytes: 1850,
  },
};

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'cupom-prof10',
    code: 'PROF10',
    type: 'percent',
    value: 10,
    minOrder: 60,
    active: true,
    usageCount: 14,
  },
  {
    id: 'cupom-bemvinda15',
    code: 'BEMVINDA15',
    type: 'fixed',
    value: 15,
    minOrder: 120,
    active: true,
    usageCount: 8,
  },
];
