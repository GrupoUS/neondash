import { and, desc, eq, sql } from "drizzle-orm";
import {
  badges,
  mentoradoBadges,
  mentorados,
  metasProgressivas,
  metricasMensais,
  notificacoes,
  playbookItems,
  playbookProgress,
  rankingMensal,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sendEmail } from "./emailService";
import { notificationService } from "./services/notificationService";

// Badge definitions with criteria - 15 badges aligned with Core Flows spec
export const BADGES_CONFIG = [
  // ============================================
  // CONSISTÊNCIA (5 badges)
  // ============================================
  {
    codigo: "primeiro_registro",
    nome: "Primeiro Registro",
    descricao: "Registrou suas primeiras métricas no dashboard",
    icone: "🏆",
    cor: "gold",
    categoria: "consistencia" as const,
    criterio: JSON.stringify({ tipo: "primeiro_registro" }),
    pontos: 10,
  },
  {
    codigo: "consistencia_bronze",
    nome: "Consistência Bronze",
    descricao: "3 meses consecutivos registrando até dia 10",
    icone: "⭐",
    cor: "bronze",
    categoria: "consistencia" as const,
    criterio: JSON.stringify({ tipo: "streak_consecutivo", meses: 3 }),
    pontos: 30,
  },
  {
    codigo: "consistencia_prata",
    nome: "Consistência Prata",
    descricao: "6 meses consecutivos registrando até dia 10",
    icone: "🥈",
    cor: "silver",
    categoria: "consistencia" as const,
    criterio: JSON.stringify({ tipo: "streak_consecutivo", meses: 6 }),
    pontos: 60,
  },
  {
    codigo: "consistencia_ouro",
    nome: "Consistência Ouro",
    descricao: "12 meses consecutivos registrando até dia 10",
    icone: "🥇",
    cor: "gold",
    categoria: "consistencia" as const,
    criterio: JSON.stringify({ tipo: "streak_consecutivo", meses: 12 }),
    pontos: 120,
  },
  {
    codigo: "pontualidade",
    nome: "Pontualidade",
    descricao: "3 meses consecutivos registrando até dia 5",
    icone: "⏰",
    cor: "blue",
    categoria: "consistencia" as const,
    criterio: JSON.stringify({ tipo: "pontualidade", meses: 3, dia: 5 }),
    pontos: 50,
  },

  // ============================================
  // FATURAMENTO (4 badges)
  // ============================================
  {
    codigo: "meta_atingida",
    nome: "Meta Atingida",
    descricao: "Atingiu a meta de faturamento do mês",
    icone: "💪",
    cor: "gold",
    categoria: "faturamento" as const,
    criterio: JSON.stringify({ tipo: "faturamento_meta" }),
    pontos: 20,
  },
  {
    codigo: "crescimento_25",
    nome: "Crescimento 25%",
    descricao: "Cresceu 25% ou mais em relação ao mês anterior",
    icone: "📈",
    cor: "green",
    categoria: "faturamento" as const,
    criterio: JSON.stringify({ tipo: "crescimento", percentual: 25 }),
    pontos: 40,
  },
  {
    codigo: "crescimento_50",
    nome: "Crescimento 50%",
    descricao: "Cresceu 50% ou mais em relação ao mês anterior",
    icone: "🚀",
    cor: "purple",
    categoria: "faturamento" as const,
    criterio: JSON.stringify({ tipo: "crescimento", percentual: 50 }),
    pontos: 80,
  },
  {
    codigo: "faturamento_6_digitos",
    nome: "6 Dígitos",
    descricao: "Faturou R$ 100.000+ em um mês",
    icone: "💰",
    cor: "gold",
    categoria: "faturamento" as const,
    criterio: JSON.stringify({ tipo: "faturamento_minimo", valor: 100000 }),
    pontos: 100,
  },

  // ============================================
  // RANKING (3 badges)
  // ============================================
  {
    codigo: "top_3_turma",
    nome: "Top 3 Turma",
    descricao: "Ficou entre os 3 primeiros do ranking mensal",
    icone: "🥇",
    cor: "gold",
    categoria: "ranking" as const,
    criterio: JSON.stringify({ tipo: "ranking_top", posicao: 3 }),
    pontos: 50,
  },
  {
    codigo: "top_1_turma",
    nome: "Campeão da Turma",
    descricao: "Ficou em 1º lugar no ranking mensal",
    icone: "👑",
    cor: "gold",
    categoria: "ranking" as const,
    criterio: JSON.stringify({ tipo: "ranking_top", posicao: 1 }),
    pontos: 100,
  },
  {
    codigo: "acima_media",
    nome: "Acima da Média",
    descricao: "Faturamento acima da média da turma por 3 meses consecutivos",
    icone: "🎯",
    cor: "blue",
    categoria: "ranking" as const,
    criterio: JSON.stringify({ tipo: "acima_media", meses: 3 }),
    pontos: 40,
  },

  // ============================================
  // OPERACIONAL (2 badges)
  // ============================================
  {
    codigo: "gerador_leads",
    nome: "Gerador de Leads",
    descricao: "Gerou 50+ leads em um mês",
    icone: "🧒",
    cor: "blue",
    categoria: "operacional" as const,
    criterio: JSON.stringify({ tipo: "leads_minimo", valor: 50 }),
    pontos: 30,
  },
  {
    codigo: "conversao_master",
    nome: "Conversão Master",
    descricao: "Taxa de conversão acima de 20%",
    icone: "✨",
    cor: "purple",
    categoria: "operacional" as const,
    criterio: JSON.stringify({ tipo: "conversao", percentual: 20 }),
    pontos: 50,
  },

  // ============================================
  // ESPECIAL (2 badges)
  // ============================================
  {
    codigo: "evolucao_completa",
    nome: "Evolução Completa",
    descricao: "Completou todos os módulos do playbook",
    icone: "🎓",
    cor: "purple",
    categoria: "especial" as const,
    criterio: JSON.stringify({ tipo: "playbook_completo" }),
    pontos: 80,
  },
  {
    codigo: "jornada_completa",
    nome: "Jornada Completa",
    descricao: "6 meses de mentoria com registro mensal",
    icone: "🎆",
    cor: "gold",
    categoria: "especial" as const,
    criterio: JSON.stringify({ tipo: "meses_mentoria", valor: 6 }),
    pontos: 150,
  },
];

