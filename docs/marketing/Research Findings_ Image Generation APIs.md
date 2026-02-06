# Research Findings: Image Generation APIs

## Fontes
- **OpenAI Pricing**: https://openai.com/api/pricing/
- **Stability AI**: https://platform.stability.ai/
- **Replicate**: https://replicate.com/
- **Data**: 06/02/2026
- **Confiança**: 4/5

## Opções de APIs Disponíveis

### 1. OpenAI DALL-E

#### DALL-E 3 (Recomendado)
- **Qualidade Standard**:
  - 1024×1024: $0.04 por imagem
  - 1024×1792 ou 1792×1024: $0.08 por imagem
- **Qualidade HD**:
  - 1024×1024: $0.08 por imagem
  - 1024×1792 ou 1792×1024: $0.12 por imagem

#### DALL-E 2 (Mais barato)
- 256×256: $0.016 por imagem
- 512×512: $0.018 por imagem
- 1024×1024: $0.020 por imagem

#### Características
- ✅ Melhor qualidade fotorrealista
- ✅ Entende prompts complexos em português
- ✅ Integração simples via OpenAI API
- ✅ Geração rápida (segundos)
- ⚠️ Custo mais alto
- ⚠️ Rate limits por tier

### 2. Stability AI (Stable Diffusion)

#### Stable Image Ultra
- Modelo mais poderoso
- Fotorrealista de alta qualidade
- Estilos versáteis: 3D, fotografia, pintura, line art

#### Stable Image Core
- Modelo intermediário
- Boa qualidade/custo

#### Características
- ✅ Custo mais baixo que DALL-E
- ✅ Múltiplos modelos especializados
- ✅ Image-to-Image (modificar imagens existentes)
- ✅ Text-to-Image
- ✅ API REST simples
- ⚠️ Qualidade pode variar
- ⚠️ Prompts em inglês funcionam melhor

### 3. Replicate

#### Modelos Disponíveis
- SDXL (Stable Diffusion XL)
- Flux
- Midjourney (via proxies)
- Diversos modelos open-source

#### Características
- ✅ Pay-per-use flexível
- ✅ Múltiplos modelos para escolher
- ✅ Fine-tuning de modelos
- ✅ Treinamento personalizado
- ✅ API unificada
- ⚠️ Latência pode variar
- ⚠️ Precisa escolher modelo certo

## Integração com Secrets Existentes

### OpenAI (Já Configurado)
O NeonDash já tem `OPENAI_API_KEY` configurado nas variáveis de ambiente. Pode usar diretamente para DALL-E.

**Exemplo de uso:**
```python
from openai import OpenAI
client = OpenAI()

response = client.images.generate(
  model="dall-e-3",
  prompt="Clínica de estética moderna com ambiente clean e acolhedor",
  size="1024x1024",
  quality="standard",
  n=1,
)
image_url = response.data[0].url
```

### Gemini (Já Configurado)
O NeonDash tem `GEMINI_API_KEY`. Gemini 2.0 também suporta geração de imagens.

**Exemplo:**
```python
from google import genai
client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

response = client.models.generate_images(
    model='imagen-3.0-generate-001',
    prompt='Modern aesthetic clinic interior design',
    number_of_images=1,
)
```

## Recomendação para NeonDash Marketing

### Estratégia Híbrida

#### Para Posts de Marketing (Alta Qualidade)
- **Usar**: DALL-E 3 Standard
- **Custo**: ~$0.04 por imagem
- **Justificativa**: Melhor qualidade fotorrealista, entende português, ideal para posts profissionais

#### Para Testes e Variações (Volume)
- **Usar**: DALL-E 2 ou Stable Diffusion
- **Custo**: ~$0.02 por imagem
- **Justificativa**: Mais barato para gerar múltiplas variações

#### Para Personalização (Fine-tuning)
- **Usar**: Replicate com modelo treinado
- **Custo**: Variável
- **Justificativa**: Pode treinar com identidade visual da clínica

### Fluxo Sugerido

1. **Geração de Prompt**:
   - IA de Marketing gera descrição detalhada baseada em narrativa
   - Inclui estilo, cores, elementos visuais
   - Otimiza prompt para modelo escolhido

2. **Geração de Imagem**:
   - Chama API (DALL-E 3 ou Gemini)
   - Recebe URL temporária
   - Faz download da imagem

3. **Armazenamento**:
   - Upload para S3 ou storage próprio
   - Gera URL pública permanente
   - Salva metadados (prompt, modelo usado, custo)

4. **Pós-processamento** (Opcional):
   - Redimensionamento para Instagram (1080x1080, 1080x1350, 1080x1920)
   - Adicionar logo/marca d'água
   - Ajustes de cor/contraste

## Considerações de Custo

### Estimativa para Campanha Típica
- **1 campanha** = 7 posts (1 por dia da semana)
- **Cada post** = 2-3 variações de imagem para escolher
- **Total imagens**: 7 × 2.5 = ~18 imagens/campanha
- **Custo DALL-E 3**: 18 × $0.04 = **$0.72 por campanha**
- **Custo mensal** (4 campanhas): **~$3.00**

### Otimização de Custos
- Cachear imagens geradas
- Reutilizar elementos visuais
- Gerar em batch
- Usar modelos mais baratos para previews

## Limitações e Considerações

### Content Policy
- ⚠️ Não pode gerar imagens de pessoas reais específicas
- ⚠️ Não pode gerar conteúdo médico explícito
- ⚠️ Seguir políticas de uso de cada API

### Rate Limits
- OpenAI: Varia por tier (5-50 imagens/minuto)
- Stability AI: Varia por plano
- Replicate: Pay-per-use sem limite fixo

### Qualidade
- Prompts bem escritos = melhores resultados
- Pode precisar múltiplas tentativas
- Revisar e aprovar antes de publicar

## Próximos Passos
1. ✅ Instagram API - Completo
2. ✅ WhatsApp/Z-API - Completo
3. ✅ Image Generation APIs - Completo
4. ⏳ Elaborar PRP completo com atomic tasks
