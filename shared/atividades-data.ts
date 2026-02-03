/**
 * Dados estáticos das atividades do PLAY NEON
 * Reestruturado em 6 Fases com base na pesquisa de dores de profissionais de estética
 */

export interface AtividadeStep {
  codigo: string;
  label: string;
  descricao?: string;
}

export interface Atividade {
  codigo: string;
  titulo: string;
  etapa: string;
  icone: string;
  descricao?: string;
  steps: AtividadeStep[];
}

export interface Fase {
  id: number;
  title: string;
  description: string;
  etapaKey: string;
  icon: string;
}

export const FASES: Fase[] = [
  {
    id: 1,
    title: "Fase 1: Fundamentos",
    etapaKey: "Fase 1: Fundamentos",
    description: "Estruture as bases do seu negócio, desde a legalização até as finanças.",
    icon: "🏠",
  },
  {
    id: 2,
    title: "Fase 2: Posicionamento",
    etapaKey: "Fase 2: Posicionamento",
    description: "Defina sua identidade, nicho e como você se apresenta ao mercado.",
    icon: "🎯",
  },
  {
    id: 3,
    title: "Fase 3: Marketing",
    etapaKey: "Fase 3: Marketing",
    description: "Atraia clientes ideais com estratégias de conteúdo e tráfego.",
    icon: "🚀",
  },
  {
    id: 4,
    title: "Fase 4: Vendas",
    etapaKey: "Fase 4: Vendas",
    description: "Converta leads em pacientes fiéis com processos comerciais eficientes.",
    icon: "💰",
  },
  {
    id: 5,
    title: "Fase 5: Gestão",
    etapaKey: "Fase 5: Gestão",
    description: "Organize processos e equipe para escalar seu negócio com saúde.",
    icon: "📊",
  },
  {
    id: 6,
    title: "Fase 6: Mindset",
    etapaKey: "Fase 6: Mindset",
    description: "Desenvolva a mentalidade e rotinas de uma empresária de sucesso.",
    icon: "🧠",
  },
];