// Initialize badges in database
export async function initializeBadges() {
  const db = await getDb();
  if (!db) return;

  for (const badge of BADGES_CONFIG) {
    const existing = await db.select().from(badges).where(eq(badges.codigo, badge.codigo)).limit(1);
    if (existing.length === 0) {
      await db.insert(badges).values(badge);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BADGE CRITERIA CHECKERS (extracted for reduced complexity)
// ════════════════════════════════════════════════════════════════════════════

interface BadgeCheckContext {
  mentoradoId: number;
  mentorado: {
    id: number;
    metaFaturamento: number;
    metaLeads?: number | null;
    metaProcedimentos?: number | null;
    metaPosts?: number | null;
    metaStories?: number | null;
  };
  metricas: {
    faturamento: number;
    leads: number;
    procedimentos: number;
    postsFeed: number;
    stories: number;
    createdAt: Date;
    metaFaturamento?: number | null;
    metaLeads?: number | null;
    metaProcedimentos?: number | null;
    metaPosts?: number | null;
    metaStories?: number | null;
  };
  metricasAnterior: { faturamento: number } | undefined;
}

async function checkPrimeiroRegistro(mentoradoId: number): Promise<boolean> {
  const db = getDb();
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId));
  return (countResult?.count ?? 0) === 1;
}

async function checkPontualidade(
  mentoradoId: number,
  monthsToCheck: number,
  targetDay: number
): Promise<boolean> {
  const db = getDb();
  const recentMetrics = await db
    .select()
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId))
    .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
    .limit(monthsToCheck);

  if (recentMetrics.length < monthsToCheck) return false;
  return recentMetrics.every((m) => new Date(m.createdAt).getDate() <= targetDay);
}

