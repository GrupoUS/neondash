# PLAN-design-sdr-sidebar: SDR Agent Sidebar & Configuration
> **Goal:** Create a feature-rich, animated right sidebar on the Chat page for SDR Agent control/monitoring, and enhance the Master Prompt editor in Settings.

## Research Findings
| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | `ChatPage.tsx` uses a 2-column layout (Sidebar + MessageArea). | High | codebase |
| 2 | `Sidebar` component exists but handles conversation list. | High | codebase |
| 3 | `Settings.tsx` includes `SdrAgentSettingsCard` and `AIAgentSettingsCard`. | High | codebase |
| 4 | Current SDR settings are basic (textarea only). | High | codebase |
| 5 | Request requires high-fidelity UI (shadcn + animations). | High | User Prompt |

## Design Specs
- **Layout:** 3-Column on Chat Page (Contacts | Chat | SDR Control).
- **Theme:** Dark mode optimized (base `bg-slate-900/30`), utilizing app's existing navy/gold/emerald accents.
- **SDR Sidebar Components:**
    - **Status Header:** Toggle Agent, Connection Status (Pulse animation).
    - **Context Panel:** Extracted Lead Data (Name, Procedure, Budget).
    - **Action Deck:** "Sync CRM", "Schedule", "Create Patient".
    - **Activity Feed:** Live log of agent thoughts/actions (Mock/Real).
- **Settings Enhancements:**
    - Syntax highlighting for Prompt Editor? (Maybe simple textarea with variable chips).
    - "Insert Variable" shortcuts.

## Atomic Tasks

### AT-001: Component Design - SDR Sidebar
- [ ] ST-001.1: Create `client/src/components/chat/SdrSidebar.tsx`.
    - Use `motion` for entry/exit animations.
    - Sections: `AgentState`, `LeadContext`, `QuickActions`.
- [ ] ST-001.2: Implement `AgentState` card with pulsing status.
- [ ] ST-001.3: Implement `LeadContext` with editable fields (synced to backend?).
- [ ] ST-001.4: Implement `QuickActions` grid.

### AT-002: Settings Enhancement - Prompt Editor
- [ ] ST-002.1: Enhance `SdrAgentSettingsCard.tsx`.
- [ ] ST-002.2: Add "Variable Handlers" (buttons to insert {{name}}, {{phone}}).
- [ ] ST-002.3: Improve visual hierarchy of the settings card.

### AT-003: Integration - Chat Page
- [ ] ST-003.1: Modify `ChatPage.tsx` to include `SdrSidebar`.
- [ ] ST-003.2: Add toggle button in `ChatPageHeader` to show/hide SDR Sidebar.
- [ ] ST-003.3: Ensure responsive behavior (hide on mobile, drawer on tablet?).

### AT-004: Backend Support (Mock/Stub for now)
- [ ] ST-004.1: Ensure tRPC endpoints exist for "active context" or mock them in frontend for UI demo.
- [ ] ST-004.2: Connect `SdrSidebar` to `trpc.aiAgent` (or equivalent).

## Verification Plan
### Automated Tests
- Run `bun test` to ensure no regressions in existing components.
- Check build `bun run build`.

### Manual Verification
1.  **Chat Page Layout**: Verify 3-column layout on desktop.
2.  **SDR Sidebar**:
    - Click "Toggle Agent" -> Should animate state.
    - Check "Lead Info" -> Should display dummy/real data.
    - Click Actions -> Should trigger toasts.
  - Verify "Create New Patient" opens the patient form or dialog.
3.  **Settings Page**:
    - Edit prompt using new UI.
    - Save and verify persistence.
