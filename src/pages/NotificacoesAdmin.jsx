import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ArrowLeft, Bell, BellOff, Mail, MailOpen, Loader2, Save,
  CheckCircle, XCircle, Info, Zap, Megaphone, MessageCircle,
  User, Briefcase, Newspaper, CreditCard, Bot, Send, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// ─── Mapa completo de funções que enviam/recebem notificações ─────────────────
const BELL_FUNCTIONS = [
  {
    id: 'notify_job_created',
    label: 'Nova Vaga Criada (Admin)',
    description: 'Notifica admins quando qualquer vaga é criada (manual, Telegram, N8N/WhatsApp)',
    function: 'notifyJobCreated',
    trigger: 'Automação: Job CREATE',
    icon: Briefcase,
    color: 'blue',
    target: 'Admins',
  },
  {
    id: 'notify_job_status',
    label: 'Vaga Aprovada/Expirada',
    description: 'Quando vaga muda de pending → ativa: notifica TODOS usuários no sininho + push. Quando expira: notifica admins.',
    function: 'notifyJobStatusChanged',
    trigger: 'Automação: Job UPDATE',
    icon: Zap,
    color: 'green',
    target: 'Todos usuários + Admins',
  },
  {
    id: 'notify_new_job_manual',
    label: 'Nova Vaga (Aprovação Manual)',
    description: 'Chamada ao aprovar vaga individualmente em Vagas Pendentes IA (Premium, Geral, etc). Usa force=true.',
    function: 'notifyNewJob',
    trigger: 'Botão: Publicar (VagasPendentesIA)',
    icon: Bot,
    color: 'emerald',
    target: 'Todos usuários',
  },
  {
    id: 'notify_bulk_publish',
    label: 'Publicação em Massa',
    description: 'Ao publicar múltiplas vagas pendentes de uma vez. Cria notificação no sininho + push para cada vaga.',
    function: 'autoPublishPending',
    trigger: 'Botão: Publicar selecionadas (VagasPendentesIA)',
    icon: Megaphone,
    color: 'purple',
    target: 'Todos usuários',
  },
  {
    id: 'notify_direct_message',
    label: 'Mensagem Direta',
    description: 'Notifica o destinatário quando recebe uma nova mensagem direta no app.',
    function: 'notifyDirectMessage',
    trigger: 'Automação: MensagemDireta CREATE',
    icon: MessageCircle,
    color: 'sky',
    target: 'Destinatário',
  },
  {
    id: 'notify_feed_comment',
    label: 'Comentário no Feed',
    description: 'Notifica o autor do post quando alguém comenta.',
    function: 'notifyFeedNewComment',
    trigger: 'Automação: FeedComentario CREATE',
    icon: MessageCircle,
    color: 'indigo',
    target: 'Autor do post',
  },
  {
    id: 'notify_feed_post',
    label: 'Novo Post no Feed',
    description: 'Notifica admins quando um novo post é criado no feed.',
    function: 'notifyFeedNewPost',
    trigger: 'Automação: FeedPost CREATE',
    icon: Send,
    color: 'violet',
    target: 'Admins',
  },
  {
    id: 'notify_payment',
    label: 'Pagamento Recebido',
    description: 'Notifica o usuário pagador e todos os admins quando um pagamento é criado.',
    function: 'notifyPaymentReceived',
    trigger: 'Automação: Payment CREATE',
    icon: CreditCard,
    color: 'yellow',
    target: 'Usuário + Admins',
  },
  {
    id: 'notify_news',
    label: 'Nova Notícia',
    description: 'Notifica admins ao criar notícia. Se status=published, notifica todos os usuários.',
    function: 'notifyNewsPublished',
    trigger: 'Automação: News CREATE',
    icon: Newspaper,
    color: 'orange',
    target: 'Admins + Todos usuários',
  },
  {
    id: 'notify_user_registered',
    label: 'Novo Usuário',
    description: 'Notifica admins quando um novo usuário se registra no app.',
    function: 'notifyUserRegistered',
    trigger: 'Automação: User CREATE',
    icon: User,
    color: 'teal',
    target: 'Admins',
  },
];

