import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Download, Loader2, RefreshCw, Code, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const APP_STRUCTURE = `
## ESTRUTURA DO APLICATIVO: Vagas Abertas PB

### IDENTIDADE VISUAL
- **Nome:** Vagas Abertas PB — Empregos na Paraíba
- **CNPJ:** 62.874.724/0001-11
- **Criador:** Alexandre Ferreira
- **Contato:** contato@vagasabertaspb.com.br | (83) 99197-1320
- **WhatsApp:** https://wa.me/5583991971320

### PALETA DE CORES
- **Primária:** #1D4371 (azul escuro — botões principais, header nav, links)
- **Primária escura:** #0F2744 (hover de botões primários)
- **Primária média:** #2B5A8F (subtítulos, links secundários)
- **Header/Footer:** #1D2226 (quase preto) → #383E45 (gradiente)
- **Fundo:** #F3F2EF (bege claro — fundo do app)
- **Dark mode fundo:** #0f172a (slate-900)
- **Dark mode cards:** #1e293b (slate-800)
- **Sucesso:** #057642 (verde)
- **Alerta:** #F9C846 (amarelo)
- **Erro:** #C30000 (vermelho)
- **Texto principal:** #1D2226 (quase preto)
- **Texto secundário:** #718096 (slate-500)
- **Borda:** #E2E8F0 (slate-200)

### TIPOGRAFIA
- **Família:** Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Tamanhos:** xs(10-12px), sm(13-14px), base(15-16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px)
- **Pesos:** normal(400), medium(500), semibold(600), bold(700)
- **Font smoothing:** antialiased

### FRAMEWORK E TECNOLOGIAS
- **Frontend:** React 18, Tailwind CSS, TypeScript/JSX
- **Plataforma:** Base44 (BaaS — Backend as a Service)
- **Banco de dados:** Base44 Entities (NoSQL)
- **Autenticação:** Base44 Auth (email/senha, Google, Microsoft, Facebook)
- **Animações:** Framer Motion
- **Ícones:** Lucide React
- **Componentes UI:** shadcn/ui + Radix UI
- **Roteamento:** React Router DOM v6
- **Queries:** TanStack React Query v5
- **Datas:** date-fns, moment
- **Gráficos:** Recharts
- **Mapas:** React Leaflet
- **PDF:** jsPDF
- **Excel:** xlsx
- **Editor de texto:** React Quill
- **Drag & Drop:** @hello-pangea/dnd
- **Notificações toast:** Sonner

### ESTRUTURA DE PÁGINAS
**Páginas Públicas:**
- Home — Feed principal com vagas em destaque, notícias e comunidade
- Jobs — Lista e filtro de vagas de emprego
- JobDetail — Detalhe de vaga individual
- News / NewsDetail — Notícias do mercado de trabalho
- Blog / BlogDetail — Blog com artigos
- Feed — Rede social / comunidade
- Groups — Grupos de WhatsApp, Telegram e Facebook
- Subscription — Planos e preços
- Profile — Perfil do usuário
- Splash — Tela de login/cadastro
- PreLander — Pré-landing page monetizada

**Ferramentas do Usuário:**
- Favoritos — Vagas salvas
- Historico — Vagas visualizadas
- ProfessionalResume — Gerador e banco de currículos
- Utilidades — Ferramentas de carreira (currículo, carta, checklist, DISC, portfólio)
- RecruiterArea — Painel exclusivo para recrutadores
- Mensagens — Suporte e chat com admin
- Notifications — Central de notificações

**Páginas Administrativas:**
- Configuracoes — Menu central de configurações
- GerenciarVagas — Central de gerenciamento de vagas
- GerenciarUsuarios — Gerenciar usuários e planos
- GerenciarNoticias / PostarNoticia — CRUD de notícias
- GerenciarBlog — CRUD do blog
- GerenciarGrupos — CRUD de grupos (WhatsApp, Telegram, Facebook)
- GerenciarPopups — Popups e avisos no app
- GerenciarAnuncios — Configurar anúncios AdsTerra
- GerenciarPrecos — Preços dos planos
- GerenciarPlanos — Planos e assinaturas
- GerenciarAPIKeys — Chaves de API e secrets
- GerenciarLinksEspeciais — Links que ativam planos automaticamente
- GerenciarAcessos — Links de ativação únicos
- GerenciarCores — Personalizar paleta de cores
- GerenciarFuncoes — Habilitar/desabilitar funções
- GerenciarComunidade — Moderar feed e chat
- GerenciarSolicitacoes — Aprovar conteúdos de recrutadores
- N8NConfig — Configuração da integração N8N
- Pendencias — Vagas sem contato para revisão
- VagasPendentes — Vagas aguardando publicação
- PostManual — Revisar vagas recebidas do N8N
- PostManualTexto — Postar vaga colando texto (extração automática)
- PostsEmMassa — Upload de imagens com extração via IA
- PostsEmMassaTXT — Upload de TXT/DOC/PDF com extração via IA
- PostarVaga — Formulário completo para postar vaga
- VagasHomeOffice — Vagas remotas
- VagasPorIA — Gerar vagas com IA
- VagasPendentesIA — Revisar vagas geradas por IA
- ControleFinanceiro — Assinaturas, ciclos e receitas
- DashboardFinanceiro — Dashboard financeiro com gráficos
- Extrato — Extrato e lançamentos financeiros
- AnalyticsPage — Analytics de uso do app
- BibliotecaAdmin — Gerenciar biblioteca de materiais
- GerenciadorFiltros — Gerenciar filtros de busca de vagas
- CentralPromocoes — Campanhas de email e WhatsApp
- EnviarParaTodos — Notificações, Push e Email em massa
- NotificacoesAdmin — Configurar notificações do sininho
- Permissoes — Controle de permissões de acesso
- Ocorrencias — Registro de ocorrências
- ResponderChat — Responder suporte
- SuporteAdmin — Painel de suporte admin
- GerenciarPreLander — Configurar pre-lander monetizado
- ApagarVagasPorPeriodo — Apagar vagas por período
- ExcluirVagasSemContato — Excluir vagas sem contato
- ListaTransmissao — Listas de transmissão WhatsApp
- BancoDadosAssistente — Assistente de banco de dados
- Agentes — Agentes de IA
- ChatIA — Chat com IA

### ENTIDADES (BANCO DE DADOS)
- **Job** — Vagas de emprego (título, empresa, cidade, UF, bairro, CEP, salário, tipo, modalidade, categoria, descrição, contato, status, destaque, premium, datas, geolocalização, validação, origem)
- **User** — Usuários (email, nome, role, subscription_type, permissions, plano_expira_em, etc.)
- **Notification** — Notificações (título, mensagem, tipo, referência, lida, destinatário)
- **News** — Notícias (título, subtítulo, categoria, blocos de conteúdo, autor, destaque, views, status)
- **BlogPost** — Posts do blog (título, slug, subtítulo, conteúdo HTML, capa, categoria, tags, autor, status, destaque, views, likes, tempo leitura)
- **BlogComment** — Comentários do blog
- **FeedPost** — Posts da rede social (texto, imagem, autor, likes, comentários)
- **FeedComentario** — Comentários do feed
- **FeedSalvo** — Posts salvos do feed
- **Group** — Grupos (nome, tipo: whatsapp/whatsapp_channel/telegram/facebook, link, descrição, ativo, ordem)
- **AppPopup** — Popups e avisos (título, mensagem, ícone, tipo, frequência, ativo, datas, botões)
- **AppVisit** — Rastreamento de visitas (página, IP, cidade, dispositivo, sessão)
- **JobView** — Visualizações de vagas (job_id, visitor_id, IP, dispositivo, referrer)
- **FavoriteJob** — Vagas favoritas por usuário
- **ViewHistory** — Histórico de vagas visualizadas
- **PushSubscription** — Inscrições para push notifications
- **FilaNotificacao** — Fila de envio de notificações por email
- **Payment** — Pagamentos (usuário, valor, status, método, external_id)
- **Subscription** — Assinaturas ativas
- **Plan** — Planos disponíveis
- **PremiumCode** — Códigos de acesso premium (único, múltiplo uso, com expiração)
- **AccessLink** — Links de ativação únicos
- **SpecialLink** — Links especiais que ativam planos
- **PreLanderConfig** — Configuração da pre-lander (link, título, subtítulo, botão)
- **Affiliate** — Afiliados (código, comissão, conversões, ganhos)
- **ProfessionalResume** — Currículos profissionais
- **City** — Cidades cadastradas (nome, UF)
- **ProfessionalCategory** — Categorias profissionais
- **FilterMaster** / **FilterAuditLog** — Filtros de busca de vagas e auditoria
- **JobInteraction** — Interações com vagas
- **RecruiterRequest** — Solicitações de recrutadores
- **MaterialBiblioteca** — Materiais da biblioteca
- **MensagemDireta** — Mensagens diretas entre usuários
- **SupportChat** — Chat de suporte
- **BroadcastList** / **BroadcastMessage** — Listas e mensagens de transmissão
- **ScheduledPost** — Posts agendados
- **Report** — Denúncias de conteúdo
- **Occurrence** — Ocorrências registradas
- **UserSession** / **UserActivity** — Sessões e atividades de usuário
- **SecurityLog** — Logs de segurança
- **ChatHistory** — Histórico de chat com IA
- **NotificationTemplate** / **PromoTemplate** / **PromoSchedule** — Templates e agendamentos de promoções
- **FinancialHistory** / **ManualEntry** — Histórico financeiro e lançamentos manuais
- **AppTheme** — Tema da aplicação
- **CurriculoUsuario** / **CartaUsuario** / **PortfolioUsuario** / **ChecklistUsuario** / **PerfilDISC** — Ferramentas de carreira do usuário

### FUNÇÕES BACKEND (Deno Deploy)
- **authManual** — Login manual por email/senha
- **registerUser** — Cadastro de usuário
- **handleGoogleLogin** — Login com Google
- **auth** — Verificação de autenticação
- **verifyEmail** — Verificar email
- **forgotPassword / resetPassword / changePassword** — Recuperação de senha
- **updateProfile** — Atualizar perfil
- **deleteUserAccount** — Deletar conta
- **receberVagaN8N** — Receber vagas do N8N automaticamente
- **processJobPosting** — Processar postagem de vaga
- **publishJob** — Publicar vaga
- **expireJobListings** — Expirar vagas vencidas (automatizado)
- **deleteOldJobs** — Deletar vagas antigas
- **bulkJobActions** — Ações em massa nas vagas
- **geocodeJobAuto / geocodeJobs / geocodeSystem** — Geolocalização de vagas
- **updateJobsLocation** — Atualizar localização de vagas
- **reprocessJobsLocation** — Reprocessar localização
- **reprocessContactExtraction** — Reprocessar extração de contato
- **classifyJobCategory** — Classificar categoria de vaga com IA
- **filters / filtersBulkCommit / initializeFilters** — Gerenciar filtros de busca
- **mapManagement** — Gerenciar mapa de vagas
- **notifyNewJob** — Notificar nova vaga publicada
- **notifyNewUser** — Notificar novo cadastro
- **notifyAdmins** — Notificar administradores
- **notifyJobExpiringIn24h** — Notificar vagas expirando em 24h
- **processarFilaNotificacao** — Processar fila de notificações por email
- **sendNotifications** — Enviar notificações
- **sendPushNotification / pushSend / pushSubscribe / subscribePush** — Push notifications
- **sendWhatsAppNotification** — Notificação via WhatsApp (Z-API)
- **autoPostN8N / autoPostN8NHomeOffice / autoPostN8NText / autoPostN8NImage / autoPostZAPI** — Posts automáticos via N8N
- **sendMessage** — Enviar mensagem de chat
- **sendToAllUsers** — Enviar mensagem em massa
- **sendPromoNow / sendScheduledPromos** — Promoções imediatas e agendadas
- **createReportMessage** — Criar denúncia
- **createSecurityLog** — Registrar log de segurança
- **createDefaultTemplates** — Criar templates padrão
- **updateSubscriptionStatus** — Atualizar status de assinatura
- **calculateSubscriptionExpiry** — Calcular expiração de assinatura
- **checkExpiredSubscriptions** — Verificar assinaturas expiradas (automatizado)
- **processSpecialLink** — Processar link especial de ativação
- **migrateNotifications** — Migrar notificações antigas
- **migrateUsersToFinancial** — Migrar usuários para histórico financeiro
- **fixFinancialHistoryAmounts** — Corrigir valores do histórico financeiro
- **populateStatesAndCities / populateProfessionalCategories** — Popular dados iniciais
- **deleteJobsWithoutContact** — Excluir vagas sem contato
- **chatN8NAssistant** — Assistente de chat com N8N
- **filters** — Gerenciar filtros
- **recentJobsBatch** — Vagas recentes em lote

### AGENTES DE IA
- **assistente_publico** — Assistente público para usuários (acesso ao WhatsApp)

### AUTOMAÇÕES
- Expiração automática de vagas (agendada)
- Expiração de assinaturas (agendada)
- Fila de notificações por email (agendada)
- Notificações de vagas expirando em 24h (agendada)

### INTEGRAÇÕES EXTERNAS
- **Z-API** (ZAPI_API_KEY) — Envio de mensagens WhatsApp
- **N8N** (API_KEY_N8N, API_KEY_N8N_VagasPB) — Automação de posts de vagas
- **AdsTerra** — Publicidade (PopUnder, Social Bar, Banner 728x90, 320x50, 300x250)
- **Base44 InvokeLLM** — IA para extração e geração de vagas, análise de imagens
- **Base44 SendEmail** — Envio de emails transacionais
- **Base44 UploadFile** — Upload de imagens e arquivos
- **Base44 GenerateImage** — Geração de imagens com IA
- **Push Notifications** (Web Push API) — Notificações push para usuários

### PLANOS DE ASSINATURA
- **Visitante** — Acesso limitado, sem login
- **Básico** — Acesso a vagas padrão, gratuito após cadastro
- **Premium** — Vagas exclusivas, ferramentas de carreira completas
- **Recruiter** — Painel de recrutador, currículos, solicitações
- **Admin** — Acesso administrativo completo
- **Dono** — Acesso total (proprietário do app)

### LAYOUT E NAVEGAÇÃO
- **Header fixo** (z-index 9999): Logo, nav desktop, notificações, botões admin, tema dark/light
- **Bottom nav mobile** (z-index 9998): 5 itens — Início, Vagas, Notícias, Blog, Feed
- **Páginas sem layout:** Splash, Login, Register, PreLander
- **Transições de página:** Framer Motion (opacity + translateX, 200ms ease-in-out)
- **Dark mode:** Toggle manual, salvo em localStorage, aplica classe 'dark' no documentElement
- **Safe area iOS:** env(safe-area-inset-*)

### COMPONENTES PRINCIPAIS
- **Layout.js** — Header, footer, bottom nav, dark mode, popups, push, service worker, route guard
- **FloatingButtons** — Botões flutuantes de ação
- **NotificationBell** — Sininho de notificações com contador
- **PopupManager** — Gerenciador de popups automáticos
- **PushManager** — Gerenciador de push notifications
- **ServiceWorkerManager** — Registro do service worker
- **WelcomePopup** — Popup de boas-vindas
- **CookieConsent** — Consentimento de cookies (LGPD)
- **RouteGuard** — Proteção de rotas autenticadas
- **ErrorBoundary** — Captura de erros de componentes
- **BannerAd / PopunderAd / SocialBarAd** — Componentes de anúncios AdsTerra
- **FeaturedJobsCarousel** — Carrossel de vagas em destaque
- **LatestJobsToday** — Vagas do dia
- **ApplyModal** — Modal de candidatura
- **FavoriteButton** — Botão de favoritar vaga
- **ShareJobDialog** — Compartilhar vaga
- **ReportJobModal** — Denunciar vaga
- **PremiumModal / ModernCheckoutModal** — Modais de assinatura
- **AssistantChat / UniversalChat / FloatingChatButton** — Chat com IA
- **SupportButton** — Botão de suporte
- **BlogEditor** — Editor de blog com ReactQuill
- **ImageUploadButton** — Upload de imagem para blog

### ESTILOS DE BOTÕES
- **Primário:** bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl
- **Ghost:** hover:bg-accent text-slate-700
- **Outline:** border border-input bg-white hover:bg-accent
- **Destrutivo:** bg-destructive text-white
- **Tamanho padrão:** h-11 px-4 py-2
- **Tamanho sm:** h-10 px-3 text-xs
- **Tamanho lg:** h-12 px-8
- **Icone:** h-11 w-11
- **Raio:** rounded-xl (12px) ou rounded-2xl (16px)
- **Escala ao clicar:** active:scale-[0.97]

### ESTILOS DE CARDS
- **Card padrão:** bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100
- **Card destaque:** bg-white rounded-xl shadow-lg
- **Hover:** hover:shadow-lg transition-all duration-300

### FORMULÁRIOS
- **Inputs:** h-11 rounded-xl border-slate-200 text-base (16px para evitar zoom iOS)
- **Labels:** text-sm font-medium text-slate-700
- **Select:** Shadcn Select com Radix UI
- **Textarea:** resize-none, rounded-xl

### SEGURANÇA E PERMISSÕES
- **RLS (Row Level Security)** configurado por entidade
- **Roles:** admin, user, recruiter + subscription_type (basic, premium, admin, dono, recruiter)
- **Route Guard:** Componente protege páginas que exigem autenticação
- **Admin único:** alexandreferreirajp01@gmail.com sempre tem acesso total
- **Permissões granulares:** objeto user.permissions controla acesso a funções específicas

### SEO E PWA
- **PWA:** Service Worker registrado, manifest configurado
- **Meta tags:** theme-color, viewport, lang=pt-BR
- **Anti-tradução:** translate="no", lang="pt-BR", MutationObserver bloqueia Google Translate
- **Favicon e ícones:** configurados no index.html
- **Open Graph:** meta tags para compartilhamento social
`;