async function checkAcimaMedia(mentoradoId: number, monthsRequired: number): Promise<boolean> {
  const db = getDb();
  const recentMetrics = await db
    .select()
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId))
    .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
    .limit(monthsRequired);

  if (recentMetrics.length < monthsRequired) return false;

  // Fetch all averages in one query (optimized from N+1 to 2 queries)
  const periods = recentMetrics.map((m) => ({ ano: m.ano, mes: m.mes }));
  const avgResults = await db
    .select({
      ano: metricasMensais.ano,
      mes: metricasMensais.mes,
      avg: sql<number>`avg(faturamento)`,
    })
    .from(metricasMensais)
    .where(
      sql`(${metricasMensais.ano}, ${metricasMensais.mes}) IN (${sql.join(
        periods.map((p) => sql`(${p.ano}, ${p.mes})`),
        sql`, `
      )})`
    )
    .groupBy(metricasMensais.ano, metricasMensais.mes);

  const avgMap = new Map(avgResults.map((r) => [`${r.ano}-${r.mes}`, r.avg ?? 0]));

  for (const m of recentMetrics) {
    const turmaAverage = avgMap.get(`${m.ano}-${m.mes}`) ?? 0;
    if (m.faturamento <= turmaAverage) return false;
  }
  return true;
}

async function checkPlaybookCompleto(mentoradoId: number): Promise<boolean> {
  const db = getDb();
  const [totalItems] = await db.select({ count: sql<number>`count(*)` }).from(playbookItems);
  const [completedItems] = await db
    .select({ count: sql<number>`count(*)` })
    .from(playbookProgress)
    .where(eq(playbookProgress.mentoradoId, mentoradoId));

  const total = totalItems?.count ?? 0;
  const completed = completedItems?.count ?? 0;
  return total > 0 && completed >= total;
}

async function checkMesesMentoria(mentoradoId: number, requiredMonths: number): Promise<boolean> {
  const db = getDb();
  const [monthsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId));
  return (monthsCount?.count ?? 0) >= requiredMonths;
}

// Evaluate a single badge criterion
async function checkBadgeCriteria(
  criterio: { tipo: string; meses?: number; dia?: number; valor?: number; percentual?: number },
  ctx: BadgeCheckContext
): Promise<boolean> {
  switch (criterio.tipo) {
    case "primeiro_registro":
      return checkPrimeiroRegistro(ctx.mentoradoId);

    case "streak_consecutivo": {
      const streak = await calculateStreak(ctx.mentoradoId);
      return streak.currentStreak >= (criterio.meses ?? 0);
    }

    case "pontualidade":
      return checkPontualidade(ctx.mentoradoId, criterio.meses || 3, criterio.dia || 5);

    case "faturamento_meta": {
      const meta = ctx.metricas.metaFaturamento ?? ctx.mentorado.metaFaturamento;
      // Guard: if meta is 0 or undefined, cannot evaluate goal achievement
      if (!meta || meta <= 0) return false;
      return ctx.metricas.faturamento >= meta;
    }

    case "crescimento": {
      if (!ctx.metricasAnterior || ctx.metricasAnterior.faturamento <= 0) return false;
      const crescimento =
        ((ctx.metricas.faturamento - ctx.metricasAnterior.faturamento) /
          ctx.metricasAnterior.faturamento) *
        100;
      const threshold = criterio.percentual ?? criterio.valor ?? 0;
      return crescimento >= threshold;
    }

    case "faturamento_minimo":
      return ctx.metricas.faturamento >= (criterio.valor ?? 0);

    case "ranking_top":
      // Ranking badges are awarded in calculateMonthlyRanking function
      return false;

    case "acima_media":
      return checkAcimaMedia(ctx.mentoradoId, criterio.meses || 3);

    case "leads_minimo":
      return ctx.metricas.leads >= (criterio.valor ?? 0);

    case "conversao": {
      if (ctx.metricas.leads <= 0) return false;
      const conversionRate = (ctx.metricas.procedimentos / ctx.metricas.leads) * 100;
      return conversionRate > (criterio.percentual ?? 20);
    }

    case "playbook_completo":
      return checkPlaybookCompleto(ctx.mentoradoId);

    case "meses_mentoria":
      return checkMesesMentoria(ctx.mentoradoId, criterio.valor ?? 6);

    default:
      return false;
  }
}