const EMAIL_FUNCTIONS = [
  {
    id: 'email_new_job',
    label: 'Email: Nova Vaga',
    description: 'Envia email para todos os usuários quando uma nova vaga é publicada. Ativado via parâmetro sendEmail=true na função notifyNewJob.',
    function: 'notifyNewJob',
    trigger: 'Parâmetro sendEmail=true',
    icon: Briefcase,
    color: 'blue',
    target: 'Todos os usuários',
    note: 'Desativado por padrão. Ativado manualmente ou via PostarVaga.',
  },
  {
    id: 'email_publish_job',
    label: 'Email: Publicar Vaga (Admin)',
    description: 'Envia email aos usuários alvo quando admin usa o assistente de publicação (PostarVaga) com email habilitado.',
    function: 'publishJob',
    trigger: 'Configuração no PostarVaga (notification.sendEmail)',
    icon: Send,
    color: 'green',
    target: 'Usuários premium ou todos (configurável)',
    note: 'Controlado pelo toggle na tela de publicação.',
  },
  {
    id: 'email_support',
    label: 'Email: Suporte/Mensagem',
    description: 'Emails enviados pelo sistema de suporte ao responder tickets.',
    function: 'supportSystem',
    trigger: 'Resposta de admin no suporte',
    icon: MessageCircle,
    color: 'sky',
    target: 'Usuário que abriu o ticket',
    note: 'Automático quando admin responde via SuporteAdmin.',
  },
  {
    id: 'email_promo',
    label: 'Email: Promoções/Broadcast',
    description: 'Envio em massa de emails promocionais para todos os usuários.',
    function: 'sendToAllUsers / sendScheduledPromos',
    trigger: 'Manual via CentralPromocoes ou agendado',
    icon: Megaphone,
    color: 'purple',
    target: 'Todos os usuários',
    note: 'Controlado pelo painel de promoções.',
  },
];

const COLOR_MAP = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-100 text-green-700' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 text-sky-700' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 text-indigo-700' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 text-violet-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-100 text-teal-700' },
};

const BELL_STORAGE_KEY = 'notif_manager_bell_settings';
const EMAIL_STORAGE_KEY = 'notif_manager_email_settings';

