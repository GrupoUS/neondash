# Task: Implementação WhatsApp Baileys (Self-Hosted)

## Phase 1: Backend Implementation
- [x] Create Baileys Service (`server/services/baileysService.ts`)
  - [x] Connection Logic (makeWASocket)
  - [x] Session Management (useMultiFileAuthState)
  - [x] QR Code Event Handling
- [x] Create Baileys Router (`server/baileysRouter.ts`)
  - [x] `getStatus` (connection state + QR)
  - [x] `connect` / `disconnect` mutations
  - [x] `getQRCode` query
  - [x] `sendMessage` mutation
  - [x] `getMessages` query
- [x] Create Webhook Handler (`server/webhooks/baileysWebhook.ts`)
  - [x] Listen to connection updates
  - [x] Listen to incoming messages
  - [x] Broadcast to frontend via SSE
  - [x] Persist to Database (`whatsappMessages`)

## Phase 2: Frontend Implementation
- [x] Create `BaileysConnectionCard.tsx`
  - [x] QR Code Display
  - [x] Connection Status Indicators
  - [x] Disconnect Dialog
- [x] Update `Settings.tsx`
  - [x] Add Tabs for Z-API, Meta, Baileys
  - [x] Add Comparison Table
- [x] Update `LeadChatWindow.tsx`
  - [x] Support multi-provider state (Meta > Z-API > Baileys)
  - [x] Add Baileys queries and mutations
  - [x] Handle SSE updates for Baileys

## Phase 3: Validation & Quality
- [x] Fix Lint Errors (Imports, Types)
- [x] Fix Schema Mismatches (`updatedAt` removal)
- [x] Verify Type Safety (`bun run check`)