// Check and award badges for a mentorado
export async function checkAndAwardBadges(mentoradoId: number, ano: number, mes: number) {
  const db = getDb();

  const [mentorado] = await db.select().from(mentorados).where(eq(mentorados.id, mentoradoId));
  if (!mentorado) return [];

  const [metricas] = await db
    .select()
    .from(metricasMensais)
    .where(
      and(
        eq(metricasMensais.mentoradoId, mentoradoId),
        eq(metricasMensais.ano, ano),
        eq(metricasMensais.mes, mes)
      )
    );

  if (!metricas) return [];

  // Get previous month metrics for comparison
  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAno = mes === 1 ? ano - 1 : ano;
  const [metricasAnterior] = await db
    .select()
    .from(metricasMensais)
    .where(
      and(
        eq(metricasMensais.mentoradoId, mentoradoId),
        eq(metricasMensais.ano, prevAno),
        eq(metricasMensais.mes, prevMes)
      )
    );

  const allBadges = await db.select().from(badges);
  const earnedBadges = await db
    .select()
    .from(mentoradoBadges)
    .where(
      and(
        eq(mentoradoBadges.mentoradoId, mentoradoId),
        eq(mentoradoBadges.ano, ano),
        eq(mentoradoBadges.mes, mes)
      )
    );

  const earnedBadgeIds = new Set(earnedBadges.map((b: { badgeId: number }) => b.badgeId));
  const newBadges: typeof allBadges = [];

  const ctx: BadgeCheckContext = { mentoradoId, mentorado, metricas, metricasAnterior };

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const criterio = JSON.parse(badge.criterio);
    const earned = await checkBadgeCriteria(criterio, ctx);

    if (earned) {
      await db.insert(mentoradoBadges).values({
        mentoradoId,
        badgeId: badge.id,
        ano,
        mes,
      });
      newBadges.push(badge);

      // Send dual-channel notification (in-app + email)
      await notificationService.sendBadgeUnlocked(
        mentoradoId,
        badge.nome,
        badge.descricao,
        badge.icone,
        badge.pontos
      );
    }
  }

  return newBadges;
}

