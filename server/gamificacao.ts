import { getDb } from "./db";
import { badges, mentoradoBadges, rankingMensal, metasProgressivas, notificacoes, mentorados, metricasMensais } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendEmail } from "./emailService";

// Badge definitions with criteria
export const BADGES_CONFIG = [
  // Faturamento
  { codigo: "meta_batida", nome: "Meta Batida", descricao: "Atingiu a meta de faturamento do mês", icone: "Target", cor: "gold", categoria: "faturamento" as const, criterio: JSON.stringify({ tipo: "faturamento_meta" }), pontos: 20 },
  { codigo: "crescimento_10", nome: "Crescimento 10%", descricao: "Cresceu 10% em relação ao mês anterior", icone: "TrendingUp", cor: "green", categoria: "faturamento" as const, criterio: JSON.stringify({ tipo: "crescimento", valor: 10 }), pontos: 15 },
  { codigo: "crescimento_25", nome: "Crescimento 25%", descricao: "Cresceu 25% em relação ao mês anterior", icone: "Rocket", cor: "purple", categoria: "faturamento" as const, criterio: JSON.stringify({ tipo: "crescimento", valor: 25 }), pontos: 30 },
  { codigo: "faturamento_20k", nome: "20K Club", descricao: "Faturou R$ 20.000 ou mais no mês", icone: "Crown", cor: "gold", categoria: "faturamento" as const, criterio: JSON.stringify({ tipo: "faturamento_minimo", valor: 20000 }), pontos: 25 },
  { codigo: "faturamento_50k", nome: "50K Club", descricao: "Faturou R$ 50.000 ou mais no mês", icone: "Gem", cor: "purple", categoria: "faturamento" as const, criterio: JSON.stringify({ tipo: "faturamento_minimo", valor: 50000 }), pontos: 50 },
  
  // Conteúdo
  { codigo: "criador_conteudo", nome: "Criador de Conteúdo", descricao: "Postou 12+ posts e 60+ stories no mês", icone: "Camera", cor: "blue", categoria: "conteudo" as const, criterio: JSON.stringify({ tipo: "conteudo_completo" }), pontos: 15 },
  { codigo: "viral", nome: "Viral", descricao: "Postou 20+ posts no mês", icone: "Flame", cor: "orange", categoria: "conteudo" as const, criterio: JSON.stringify({ tipo: "posts_minimo", valor: 20 }), pontos: 20 },
  { codigo: "stories_master", nome: "Stories Master", descricao: "Postou 100+ stories no mês", icone: "Play", cor: "pink", categoria: "conteudo" as const, criterio: JSON.stringify({ tipo: "stories_minimo", valor: 100 }), pontos: 20 },
  
  // Operacional
  { codigo: "maquina_leads", nome: "Máquina de Leads", descricao: "Gerou 50+ leads no mês", icone: "Users", cor: "blue", categoria: "operacional" as const, criterio: JSON.stringify({ tipo: "leads_minimo", valor: 50 }), pontos: 20 },
  { codigo: "alta_conversao", nome: "Alta Conversão", descricao: "Realizou 20+ procedimentos no mês", icone: "Zap", cor: "yellow", categoria: "operacional" as const, criterio: JSON.stringify({ tipo: "procedimentos_minimo", valor: 20 }), pontos: 25 },
  
  // Consistência
  { codigo: "consistente_3", nome: "Consistente", descricao: "Bateu a meta 3 meses seguidos", icone: "Award", cor: "silver", categoria: "consistencia" as const, criterio: JSON.stringify({ tipo: "metas_seguidas", valor: 3 }), pontos: 40 },
  { codigo: "consistente_6", nome: "Imparável", descricao: "Bateu a meta 6 meses seguidos", icone: "Trophy", cor: "gold", categoria: "consistencia" as const, criterio: JSON.stringify({ tipo: "metas_seguidas", valor: 6 }), pontos: 80 },
  
  // Especial
  { codigo: "top_3", nome: "Top 3", descricao: "Ficou entre os 3 primeiros do ranking mensal", icone: "Medal", cor: "gold", categoria: "especial" as const, criterio: JSON.stringify({ tipo: "ranking_top", valor: 3 }), pontos: 30 },
  { codigo: "primeiro_lugar", nome: "Campeão", descricao: "Ficou em primeiro lugar no ranking mensal", icone: "Crown", cor: "gold", categoria: "especial" as const, criterio: JSON.stringify({ tipo: "ranking_top", valor: 1 }), pontos: 50 },
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

// Check and award badges for a mentorado
export async function checkAndAwardBadges(mentoradoId: number, ano: number, mes: number) {
  const db = await getDb();
  if (!db) return [];

  const [mentorado] = await db.select().from(mentorados).where(eq(mentorados.id, mentoradoId));
  if (!mentorado) return [];

  const [metricas] = await db.select().from(metricasMensais)
    .where(and(eq(metricasMensais.mentoradoId, mentoradoId), eq(metricasMensais.ano, ano), eq(metricasMensais.mes, mes)));
  
  if (!metricas) return [];

  // Get previous month metrics for comparison
  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAno = mes === 1 ? ano - 1 : ano;
  const [metricasAnterior] = await db.select().from(metricasMensais)
    .where(and(eq(metricasMensais.mentoradoId, mentoradoId), eq(metricasMensais.ano, prevAno), eq(metricasMensais.mes, prevMes)));

  const allBadges = await db.select().from(badges);
  const earnedBadges = await db.select().from(mentoradoBadges)
    .where(and(eq(mentoradoBadges.mentoradoId, mentoradoId), eq(mentoradoBadges.ano, ano), eq(mentoradoBadges.mes, mes)));
  
  const earnedBadgeIds = new Set(earnedBadges.map((b: { badgeId: number }) => b.badgeId));
  const newBadges: typeof allBadges = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const criterio = JSON.parse(badge.criterio);
    let earned = false;

    switch (criterio.tipo) {
      case "faturamento_meta":
        earned = metricas.faturamento >= mentorado.metaFaturamento;
        break;
      case "crescimento":
        if (metricasAnterior && metricasAnterior.faturamento > 0) {
          const crescimento = ((metricas.faturamento - metricasAnterior.faturamento) / metricasAnterior.faturamento) * 100;
          earned = crescimento >= criterio.valor;
        }
        break;
      case "faturamento_minimo":
        earned = metricas.faturamento >= criterio.valor;
        break;
      case "conteudo_completo":
        earned = metricas.postsFeed >= 12 && metricas.stories >= 60;
        break;
      case "posts_minimo":
        earned = metricas.postsFeed >= criterio.valor;
        break;
      case "stories_minimo":
        earned = metricas.stories >= criterio.valor;
        break;
      case "leads_minimo":
        earned = metricas.leads >= criterio.valor;
        break;
      case "procedimentos_minimo":
        earned = metricas.procedimentos >= criterio.valor;
        break;
    }

    if (earned) {
      await db.insert(mentoradoBadges).values({
        mentoradoId,
        badgeId: badge.id,
        ano,
        mes,
      });
      newBadges.push(badge);

      // Create notification
      await db.insert(notificacoes).values({
        mentoradoId,
        tipo: "conquista",
        titulo: `Nova conquista: ${badge.nome}!`,
        mensagem: badge.descricao,
      });
    }
  }

  return newBadges;
}

