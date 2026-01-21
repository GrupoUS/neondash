# Migração Manus → Clerk + Neon

## Mudanças Principais

- Auth: Manus OAuth → Clerk
- Database: MySQL → PostgreSQL (Neon)
- User ID: openId → clerkId

## Setup Local

1. Copiar `.env.example` para `.env.local`
2. Preencher keys do Clerk e Neon
3. Executar `pnpm install`
4. Executar `pnpm db:push`
5. Executar `pnpm run dev`

## Variáveis Removidas

- VITE_APP_ID
- OAUTH_SERVER_URL
- OWNER_OPEN_ID
- BUILT_IN_FORGE_API_URL
- BUILT_IN_FORGE_API_KEY

## Variáveis Adicionadas

- VITE_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
