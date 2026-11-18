import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  FileUp,
  GraduationCap,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { formatCurrency, sanitizeSlug } from '../../lib/commerce';
import type {
  DigitalMaterial,
  Order,
  StudentMaterialGrant,
  StudentProfile,
} from '../../types/store';

interface AdminApostilasTabProps {
  materials: DigitalMaterial[];
  students: StudentProfile[];
  grants: StudentMaterialGrant[];
  orders: Order[];
  onSaveMaterial: (material: DigitalMaterial, isNew: boolean) => Promise<DigitalMaterial>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onGrantMaterials: (params: {
    student: StudentProfile;
    materials: DigitalMaterial[];
    orderRef?: string;
    notes?: string;
  }) => Promise<void>;
  onRevokeGrant: (grantId: string) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

const COVER_PRESETS = [
  {
    label: 'Alfabetização',
    url: '/src/assets/images/prod_alfabetizacao_1795023315545.jpg',
  },
  {
    label: 'Coordenação & Matemática',
    url: '/src/assets/images/prod_coordenacao_motora_1795023313795.jpg',
  },
  {
    label: 'Emoções & Psicopedagogia',
    url: '/src/assets/images/prod_emocoes_terapeutico_1795023315726.jpg',
  },
  {
    label: 'Planner & Cadernos',
    url: '/src/assets/images/prod_planner_prof_1795023236701.jpg',
  },
];

function createEmptyMaterial(): DigitalMaterial {
  const now = new Date().toISOString();
  return {
    id: `mat-${Date.now()}`,
    slug: '',
    title: '',
    description: '',
    levelOrSubject: 'Alfabetização & Reforço',
    recommendedAge: '5 a 8 anos',
    pagesCount: 40,
    price: 49.9,
    promoPrice: null,
    coverImage: '/src/assets/images/prod_alfabetizacao_1795023315545.jpg',
    fileName: '',
    pdfUrl: '',
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function AdminApostilasTab({
  materials,
  students,
  grants,
  orders,
  onSaveMaterial,
  onDeleteMaterial,
  onGrantMaterials,
  onRevokeGrant,
  onNotify,
}: AdminApostilasTabProps) {
  const [subTab, setSubTab] = useState<'liberar' | 'materiais'>('liberar');

  // Grant workflow state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [orderRef, setOrderRef] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [granting, setGranting] = useState(false);

  // Material CRUD state
  const [editingMaterial, setEditingMaterial] = useState<DigitalMaterial | null>(null);
  const [isNewMaterial, setIsNewMaterial] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.fullName} ${s.email} ${s.studentOrChildName} ${s.phone} ${s.cpf}`
        .toLowerCase()
        .includes(q)
    );
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.uid === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const studentExistingMaterialIds = useMemo(() => {
    if (!selectedStudent) return new Set<string>();
    return new Set(
      grants
        .filter((g) => g.studentId === selectedStudent.uid)
        .map((g) => g.materialId)
    );
  }, [grants, selectedStudent]);

  const toggleMaterialSelection = (id: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      onNotify('Selecione qual aluno vai receber o material.', 'error');
      return;
    }
    const chosenMaterials = materials.filter((m) => selectedMaterialIds.includes(m.id));
    if (chosenMaterials.length === 0) {
      onNotify('Selecione ao menos uma apostila ou PDF para liberar.', 'error');
      return;
    }

    setGranting(true);
    try {
      await onGrantMaterials({
        student: selectedStudent,
        materials: chosenMaterials,
        orderRef: orderRef.trim() || undefined,
        notes: grantNotes.trim() || undefined,
      });
      setSelectedMaterialIds([]);
      setOrderRef('');
      setGrantNotes('');
    } finally {
      setGranting(false);
    }
  };

  const handleUploadPdf = async (file: File) => {
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await res.json()) as {
        url?: string;
        fileName?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        onNotify(data.error || 'Falha no upload do PDF.', 'error');
        return;
      }
      setEditingMaterial((prev) =>
        prev
          ? {
              ...prev,
              pdfUrl: data.url,
              fileName: data.fileName || file.name,
            }
          : prev
      );
      onNotify(`PDF "${file.name}" enviado com sucesso!`);
    } catch {
      onNotify('Erro ao enviar o arquivo PDF.', 'error');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleUploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        onNotify(data.error || 'Falha ao subir capa.', 'error');
        return;
      }
      setEditingMaterial((prev) => (prev ? { ...prev, coverImage: data.url! } : prev));
      onNotify('Capa enviada com otimização WebP!');
    } catch {
      onNotify('Erro ao enviar imagem de capa.', 'error');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSaveMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    if (!editingMaterial.title.trim()) {
      onNotify('Informe o título da apostila.', 'error');
      return;
    }
    if (!editingMaterial.pdfUrl) {
      onNotify('Suba o arquivo PDF da apostila antes de salvar.', 'error');
      return;
    }

    const slug = sanitizeSlug(editingMaterial.slug || editingMaterial.title);
    await onSaveMaterial(
      {
        ...editingMaterial,
        slug: slug || `apostila-${Date.now()}`,
        fileName: editingMaterial.fileName || `${slug || 'apostila'}.pdf`,
        updatedAt: new Date().toISOString(),
      },
      isNewMaterial
    );
    setEditingMaterial(null);
  };

  const inputCls =
    'w-full px-3.5 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]';

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('liberar')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
              subTab === 'liberar'
                ? 'bg-[#6F4E42] text-white soft-card-shadow'
                : 'bg-white text-[#6F4E42] border border-[#EFE4DE] hover:bg-[#FDEEF4]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>1. Liberar Apostila para Aluno (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('materiais')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
              subTab === 'materiais'
                ? 'bg-[#6F4E42] text-white soft-card-shadow'
                : 'bg-white text-[#6F4E42] border border-[#EFE4DE] hover:bg-[#FDEEF4]'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>2. Subir e Gerenciar Apostilas & PDFs ({materials.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#725B53]">
          <span className="px-3 py-1.5 rounded-full bg-white border border-[#EFE4DE] font-semibold">
            <Users className="w-3.5 h-3.5 inline mr-1 text-[#6F4E42]" />
            {students.length} aluno(s) cadastrado(s)
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white border border-[#EFE4DE] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-[#16A34A]" />
            {grants.length} liberação(ões) ativa(s)
          </span>
        </div>
      </div>

      {/* SUBTAB 1: GRANT TO STUDENT AFTER WHATSAPP PAYMENT */}
      {subTab === 'liberar' && (
        <div className="space-y-6">
          <form
            onSubmit={handleConfirmGrant}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Step 1: Select Registered Student */}
            <section className="lg:col-span-6 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-[#3D2A24] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#6B4C8C]" />
                  <span>Passo 1 · Selecione o Aluno</span>
                </h2>
                <span className="text-[11px] font-semibold text-[#725B53]">
                  {students.length} disponíveis
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#8C756D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail, WhatsApp ou CPF..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FDF8F5] border border-[#EFE4DE] text-center text-xs text-[#725B53] space-y-1">
                  <p className="font-bold text-[#3D2A24]">Nenhum aluno encontrado</p>
                  <p>
                    Quando o cliente preencher o cadastro completo na Área do Aluno do site, ele aparecerá automaticamente aqui para seleção.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredStudents.map((stu) => {
                    const selected = selectedStudentId === stu.uid;
                    return (
                      <label
                        key={stu.uid}
                        className={`block p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#F4EFFA] border-[#B38ED9]'
                            : 'bg-[#FDF8F5] border-[#EFE4DE] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="selectedStudent"
                            checked={selected}
                            onChange={() => setSelectedStudentId(stu.uid)}
                            className="mt-1 accent-[#6F4E42]"
                          />
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-bold text-[#3D2A24] text-sm">{stu.fullName}</p>
                            <p className="text-[#725B53]">
                              {stu.email} · {stu.phone || 'Sem WhatsApp'}
                            </p>
                            <p className="text-[11px] text-[#6B4C8C] font-semibold mt-0.5">
                              Aluno(a): {stu.studentOrChildName || '—'} ·{' '}
                              {stu.gradeOrAge || '—'}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Select Apostilas/PDFs & Confirm Grant */}
            <section className="lg:col-span-6 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4">
              <h2 className="font-display text-base font-bold text-[#3D2A24] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8C4B68]" />
                <span>Passo 2 · Selecione qual Apostila / PDF liberar</span>
              </h2>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {materials.map((mat) => {
                  const checked = selectedMaterialIds.includes(mat.id);
                  const alreadyHas = studentExistingMaterialIds.has(mat.id);
                  return (
                    <label
                      key={mat.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#FDEEF4] border-[#E89EB8]'
                          : 'bg-[#FDF8F5] border-[#EFE4DE] hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMaterialSelection(mat.id)}
                        className="mt-1 accent-[#6F4E42]"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#3D2A24]">{mat.title}</span>
                          {alreadyHas && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#15803D] text-[10px] font-bold shrink-0">
                              Já liberado
                            </span>
                          )}
                        </div>
                        <p className="text-[#725B53] mt-0.5">
                          {mat.levelOrSubject} · {mat.pagesCount} pág. ·{' '}
                          {formatCurrency(
                            typeof mat.promoPrice === 'number' && mat.promoPrice > 0
                              ? mat.promoPrice
                              : mat.price
                          )}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#FAF3EE]">
                <div>
                  <label htmlFor="grant-order" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Pedido pago no WhatsApp (opcional)
                  </label>
                  <input
                    id="grant-order"
                    type="text"
                    list="recent-orders-list"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="Ex: PDP-1052"
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <datalist id="recent-orders-list">
                    {orders.slice(0, 10).map((o) => (
                      <option key={o.id} value={o.orderNumber}>
                        {o.customerName}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="grant-notes" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Recado para o aluno (opcional)
                  </label>
                  <input
                    id="grant-notes"
                    type="text"
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    placeholder="Pagamento confirmado! Bons estudos!"
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={granting || !selectedStudent || selectedMaterialIds.length === 0}
                className="w-full py-3.5 rounded-2xl bg-[#6F4E42] text-white text-xs sm:text-sm font-bold hover:bg-[#573B30] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 soft-card-shadow"
              >
                {granting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Confirmar e Liberar no Painel do Aluno</span>
              </button>
            </section>
          </form>

          {/* Active Grants History Table */}
          <section className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4 overflow-x-auto">
            <h3 className="font-display text-base font-bold text-[#3D2A24]">
              Materiais Liberados na Área do Aluno ({grants.length})
            </h3>
            {grants.length === 0 ? (
              <p className="text-xs text-[#725B53]">
                Nenhuma apostila foi liberada para alunos ainda. Selecione um aluno e uma apostila acima para confirmar a liberação.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EFE4DE] text-[#725B53]">
                    <th className="py-2.5 pr-3">Aluno(a)</th>
                    <th className="py-2.5 pr-3">Apostila / PDF</th>
                    <th className="py-2.5 pr-3">Pedido</th>
                    <th className="py-2.5 pr-3">Liberado em</th>
                    <th className="py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF3EE]">
                  {grants.map((g) => (
                    <tr key={g.id}>
                      <td className="py-3 pr-3">
                        <p className="font-bold text-[#3D2A24]">{g.studentName}</p>
                        <p className="text-[11px] text-[#725B53]">{g.studentEmail}</p>
                      </td>
                      <td className="py-3 pr-3 font-medium text-[#3D2A24]">
                        {g.materialTitle}
                      </td>
                      <td className="py-3 pr-3 font-mono text-[#6F4E42]">
                        {g.orderRef || '—'}
                      </td>
                      <td className="py-3 pr-3 text-[#725B53]">
                        {new Date(g.grantedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRevokeGrant(g.id)}
                          aria-label={`Revogar acesso de ${g.studentName}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revogar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {/* SUBTAB 2: UPLOAD & MANAGE DIGITAL APOSTILAS & PDFs */}
      {subTab === 'materiais' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">
              Acervo de Apostilas Exclusivas & PDFs
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingMaterial(createEmptyMaterial());
                setIsNewMaterial(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Nova Apostila / PDF</span>
            </button>
          </div>

          {editingMaterial && (
            <form
              onSubmit={handleSaveMaterialSubmit}
              className="bg-white border border-[#E8DDF6] rounded-3xl p-6 soft-card-shadow space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#FAF3EE] pb-3">
                <h3 className="font-display text-base font-bold text-[#3D2A24]">
                  {isNewMaterial ? 'Cadastrar Nova Apostila / PDF' : 'Editar Apostila'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="text-xs font-semibold text-[#725B53]"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label htmlFor="mat-title" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                      Título da Apostila / PDF *
                    </label>
                    <input
                      id="mat-title"
                      type="text"
                      required
                      value={editingMaterial.title}
                      onChange={(e) =>
                        setEditingMaterial({ ...editingMaterial, title: e.target.value })
                      }
                      placeholder="Ex: Apostila Exclusiva de Caligrafia & Sílabas (PDF)"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="mat-subj" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                        Área / Matéria *
                      </label>
                      <input
                        id="mat-subj"
                        type="text"
                        required
                        value={editingMaterial.levelOrSubject}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            levelOrSubject: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="mat-age" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                        Faixa Etária / Série *
                      </label>
                      <input
                        id="mat-age"
                        type="text"
                        required
                        value={editingMaterial.recommendedAge}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            recommendedAge: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="mat-pages" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                        Nº de Páginas *
                      </label>
                      <input
                        id="mat-pages"
                        type="number"
                        min={1}
                        required
                        value={editingMaterial.pagesCount}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            pagesCount: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="mat-price" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                        Preço normal (R$) *
                      </label>
                      <input
                        id="mat-price"
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        value={editingMaterial.price}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            price: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label htmlFor="mat-promo" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                        Preço promocional (R$)
                      </label>
                      <input
                        id="mat-promo"
                        type="number"
                        step="0.01"
                        min={0}
                        value={editingMaterial.promoPrice ?? ''}
                        onChange={(e) =>
                          setEditingMaterial({
                            ...editingMaterial,
                            promoPrice: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder="Opcional"
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mat-desc" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                      Descrição pedagógica *
                    </label>
                    <textarea
                      id="mat-desc"
                      rows={3}
                      required
                      value={editingMaterial.description}
                      onChange={(e) =>
                        setEditingMaterial({
                          ...editingMaterial,
                          description: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Right: Upload PDF File & Cover Image */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#F4EFFA] border border-[#E8DDF6] space-y-3">
                    <p className="font-display text-xs font-bold text-[#3D2A24]">
                      Arquivo PDF da Apostila *
                    </p>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadPdf(f);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={pdfUploading}
                      className="w-full py-3 px-4 rounded-xl bg-white border border-dashed border-[#B38ED9] text-xs font-bold text-[#6B4C8C] hover:bg-[#FDF8F5] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {pdfUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileUp className="w-4 h-4" />
                      )}
                      <span>
                        {pdfUploading ? 'Enviando PDF...' : 'Selecionar Arquivo PDF do Computador'}
                      </span>
                    </button>

                    {editingMaterial.pdfUrl && (
                      <div className="bg-white rounded-xl p-2.5 border border-[#E8DDF6] text-[11px] flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[#15803D]">
                          ✓ {editingMaterial.fileName || 'apostila.pdf'}
                        </span>
                        <a
                          href={editingMaterial.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6F4E42] font-bold underline shrink-0"
                        >
                          Abrir
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FDF8F5] border border-[#EFE4DE] space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-bold text-[#3D2A24]">
                        Imagem de Capa
                      </p>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadCover(f);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={coverUploading}
                        className="text-[11px] font-bold text-[#6F4E42] underline"
                      >
                        {coverUploading ? 'Enviando...' : 'Subir nova capa'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setEditingMaterial({ ...editingMaterial, coverImage: preset.url })
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            editingMaterial.coverImage === preset.url
                              ? 'bg-[#6F4E42] text-white border-[#6F4E42]'
                              : 'bg-white text-[#6F4E42] border-[#EFE4DE]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-[#3D2A24]">
                    <input
                      type="checkbox"
                      checked={editingMaterial.active}
                      onChange={(e) =>
                        setEditingMaterial({ ...editingMaterial, active: e.target.checked })
                      }
                      className="accent-[#6F4E42]"
                    />
                    <span>Exibir na vitrine pública de Apostilas & PDFs</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
              >
                Salvar Apostila no Acervo
              </button>
            </form>
          )}

          {/* Existing Digital Materials Table */}
          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EFE4DE] text-[#725B53]">
                  <th className="py-2.5 pr-3">Apostila / PDF</th>
                  <th className="py-2.5 pr-3">Área</th>
                  <th className="py-2.5 pr-3">Pág.</th>
                  <th className="py-2.5 pr-3">Preço</th>
                  <th className="py-2.5 pr-3">Arquivo PDF</th>
                  <th className="py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF3EE]">
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-3 font-bold text-[#3D2A24]">{m.title}</td>
                    <td className="py-3 pr-3 text-[#725B53]">{m.levelOrSubject}</td>
                    <td className="py-3 pr-3 tabular-nums">{m.pagesCount}</td>
                    <td className="py-3 pr-3 tabular-nums font-bold text-[#6F4E42]">
                      {formatCurrency(
                        typeof m.promoPrice === 'number' && m.promoPrice > 0
                          ? m.promoPrice
                          : m.price
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {m.pdfUrl ? (
                        <a
                          href={m.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-[#3B6E9C] underline"
                        >
                          {m.fileName || 'Ver PDF'}
                        </a>
                      ) : (
                        <span className="text-[#725B53]">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMaterial(m);
                          setIsNewMaterial(false);
                        }}
                        aria-label={`Editar ${m.title}`}
                        className="p-1.5 rounded-xl text-[#6F4E42] hover:bg-[#FDF8F5]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMaterial(m.id)}
                        aria-label={`Excluir ${m.title}`}
                        className="p-1.5 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
