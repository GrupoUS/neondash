# Research Findings: Instagram Content Publishing API

## Fonte
- **URL**: https://developers.facebook.com/docs/instagram-platform/content-publishing/
- **Data**: 06/02/2026
- **Confiança**: 5/5 (Documentação oficial Meta)

## Principais Descobertas

### 1. Capacidades da API
- **Posts únicos**: Imagens (JPEG), vídeos
- **Reels**: Vídeos curtos com `media_type=REELS`
- **Stories**: Imagens/vídeos com `media_type=STORIES`
- **Carousels**: Até 10 imagens/vídeos em um único post

### 2. Limitações Críticas
- **Rate Limit**: 100 posts publicados via API por conta em período móvel de 24h
- **Formato**: Apenas JPEG para imagens (MPO e JPS não suportados)
- **Não suportado**: Shopping tags, branded content tags, filtros
- **Mídia**: Deve estar hospedada em servidor público acessível (Meta faz cURL)

### 3. Requisitos de Autenticação

#### Opção 1: Instagram API with Instagram Login
- **Access Level**: Advanced Access ou Standard Access
- **Token**: Instagram User access token
- **Permissions**: 
  - `instagram_business_basic`
  - `instagram_business_content_publish`
- **Host**: `graph.instagram.com`

#### Opção 2: Instagram API with Facebook Login (Recomendado)
- **Access Level**: Advanced Access ou Standard Access
- **Token**: Facebook Page access token
- **Permissions**:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`
  - Se via Business Manager: `ads_management`, `ads_read`
- **Host**: `graph.facebook.com` e `rupload.facebook.com` (upload de vídeos)

### 4. Fluxo de Publicação

#### Para Posts Simples (Imagem/Vídeo)
1. **Criar Container**: `POST /<IG_ID>/media`
   - Parâmetros: `image_url` ou `video_url`, `media_type`, `caption`, `access_token`
   - Retorna: `IG_CONTAINER_ID`

2. **Publicar**: `POST /<IG_ID>/media_publish`
   - Parâmetros: `creation_id` (o container ID)
   - Retorna: `IG_MEDIA_ID`

#### Para Carousels
1. Criar containers individuais para cada mídia com `is_carousel_item=true`
2. Criar carousel container: `POST /<IG_ID>/media` com `media_type=CAROUSEL` e `children` (lista de IDs)
3. Publicar o carousel container

#### Para Vídeos Grandes (Resumable Upload)
1. Criar container com `upload_type=resumable`
2. Upload: `POST https://rupload.facebook.com/ig-api-upload/<IG_MEDIA_CONTAINER_ID>`
3. Verificar status: `GET /<IG_CONTAINER_ID>?fields=status_code`
4. Publicar quando pronto

### 5. Endpoints Principais
- `/<IG_ID>/media` - Criar container
- `/<IG_ID>/media_publish` - Publicar
- `/<IG_CONTAINER_ID>?fields=status_code` - Verificar status
- `/<IG_ID>/content_publishing_limit` - Verificar rate limit atual

### 6. Page Publishing Authorization (PPA)
- Contas conectadas a Pages que requerem PPA não podem publicar até completar PPA
- Recomendação: Avisar usuários para completar PPA preventivamente

### 7. Trial Reels
- Reels compartilhados apenas com não-seguidores
- Estratégias de graduação: MANUAL ou AUTO (baseado em métricas)
- Parâmetro: `trial_params` com `graduation_strategy`

## Integração Existente no NeonDash

### Componentes Encontrados
- **InstagramConnectionCard.tsx**: Gerencia OAuth com Facebook SDK
- **MarketingAgentSettingsCard.tsx**: Configuração de prompt IA para marketing
- **instagramRouter.ts**: Rotas backend para Instagram
- **instagramService.ts**: Serviço de sincronização de métricas

### Funcionalidades Atuais
- ✅ Conexão OAuth via Facebook Login
- ✅ Sincronização de métricas (posts, stories)
- ✅ Configuração de agente IA de marketing
- ❌ **NÃO IMPLEMENTADO**: Publicação de conteúdo via API

## Gaps Identificados

### Para Implementar Página de Marketing
1. **Publicação de Conteúdo**: Implementar fluxo completo de criação e publicação
2. **Geração de Imagens**: Integrar IA para criar imagens de posts
3. **Geração de Textos**: Usar IA configurada para criar captions e narrativas
4. **Agendamento**: Sistema de scheduling para posts futuros
5. **Preview**: Visualização de como ficará o post antes de publicar
6. **Análise de Perfil**: Analisar posts existentes para sugerir conteúdo
7. **Templates de Campanha**: Bibliotecas de templates para clínicas estéticas
8. **Monitoramento**: Dashboard de performance das campanhas

## Considerações Técnicas

### Rate Limiting
- Implementar controle local de rate limit (100 posts/24h)
- Usar endpoint `content_publishing_limit` para verificar antes de publicar
- Queue system para agendamento respeitando limites

### Armazenamento de Mídia
- Necessário servidor público para hospedar imagens/vídeos
- Opções: S3, CDN, servidor próprio
- Meta faz cURL na URL fornecida

### Error Handling
- Verificar `status_code` do container antes de publicar
- Implementar retry logic para falhas de upload
- Validar formato de imagem (apenas JPEG)

## Próximos Passos de Pesquisa
1. ✅ Instagram Graph API - Completo
2. ⏳ WhatsApp Business API para campanhas
3. ⏳ APIs de geração de imagem (DALL-E, Midjourney, Stable Diffusion)
4. ⏳ Best practices de UI/UX para dashboards de marketing
