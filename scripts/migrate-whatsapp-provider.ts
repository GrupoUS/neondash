/**
 * Conservative WhatsApp provider migration helper scaffold.
 *
 * Goals:
 * - Keep migration non-destructive by default (dry-run).
 * - Preserve message history integrity.
 * - Provide explicit TODO boundaries for future implementation.
 *
 * Usage:
 *   bun run scripts/migrate-whatsapp-provider.ts --from=zapi --to=meta --dry-run
 */

type WhatsAppProvider = "zapi" | "meta" | "baileys";

interface MigrationOptions {
  from: WhatsAppProvider;
  to: WhatsAppProvider;
  dryRun: boolean;
  mentoradoId?: number;
}

interface MigrationPlanItem {
  mentoradoId: number;
  from: WhatsAppProvider;
  to: WhatsAppProvider;
  notes: string[];
}

function parseProvider(value: string | undefined): WhatsAppProvider | null {
  if (!value) return null;
  if (value === "zapi" || value === "meta" || value === "baileys") return value;
  return null;
}

function parseArgs(argv: string[]): MigrationOptions {
  const fromArg = argv.find((arg) => arg.startsWith("--from="))?.split("=")[1];
  const toArg = argv.find((arg) => arg.startsWith("--to="))?.split("=")[1];
  const dryRunArg = argv.find((arg) => arg === "--dry-run" || arg.startsWith("--dry-run="));
  const mentoradoArg = argv.find((arg) => arg.startsWith("--mentorado-id="))?.split("=")[1];

  const from = parseProvider(fromArg);
  const to = parseProvider(toArg);

  if (!from || !to) {
    throw new Error(
      "Missing/invalid providers. Use --from=zapi|meta|baileys and --to=zapi|meta|baileys.",
    );
  }

  if (from === to) {
    throw new Error("Source and destination providers must be different.");
  }

  const dryRun = dryRunArg
    ? dryRunArg.includes("=")
      ? dryRunArg.split("=")[1] !== "false"
      : true
    : true;

  const mentoradoId = mentoradoArg ? Number.parseInt(mentoradoArg, 10) : undefined;
  if (mentoradoArg && Number.isNaN(mentoradoId)) {
    throw new Error("Invalid --mentorado-id. Expected an integer value.");
  }

  return {
    from,
    to,
    dryRun,
    mentoradoId,
  };
}

async function loadCandidateMentoradoIds(options: MigrationOptions): Promise<number[]> {
  // TODO: Replace scaffold logic with DB query once migration policy is approved.
  // Keep this helper read-only and conservative.
  if (options.mentoradoId) return [options.mentoradoId];
  return [];
}

function buildPlan(options: MigrationOptions, mentoradoIds: number[]): MigrationPlanItem[] {
  return mentoradoIds.map((id) => ({
    mentoradoId: id,
    from: options.from,
    to: options.to,
    notes: [
      "Preserve existing whatsappMessages rows (no delete/update of message history).",
      "Switch provider credentials only after destination connection health-check passes.",
      "Keep rollback path: restore previous provider flags if cutover validation fails.",
    ],
  }));
}

async function executePlan(options: MigrationOptions, plan: MigrationPlanItem[]): Promise<void> {
  if (options.dryRun) {
    console.log("[DRY-RUN] No data mutation executed.");
    return;
  }

  // TODO: Implement non-destructive writes behind explicit operator approval.
  // Suggested future boundaries:
  // 1) Create migration audit row for each mentorado.
  // 2) Update provider preference fields (without deleting old credentials).
  // 3) Trigger post-cutover smoke checks.
  // 4) Mark migration completed only after successful send/receive validation.
  throw new Error("Write mode is not implemented yet. Re-run with --dry-run.");
}

function printSummary(options: MigrationOptions, plan: MigrationPlanItem[]): void {
  console.log("=== WhatsApp Provider Migration Helper (Scaffold) ===");
  console.log(`From: ${options.from}`);
  console.log(`To: ${options.to}`);
  console.log(`Mode: ${options.dryRun ? "dry-run (safe)" : "write (blocked in scaffold)"}`);
  console.log(`Candidates: ${plan.length}`);

  if (plan.length === 0) {
    console.log("No candidates found. Provide --mentorado-id=<id> for targeted planning.");
    return;
  }

  for (const item of plan) {
    console.log(`\n- Mentorado #${item.mentoradoId}: ${item.from} -> ${item.to}`);
    for (const note of item.notes) {
      console.log(`  • ${note}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    const mentoradoIds = await loadCandidateMentoradoIds(options);
    const plan = buildPlan(options, mentoradoIds);

    printSummary(options, plan);
    await executePlan(options, plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[migrate-whatsapp-provider] ${message}`);
    process.exitCode = 1;
  }
}

void main();