export const ATIVIDADES: Atividade[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: FUNDAMENTOS (Semanas 1-4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f1-boas-vindas",
    titulo: "Boas-Vindas à Jornada NEON",
    etapa: "Fase 1: Fundamentos",
    icone: "👋",
    descricao: "Seu primeiro passo na metodologia NEON.",
    steps: [
      {
        codigo: "f1-bv-1",
        label: "Assistir vídeo de boas-vindas",
        descricao:
          "Acesse a área de membros e assista o vídeo de introdução da Dra. Sacha explicando a metodologia NEON.",
      },
      {
        codigo: "f1-bv-2",
        label: "Ler guia de navegação da plataforma",
        descricao:
          "Familiarize-se com todas as áreas do dashboard: atividades, métricas, agenda e comunidade.",
      },
      {
        codigo: "f1-bv-3",
        label: "Configurar foto de perfil profissional",
        descricao:
          "Use uma foto com fundo neutro, boa iluminação e roupa profissional. Evite selfies ou fotos casuais.",
      },
      {
        codigo: "f1-bv-4",
        label: "Preencher informações do perfil",
        descricao:
          "Complete: nome completo, especialidade, cidade/estado, tempo de atuação e meta de faturamento.",
      },
      {
        codigo: "f1-bv-5",
        label: "Conhecer a comunidade e mentores",
        descricao:
          "Entre no grupo do WhatsApp NEON e apresente-se: nome, especialidade, cidade e o que espera da mentoria.",
      },
    ],
  },
  {
    codigo: "f1-diagnostico",
    titulo: "Diagnóstico 360° e Metas SMART",
    etapa: "Fase 1: Fundamentos",
    icone: "📊",
    descricao: "Entenda sua situação atual e defina metas claras para os próximos 6 meses.",
    steps: [
      {
        codigo: "f1-diag-1",
        label: "Mapear faturamento dos últimos 3 meses",
        descricao:
          "Some todas as entradas (procedimentos, produtos vendidos). Use extratos bancários se necessário.",
      },
      {
        codigo: "f1-diag-2",
        label: "Identificar despesas fixas e variáveis",
        descricao:
          "Fixas: aluguel, internet, contador. Variáveis: insumos, comissões. Liste tudo com valores.",
      },
      {
        codigo: "f1-diag-3",
        label: "Calcular margem de lucro atual",
        descricao:
          "Fórmula: (Faturamento - Custos) / Faturamento × 100. Meta saudável: acima de 30%.",
      },
      {
        codigo: "f1-diag-4",
        label: "Definir faturamento desejado em 6 meses",
        descricao: "Seja realista: aumento de 30-50% é agressivo mas alcançável. Use método SMART.",
      },
      {
        codigo: "f1-diag-5",
        label: "Listar 3 maiores obstáculos atuais",
        descricao:
          "Ex: falta de leads, baixa conversão, precificação errada. Priorize por impacto no faturamento.",
      },
      {
        codigo: "f1-diag-6",
        label: "Definir meta mensal de leads",
        descricao:
          "Calcule: quantos leads precisa para atingir o faturamento? Se conversão é 20%, para 10 clientes precisa de 50 leads.",
      },
      {
        codigo: "f1-diag-7",
        label: "Criar timeline de metas",
        descricao:
          "Distribua a meta de 6 meses em marcos mensais. Mês 1-2: estrutura. Mês 3-4: captação. Mês 5-6: escala.",
      },
    ],
  },
  {
    codigo: "f1-legalizacao",
    titulo: "Legalização Completa do Negócio",
    etapa: "Fase 1: Fundamentos",
    icone: "⚖️",
    descricao: "Regularize sua atuação profissional com toda documentação necessária.",
    steps: [
      {
        codigo: "f1-leg-1",
        label: "Definir CNAE correto",
        descricao:
          "Para estética: 9602-5/02 (Atividades de Estética). Para clínica médica: 8650-0/12. Confirme com contador.",
      },
      {
        codigo: "f1-leg-2",
        label: "Contratar contador especializado",
        descricao:
          "Busque contador com experiência em clínicas/consultórios. Peça referências no grupo NEON.",
      },
      {
        codigo: "f1-leg-3",
        label: "Abrir CNPJ (se ainda não tiver)",
        descricao:
          "Tipos: MEI não serve para estética. Opte por ME ou LTDA. Lucro Presumido costuma ser mais vantajoso.",
      },
      {
        codigo: "f1-leg-4",
        label: "Obter alvará de funcionamento",
        descricao:
          "Solicite na Prefeitura. Documentos: contrato social, CNPJ, comprovante de endereço, taxa paga.",
      },
      {
        codigo: "f1-leg-5",
        label: "Obter licença da Vigilância Sanitária",
        descricao:
          "Documentos: projeto arquitetônico, PGRS, RT, lista de procedimentos. Prazo: 30-60 dias.",
      },
      {
        codigo: "f1-leg-6",
        label: "Registrar no Conselho de Classe",
        descricao: "CRBM (biomédicos), COREN (enfermeiros), CFM (médicos). Obtenha número de RT.",
      },
      {
        codigo: "f1-leg-7",
        label: "Obter autorização do Corpo de Bombeiros",
        descricao:
          "AVCB para estabelecimentos. Verifique requisitos de extintores e saídas de emergência.",
      },
      {
        codigo: "f1-leg-8",
        label: "Cadastrar no CNES",
        descricao:
          "Cadastro Nacional de Estabelecimentos de Saúde. Obrigatório para clínicas. Feito online.",
      },
    ],
  },
  {
    codigo: "f1-financas",
    titulo: "Finanças Organizadas",
    etapa: "Fase 1: Fundamentos",
    icone: "💳",
    descricao: "Separe suas finanças pessoais das profissionais e controle seu fluxo de caixa.",
    steps: [
      {
        codigo: "f1-fin-1",
        label: "Abrir conta bancária PJ",
        descricao:
          "Bancos digitais (Inter, Cora) têm taxas menores. Nunca misture dinheiro PF com PJ.",
      },
      {
        codigo: "f1-fin-2",
        label: "Configurar planilha de fluxo de caixa",
        descricao:
          "Baixe modelo no drive NEON ou use apps como Conta Azul, Granatum. Registre TUDO.",
      },
      {
        codigo: "f1-fin-3",
        label: "Definir pró-labore mensal",
        descricao:
          "Valor fixo que você retira todo mês. Sugestão: 30-40% do lucro líquido. Seja disciplinada.",
      },
      {
        codigo: "f1-fin-4",
        label: "Mapear custos fixos e variáveis",
        descricao:
          "Fixos: aluguel, internet, software. Variáveis: insumos, comissões. Crie categorias claras.",
      },
      {
        codigo: "f1-fin-5",
        label: "Criar reserva de emergência",
        descricao:
          "Meta: 3-6 meses de custos fixos. Guarde em conta separada. Não toque exceto emergência real.",
      },
      {
        codigo: "f1-fin-6",
        label: "Implementar DRE simplificada",
        descricao:
          "Demonstrativo de Resultados: Receitas - Custos Variáveis - Custos Fixos = Lucro. Faça mensal.",
      },
    ],
  },
  {
    codigo: "f1-precificacao",
    titulo: "Precificação Lucrativa",
    etapa: "Fase 1: Fundamentos",
    icone: "🏷️",
    descricao: "Defina preços que geram lucro e comunicam valor ao cliente.",
    steps: [
      {
        codigo: "f1-prec-1",
        label: "Calcular custo real por procedimento",
        descricao:
          "Inclua: insumos, tempo (seu hora/trabalho), depreciação de equipamentos, overhead.",
      },
      {
        codigo: "f1-prec-2",
        label: "Pesquisar preços da concorrência",
        descricao:
          "Use perfis de 5-10 concorrentes da sua região. Anote preços e posicionamento de cada um.",
      },
      {
        codigo: "f1-prec-3",
        label: "Definir margem mínima de 40%",
        descricao:
          "Preço = Custo / (1 - Margem). Se custo é R$100 e margem 40%: 100 / 0.6 = R$166,67.",
      },
      {
        codigo: "f1-prec-4",
        label: "Criar tabela de preços",
        descricao:
          "Liste todos os procedimentos com preço. Crie versões: à vista, parcelado, combo.",
      },
      {
        codigo: "f1-prec-5",
        label: "Definir política de descontos",
        descricao: "Máximo 10-15% para pagamento à vista. Nunca dê desconto sem motivo claro.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: POSICIONAMENTO (Semanas 5-8)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f2-nicho",
    titulo: "Nicho e Especialização",
    etapa: "Fase 2: Posicionamento",
    icone: "🔍",
    descricao: "Defina seu nicho de atuação principal para se diferenciar.",
    steps: [
      {
        codigo: "f2-nicho-1",
        label: "Listar áreas de interesse e expertise",
        descricao:
          "O que você mais gosta de fazer? Harmonização, skincare, corporal? Liste 3-5 áreas.",
      },
      {
        codigo: "f2-nicho-2",
        label: "Analisar demanda local",
        descricao:
          "Pesquise no Google Trends, veja perguntas no Google, analise concorrência local.",
      },
      {
        codigo: "f2-nicho-3",
        label: "Avaliar lucratividade do nicho",
        descricao: "Nichos com maior ticket: harmonização facial, tratamentos corporais avançados.",
      },
      {
        codigo: "f2-nicho-4",
        label: "Definir nicho principal",
        descricao:
          "Escolha 1-2 nichos para focar. Exemplo: 'Harmonização facial natural para mulheres 35+'.",
      },
      {
        codigo: "f2-nicho-5",
        label: "Criar diferencial competitivo",
        descricao:
          "O que você faz diferente? Atendimento, técnica, resultado, experiência? Defina 3 diferenciais.",
      },
    ],
  },
  {
    codigo: "f2-persona",
    titulo: "Persona Ideal Validada",
    etapa: "Fase 2: Posicionamento",
    icone: "👤",
    descricao: "Defina e valide seu cliente ideal para comunicar com precisão.",
    steps: [
      {
        codigo: "f2-pers-1",
        label: "Definir dados demográficos",
        descricao:
          "Idade, gênero, renda, profissão, cidade. Seja específica: 'Mulheres 35-50, renda 10k+, SP capital'.",
      },
      {
        codigo: "f2-pers-2",
        label: "Mapear dores profundas",
        descricao:
          "O que a incomoda? Envelhecimento, autoestima baixa, comparação social? Vá além do superficial.",
      },
      {
        codigo: "f2-pers-3",
        label: "Identificar desejos e aspirações",
        descricao: "Como ela quer se sentir? Mais jovem, confiante, bonita? Use as palavras dela.",
      },
      {
        codigo: "f2-pers-4",
        label: "Listar objeções comuns",
        descricao:
          "Preço, medo de ficar artificial, não ter tempo. Prepare respostas para cada objeção.",
      },
      {
        codigo: "f2-pers-5",
        label: "Validar com 5 clientes reais",
        descricao:
          "Entreviste 5 melhores clientes. Pergunte: por que me escolheu? O que mais valoriza?",
      },
    ],
  },
  {
    codigo: "f2-posicionamento",
    titulo: "Proposta de Valor e Posicionamento",
    etapa: "Fase 2: Posicionamento",
    icone: "🗺️",
    descricao: "Construa seu posicionamento único no mercado.",
    steps: [
      {
        codigo: "f2-pos-1",
        label: "Analisar 5 concorrentes diretos",
        descricao:
          "O que comunicam? Qual preço praticam? Como é o Instagram deles? Anote pontos fortes e fracos.",
      },
      {
        codigo: "f2-pos-2",
        label: "Identificar gaps de mercado",
        descricao:
          "O que ninguém oferece? Atendimento humanizado? Técnica específica? Horários diferenciados?",
      },
      {
        codigo: "f2-pos-3",
        label: "Criar proposta única de valor",
        descricao:
          "Complete: 'Eu ajudo [persona] a [resultado] através de [método], diferente de [concorrência]'.",
      },
      {
        codigo: "f2-pos-4",
        label: "Escrever mensagem de posicionamento",
        descricao:
          "Frase de 2 linhas que resume quem você é e para quem. Use na bio e em todas as apresentações.",
      },
      {
        codigo: "f2-pos-5",
        label: "Criar elevator pitch de 30 segundos",
        descricao:
          "Treine apresentar quem você é em 30 segundos. Use em networking e primeiros contatos.",
      },
    ],
  },
  {
    codigo: "f2-perfil",
    titulo: "Perfil Comportamental DISC",
    etapa: "Fase 2: Posicionamento",
    icone: "🧠",
    descricao: "Entenda seu perfil comportamental para melhorar comunicação e vendas.",
    steps: [
      {
        codigo: "f2-disc-1",
        label: "Realizar teste DISC",
        descricao: "Faça o teste gratuito em sites como 123test.com ou peça link no grupo NEON.",
      },
      {
        codigo: "f2-disc-2",
        label: "Analisar seus pontos fortes",
        descricao:
          "D=decisão, I=influência, S=estabilidade, C=conformidade. Qual domina? Use a seu favor.",
      },
      {
        codigo: "f2-disc-3",
        label: "Identificar pontos de melhoria",
        descricao:
          "Alto D pode parecer agressivo. Alto S pode demorar para agir. Reconheça e trabalhe.",
      },
      {
        codigo: "f2-disc-4",
        label: "Adaptar comunicação para clientes",
        descricao: "Cliente D quer resultado rápido. Cliente S quer segurança. Adapte seu pitch.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: MARKETING DIGITAL (Semanas 9-12)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f3-instagram",
    titulo: "Instagram Profissional para Clínicas",
    etapa: "Fase 3: Marketing",
    icone: "📱",
    descricao: "Transforme seu Instagram em máquina de captação de leads qualificados.",
    steps: [
      {
        codigo: "f3-ig-1",
        label: "Converter para conta profissional",
        descricao:
          "Configurações > Conta > Mudar para conta profissional > Empresa. Conecte ao Facebook Business.",
      },
      {
        codigo: "f3-ig-2",
        label: "Otimizar bio com método AIDA",
        descricao:
          "Atenção: emoji + especialidade. Interesse: resultado que entrega. Desejo: prova social. Ação: CTA + link.",
      },
      {
        codigo: "f3-ig-3",
        label: "Definir 3-5 pilares de conteúdo",
        descricao:
          "Sugestão: Educativo (dicas), Bastidores (humaniza), Resultados (antes/depois), Autoridade (formações).",
      },
      {
        codigo: "f3-ig-4",
        label: "Criar calendário editorial de 30 dias",
        descricao:
          "Use Notion ou Google Sheets. Defina: 3-4 posts/semana + stories diários + 1-2 reels/semana.",
      },
      {
        codigo: "f3-ig-5",
        label: "Preparar batch de 10 conteúdos",
        descricao:
          "Reserve 2-3h por semana para produzir em lote. Grave vídeos, escreva legendas. Use Canva e CapCut.",
      },
      {
        codigo: "f3-ig-6",
        label: "Configurar destaques organizados",
        descricao:
          "Mínimo: Sobre mim, Procedimentos, Resultados, Localização. Use capas padronizadas com sua identidade.",
      },
      {
        codigo: "f3-ig-7",
        label: "Implementar rotina de stories",
        descricao:
          "5-7 stories/dia. Roteiro: bastidores manhã, conteúdo educativo, enquete, resultado, CTA final.",
      },
      {
        codigo: "f3-ig-8",
        label: "Criar primeiro Reels com hook forte",
        descricao:
          "Primeiros 3 segundos são cruciais. Use: pergunta provocativa ou 'você está fazendo isso errado'.",
      },
      {
        codigo: "f3-ig-9",
        label: "Estabelecer rotina de engajamento",
        descricao:
          "30min/dia: responda DMs em até 1h, comente em 10 perfis de potenciais clientes, responda comentários.",
      },
      {
        codigo: "f3-ig-10",
        label: "Acompanhar métricas semanalmente",
        descricao:
          "Insights: alcance, visitas ao perfil, cliques no link, salvamentos. Meta: crescer 10% semana a semana.",
      },
    ],
  },
  {
    codigo: "f3-trafego",
    titulo: "Tráfego Pago: Fundamentos Meta Ads",
    etapa: "Fase 3: Marketing",
    icone: "🎯",
    descricao: "Configure suas primeiras campanhas para acelerar captação de leads.",
    steps: [
      {
        codigo: "f3-tf-1",
        label: "Criar Gerenciador de Negócios",
        descricao:
          "Acesse business.facebook.com. Crie conta com e-mail profissional. Adicione sua página e Instagram.",
      },
      {
        codigo: "f3-tf-2",
        label: "Configurar Pixel do Meta",
        descricao:
          "Eventos > Adicionar Pixel. Instale no seu site ou landing page. Essencial para remarketing.",
      },
      {
        codigo: "f3-tf-3",
        label: "Definir público-alvo inicial",
        descricao:
          "Segmente por: localização (10-30km), idade (25-55), interesses (estética, beleza, skincare).",
      },
      {
        codigo: "f3-tf-4",
        label: "Criar campanha de engajamento",
        descricao:
          "Objetivo: Engajamento. Orçamento: R$15-30/dia para testar. Duração: 7 dias para aprendizado.",
      },
      {
        codigo: "f3-tf-5",
        label: "Analisar resultados após 7 dias",
        descricao: "CPC aceitável: < R$1,00. CTR: > 1%. Desative anúncios ruins, duplique os bons.",
      },
      {
        codigo: "f3-tf-6",
        label: "Escalar para campanha de leads",
        descricao:
          "Objetivo: Mensagens WhatsApp ou Cadastro. Custo por lead meta: R$10-40 dependendo do procedimento.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: VENDAS E ATENDIMENTO (Semanas 13-16)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f4-whatsapp",
    titulo: "WhatsApp Business Estratégico",
    etapa: "Fase 4: Vendas",
    icone: "💬",
    descricao: "Configure seu principal canal de vendas para converter mais leads.",
    steps: [
      {
        codigo: "f4-wpp-1",
        label: "Migrar para WhatsApp Business",
        descricao:
          "Baixe o app WhatsApp Business (não o normal). Migre histórico. Use número comercial separado se possível.",
      },
      {
        codigo: "f4-wpp-2",
        label: "Configurar perfil comercial completo",
        descricao:
          "Foto: sua foto profissional. Descrição: especialidade + CTA. Horário. Endereço com mapa.",
      },
      {
        codigo: "f4-wpp-3",
        label: "Criar catálogo de serviços",
        descricao:
          "Adicione 5-10 procedimentos principais. Foto, descrição curta, preço (opcional), link para agendar.",
      },
      {
        codigo: "f4-wpp-4",
        label: "Configurar mensagem de saudação",
        descricao:
          "'Olá! 👋 Obrigada por entrar em contato! Em breve vamos te responder. O que você gostaria de saber?'",
      },
      {
        codigo: "f4-wpp-5",
        label: "Configurar mensagem de ausência",
        descricao:
          "Ative fora do horário: 'Nosso horário é seg-sex, 9h-18h. Deixe sua mensagem que responderemos!'",
      },
      {
        codigo: "f4-wpp-6",
        label: "Criar etiquetas de organização",
        descricao:
          "'Novo lead', 'Em negociação', 'Agendado', 'Pós-atendimento', 'Inativo'. Cores diferentes.",
      },
      {
        codigo: "f4-wpp-7",
        label: "Preparar respostas rápidas",
        descricao:
          "Crie 10+ templates: valores, endereço, como funciona procedimento X, formas de pagamento, confirmação.",
      },
      {
        codigo: "f4-wpp-8",
        label: "Definir SLA de resposta",
        descricao:
          "Meta: responder em até 5min no horário comercial. Máximo aceitável: 1h. Lead quente esfria em 5min!",
      },
    ],
  },
  {
    codigo: "f4-vendas",
    titulo: "Script de Vendas Consultivas",
    etapa: "Fase 4: Vendas",
    icone: "💰",
    descricao: "Desenvolva técnicas de vendas que convertem sem parecer vendedor.",
    steps: [
      {
        codigo: "f4-vend-1",
        label: "Estudar vendas consultivas",
        descricao:
          "Venda consultiva = entender a dor antes de oferecer solução. Leia: SPIN Selling ou assista aulas NEON.",
      },
      {
        codigo: "f4-vend-2",
        label: "Criar script de descoberta",
        descricao:
          "Perguntas: 'O que te motivou a buscar isso agora?' 'Já fez algo parecido?' 'O que espera de resultado?'",
      },
      {
        codigo: "f4-vend-3",
        label: "Mapear objeções comuns",
        descricao:
          "Liste as 5 objeções mais frequentes: preço, medo, tempo, desconfiança. Prepare respostas para cada.",
      },
      {
        codigo: "f4-vend-4",
        label: "Criar script de contorno de objeções",
        descricao:
          "'Entendo sua preocupação com o valor. Posso te mostrar como o retorno compensa o investimento?'",
      },
      {
        codigo: "f4-vend-5",
        label: "Definir processo de follow-up",
        descricao:
          "Cadência de 7 toques: D1 (proposta), D2 (check), D4 (valor), D7 (urgência), D14, D21, D30 (última).",
      },
    ],
  },
  {
    codigo: "f4-jornada",
    titulo: "Jornada WOW do Paciente",
    etapa: "Fase 4: Vendas",
    icone: "⭐",
    descricao: "Crie uma experiência memorável do primeiro contato à fidelização.",
    steps: [
      {
        codigo: "f4-jor-1",
        label: "Mapear jornada atual",
        descricao:
          "Desenhe: lead > contato > agendamento > preparo > atendimento > pós. Identifique gaps e fricções.",
      },
      {
        codigo: "f4-jor-2",
        label: "Criar script de primeira abordagem",
        descricao:
          "Acolhimento + descoberta + qualificação. 'O que te motivou?' 'Já fez algo antes?' 'Qual sua expectativa?'",
      },
      {
        codigo: "f4-jor-3",
        label: "Implementar confirmação 24h antes",
        descricao:
          "'Olá [nome]! Lembrando do seu horário amanhã às [hora]. Qualquer necessidade, me avise! 💙'",
      },
      {
        codigo: "f4-jor-4",
        label: "Enviar orientações pré-procedimento",
        descricao:
          "Crie PDF ou mensagem: o que evitar, como se preparar, o que esperar. Reduz ansiedade e no-shows.",
      },
      {
        codigo: "f4-jor-5",
        label: "Criar momento WOW no atendimento",
        descricao:
          "Elementos: chá/café na chegada, música ambiente, manta aquecida, brinde surpresa, foto antes/depois.",
      },
      {
        codigo: "f4-jor-6",
        label: "Follow-up 24h pós-procedimento",
        descricao:
          "'Oi [nome]! Tudo bem com você? Como está se sentindo? Qualquer dúvida, estou aqui! 💙'",
      },
      {
        codigo: "f4-jor-7",
        label: "Follow-up 7 dias pós",
        descricao:
          "Verificar resultado, pedir feedback, solicitar avaliação Google. 'Está satisfeita com o resultado?'",
      },
      {
        codigo: "f4-jor-8",
        label: "Implementar reativação 60-90 dias",
        descricao:
          "'Olá [nome]! Já faz 2 meses desde seu [procedimento]. Hora de agendar a manutenção!'",
      },
      {
        codigo: "f4-jor-9",
        label: "Criar programa de indicações",
        descricao:
          "'Indique uma amiga e ganhe 10% na próxima sessão!' Cartão físico ou digital para compartilhar.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 5: GESTÃO E ESCALA (Semanas 17-20)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f5-organizacao",
    titulo: "Organização e Produtividade",
    etapa: "Fase 5: Gestão",
    icone: "📅",
    descricao: "Organize sua agenda e sistema de tarefas para máxima produtividade.",
    steps: [
      {
        codigo: "f5-org-1",
        label: "Escolher ferramenta de agenda",
        descricao:
          "Google Calendar (integra com tudo), Calendly (agendamento online), ou sistemas como Simples Agenda.",
      },
      {
        codigo: "f5-org-2",
        label: "Configurar blocos de tempo",
        descricao:
          "Blocos para: atendimentos, administrativo, conteúdo, personal. Proteja horários estratégicos.",
      },
      {
        codigo: "f5-org-3",
        label: "Definir horários administrativos",
        descricao:
          "Reserve 2-3h/semana para: finanças, planejamento, análise de métricas. Não atenda nesse horário.",
      },
      {
        codigo: "f5-org-4",
        label: "Implementar sistema de confirmação",
        descricao: "Automação 48h e 24h antes. Reduza no-shows em até 50% com lembretes.",
      },
      {
        codigo: "f5-org-5",
        label: "Proteger 1 dia de folga",
        descricao:
          "Escolha um dia SEM atendimentos. Não negocie. Seu descanso impacta sua performance.",
      },
    ],
  },
  {
    codigo: "f5-processos",
    titulo: "Processos e SOPs",
    etapa: "Fase 5: Gestão",
    icone: "📋",
    descricao: "Documente e padronize seus processos operacionais.",
    steps: [
      {
        codigo: "f5-sop-1",
        label: "Listar processos-chave",
        descricao: "Atendimento, vendas, financeiro, pós. Liste tudo que você faz repetidamente.",
      },
      {
        codigo: "f5-sop-2",
        label: "Documentar SOP de atendimento",
        descricao:
          "Passo a passo: recepção, anamnese, procedimento, orientações, foto, despedida. Com checklist.",
      },
      {
        codigo: "f5-sop-3",
        label: "Documentar SOP de vendas",
        descricao:
          "Etapas: qualificação, apresentação, objeção, fechamento, pós-venda. Scripts incluídos.",
      },
      {
        codigo: "f5-sop-4",
        label: "Documentar SOP financeiro",
        descricao: "Recebimentos, pagamentos, conciliação, DRE. Quem faz o quê, quando e como.",
      },
      {
        codigo: "f5-sop-5",
        label: "Criar checklist de qualidade",
        descricao:
          "Verificação diária: estoque, equipamentos, limpeza, agenda. Semanal: métricas, pendências.",
      },
    ],
  },
  {
    codigo: "f5-dashboard",
    titulo: "Dashboard de Resultados",
    etapa: "Fase 5: Gestão",
    icone: "📈",
    descricao: "Monitore os indicadores-chave e tome decisões baseadas em dados.",
    steps: [
      {
        codigo: "f5-kpi-1",
        label: "Definir KPIs de faturamento",
        descricao: "Faturamento mensal, ticket médio, recorrência. Meta e real. Compare mês a mês.",
      },
      {
        codigo: "f5-kpi-2",
        label: "Definir KPIs de marketing",
        descricao:
          "Leads gerados, custo por lead, taxa de conversão. Qual canal traz mais resultado?",
      },
      {
        codigo: "f5-kpi-3",
        label: "Definir KPIs de atendimento",
        descricao: "Taxa de no-show, NPS, taxa de retorno. Como está a experiência do cliente?",
      },
      {
        codigo: "f5-kpi-4",
        label: "Configurar planilha/dashboard",
        descricao: "Use Google Sheets ou Notion. Atualize semanalmente. Visualize evolução.",
      },
      {
        codigo: "f5-kpi-5",
        label: "Estabelecer rotina de análise",
        descricao: "Sexta-feira: revisar semana. Último dia do mês: análise completa. 30min cada.",
      },
      {
        codigo: "f5-kpi-6",
        label: "Definir ajustes baseados em dados",
        descricao:
          "Se conversão baixa: revisar script. Se leads baixos: revisar tráfego. Aja no gargalo.",
      },
    ],
  },
  {
    codigo: "f5-equipe",
    titulo: "Gestão de Equipe (quando aplicável)",
    etapa: "Fase 5: Gestão",
    icone: "👥",
    descricao: "Construa e gerencie sua equipe de alta performance.",
    steps: [
      {
        codigo: "f5-eq-1",
        label: "Mapear cargos necessários",
        descricao:
          "Funções típicas: recepcionista, assistente, social media. O que você mais precisa delegar?",
      },
      {
        codigo: "f5-eq-2",
        label: "Criar descritivo de funções",
        descricao:
          "Responsabilidades, horário, competências, remuneração. Seja clara desde o início.",
      },
      {
        codigo: "f5-eq-3",
        label: "Definir processo seletivo",
        descricao:
          "Onde divulgar, entrevista, teste prático, período de experiência. Contrate devagar.",
      },
      {
        codigo: "f5-eq-4",
        label: "Estruturar onboarding",
        descricao: "Primeira semana: cultura, processos, sistemas. Use os SOPs que você criou.",
      },
      {
        codigo: "f5-eq-5",
        label: "Criar sistema de feedback",
        descricao: "1:1 semanal de 15min. O que foi bem, o que melhorar, suporte necessário.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 6: MINDSET E ROTINAS (Contínuo)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    codigo: "f6-mural",
    titulo: "Mural da Vida Extraordinária",
    etapa: "Fase 6: Mindset",
    icone: "✨",
    descricao: "Crie seu mural de visualização e mantenha o foco nos seus sonhos.",
    steps: [
      {
        codigo: "f6-mur-1",
        label: "Definir visão de vida ideal",
        descricao:
          "Como é sua vida em 3 anos? Casa, viagens, rotina, relacionamentos, negócio. Seja específica.",
      },
      {
        codigo: "f6-mur-2",
        label: "Coletar imagens inspiradoras",
        descricao:
          "Pinterest, revistas, fotos. Represente cada área: carreira, família, saúde, lazer, finanças.",
      },
      {
        codigo: "f6-mur-3",
        label: "Montar o mural físico ou digital",
        descricao:
          "Físico: quadro na parede do escritório. Digital: fundo de tela, Pinterest secreto, Notion.",
      },
      {
        codigo: "f6-mur-4",
        label: "Posicionar em local visível",
        descricao:
          "Você precisa VER todo dia. Mesinha de cabeceira, tela do computador, espelho do banheiro.",
      },
    ],
  },
  {
    codigo: "f6-gratidao",
    titulo: "Prática de Gratidão Diária",
    etapa: "Fase 6: Mindset",
    icone: "🙏",
    descricao: "Pratique gratidão diária para mindset positivo e abundância.",
    steps: [
      {
        codigo: "f6-grat-1",
        label: "Escolher formato (caderno ou app)",
        descricao:
          "Caderno físico para quem gosta de escrever. Apps: Day One, Gratitude. Escolha o que vai usar.",
      },
      {
        codigo: "f6-grat-2",
        label: "Definir horário diário",
        descricao:
          "Manhã (define o dia) ou noite (reflexão). Conecte a hábito existente: após café, antes de dormir.",
      },
      {
        codigo: "f6-grat-3",
        label: "Registrar 3 gratidões por dia",
        descricao:
          "Seja específica: não 'família', mas 'a ligação com minha mãe hoje de manhã que me alegrou'.",
      },
      {
        codigo: "f6-grat-4",
        label: "Refletir sobre impactos semanalmente",
        descricao: "Sexta: releia a semana. Como seu humor e perspectiva mudaram? O que aprendeu?",
      },
    ],
  },
  {
    codigo: "f6-leitura",
    titulo: "Rotina de Leitura",
    etapa: "Fase 6: Mindset",
    icone: "📚",
    descricao: "Desenvolva o hábito de leitura para crescimento contínuo.",
    steps: [
      {
        codigo: "f6-leit-1",
        label: "Escolher livro da lista NEON",
        descricao:
          "Sugestões: Quem Pensa Enriquece, Mindset, Essencialismo, Comece pelo Porquê. Peça lista no grupo.",
      },
      {
        codigo: "f6-leit-2",
        label: "Definir meta de leitura",
        descricao:
          "Sugestão: 10-20 páginas/dia ou 1 livro/mês. Comece pequeno, aumente gradualmente.",
      },
      {
        codigo: "f6-leit-3",
        label: "Reservar horário fixo",
        descricao: "Manhã cedo, almoço, antes de dormir. Substitua 30min de celular por leitura.",
      },
      {
        codigo: "f6-leit-4",
        label: "Registrar insights aplicáveis",
        descricao:
          "Não só leia, aplique. Anote: 'O que posso fazer diferente a partir disso?' Implemente 1 coisa por livro.",
      },
    ],
  },
  {
    codigo: "f6-saude-mental",
    titulo: "Saúde Mental do Empreendedor",
    etapa: "Fase 6: Mindset",
    icone: "🧘",
    descricao: "Cuide de você para cuidar do seu negócio. Prevenção de burnout.",
    steps: [
      {
        codigo: "f6-sm-1",
        label: "Reconhecer sinais de esgotamento",
        descricao:
          "Sintomas: exaustão constante, cinismo sobre trabalho, queda de produtividade, irritabilidade, insônia.",
      },
      {
        codigo: "f6-sm-2",
        label: "Definir horários de trabalho fixos",
        descricao:
          "Hora de início e fim. Não responda WhatsApp fora do horário. Configure 'modo não perturbe'.",
      },
      {
        codigo: "f6-sm-3",
        label: "Criar ritual de desconexão diária",
        descricao:
          "Após 20h: celular em outro cômodo. Atividade relaxante: banho, leitura, série, família.",
      },
      {
        codigo: "f6-sm-4",
        label: "Proteger 1 dia de folga sagrado",
        descricao:
          "Mínimo 1 dia/semana SEM trabalho. Não olhe métricas. Seu cérebro precisa descansar.",
      },
      {
        codigo: "f6-sm-5",
        label: "Criar rede de apoio",
        descricao:
          "Use o grupo NEON ativamente. Tenha 2-3 colegas para desabafar. Considere terapia.",
      },
      {
        codigo: "f6-sm-6",
        label: "Praticar exercício físico regular",
        descricao:
          "Mínimo 3x/semana, 30min. Caminhada, academia, yoga, dança. Libera endorfinas, reduz ansiedade.",
      },
      {
        codigo: "f6-sm-7",
        label: "Implementar pausas durante o dia",
        descricao:
          "Pomodoro: 25min trabalho + 5min pausa. A cada 4 ciclos: 15-30min. Levante, hidrate, respire.",
      },
    ],
  },
  {
    codigo: "f6-mentoria",
    titulo: "Aproveitando a Mentoria NEON",
    etapa: "Fase 6: Mindset",
    icone: "📞",
    descricao: "Maximize o valor da sua mentoria com preparação e execução.",
    steps: [
      {
        codigo: "f6-ment-1",
        label: "Preparar pauta antes de cada call",
        descricao:
          "Liste: 3 vitórias do mês, 3 desafios atuais, 3 perguntas específicas. Envie 24h antes.",
      },
      {
        codigo: "f6-ment-2",
        label: "Definir objetivos da mentoria",
        descricao:
          "O que você PRECISA sair sabendo dessa call? Foco salva tempo e aumenta resultado.",
      },
      {
        codigo: "f6-ment-3",
        label: "Registrar insights durante a call",
        descricao: "Anote tudo: recomendações, tarefas, prazos. Use Notion, Notes ou papel mesmo.",
      },
      {
        codigo: "f6-ment-4",
        label: "Criar plano de ação pós-call",
        descricao:
          "Transforme insights em tarefas com prazo. Máximo 3-5 ações. Priorize por impacto.",
      },
      {
        codigo: "f6-ment-5",
        label: "Executar e reportar na próxima",
        descricao:
          "O diferencial está na EXECUÇÃO. Faça o combinado e conte os resultados na próxima call.",
      },
    ],
  },
];

/**
 * Agrupa atividades por etapa
 */
export function getAtividadesByEtapa(): Record<string, Atividade[]> {
  const grouped: Record<string, Atividade[]> = {};
  for (const atividade of ATIVIDADES) {
    if (!grouped[atividade.etapa]) {
      grouped[atividade.etapa] = [];
    }
    grouped[atividade.etapa].push(atividade);
  }
  return grouped;
}

/**
 * Calcula progresso total dado um mapa de progresso
 */
export function calcularProgresso(progressMap: Record<string, boolean>): {
  total: number;
  completed: number;
  percentage: number;
} {
  let total = 0;
  let completed = 0;

  for (const atividade of ATIVIDADES) {
    for (const step of atividade.steps) {
      total++;
      const key = `${atividade.codigo}:${step.codigo}`;
      if (progressMap[key]) {
        completed++;
      }
    }
  }

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Color mapping for etapa categories (6 Fases)
 */
export function getEtapaColor(etapa: string): {
  border: string;
  bg: string;
  text: string;
  ring: string;
} {
  const colorMap: Record<string, { border: string; bg: string; text: string; ring: string }> = {
    "Fase 1: Fundamentos": {
      border: "border-l-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      ring: "ring-amber-500/30",
    },
    "Fase 2: Posicionamento": {
      border: "border-l-blue-500",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      ring: "ring-blue-500/30",
    },
    "Fase 3: Marketing": {
      border: "border-l-pink-500",
      bg: "bg-pink-500/10",
      text: "text-pink-500",
      ring: "ring-pink-500/30",
    },
    "Fase 4: Vendas": {
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      ring: "ring-emerald-500/30",
    },
    "Fase 5: Gestão": {
      border: "border-l-violet-500",
      bg: "bg-violet-500/10",
      text: "text-violet-500",
      ring: "ring-violet-500/30",
    },
    "Fase 6: Mindset": {
      border: "border-l-teal-500",
      bg: "bg-teal-500/10",
      text: "text-teal-500",
      ring: "ring-teal-500/30",
    },
  };

  return (
    colorMap[etapa] ?? {
      border: "border-l-primary",
      bg: "bg-primary/10",
      text: "text-primary",
      ring: "ring-primary/30",
    }
  );
}

/**
 * Get motivational message based on progress percentage
 */
export function getMotivationalMessage(percentage: number): {
  message: string;
  emoji: string;
} {
  if (percentage === 100) {
    return { message: "Parabéns! Jornada completa! 🎉", emoji: "🏆" };
  }
  if (percentage >= 75) {
    return { message: "Quase lá! Você está arrasando!", emoji: "🔥" };
  }
  if (percentage >= 50) {
    return { message: "Metade do caminho! Continue assim!", emoji: "💪" };
  }
  if (percentage >= 25) {
    return { message: "Ótimo progresso! Mantenha o ritmo!", emoji: "⚡" };
  }
  if (percentage > 0) {
    return { message: "Bom começo! O primeiro passo é o mais importante.", emoji: "🚀" };
  }
  return { message: "Sua jornada começa agora!", emoji: "✨" };
}
