import { CartItem } from '../types';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatInstallment(value: number, installments = 3): string {
  const perMonth = (value || 0) / installments;
  return `${installments}x de ${formatBRL(perMonth)} sem juros`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function slugId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Agora mesmo';
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? ts : d.toLocaleDateString('pt-BR');
  }
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return 'Recente';
}

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export async function fetchViaCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (!response.ok) return null;
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;
  return data;
}

export function calculateShippingByCep(
  cep: string,
  uf: string,
  items: CartItem[],
  subtotal: number,
  freeShippingThreshold: number
): { cost: number; label: string; estimatedDays: string } {
  const hasPhysical = items.some((item) => item.type === 'product');
  if (!hasPhysical) {
    return {
      cost: 0,
      label: 'Entrega Digital (Área do Aluno)',
      estimatedDays: 'Liberação após confirmação',
    };
  }
  if (subtotal >= freeShippingThreshold && freeShippingThreshold > 0) {
    return {
      cost: 0,
      label: 'Frete Grátis Promocional',
      estimatedDays: '3 a 7 dias úteis',
    };
  }
  const normalizedUf = uf.trim().toUpperCase();
  const cleanCep = cep.replace(/\D/g, '');
  if (!cleanCep || cleanCep.length < 8) {
    return {
      cost: 0,
      label: 'Informe o CEP para calcular',
      estimatedDays: 'Calculado via CEP',
    };
  }

  // Regional freight table for Brazil based on UF / CEP prefix
  if (['RJ', 'SP', 'MG', 'ES'].includes(normalizedUf) || cleanCep.startsWith('0') || cleanCep.startsWith('1') || cleanCep.startsWith('2') || cleanCep.startsWith('3')) {
    return { cost: 16.9, label: 'PAC Sudeste', estimatedDays: '3 a 6 dias úteis' };
  }
  if (['PR', 'SC', 'RS', 'DF', 'GO', 'MS', 'MT'].includes(normalizedUf) || cleanCep.startsWith('7') || cleanCep.startsWith('8') || cleanCep.startsWith('9')) {
    return { cost: 22.9, label: 'PAC Sul / Centro-Oeste', estimatedDays: '5 a 9 dias úteis' };
  }
  return { cost: 29.9, label: 'PAC Norte / Nordeste', estimatedDays: '7 a 12 dias úteis' };
}

export async function compressImageFile(file: File, maxWidth = 1400, quality = 0.88): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const webpName = file.name.replace(/\.[^.]+$/, '') + '.webp';
          resolve(new File([blob], webpName, { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export async function uploadFileToStorage(
  file: File,
  folder: 'images' | 'pdfs'
): Promise<{ url: string; fileName: string; fileSizeBytes: number; storage: string }> {
  const processedFile = folder === 'images' ? await compressImageFile(file) : file;
  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('folder', folder);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao enviar arquivo.');
  }

  return response.json();
}

export function buildWhatsAppOrderUrl(params: {
  whatsappNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  cep?: string;
  address?: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod?: string;
}): string {
  const cleanNumber = params.whatsappNumber.replace(/\D/g, '');
  const phoneWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

  const itemLines = params.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.title} (Material Digital PDF) — ${item.quantity}x ${formatBRL(item.price)}`
    )
    .join('\n');

  const lines = [
    `*Novo Pedido - Papelaria da Prof*`,
    `*Pedido:* ${params.orderNumber}`,
    ``,
    `*Dados da Cliente:*`,
    `Nome: ${params.customerName}`,
    `Telefone: ${params.customerPhone}`,
    params.customerEmail ? `E-mail (Área do Aluno): ${params.customerEmail}` : '',
    ``,
    `*Apostilas PDF Selecionadas:*`,
    itemLines,
    ``,
    `Subtotal: ${formatBRL(params.subtotal)}`,
    `Entrega: Digital em PDF (Área do Aluno)`,
    params.discount > 0 ? `Desconto${params.couponCode ? ` (${params.couponCode})` : ''}: -${formatBRL(params.discount)}` : '',
    `*Total: ${formatBRL(params.total)}*`,
    params.paymentMethod ? `Forma de pagamento: ${params.paymentMethod}` : '',
    `\n_Obs.: Pedido 100% digital em PDF para liberação na Área do Aluno._`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(lines)}`;
}