// Calculate and update monthly ranking
export async function calculateMonthlyRanking(ano: number, mes: number) {
  const db = await getDb();
  if (!db) return;

  // Get all active mentorados
  const mentoradosAtivos = await db.select().from(mentorados).where(eq(mentorados.ativo, "sim"));

  const rankings: {
    mentoradoId: number;
    pontuacao: number;
    bonus: number;
  }[] = [];

  for (const m of mentoradosAtivos) {
    const [metricas] = await db
      .select()
      .from(metricasMensais)
      .where(
        and(
          eq(metricasMensais.mentoradoId, m.id),
          eq(metricasMensais.ano, ano),
          eq(metricasMensais.mes, mes)
        )
      );

    if (!metricas) continue;

    // Determine goals (monthly override or global default)
    const goalFaturamento = metricas.metaFaturamento ?? m.metaFaturamento;
    const goalPosts = metricas.metaPosts ?? m.metaPosts ?? 12;
    const goalStories = metricas.metaStories ?? m.metaStories ?? 60;
    const goalLeads = metricas.metaLeads ?? m.metaLeads ?? 50;
    const goalProcedimentos = metricas.metaProcedimentos ?? m.metaProcedimentos ?? 10;

    // Calculate score
    let pontuacao = 0;
    let bonus = 0;

    // Faturamento score (max 40 points)
    // Guard: prevent division by zero when goalFaturamento is 0
    const faturamentoPercent =
      goalFaturamento > 0 ? Math.min((metricas.faturamento / goalFaturamento) * 100, 150) : 0;
    pontuacao += Math.round(faturamentoPercent * 0.4);

    // Content score (max 20 points)
    const postsPercent = Math.min((metricas.postsFeed / goalPosts) * 100, 150);
    const storiesPercent = Math.min((metricas.stories / goalStories) * 100, 150);
    pontuacao += Math.round(((postsPercent + storiesPercent) / 2) * 0.2);

    // Operational score (max 20 points)
    const leadsPercent = Math.min((metricas.leads / goalLeads) * 100, 150);
    const procPercent = Math.min((metricas.procedimentos / goalProcedimentos) * 100, 150);
    pontuacao += Math.round(((leadsPercent + procPercent) / 2) * 0.2);

    // Badges bonus (max 20 points)
    const badgesEarned = await db
      .select()
      .from(mentoradoBadges)
      .where(
        and(
          eq(mentoradoBadges.mentoradoId, m.id),
          eq(mentoradoBadges.ano, ano),
          eq(mentoradoBadges.mes, mes)
        )
      );

    for (const b of badgesEarned) {
      const [badge] = await db.select().from(badges).where(eq(badges.id, b.badgeId));
      if (badge) bonus += badge.pontos;
    }
    bonus = Math.min(bonus, 20);
    pontuacao += bonus;

    rankings.push({ mentoradoId: m.id, pontuacao, bonus });
  }

  // Sort by score
  rankings.sort((a, b) => b.pontuacao - a.pontuacao);

  // Delete existing rankings for this month
  await db.delete(rankingMensal).where(and(eq(rankingMensal.ano, ano), eq(rankingMensal.mes, mes)));

  // Insert new rankings
  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i];
    await db.insert(rankingMensal).values({
      mentoradoId: r.mentoradoId,
      ano,
      mes,
      turma: "neon",
      posicao: i + 1,
      pontuacaoTotal: r.pontuacao,
      pontosBonus: r.bonus,
    });

    // Award ranking badges
    if (i < 3) {
      const [topBadge] = await db.select().from(badges).where(eq(badges.codigo, "top_3_turma"));
      if (topBadge) {
        const existing = await db
          .select()
          .from(mentoradoBadges)
          .where(
            and(
              eq(mentoradoBadges.mentoradoId, r.mentoradoId),
              eq(mentoradoBadges.badgeId, topBadge.id),
              eq(mentoradoBadges.ano, ano),
              eq(mentoradoBadges.mes, mes)
            )
          );
        if (existing.length === 0) {
          await db.insert(mentoradoBadges).values({
            mentoradoId: r.mentoradoId,
            badgeId: topBadge.id,
            ano,
            mes,
          });
        }
      }
    }
    if (i === 0) {
      const [champBadge] = await db.select().from(badges).where(eq(badges.codigo, "top_1_turma"));
      if (champBadge) {
        const existing = await db
          .select()
          .from(mentoradoBadges)
          .where(
            and(
              eq(mentoradoBadges.mentoradoId, r.mentoradoId),
              eq(mentoradoBadges.badgeId, champBadge.id),
              eq(mentoradoBadges.ano, ano),
              eq(mentoradoBadges.mes, mes)
            )
          );
        if (existing.length === 0) {
          await db.insert(mentoradoBadges).values({
            mentoradoId: r.mentoradoId,
            badgeId: champBadge.id,
            ano,
            mes,
          });
        }
      }
    }
  }
}