export default function DocumentacaoApp() {
  const [generating, setGenerating] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [activeTab, setActiveTab] = useState('doc'); // 'doc' | 'prompt'

  const generateWithAI = async (type) => {
    setGenerating(true);
    try {
      if (type === 'doc') {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em documentação técnica de software. Com base na estrutura abaixo do aplicativo "Vagas Abertas PB", gere uma DOCUMENTAÇÃO TÉCNICA COMPLETA E DETALHADA em português brasileiro.

A documentação deve conter:
1. Visão Geral do Projeto
2. Arquitetura e Stack Tecnológica (com versões quando disponível)
3. Identidade Visual (paleta de cores com hex, tipografia, estilos)
4. Estrutura de Páginas (com descrição de cada uma)
5. Banco de Dados — todas as entidades com seus campos e relacionamentos
6. Funções Backend — todas com descrição do que fazem
7. Integrações Externas (com como são usadas)
8. Planos e Controle de Acesso
9. Automações e Jobs agendados
10. Layout e Navegação
11. Componentes-chave
12. Segurança e RLS
13. PWA e SEO
14. Fluxos principais (cadastro, publicar vaga, assinar plano, etc.)

ESTRUTURA DO APP:
${APP_STRUCTURE}

Seja extremamente detalhado, preciso e técnico. Use Markdown com títulos, subtítulos, tabelas e listas.`,
        });
        setDocContent(res);
        setActiveTab('doc');
      } else {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em criação de aplicações Base44. Com base na estrutura abaixo do aplicativo "Vagas Abertas PB", gere um PROMPT COMPLETO E DETALHADO que poderia ser usado para RECRIAR ESTE APLICATIVO EXATAMENTE COMO ELE ESTÁ HOJE.

O prompt deve:
1. Descrever o aplicativo completo do zero
2. Listar TODAS as páginas necessárias com suas funcionalidades
3. Descrever TODAS as entidades (banco de dados) com campos, tipos e RLS
4. Descrever TODAS as funções backend necessárias
5. Especificar identidade visual completa (cores exatas, tipografia, estilos)
6. Descrever o layout (header, footer, nav mobile, dark mode)
7. Descrever integrações necessárias
8. Descrever planos e permissões
9. Descrever automações
10. Incluir instruções para configurar cada componente

O prompt deve ser escrito em português e ser tão detalhado que qualquer pessoa poderia recriar o app usando APENAS esse prompt no Base44. Use linguagem de instrução direta, como se estivesse instruindo a IA a construir o app.

ESTRUTURA DO APP:
${APP_STRUCTURE}

Gere o prompt mais completo, preciso e acionável possível.`,
        });
        setPromptContent(res);
        setActiveTab('prompt');
      }
      toast.success('Documento gerado com sucesso!');
    } catch (e) {
      toast.error('Erro ao gerar: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadTxt = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadWord = (content, filename) => {
    // Word-compatible HTML
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${filename}</title>
<style>
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1D2226; line-height: 1.6; margin: 2cm; }
  h1 { font-size: 20pt; color: #1D4371; border-bottom: 2px solid #1D4371; padding-bottom: 6px; }
  h2 { font-size: 15pt; color: #1D4371; margin-top: 18pt; }
  h3 { font-size: 13pt; color: #2B5A8F; margin-top: 12pt; }
  h4 { font-size: 11pt; color: #383E45; }
  code, pre { font-family: Consolas, monospace; background: #F3F2EF; padding: 2px 5px; border-radius: 3px; font-size: 9pt; }
  pre { display: block; padding: 8pt; margin: 6pt 0; white-space: pre-wrap; }
  strong, b { color: #1D2226; }
  ul, ol { margin-left: 1cm; }
  li { margin-bottom: 3pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #E2E8F0; padding: 4pt 8pt; font-size: 10pt; }
  th { background: #1D4371; color: white; }
  hr { border: 1px solid #E2E8F0; margin: 12pt 0; }
  blockquote { border-left: 4px solid #1D4371; margin-left: 1cm; padding-left: 8pt; color: #718096; }
</style>
</head><body>
${content
  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
  .replace(/^### (.+)$/gm, '<h3>$3</h3>'.replace('$3','$1'))
  .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')
  .replace(/^- (.+)$/gm, '<li>$1</li>')
  .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^(?!<[h|l|p])/gm, '')
}
</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (content, filename) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const lines = content.split('\n');
      let y = 20;
      const pageH = 280;
      const margin = 15;
      const maxW = 180;

      doc.setFont('helvetica');

      for (const line of lines) {
        if (y > pageH) { doc.addPage(); y = 20; }

        if (line.startsWith('# ')) {
          doc.setFontSize(18); doc.setTextColor(29, 67, 113); doc.setFont('helvetica', 'bold');
          const wrapped = doc.splitTextToSize(line.replace('# ', ''), maxW);
          doc.text(wrapped, margin, y); y += wrapped.length * 8 + 4;
        } else if (line.startsWith('## ')) {
          doc.setFontSize(14); doc.setTextColor(29, 67, 113); doc.setFont('helvetica', 'bold');
          const wrapped = doc.splitTextToSize(line.replace('## ', ''), maxW);
          doc.text(wrapped, margin, y); y += wrapped.length * 7 + 3;
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12); doc.setTextColor(43, 90, 143); doc.setFont('helvetica', 'bold');
          const wrapped = doc.splitTextToSize(line.replace('### ', ''), maxW);
          doc.text(wrapped, margin, y); y += wrapped.length * 6 + 2;
        } else if (line.startsWith('- ') || line.match(/^\d+\. /)) {
          doc.setFontSize(9); doc.setTextColor(29, 34, 38); doc.setFont('helvetica', 'normal');
          const text = line.replace(/^- /, '• ').replace(/^(\d+)\. /, '$1. ').replace(/\*\*(.+?)\*\*/g, '$1');
          const wrapped = doc.splitTextToSize(text, maxW - 5);
          doc.text(wrapped, margin + 3, y); y += wrapped.length * 5 + 1;
        } else if (line.trim() === '' || line.startsWith('---')) {
          y += 3;
        } else if (line.trim()) {
          doc.setFontSize(9); doc.setTextColor(29, 34, 38); doc.setFont('helvetica', 'normal');
          const text = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1');
          const wrapped = doc.splitTextToSize(text, maxW);
          doc.text(wrapped, margin, y); y += wrapped.length * 5 + 1;
        }
      }

      doc.save(filename);
    } catch (e) {
      toast.error('Erro ao gerar PDF: ' + e.message);
    }
  };

  const currentContent = activeTab === 'doc' ? docContent : promptContent;
  const docDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Configurações
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Documentação do Aplicativo</h1>
              <p className="text-white/60 text-xs mt-0.5">Documentação técnica completa e prompt de recriação — atualizado em {docDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('doc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'doc' ? 'bg-[#1D4371] text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}
          >
            <FileText className="w-4 h-4" /> Documentação Técnica
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'prompt' ? 'bg-[#1D4371] text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}
          >
            <Code className="w-4 h-4" /> Prompt de Recriação
          </button>
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">
                  {activeTab === 'doc' ? '📄 Documentação Técnica Completa' : '🤖 Prompt de Recriação do App'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTab === 'doc'
                    ? 'Gerada via IA com base na estrutura atual do app — inclui cores, fontes, entidades, funções, fluxos e mais'
                    : 'Prompt detalhado para recriar o app do zero como está hoje'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => generateWithAI(activeTab === 'doc' ? 'doc' : 'prompt')}
                  disabled={generating}
                  className="gap-2 bg-[#1D4371] hover:bg-[#0F2744]"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {currentContent ? 'Regerar' : 'Gerar Agora'}
                </Button>
                {currentContent && (
                  <>
                    <Button variant="outline" className="gap-2" onClick={() => downloadTxt(currentContent, activeTab === 'doc' ? `documentacao_vagas_pb_${docDate.replace(/\//g,'-')}.txt` : `prompt_recriacao_vagas_pb_${docDate.replace(/\//g,'-')}.txt`)}>
                      <Download className="w-4 h-4" /> TXT
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => downloadWord(currentContent, activeTab === 'doc' ? `documentacao_vagas_pb_${docDate.replace(/\//g,'-')}.doc` : `prompt_recriacao_vagas_pb_${docDate.replace(/\//g,'-')}.doc`)}>
                      <Download className="w-4 h-4" /> Word (.doc)
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => downloadPDF(currentContent, activeTab === 'doc' ? `documentacao_vagas_pb_${docDate.replace(/\//g,'-')}.pdf` : `prompt_recriacao_vagas_pb_${docDate.replace(/\//g,'-')}.pdf`)}>
                      <Download className="w-4 h-4" /> PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Preview */}
        {!currentContent && !generating && (
          <Card>
            <CardContent className="p-12 text-center">
              {activeTab === 'doc' ? <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" /> : <Code className="w-16 h-16 text-slate-300 mx-auto mb-4" />}
              <p className="text-slate-500 text-sm">
                {activeTab === 'doc'
                  ? 'Clique em "Gerar Agora" para criar a documentação técnica completa do aplicativo via IA'
                  : 'Clique em "Gerar Agora" para criar o prompt completo de recriação do app'}
              </p>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#1D4371] animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">Gerando documento com IA...</p>
              <p className="text-slate-400 text-sm mt-1">Isso pode levar alguns segundos</p>
            </CardContent>
          </Card>
        )}

        {currentContent && !generating && (
          <Card>
            <CardContent className="p-4">
              <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed max-h-[70vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                {currentContent}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}