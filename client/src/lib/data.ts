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
        "classificacao": "Excelente"
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
        "classificacao": "Excelente"
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
        "classificacao": "Excelente"
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
        "classificacao": "Excelente"
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
        "classificacao": "Regular"
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
        "classificacao": "Excelente"
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
        "classificacao": "Excelente"
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
        "classificacao": "Excelente"
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
        "classificacao": "Bom"
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
        "classificacao": "Bom"
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
        "classificacao": "Bom"
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
        "classificacao": "Regular"
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
        "classificacao": "Regular"
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
        "classificacao": "Regular"
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