// Calculate and update monthly ranking
export async function calculateMonthlyRanking(ano: number, mes: number) {
  const db = await getDb();
  if (!db) return;

  const turmas = ["neon_estrutura", "neon_escala"] as const;
  
  for (const turma of turmas) {
    // Get all mentorados from this turma with their metrics
    const mentoradosTurma = await db.select()
      .from(mentorados)
      .where(and(eq(mentorados.turma, turma), eq(mentorados.ativo, "sim")));

    const rankings: { mentoradoId: number; pontuacao: number; bonus: number }[] = [];

    for (const m of mentoradosTurma) {
      const [metricas] = await db.select().from(metricasMensais)
        .where(and(eq(metricasMensais.mentoradoId, m.id), eq(metricasMensais.ano, ano), eq(metricasMensais.mes, mes)));

      if (!metricas) continue;

      // Calculate score
      let pontuacao = 0;
      let bonus = 0;

      // Faturamento score (max 40 points)
      const faturamentoPercent = Math.min((metricas.faturamento / m.metaFaturamento) * 100, 150);
      pontuacao += Math.round(faturamentoPercent * 0.4);

      // Content score (max 20 points)
      const postsPercent = Math.min((metricas.postsFeed / (m.metaPosts || 12)) * 100, 150);
      const storiesPercent = Math.min((metricas.stories / (m.metaStories || 60)) * 100, 150);
      pontuacao += Math.round(((postsPercent + storiesPercent) / 2) * 0.2);

      // Operational score (max 20 points)
      const leadsPercent = Math.min((metricas.leads / (m.metaLeads || 50)) * 100, 150);
      const procPercent = Math.min((metricas.procedimentos / (m.metaProcedimentos || 10)) * 100, 150);
      pontuacao += Math.round(((leadsPercent + procPercent) / 2) * 0.2);

      // Badges bonus (max 20 points)
      const badgesEarned = await db.select().from(mentoradoBadges)
        .where(and(eq(mentoradoBadges.mentoradoId, m.id), eq(mentoradoBadges.ano, ano), eq(mentoradoBadges.mes, mes)));
      
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

    // Delete existing rankings for this month/turma
    await db.delete(rankingMensal)
      .where(and(eq(rankingMensal.ano, ano), eq(rankingMensal.mes, mes), eq(rankingMensal.turma, turma)));

    // Insert new rankings
    for (let i = 0; i < rankings.length; i++) {
      const r = rankings[i];
      await db.insert(rankingMensal).values({
        mentoradoId: r.mentoradoId,
        ano,
        mes,
        turma,
        posicao: i + 1,
        pontuacaoTotal: r.pontuacao,
        pontosBonus: r.bonus,
      });

      // Award ranking badges
      if (i < 3) {
        const [topBadge] = await db.select().from(badges).where(eq(badges.codigo, "top_3"));
        if (topBadge) {
          const existing = await db.select().from(mentoradoBadges)
            .where(and(eq(mentoradoBadges.mentoradoId, r.mentoradoId), eq(mentoradoBadges.badgeId, topBadge.id), eq(mentoradoBadges.ano, ano), eq(mentoradoBadges.mes, mes)));
          if (existing.length === 0) {
            await db.insert(mentoradoBadges).values({ mentoradoId: r.mentoradoId, badgeId: topBadge.id, ano, mes });
          }
        }
      }
      if (i === 0) {
        const [champBadge] = await db.select().from(badges).where(eq(badges.codigo, "primeiro_lugar"));
        if (champBadge) {
          const existing = await db.select().from(mentoradoBadges)
            .where(and(eq(mentoradoBadges.mentoradoId, r.mentoradoId), eq(mentoradoBadges.badgeId, champBadge.id), eq(mentoradoBadges.ano, ano), eq(mentoradoBadges.mes, mes)));
          if (existing.length === 0) {
            await db.insert(mentoradoBadges).values({ mentoradoId: r.mentoradoId, badgeId: champBadge.id, ano, mes });
          }
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

  const [metricas] = await db.select().from(metricasMensais)
    .where(and(eq(metricasMensais.mentoradoId, mentoradoId), eq(metricasMensais.ano, ano), eq(metricasMensais.mes, mes)));
  
  if (!metricas) return;

  const tipos = [
    { tipo: "faturamento" as const, valor: metricas.faturamento, meta: mentorado.metaFaturamento },
    { tipo: "leads" as const, valor: metricas.leads, meta: mentorado.metaLeads || 50 },
    { tipo: "procedimentos" as const, valor: metricas.procedimentos, meta: mentorado.metaProcedimentos || 10 },
    { tipo: "posts" as const, valor: metricas.postsFeed, meta: mentorado.metaPosts || 12 },
    { tipo: "stories" as const, valor: metricas.stories, meta: mentorado.metaStories || 60 },
  ];

  for (const t of tipos) {
    if (t.valor >= t.meta) {
      // Check if progressive goal exists
      const [metaProgressiva] = await db.select().from(metasProgressivas)
        .where(and(eq(metasProgressivas.mentoradoId, mentoradoId), eq(metasProgressivas.tipo, t.tipo)));

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
        const novaMeta = Math.round(metaProgressiva.metaInicial * Math.pow(1.1, novaVezes)); // 10% compound increase
        
        await db.update(metasProgressivas)
          .set({ metaAtual: novaMeta, vezesAtingida: novaVezes, ultimaAtualizacao: new Date() })
          .where(eq(metasProgressivas.id, metaProgressiva.id));
      }
    }
  }
}

// Send reminder notifications for metrics submission
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
    const [metricas] = await db.select().from(metricasMensais)
      .where(and(eq(metricasMensais.mentoradoId, m.id), eq(metricasMensais.ano, anoAnterior), eq(metricasMensais.mes, mesAnterior)));

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
          body: `Olá ${m.nomeCompleto.split(" ")[0]},\n\nNão se esqueça de enviar suas métricas de ${mesAnterior}/${anoAnterior}.\n\nAcesse o dashboard para registrar seu desempenho e acompanhar sua evolução.\n\nAbraços,\nEquipe Neon`
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
    const [metricas] = await db.select().from(metricasMensais)
      .where(and(eq(metricasMensais.mentoradoId, m.id), eq(metricasMensais.ano, ano), eq(metricasMensais.mes, mes)));

    if (!metricas) continue;

    const alertas: string[] = [];

    if (metricas.faturamento < m.metaFaturamento * 0.8) {
      alertas.push(`Faturamento (${((metricas.faturamento / m.metaFaturamento) * 100).toFixed(0)}% da meta)`);
    }
    if (metricas.leads < (m.metaLeads || 50) * 0.8) {
      alertas.push(`Leads (${((metricas.leads / (m.metaLeads || 50)) * 100).toFixed(0)}% da meta)`);
    }
    if (metricas.postsFeed < (m.metaPosts || 12) * 0.8) {
      alertas.push(`Posts (${((metricas.postsFeed / (m.metaPosts || 12)) * 100).toFixed(0)}% da meta)`);
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

  const result = await db.select({
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
export async function getRanking(ano: number, mes: number, turma?: "neon_estrutura" | "neon_escala") {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(rankingMensal.ano, ano), eq(rankingMensal.mes, mes)];
  if (turma) {
    conditions.push(eq(rankingMensal.turma, turma));
  }

  const result = await db.select({
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

  return db.select().from(notificacoes).where(and(...conditions)).orderBy(desc(notificacoes.createdAt));
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
