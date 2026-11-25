# Papelaria da Prof — E-commerce Pedagógico, Terapêutico & Área do Aluno

Loja online completa especializada em recursos pedagógicos, materiais terapêuticos, planners docentes e apostilas digitais exclusivas, com **Área do Aluno** e **Painel Administrativo** integrados ao **Firebase Firestore & Authentication** e suporte a **Vercel Blob**.

---

## Principais Funcionalidades

- **Vitrine & Catálogo Completo**: Produtos físicos com filtro por categoria, busca, visualização rápida (Quick View) e página detalhada (PDP).
- **Seção Exclusiva de Apostilas e PDFs**: Catálogo dedicado de materiais digitais com preview de páginas, descrição e entrega na Área do Aluno.
- **Área do Aluno**:
  - Cadastro completo (nome, e-mail, telefone, senha e confirmação) + **Login com Google**.
  - Painel exclusivo com listagem das apostilas liberadas, botão de download direto do PDF, histórico de materiais e pedidos, e edição de perfil com busca automática de CEP.
- **Checkout Inteligente + ViaCEP + WhatsApp**:
  - Máscara automática de telefone e CEP.
  - Consulta automática na API pública **ViaCEP** com cálculo de frete regional e faixa de frete grátis.
  - Validação de cupons de desconto (`%` ou `R$`).
  - Geração e envio automático do resumo completo do pedido para o WhatsApp da loja via `wa.me`.
- **Painel Administrativo Completo** (acesso discreto no rodapé):
  - Dashboard com faturamento, pedidos, ticket médio, mais vendidos e atualização de status.
  - **PDV (Ponto de Venda)** completo para vendas presenciais/WhatsApp.
  - CRUD completo de Produtos Físicos e Apostilas PDF (com upload comprimido de imagens e PDFs).
  - **Liberar Material para Aluno**: busca de alunos cadastrados e liberação imediata de apostilas para download.
  - Gestão de Cupons, Redes Sociais, WhatsApp e Configurações Gerais.
- **Widgets Flutuantes**:
  - Direita: botões oficiais do **Instagram** e **WhatsApp**.
  - Esquerda: **Prof. Mel** (assistente virtual interativa com foto em fundo transparente e respostas rápidas direcionando para Instagram/WhatsApp).

---

## Configuração do Firebase (Banco Isolado)

O projeto já está provisionado automaticamente com um banco Firestore isolado em `firebase-applet-config.json` (`firestoreDatabaseId` exclusivo) e regras de segurança validadas em `firestore.rules`.

- **Login com Google**: funciona imediatamente sem nenhuma configuração extra.
- **Login com E-mail e Senha (opcional)**: caso queira utilizar o cadastro/login tradicional por e-mail/senha além do Google, ative o provedor **E-mail/senha** em *Firebase Console → Authentication → Sign-in method*.
- **Admin Padrão**: o e-mail de bootstrap configurado no provisionamento possui acesso administrativo imediato via Google Sign-In, podendo também autorizar o UID da conta `admin@x.com` diretamente na aba **Configurações** do Painel Admin.

---

## Armazenamento de Arquivos e Vercel Blob

O endpoint `POST /api/upload` possui comportamento híbrido automático:

1. **Com `BLOB_READ_WRITE_TOKEN` configurado (Produção / Vercel)**:
   - Os uploads de imagens (já comprimidas em WebP no navegador sem perda perceptível) e arquivos PDF são enviados diretamente ao **Vercel Blob**.
2. **Sem `BLOB_READ_WRITE_TOKEN` (Desenvolvimento Local / AI Studio)**:
   - Os arquivos são salvos automaticamente em `/public/uploads/` e servidos pelo Express sem necessidade de chaves manuais.

### Variáveis de Ambiente (`.env`)

```env
GEMINI_API_KEY="SUA_CHAVE_OPCIONAL"
APP_URL="https://sua-loja.vercel.app"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

---

## Executando Localmente e Deploy

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

Para deploy no **Vercel**, conecte o repositório, configure `BLOB_READ_WRITE_TOKEN` nas *Environment Variables* do projeto e faça o deploy normalmente. Todos os assets da loja (`/public/images/*` e `/public/pdfs/*`) estão incluídos diretamente no repositório.