// Update progressive goals when meta is achieved
export async function updateProgressiveGoals(mentoradoId: number, ano: number, mes: number) {
  const db = await getDb();
  if (!db) return;

  const [mentorado] = await db.select().from(mentorados).where(eq(mentorados.id, mentoradoId));
  if (!mentorado) return;

  const [metricas] = await db
    .select()
    .from(metricasMensais)
    .where(
      and(
        eq(metricasMensais.mentoradoId, mentoradoId),
        eq(metricasMensais.ano, ano),
        eq(metricasMensais.mes, mes)
      )
    );

  if (!metricas) return;

  const tipos = [
    {
      tipo: "faturamento" as const,
      valor: metricas.faturamento,
      meta: mentorado.metaFaturamento,
    },
    {
      tipo: "leads" as const,
      valor: metricas.leads,
      meta: mentorado.metaLeads || 50,
    },
    {
      tipo: "procedimentos" as const,
      valor: metricas.procedimentos,
      meta: mentorado.metaProcedimentos || 10,
    },
    {
      tipo: "posts" as const,
      valor: metricas.postsFeed,
      meta: mentorado.metaPosts || 12,
    },
    {
      tipo: "stories" as const,
      valor: metricas.stories,
      meta: mentorado.metaStories || 60,
    },
  ];

  for (const t of tipos) {
    if (t.valor >= t.meta) {
      // Check if progressive goal exists
      const [metaProgressiva] = await db
        .select()
        .from(metasProgressivas)
        .where(
          and(eq(metasProgressivas.mentoradoId, mentoradoId), eq(metasProgressivas.tipo, t.tipo))
        );

      if (!metaProgressiva) {
        // Create new progressive goal
        await db.insert(metasProgressivas).values({
          mentoradoId,
          tipo: t.tipo,
          metaAtual: Math.round(t.meta * 1.1), // 10% increase
          metaInicial: t.meta,
          incremento: 10,
          vezesAtingida: 1,
        });
      } else {
        // Update existing progressive goal
        const novaVezes = metaProgressiva.vezesAtingida + 1;
        const novaMeta = Math.round(metaProgressiva.metaInicial * 1.1 ** novaVezes); // 10% compound increase

        await db
          .update(metasProgressivas)
          .set({
            metaAtual: novaMeta,
            vezesAtingida: novaVezes,
            ultimaAtualizacao: new Date(),
          })
          .where(eq(metasProgressivas.id, metaProgressiva.id));
      }
    }
  }
}

/**
 * @deprecated Use notificationService.sendAllReminders() instead.
 * This legacy function bypasses the new templates, spam control, and dual-channel delivery.
 * Kept for reference; will be removed in a future version.
 */
export async function sendMetricsReminders() {
  const db = await getDb();
  if (!db) return;

  const hoje = new Date();
  const diaDoMes = hoje.getDate();

  // Send reminders on day 1, 5, and 10 of each month
  if (![1, 5, 10].includes(diaDoMes)) return;

  const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
  const anoAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();

  const mentoradosAtivos = await db.select().from(mentorados).where(eq(mentorados.ativo, "sim"));

  for (const m of mentoradosAtivos) {
    // Check if metrics were already submitted
    const [metricas] = await db
      .select()
      .from(metricasMensais)
      .where(
        and(
          eq(metricasMensais.mentoradoId, m.id),
          eq(metricasMensais.ano, anoAnterior),
          eq(metricasMensais.mes, mesAnterior)
        )
      );

    if (!metricas) {
      // Create notification
      await db.insert(notificacoes).values({
        mentoradoId: m.id,
        tipo: "lembrete_metricas",
        titulo: "Lembrete: Envie suas métricas!",
        mensagem: `Não se esqueça de enviar suas métricas de ${mesAnterior}/${anoAnterior}. Acesse o dashboard para registrar seu desempenho.`,
      });

      // Send email
      if (m.email) {
        await sendEmail({
          to: m.email,
          subject: "Lembrete: Envie suas métricas mensais",
          body: `Olá ${m.nomeCompleto.split(" ")[0]},\n\nNão se esqueça de enviar suas métricas de ${mesAnterior}/${anoAnterior}.\n\nAcesse o dashboard para registrar seu desempenho e acompanhar sua evolução.\n\nAbraços,\nEquipe Neon`,
        });
      }
    }
  }
}