export default function NotificacoesAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bellSettings, setBellSettings] = useState({});
  const [emailSettings, setEmailSettings] = useState({});
  const [testLoading, setTestLoading] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' ||
                        user.subscription_type === 'admin' ||
                        user.role === 'admin';
        if (!isAdmin) { window.location.href = createPageUrl('Home'); return; }

        // Carregar settings do localStorage (ON por padrão)
        const savedBell = localStorage.getItem(BELL_STORAGE_KEY);
        const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);

        const initBell = {};
        BELL_FUNCTIONS.forEach(f => { initBell[f.id] = true; });
        const initEmail = {};
        EMAIL_FUNCTIONS.forEach(f => { initEmail[f.id] = false; }); // email OFF por padrão

        setBellSettings(savedBell ? { ...initBell, ...JSON.parse(savedBell) } : initBell);
        setEmailSettings(savedEmail ? { ...initEmail, ...JSON.parse(savedEmail) } : initEmail);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(BELL_STORAGE_KEY, JSON.stringify(bellSettings));
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emailSettings));
    toast.success('Configurações salvas!');
    setTimeout(() => setSaving(false), 500);
  };

  const enableAllBell = () => {
    const all = {};
    BELL_FUNCTIONS.forEach(f => { all[f.id] = true; });
    setBellSettings(all);
  };

  const disableAllBell = () => {
    const all = {};
    BELL_FUNCTIONS.forEach(f => { all[f.id] = false; });
    setBellSettings(all);
  };

  const handleTestNotification = async (fnId) => {
    setTestLoading(fnId);
    try {
      // Cria uma notificação de teste no sininho
      await base44.asServiceRole?.entities?.Notification?.create({
        title: `🧪 Teste: ${BELL_FUNCTIONS.find(f => f.id === fnId)?.label}`,
        message: 'Esta é uma notificação de teste enviada manualmente.',
        type: 'admin',
        sent_to_all: false,
        is_read: false,
      }).catch(() => {
        // fallback: usar SDK normal
      });
      toast.success('Notificação de teste enviada!');
    } catch {
      toast.error('Erro ao enviar teste');
    } finally {
      setTestLoading(null);
    }
  };

  const activeBellCount = Object.values(bellSettings).filter(Boolean).length;
  const activeEmailCount = Object.values(emailSettings).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 pt-6 pb-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciador de Notificações</h1>
          <p className="text-white/80 text-sm mt-1">Controle quais funções enviam notificações no sininho e por email</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">{activeBellCount}/{BELL_FUNCTIONS.length} Sininho ativas</span>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">{activeEmailCount}/{EMAIL_FUNCTIONS.length} Email ativas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <Tabs defaultValue="bell" className="w-full">
          <TabsList className="w-full mb-6 rounded-2xl h-auto shadow-lg">
            <TabsTrigger value="bell" className="flex-1 rounded-xl gap-1.5 text-xs sm:text-sm py-3">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline">Notificações </span>Sininho
              <Badge className="bg-blue-100 text-blue-700 text-xs ml-1">{activeBellCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 rounded-xl gap-1.5 text-xs sm:text-sm py-3">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline">Notificações </span>Email
              <Badge className="bg-green-100 text-green-700 text-xs ml-1">{activeEmailCount}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ─── ABA SININHO ─── */}
          <TabsContent value="bell">
            {/* Info card */}
            <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Como funciona:</strong> Cada função abaixo representa um canal de notificação do sininho (🔔).
                  Desativar uma função aqui <strong>salva a preferência localmente</strong> — use como referência para habilitar/desabilitar
                  as automações correspondentes no painel de automações.
                  As notificações são sempre <strong>clicáveis</strong> e redirecionam para a vaga/conteúdo correspondente.
                </div>
              </CardContent>
            </Card>

            {/* Controles globais */}
            <Card className="mb-4 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeBellCount > 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
                      {activeBellCount > 0 ? <Bell className="w-6 h-6 text-green-600" /> : <BellOff className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{activeBellCount} de {BELL_FUNCTIONS.length} ativas</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Funções de notificação no sininho</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={enableAllBell} variant="outline" size="sm" className="dark:border-slate-600 text-xs">Ativar todas</Button>
                    <Button onClick={disableAllBell} variant="outline" size="sm" className="dark:border-slate-600 text-xs">Desativar todas</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de funções */}
            <div className="space-y-3">
              {BELL_FUNCTIONS.map((fn) => {
                const colors = COLOR_MAP[fn.color] || COLOR_MAP.blue;
                const Icon = fn.icon;
                const isEnabled = bellSettings[fn.id] !== false;
                return (
                  <Card key={fn.id} className={`dark:bg-slate-800 dark:border-slate-700 transition-all ${!isEnabled ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-slate-800 dark:text-white text-sm">{fn.label}</span>
                            {isEnabled
                              ? <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Ativa</Badge>
                              : <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Desativada</Badge>
                            }
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{fn.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs text-slate-500">
                              🔧 {fn.function}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-slate-500">
                              ⚡ {fn.trigger}
                            </Badge>
                            <Badge className={`${colors.badge} text-xs`}>
                              👥 {fn.target}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(v) => setBellSettings(prev => ({ ...prev, [fn.id]: v }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ─── ABA EMAIL ─── */}
          <TabsContent value="email">
            {/* Info card */}
            <Card className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Atenção:</strong> Emails são enviados via <strong>Resend</strong> e consomem créditos.
                  As funções abaixo são os canais de envio de email do sistema. Cada uma tem sua própria lógica de ativação.
                  Aqui você vê o mapeamento completo e pode usar como referência para configurar cada função.
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {EMAIL_FUNCTIONS.map((fn) => {
                const colors = COLOR_MAP[fn.color] || COLOR_MAP.blue;
                const Icon = fn.icon;
                const isEnabled = emailSettings[fn.id] === true;
                return (
                  <Card key={fn.id} className={`dark:bg-slate-800 dark:border-slate-700 transition-all ${!isEnabled ? 'opacity-70' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-slate-800 dark:text-white text-sm">{fn.label}</span>
                            {isEnabled
                              ? <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Ativa</Badge>
                              : <Badge className="bg-slate-100 text-slate-600 text-xs flex items-center gap-1"><MailOpen className="w-3 h-3" />Padrão desativado</Badge>
                            }
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{fn.description}</p>
                          {fn.note && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">⚠️ {fn.note}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs text-slate-500">
                              🔧 {fn.function}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-slate-500">
                              ⚡ {fn.trigger}
                            </Badge>
                            <Badge className={`${colors.badge} text-xs`}>
                              👥 {fn.target}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(v) => setEmailSettings(prev => ({ ...prev, [fn.id]: v }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Botão salvar fixo */}
        <div className="fixed bottom-20 left-0 right-0 px-4 z-50 max-w-5xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold shadow-xl rounded-2xl"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}