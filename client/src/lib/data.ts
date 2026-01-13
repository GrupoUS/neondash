export interface MentoradoData {
  faturamento: number;
  lucro: number;
  posts_feed: number;
  stories: number;
  leads: number;
  procedimentos: number;
}

export interface DetalheScore {
  realizado: number;
  meta?: number;
  esperado?: number;
  percentual: number;
  score: number;
}

export interface MentoradoAnalise {
  dados: MentoradoData;
  score: number;
  detalhes: {
    faturamento: DetalheScore;
    posts_feed: DetalheScore;
    stories: DetalheScore;
    procedimentos: DetalheScore;
    leads?: DetalheScore;
    bonus_estrutura?: number;
  };
  classificacao: string;
  feedback?: {
    analise_dezembro: string;
    foco_janeiro: string;
    sugestao: string;
  };
}

export interface GrupoAnalise {
  analise: Record<string, MentoradoAnalise>;
  ranking: [string, number][];
  benchmarks: {
    meta_faturamento: number;
    posts_feed_min: number;
    stories_min: number;
    procedimentos_min: number;
    leads_min?: number;
  };
}

export interface AnaliseCompleta {
  neon_estrutura: GrupoAnalise;
  neon_escala: GrupoAnalise;
}

export const analiseData: AnaliseCompleta = {
  "neon_estrutura": {
    "analise": {
      "Ana Scaravate": {
        "dados": { "faturamento": 16350.0, "lucro": 10864.38, "posts_feed": 2, "stories": 99, "leads": 4, "procedimentos": 16 },
        "score": 88.8,
        "detalhes": {
          "faturamento": { "realizado": 16350.0, "meta": 16000, "percentual": 102.2, "score": 40 },
          "posts_feed": { "realizado": 2, "esperado": 8, "percentual": 25.0, "score": 3.8 },
          "stories": { "realizado": 99, "esperado": 28, "percentual": 353.6, "score": 15 },
          "procedimentos": { "realizado": 16, "esperado": 5, "percentual": 320.0, "score": 20 },
          "bonus_estrutura": 10
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Excelente performance em faturamento (R$ 16.350) e stories (99), mas baixa frequência no feed (2 posts).",
          "foco_janeiro": "Manter o ritmo de stories e aumentar a presença no feed para educar a audiência sobre novos procedimentos.",
          "sugestao": "Ana, seu engajamento nos stories é fantástico e refletiu diretamente no seu faturamento. Para janeiro, o foco é transformar essa audiência quente em pacientes recorrentes. Aumente para 3 posts semanais no feed focando em 'dor vs. solução' para atrair novos seguidores que ainda não veem seus stories. Use a campanha de 'Avaliação Estratégica' para preencher a agenda da semana 3 e 4."
        }
      },
      "Alina Targino": {
        "dados": { "faturamento": 9220.0, "lucro": 3970.56, "posts_feed": 20, "stories": 84, "leads": 0, "procedimentos": 12 },
        "score": 83.0,
        "detalhes": {
          "faturamento": { "realizado": 9220.0, "meta": 16000, "percentual": 57.6, "score": 23.1 },
          "posts_feed": { "realizado": 20, "esperado": 8, "percentual": 250.0, "score": 15 },
          "stories": { "realizado": 84, "esperado": 28, "percentual": 300.0, "score": 15 },
          "procedimentos": { "realizado": 12, "esperado": 5, "percentual": 240.0, "score": 20 },
          "bonus_estrutura": 10
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Ótima consistência em posts (20) e stories (84), mas faturamento (R$ 9.220) abaixo da meta de R$ 16k.",
          "foco_janeiro": "Converter o alto volume de conteúdo em agendamentos efetivos através de prospecção ativa.",
          "sugestao": "Alina, você é uma máquina de conteúdo! Agora precisamos converter essa visibilidade em vendas. Em janeiro, aplique a estratégia de 'Prospecção Ativa' enviando mensagens diretas para quem interage com seus posts. Não espere eles virem até você. Use o roteiro de convite para avaliação estratégica com os 30 nomes mais engajados do seu Instagram."
        }
      },
      "Tânia Cristina": {
        "dados": { "faturamento": 9120.0, "lucro": 6300.0, "posts_feed": 20, "stories": 37, "leads": 4, "procedimentos": 8 },
        "score": 82.8,
        "detalhes": {
          "faturamento": { "realizado": 9120.0, "meta": 16000, "percentual": 57.0, "score": 22.8 },
          "posts_feed": { "realizado": 20, "esperado": 8, "percentual": 250.0, "score": 15 },
          "stories": { "realizado": 37, "esperado": 28, "percentual": 132.1, "score": 15 },
          "procedimentos": { "realizado": 8, "esperado": 5, "percentual": 160.0, "score": 20 },
          "bonus_estrutura": 10
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Consistência exemplar no feed (20 posts), mas faturamento (R$ 9.120) ainda tem potencial de crescimento.",
          "foco_janeiro": "Melhorar a oferta nos stories e focar em procedimentos de maior ticket médio.",
          "sugestao": "Tânia, sua vitrine está linda, mas precisamos ser mais intencionais na venda. Para janeiro, reduza levemente o feed se necessário, mas intensifique os stories com chamadas para ação (CTAs) diretas. A campanha de '10 vagas para avaliação' é perfeita para você criar urgência e fechar pacotes de maior valor."
        }
      },
      "Mariana Guimarães": {
        "dados": { "faturamento": 9068.0, "lucro": 4500.75, "posts_feed": 7, "stories": 157, "leads": 13, "procedimentos": 10 },
        "score": 80.8,
        "detalhes": {
          "faturamento": { "realizado": 9068.0, "meta": 16000, "percentual": 56.7, "score": 22.7 },
          "posts_feed": { "realizado": 7, "esperado": 8, "percentual": 87.5, "score": 13.1 },
          "stories": { "realizado": 157, "esperado": 28, "percentual": 560.7, "score": 15 },
          "procedimentos": { "realizado": 10, "esperado": 5, "percentual": 200.0, "score": 20 },
          "bonus_estrutura": 10
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Rainha dos stories (157!), mas faturamento (R$ 9.068) e feed (7 posts) podem melhorar.",
          "foco_janeiro": "Equilibrar a presença no feed e usar a base de leads (13 captados) para gerar vendas.",
          "sugestao": "Mariana, sua conexão nos stories é incrível. Em janeiro, vamos usar essa influência para lotar a agenda. Pegue esses 13 leads de dezembro e os novos que surgirem e aplique o roteiro de prospecção ativa. No feed, foque em posts de 'Prova Social' para validar sua autoridade para quem chega agora."
        }
      },
      "Gabriela Santiago": {
        "dados": { "faturamento": 3600.0, "lucro": 1990.0, "posts_feed": 2, "stories": 49, "leads": 2, "procedimentos": 7 },
        "score": 57.8,
        "detalhes": {
          "faturamento": { "realizado": 3600.0, "meta": 16000, "percentual": 22.5, "score": 9.0 },
          "posts_feed": { "realizado": 2, "esperado": 8, "percentual": 25.0, "score": 3.8 },
          "stories": { "realizado": 49, "esperado": 28, "percentual": 175.0, "score": 15 },
          "procedimentos": { "realizado": 7, "esperado": 5, "percentual": 140.0, "score": 20 },
          "bonus_estrutura": 10
        },
        "classificacao": "Regular",
        "feedback": {
          "analise_dezembro": "Faturamento (R$ 3.600) e ações (2 posts) abaixo do potencial. Precisa de um choque de gestão.",
          "foco_janeiro": "Execução rigorosa do básico: constância mínima e prospecção ativa.",
          "sugestao": "Gabriela, janeiro é o mês da virada. Não se preocupe com perfeição, foque em execução. Sua meta é simples: 3 posts na semana e prospecção ativa diária. Use o Google Meu Negócio para atrair pacientes locais que já procuram pelo seu serviço. A meta é dobrar esse faturamento com ações simples e consistentes."
        }
      }
    },
    "ranking": [
      ["Ana Scaravate", 88.8],
      ["Alina Targino", 83.0],
      ["Tânia Cristina", 82.8],
      ["Mariana Guimarães", 80.8],
      ["Gabriela Santiago", 57.8]
    ],
    "benchmarks": {
      "meta_faturamento": 16000,
      "posts_feed_min": 8,
      "stories_min": 28,
      "procedimentos_min": 5
    }
  },
  "neon_escala": {
    "analise": {
      "Thais Olimpia": {
        "dados": { "faturamento": 30725.0, "lucro": 0, "posts_feed": 12, "stories": 36, "leads": 184, "procedimentos": 12 },
        "score": 96.0,
        "detalhes": {
          "faturamento": { "realizado": 30725.0, "meta": 30000, "percentual": 102.4, "score": 40 },
          "posts_feed": { "realizado": 12, "esperado": 12, "percentual": 100.0, "score": 15 },
          "stories": { "realizado": 36, "esperado": 28, "percentual": 128.6, "score": 15 },
          "procedimentos": { "realizado": 12, "esperado": 15, "percentual": 80.0, "score": 16.0 },
          "leads": { "realizado": 184, "esperado": 20, "percentual": 920.0, "score": 10 }
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Performance estelar! Bateu meta de faturamento (R$ 30.725) e gerou incríveis 184 leads.",
          "foco_janeiro": "Gestão de leads e qualificação para manter a taxa de conversão alta.",
          "sugestao": "Thais, você 'zerou' o jogo em dezembro! Com 184 leads, seu desafio em janeiro é qualificação e conversão. Não deixe esses contatos esfriarem. Use a campanha de avaliação estratégica para filtrar os curiosos dos compradores reais. Mantenha a constância e comece a pensar em delegar o agendamento se ainda não o fez."
        }
      },
      "Lana Máximo": {
        "dados": { "faturamento": 88365.0, "lucro": 22774.0, "posts_feed": 5, "stories": 127, "leads": 13, "procedimentos": 54 },
        "score": 87.8,
        "detalhes": {
          "faturamento": { "realizado": 88365.0, "meta": 30000, "percentual": 294.6, "score": 40 },
          "posts_feed": { "realizado": 5, "esperado": 12, "percentual": 41.7, "score": 6.2 },
          "stories": { "realizado": 127, "esperado": 28, "percentual": 453.6, "score": 15 },
          "procedimentos": { "realizado": 54, "esperado": 15, "percentual": 360.0, "score": 20 },
          "leads": { "realizado": 13, "esperado": 20, "percentual": 65.0, "score": 6.5 }
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Faturamento recorde (R$ 88.365), mas feed (5 posts) foi deixado de lado.",
          "foco_janeiro": "Retomar a presença no feed para garantir a demanda futura e não depender apenas de indicações/recorrência.",
          "sugestao": "Lana, resultados impressionantes! Para garantir que esse faturamento seja sustentável a longo prazo, precisamos reaquecer o feed. Volte com os 3 posts semanais focados em educação e autoridade. Você já tem o faturamento, agora construa o império de marca para sustentar esse nível o ano todo."
        }
      },
      "Kleber Oliveira": {
        "dados": { "faturamento": 66300.0, "lucro": 0, "posts_feed": 2, "stories": 71, "leads": 92, "procedimentos": 36 },
        "score": 87.5,
        "detalhes": {
          "faturamento": { "realizado": 66300.0, "meta": 30000, "percentual": 221.0, "score": 40 },
          "posts_feed": { "realizado": 2, "esperado": 12, "percentual": 16.7, "score": 2.5 },
          "stories": { "realizado": 71, "esperado": 28, "percentual": 253.6, "score": 15 },
          "procedimentos": { "realizado": 36, "esperado": 15, "percentual": 240.0, "score": 20 },
          "leads": { "realizado": 92, "esperado": 20, "percentual": 460.0, "score": 10 }
        },
        "classificacao": "Excelente",
        "feedback": {
          "analise_dezembro": "Faturamento monstro (R$ 66.300), mas feed (2 posts) quase inexistente.",
          "foco_janeiro": "Organizar a casa digital. O faturamento está ótimo, mas a vitrine precisa refletir esse sucesso.",
          "sugestao": "Kleber, financeiramente você está voando. O risco é ficar invisível para novos públicos. Em janeiro, dedique tempo para organizar o feed com posts de 'Prova Social' e 'Bastidores'. Mostre o sucesso da clínica para atrair pacientes que buscam tickets ainda mais altos. Google Meu Negócio atualizado é essencial para você."
        }
      },
      "Carmen": {
        "dados": { "faturamento": 65274.0, "lucro": 0, "posts_feed": 10, "stories": 131, "leads": 27, "procedimentos": 0 },
        "score": 77.5,
        "detalhes": {
          "faturamento": { "realizado": 65274.0, "meta": 30000, "percentual": 217.6, "score": 40 },
          "posts_feed": { "realizado": 10, "esperado": 12, "percentual": 83.3, "score": 12.5 },
          "stories": { "realizado": 131, "esperado": 28, "percentual": 467.9, "score": 15 },
          "procedimentos": { "realizado": 0, "esperado": 15, "percentual": 0.0, "score": 0.0 },
          "leads": { "realizado": 27, "esperado": 20, "percentual": 135.0, "score": 10 }
        },
        "classificacao": "Bom",
        "feedback": {
          "analise_dezembro": "Faturamento excelente (R$ 65.274) com bom equilíbrio de posts (10) e stories (131).",
          "foco_janeiro": "Manter a consistência e focar em fidelização.",
          "sugestao": "Carmen, você encontrou o equilíbrio ideal. Em janeiro, seu foco deve ser manter essa máquina rodando e pedir avaliações no Google Meu Negócio. Com esse volume de atendimentos, você pode dominar a busca local rapidamente. Incentive seus pacientes a deixarem depoimentos para atrair ainda mais demanda orgânica."
        }
      },
      "Jéssica Sales": {
        "dados": { "faturamento": 22554.0, "lucro": 0, "posts_feed": 7, "stories": 93, "leads": 43, "procedimentos": 10 },
        "score": 77.2,
        "detalhes": {
          "faturamento": { "realizado": 22554.0, "meta": 30000, "percentual": 75.2, "score": 30.1 },
          "posts_feed": { "realizado": 7, "esperado": 12, "percentual": 58.3, "score": 8.8 },
          "stories": { "realizado": 93, "esperado": 28, "percentual": 332.1, "score": 15 },
          "procedimentos": { "realizado": 10, "esperado": 15, "percentual": 66.7, "score": 13.3 },
          "leads": { "realizado": 43, "esperado": 20, "percentual": 215.0, "score": 10 }
        },
        "classificacao": "Bom",
        "feedback": {
          "analise_dezembro": "Bom faturamento (R$ 22.554) e stories consistentes (93), mas feed (7 posts) pode melhorar.",
          "foco_janeiro": "Acelerar para bater os 30k. Faltou pouco!",
          "sugestao": "Jéssica, os 30k estão logo ali! Em janeiro, a prospecção ativa será seu diferencial. Pegue sua lista de pacientes antigos e ofereça a avaliação estratégica. No conteúdo, foque em mostrar resultados (antes/depois com ética) para aumentar o desejo e facilitar o fechamento de planos maiores."
        }
      },
      "Iza Pionório": {
        "dados": { "faturamento": 11425.48, "lucro": 0, "posts_feed": 23, "stories": 137, "leads": 47, "procedimentos": 12 },
        "score": 71.2,
        "detalhes": {
          "faturamento": { "realizado": 11425.48, "meta": 30000, "percentual": 38.1, "score": 15.2 },
          "posts_feed": { "realizado": 23, "esperado": 12, "percentual": 191.7, "score": 15 },
          "stories": { "realizado": 137, "esperado": 28, "percentual": 489.3, "score": 15 },
          "procedimentos": { "realizado": 12, "esperado": 15, "percentual": 80.0, "score": 16.0 },
          "leads": { "realizado": 47, "esperado": 20, "percentual": 235.0, "score": 10 }
        },
        "classificacao": "Bom",
        "feedback": {
          "analise_dezembro": "Volume alto de posts (23) e stories (137), mas faturamento (R$ 11.425) não acompanhou o esforço.",
          "foco_janeiro": "Ajuste de oferta e público. Muito esforço, pouco resultado financeiro.",
          "sugestao": "Iza, sua dedicação é inquestionável. O problema pode estar na oferta ou no público. Em janeiro, vamos focar em qualidade, não quantidade. Reduza os posts se precisar, mas melhore a copy e a oferta. Use a prospecção ativa para buscar pacientes com perfil de compra imediata e ticket mais alto."
        }
      },
      "Élica": {
        "dados": { "faturamento": 20110.6, "lucro": 10159.48, "posts_feed": 3, "stories": 196, "leads": 12, "procedimentos": 5 },
        "score": 58.2,
        "detalhes": {
          "faturamento": { "realizado": 20110.6, "meta": 30000, "percentual": 67.0, "score": 26.8 },
          "posts_feed": { "realizado": 3, "esperado": 12, "percentual": 25.0, "score": 3.8 },
          "stories": { "realizado": 196, "esperado": 28, "percentual": 700.0, "score": 15 },
          "procedimentos": { "realizado": 5, "esperado": 15, "percentual": 33.3, "score": 6.7 },
          "leads": { "realizado": 12, "esperado": 20, "percentual": 60.0, "score": 6.0 }
        },
        "classificacao": "Regular",
        "feedback": {
          "analise_dezembro": "Stories altíssimos (196!), mas faturamento (R$ 20.110) e feed (3 posts) desequilibrados.",
          "foco_janeiro": "Converter a audiência dos stories em vendas diretas.",
          "sugestao": "Élica, você tem a atenção da sua audiência nos stories, agora cobre por isso! Em janeiro, seja mais direta nas ofertas. Menos 'bom dia' e mais 'agenda aberta'. Use a caixinha de perguntas para identificar dores e chame no direct para agendar. O feed precisa de atenção: 3 posts semanais para não depender só de quem já te segue."
        }
      },
      "Jayne": {
        "dados": { "faturamento": 4900.0, "lucro": 0, "posts_feed": 30, "stories": 57, "leads": 52, "procedimentos": 4 },
        "score": 51.9,
        "detalhes": {
          "faturamento": { "realizado": 4900.0, "meta": 30000, "percentual": 16.3, "score": 6.5 },
          "posts_feed": { "realizado": 30, "esperado": 12, "percentual": 250.0, "score": 15 },
          "stories": { "realizado": 57, "esperado": 28, "percentual": 203.6, "score": 15 },
          "procedimentos": { "realizado": 4, "esperado": 15, "percentual": 26.7, "score": 5.3 },
          "leads": { "realizado": 52, "esperado": 20, "percentual": 260.0, "score": 10 }
        },
        "classificacao": "Regular",
        "feedback": {
          "analise_dezembro": "Muitos posts (30), muitos leads (52), mas faturamento baixo (R$ 4.900). Problema de conversão.",
          "foco_janeiro": "Foco total em vendas e fechamento. O marketing está funcionando, a venda não.",
          "sugestao": "Jayne, você está atraindo as pessoas (52 leads!), mas não está fechando. Pare de focar apenas em atrair e foque em converter. Em janeiro, dedique-se a aprender a fechar vendas. Chame esses leads novamente, ofereça a avaliação estratégica e treine seu script de vendas. Seu ouro está nesses contatos não convertidos."
        }
      },
      "Tamara Dilma": {
        "dados": { "faturamento": 18278.0, "lucro": 3989.0, "posts_feed": 23, "stories": 0, "leads": 0, "procedimentos": 7 },
        "score": 48.7,
        "detalhes": {
          "faturamento": { "realizado": 18278.0, "meta": 30000, "percentual": 60.9, "score": 24.4 },
          "posts_feed": { "realizado": 23, "esperado": 12, "percentual": 191.7, "score": 15 },
          "stories": { "realizado": 0, "esperado": 28, "percentual": 0.0, "score": 0.0 },
          "procedimentos": { "realizado": 7, "esperado": 15, "percentual": 46.7, "score": 9.3 },
          "leads": { "realizado": 0, "esperado": 20, "percentual": 0.0, "score": 0.0 }
        },
        "classificacao": "Regular",
        "feedback": {
          "analise_dezembro": "Faturamento razoável (R$ 18.278) sustentado por posts (23), mas ZERO stories e leads.",
          "foco_janeiro": "Aparecer nos stories! É impossível escalar sem conexão pessoal.",
          "sugestao": "Tamara, seu feed garante o básico, mas a falta de stories (0) está deixando dinheiro na mesa. Em janeiro, a meta é simples: apareça nos stories todos os dias. Bastidores, café, dúvidas. As pessoas compram de pessoas. Comece devagar, mas comece. Isso vai destravar o próximo nível do seu faturamento."
        }
      }
    },
    "ranking": [
      ["Thais Olimpia", 96.0],
      ["Lana Máximo", 87.8],
      ["Kleber Oliveira", 87.5],
      ["Carmen", 77.5],
      ["Jéssica Sales", 77.2],
      ["Iza Pionório", 71.2],
      ["Élica", 58.2],
      ["Jayne", 51.9],
      ["Tamara Dilma", 48.7]
    ],
    "benchmarks": {
      "meta_faturamento": 30000,
      "posts_feed_min": 12,
      "stories_min": 28,
      "procedimentos_min": 15,
      "leads_min": 20
    }
  }
};