// Check and send alerts for unmet goals
export async function checkUnmetGoalsAlerts(ano: number, mes: number) {
  const db = await getDb();
  if (!db) return;

  const mentoradosAtivos = await db.select().from(mentorados).where(eq(mentorados.ativo, "sim"));

  for (const m of mentoradosAtivos) {
    const [metricas] = await db
      .select()
      .from(metricasMensais)
      .where(
        and(
          eq(metricasMensais.mentoradoId, m.id),
          eq(metricasMensais.ano, ano),
          eq(metricasMensais.mes, mes)
        )
      );

    if (!metricas) continue;

    const alertas: string[] = [];

    if (metricas.faturamento < m.metaFaturamento * 0.8) {
      alertas.push(
        `Faturamento (${((metricas.faturamento / m.metaFaturamento) * 100).toFixed(0)}% da meta)`
      );
    }
    if (metricas.leads < (m.metaLeads || 50) * 0.8) {
      alertas.push(`Leads (${((metricas.leads / (m.metaLeads || 50)) * 100).toFixed(0)}% da meta)`);
    }
    if (metricas.postsFeed < (m.metaPosts || 12) * 0.8) {
      alertas.push(
        `Posts (${((metricas.postsFeed / (m.metaPosts || 12)) * 100).toFixed(0)}% da meta)`
      );
    }

    if (alertas.length > 0) {
      await db.insert(notificacoes).values({
        mentoradoId: m.id,
        tipo: "alerta_meta",
        titulo: "Atenção: Metas abaixo do esperado",
        mensagem: `Suas métricas de ${mes}/${ano} estão abaixo de 80% em: ${alertas.join(", ")}. Vamos focar para o próximo mês!`,
      });
    }
  }
}

// Get mentorado badges
export async function getMentoradoBadges(mentoradoId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      badge: badges,
      conquistadoEm: mentoradoBadges.conquistadoEm,
      ano: mentoradoBadges.ano,
      mes: mentoradoBadges.mes,
    })
    .from(mentoradoBadges)
    .innerJoin(badges, eq(mentoradoBadges.badgeId, badges.id))
    .where(eq(mentoradoBadges.mentoradoId, mentoradoId))
    .orderBy(desc(mentoradoBadges.conquistadoEm));

  return result;
}

// Get ranking for a specific month
export async function getRanking(ano: number, mes: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(rankingMensal.ano, ano), eq(rankingMensal.mes, mes)];

  const result = await db
    .select({
      ranking: rankingMensal,
      mentorado: mentorados,
    })
    .from(rankingMensal)
    .innerJoin(mentorados, eq(rankingMensal.mentoradoId, mentorados.id))
    .where(and(...conditions))
    .orderBy(rankingMensal.posicao);

  return result;
}

// Get notifications for a mentorado
export async function getNotificacoes(mentoradoId: number, apenasNaoLidas = false) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(notificacoes.mentoradoId, mentoradoId)];
  if (apenasNaoLidas) {
    conditions.push(eq(notificacoes.lida, "nao"));
  }

  return db
    .select()
    .from(notificacoes)
    .where(and(...conditions))
    .orderBy(desc(notificacoes.createdAt));
}

// Mark notification as read
export async function markNotificationRead(notificacaoId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notificacoes).set({ lida: "sim" }).where(eq(notificacoes.id, notificacaoId));
}

// Get all badges
export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(badges).orderBy(badges.categoria, badges.pontos);
}

// Get progressive goals for a mentorado
export async function getProgressiveGoals(mentoradoId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(metasProgressivas).where(eq(metasProgressivas.mentoradoId, mentoradoId));
}

/**
 * Calculate current and longest streak for a mentorado
 *
 * Streak is counted as consecutive months with metrics registered by day 10.
 * Breaks if a month is skipped or registered after day 10.
 *
 * @param mentoradoId - ID of the mentorado
 * @returns Object with currentStreak, longestStreak, nextMilestone, and progressPercent
 */
