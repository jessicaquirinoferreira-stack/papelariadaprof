# Papelaria da Prof — Recursos Pedagógicos e Terapêuticos

E-commerce completo com vitrine responsiva, catálogo filtrável, cálculo de frete via CEP/Correios (PAC, SEDEX e Retirada em São José do Rio Preto - SP), checkout integrado ao WhatsApp (`wa.me`), PDV (Ponto de Venda) e Painel Administrativo conectado ao Firebase (Auth + Firestore) e Vercel Blob com compressão de mídia no servidor (`sharp`).

---

## Estrutura de Pastas

```text
├── server.ts                  # Servidor Express + Vite + /api/upload (sharp + Vercel Blob) + ViaCEP/Frete
├── firebase-blueprint.json    # Schema das coleções Firestore
├── firestore.rules            # Regras de segurança endurecidas (produção)
├── firebase-applet-config.json# Credenciais do projeto Firebase provisionado
├── src/
│   ├── components/            # Storefront, PDP, Carrinho, Checkout, Blog e Painel Admin
│   ├── data/seedData.ts       # Catálogo inicial, cupons, pedidos exemplo e posts
│   ├── hooks/useStore.ts      # Estado global sincronizado (Firestore + localStorage)
│   ├── lib/
│   │   ├── commerce.ts        # Cálculos de carrinho, cupons, frete, máscaras e WhatsApp
│   │   ├── firebase.ts        # Inicialização Firebase App, Auth e Firestore
│   │   └── firestoreService.ts# Camada de persistência Firestore
│   └── types/store.ts         # Tipagens TypeScript
```

---

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` (opcionalmente preenchendo `BLOB_READ_WRITE_TOKEN` caso queira testar uploads no Vercel Blob):
   ```bash
   cp .env.example .env
   ```
3. Inicie o servidor full-stack na porta `3000`:
   ```bash
   npm run dev
   ```
4. Execute os testes unitários e validação de tipos:
   ```bash
   npx --yes tsx --test src/lib/commerce.test.ts
   npm run lint
   npm run build
   ```

---

## Setup do Firebase (Projeto Isolado)

O projeto já possui `firebase-applet-config.json` e `firestore.rules` implantados. Caso deseje conectar um projeto Firebase novo (`papelaria-da-prof-[timestamp]`):

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto.
2. Em **Authentication → Sign-in method**, ative os provedores:
   - **Email/Password** (necessário para login direto via `admin@x.com`)
   - **Google** (opcional para proprietária)
3. Em **Authentication → Users**, cadastre `admin@x.com` (ou faça o primeiro login no modal **Área Admin** após habilitar Email/Senha).
4. Em **Firestore Database**, crie o banco de dados e publique o arquivo `firestore.rules` deste repositório.
5. Registre um App Web no Firebase e atualize `firebase-applet-config.json` ou as variáveis `VITE_FIREBASE_*` do `.env`.

---

## Setup do Vercel Blob (Upload de Imagens e Vídeos)

Todas as imagens enviadas pelo painel administrativo passam automaticamente por compressão no servidor (`sharp` -> WebP com qualidade 84 e largura máxima de 1600px) antes do armazenamento:

1. No painel da **Vercel**, ative **Storage → Blob** no seu projeto.
2. Copie o token gerado (`BLOB_READ_WRITE_TOKEN`) para as variáveis de ambiente da Vercel (ou `.env` local).
3. Quando `BLOB_READ_WRITE_TOKEN` estiver definido, a rota `POST /api/upload` envia diretamente para o Vercel Blob (`@vercel/blob`). Sem o token (em preview local), os arquivos otimizados são salvos em `public/uploads/`.

---

## Variáveis de Ambiente

Veja `.env.example`:
- `BLOB_READ_WRITE_TOKEN` — Token de leitura/escrita do Vercel Blob
- `VITE_STORE_WHATSAPP` — Número padrão do WhatsApp da loja (`5517991234567`)
- `VITE_ORIGIN_CEP` — CEP de origem em São José do Rio Preto (`15015000`)
- `VITE_FIREBASE_*` — Credenciais Firebase Web (opcional se usar `firebase-applet-config.json`)

---

## Credenciais da Área Admin

No rodapé do site (canto inferior direito), clique no ícone discreto **Área Admin**:

- **Login:** `admin@x.com`
- **Senha:** `admin4321`