export async function calculateStreak(mentoradoId: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  nextMilestone: number;
  progressPercent: number;
}> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0, nextMilestone: 3, progressPercent: 0 };

  // Query last 12 months of metrics ordered by ano DESC, mes DESC
  const metrics = await db
    .select()
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId))
    .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
    .limit(12);

  if (metrics.length === 0) {
    return { currentStreak: 0, longestStreak: 0, nextMilestone: 3, progressPercent: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let previousAno: number | null = null;
  let previousMes: number | null = null;
  let isCurrentStreakActive = true;

  for (const metric of metrics) {
    const registrationDay = new Date(metric.createdAt).getDate();
    const isOnTime = registrationDay <= 10;

    // Check for gaps in consecutive months
    if (previousAno !== null && previousMes !== null) {
      const expectedPrevMes = metric.mes === 12 ? 1 : metric.mes + 1;
      const expectedPrevAno = metric.mes === 12 ? metric.ano + 1 : metric.ano;

      // If there's a gap in months, break the streak
      if (previousMes !== expectedPrevMes || previousAno !== expectedPrevAno) {
        if (isCurrentStreakActive) {
          currentStreak = tempStreak;
          isCurrentStreakActive = false;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    if (isOnTime) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // Late registration breaks the streak
      if (isCurrentStreakActive) {
        currentStreak = tempStreak;
        isCurrentStreakActive = false;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }

    previousAno = metric.ano;
    previousMes = metric.mes;
  }

  // If still in active streak at end of loop
  if (isCurrentStreakActive) {
    currentStreak = tempStreak;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate next milestone (3, 6, or 12 months)
  let nextMilestone: number;
  if (currentStreak < 3) {
    nextMilestone = 3;
  } else if (currentStreak < 6) {
    nextMilestone = 6;
  } else {
    nextMilestone = 12;
  }

  // Calculate progress percentage towards next milestone
  const progressPercent = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

  return { currentStreak, longestStreak, nextMilestone, progressPercent };
}

/**
 * Calculate score from metrics and goals
 */
export function calculateScoreFromMetrics(
  mentorado: {
    metaFaturamento: number;
    metaPosts?: number | null;
    metaStories?: number | null;
    metaLeads?: number | null;
    metaProcedimentos?: number | null;
  },
  metricas: {
    faturamento: number;
    postsFeed: number;
    stories: number;
    leads: number;
    procedimentos: number;
    metaFaturamento?: number | null;
    metaPosts?: number | null;
    metaStories?: number | null;
    metaLeads?: number | null;
    metaProcedimentos?: number | null;
  }
) {
  // Determine goals (monthly override or global default)
  const goalFaturamento = metricas.metaFaturamento ?? mentorado.metaFaturamento;
  const goalPosts = metricas.metaPosts ?? mentorado.metaPosts ?? 12;
  const goalStories = metricas.metaStories ?? mentorado.metaStories ?? 60;
  const goalLeads = metricas.metaLeads ?? mentorado.metaLeads ?? 50;
  const goalProcedimentos = metricas.metaProcedimentos ?? mentorado.metaProcedimentos ?? 10;

  // Calculate score
  let pontuacao = 0;

  // Faturamento score (max 40 points)
  // Guard: prevent division by zero when goalFaturamento is 0
  const faturamentoPercent =
    goalFaturamento > 0 ? Math.min((metricas.faturamento / goalFaturamento) * 100, 150) : 0;
  pontuacao += Math.round(faturamentoPercent * 0.4);

  // Content score (max 20 points)
  const postsPercent = Math.min((metricas.postsFeed / goalPosts) * 100, 150);
  const storiesPercent = Math.min((metricas.stories / goalStories) * 100, 150);
  pontuacao += Math.round(((postsPercent + storiesPercent) / 2) * 0.2);

  // Operational score (max 20 points)
  const leadsPercent = Math.min((metricas.leads / goalLeads) * 100, 150);
  const procPercent = Math.min((metricas.procedimentos / goalProcedimentos) * 100, 150);
  pontuacao += Math.round(((leadsPercent + procPercent) / 2) * 0.2);

  return pontuacao;
}
