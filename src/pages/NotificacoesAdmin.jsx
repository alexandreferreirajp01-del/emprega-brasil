import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, Loader2, Bell, BellOff, Mail, MailX,
  Briefcase, Users, MessageCircle, Newspaper, Star, Bot,
  CreditCard, AlertTriangle, Send, Zap, Crown, Home, UserCheck
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// ─── Notificações de Sininho (in-app) ─────────────────────────────────────────
const BELL_NOTIFICATIONS = [
  {
    id: 'new_job_published',
    label: 'Nova Vaga Publicada',
    description: 'Notifica todos quando uma nova vaga é aprovada e publicada',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    function: 'autoPublishPending / publishJob / bulkJobActions',
  },
  {
    id: 'new_job_pending_ia',
    label: 'Vagas Pendentes IA',
    description: 'Notifica admins quando novas vagas chegam via WhatsApp/Telegram',
    icon: Bot,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    function: 'telegramWebhook / autoPostN8N',
  },
  {
    id: 'new_user',
    label: 'Novo Usuário Registrado',
    description: 'Notifica admins quando um novo usuário se cadastra',
    icon: UserCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    function: 'notifyUserRegistered / notifyNewUser',
  },
  {
    id: 'feed_post',
    label: 'Posts no Feed',
    description: 'Notifica quando há novos posts na comunidade',
    icon: MessageCircle,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    function: 'notifyFeedNewPost',
  },
  {
    id: 'feed_comment',
    label: 'Comentários no Feed',
    description: 'Notifica quando há novos comentários em posts',
    icon: MessageCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    function: 'notifyFeedNewComment',
  },
  {
    id: 'occurrence',
    label: 'Ocorrências / Denúncias',
    description: 'Notifica admins quando vagas ou usuários são reportados',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    function: 'createReportMessage / notifyAdmins',
  },
  {
    id: 'chat_message',
    label: 'Mensagens no Suporte',
    description: 'Notifica admins quando há novas mensagens de suporte',
    icon: MessageCircle,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    function: 'notifyDirectMessage / supportSystem',
  },
  {
    id: 'payment_received',
    label: 'Pagamentos Recebidos',
    description: 'Notifica admins quando um pagamento é confirmado',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50',
    function: 'notifyPaymentReceived / coraPayment',
  },
  {
    id: 'recruiter_request',
    label: 'Solicitações de Recrutador',
    description: 'Notifica admins quando recrutadores enviam vagas para aprovação',
    icon: Send,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    function: 'publishJob (modo recruiter)',
  },
  {
    id: 'news_published',
    label: 'Notícias Publicadas',
    description: 'Notifica todos quando uma nova notícia é publicada',
    icon: Newspaper,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    function: 'notifyNewsPublished / postNews',
  },
  {
    id: 'home_office_job',
    label: 'Vagas Home Office',
    description: 'Notifica especificamente sobre vagas remotas/híbridas',
    icon: Home,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    function: 'autoPostN8NHomeOffice / VagasHomeOffice',
  },
  {
    id: 'premium_job',
    label: 'Vagas Premium',
    description: 'Notifica assinantes sobre novas vagas premium exclusivas',
    icon: Crown,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    function: 'autoPublishPending (modo premium)',
  },
  {
    id: 'featured_job',
    label: 'Vagas em Destaque',
    description: 'Notifica todos sobre vagas marcadas como destaque',
    icon: Star,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    function: 'autoPublishPending (modo destaque)',
  },
  {
    id: 'direct_message',
    label: 'Mensagens Diretas',
    description: 'Notifica usuários quando recebem mensagens diretas',
    icon: Mail,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    function: 'notifyDirectMessage / sendMessage',
  },
  {
    id: 'admin_broadcast',
    label: 'Broadcast de Admin',
    description: 'Notificações manuais enviadas pelo admin para todos os usuários',
    icon: Zap,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    function: 'sendToAllUsers / NotificationSender',
  },
];

// ─── Notificações de Email ─────────────────────────────────────────────────────
const EMAIL_NOTIFICATIONS = [
  {
    id: 'email_new_job',
    label: 'Nova Vaga Publicada',
    description: 'Envia email para usuários cadastrados quando nova vaga é publicada',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    function: 'publishJob / autoPublishPending (sendToAllUsers)',
  },
  {
    id: 'email_new_user_welcome',
    label: 'Boas-vindas ao Novo Usuário',
    description: 'Envia email de boas-vindas quando usuário se cadastra',
    icon: UserCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    function: 'notifyUserRegistered / registerUser',
  },
  {
    id: 'email_payment_confirmed',
    label: 'Confirmação de Pagamento',
    description: 'Envia email confirmando pagamento premium para o usuário',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50',
    function: 'notifyPaymentReceived / coraPayment',
  },
  {
    id: 'email_recruiter_approved',
    label: 'Vaga do Recrutador Aprovada',
    description: 'Avisa o recrutador quando sua vaga for aprovada pelo admin',
    icon: Send,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    function: 'GerenciarSolicitacoes (aprovação)',
  },
  {
    id: 'email_recruiter_rejected',
    label: 'Vaga do Recrutador Rejeitada',
    description: 'Avisa o recrutador quando sua vaga for rejeitada',
    icon: Send,
    color: 'text-red-600',
    bg: 'bg-red-50',
    function: 'GerenciarSolicitacoes (rejeição)',
  },
  {
    id: 'email_occurrence_reply',
    label: 'Resposta a Ocorrências',
    description: 'Envia email ao usuário com a resposta do admin sobre sua denúncia',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    function: 'Ocorrencias (resposta admin)',
  },
  {
    id: 'email_admin_broadcast',
    label: 'Broadcast por Email',
    description: 'Envia email em massa para todos os usuários da plataforma',
    icon: Zap,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    function: 'sendToAllUsers / EnviarParaTodos',
  },
  {
    id: 'email_job_expiring',
    label: 'Vaga Expirando em 24h',
    description: 'Avisa empresas/admins quando uma vaga está prestes a expirar',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    function: 'notifyJobExpiringIn24h (scheduled)',
  },
  {
    id: 'email_support_reply',
    label: 'Resposta do Suporte',
    description: 'Envia email quando o admin responde uma mensagem de suporte',
    icon: MessageCircle,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    function: 'supportSystem / ResponderChat',
  },
  {
    id: 'email_news_published',
    label: 'Notícia Publicada',
    description: 'Envia email com a nova notícia para usuários inscritos',
    icon: Newspaper,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    function: 'notifyNewsPublished / postNews',
  },
];

const BELL_KEY = 'notif_manager_bell_v2';
const EMAIL_KEY = 'notif_manager_email_v2';

export default function NotificacoesAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bellSettings, setBellSettings] = useState({});
  const [emailSettings, setEmailSettings] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' ||
          user.subscription_type === 'admin' ||
          user.role === 'admin';
        if (!isAdmin) { window.location.href = createPageUrl('Home'); return; }

        // Carregar configurações salvas ou inicializar todas como ativas
        const savedBell = localStorage.getItem(BELL_KEY);
        const savedEmail = localStorage.getItem(EMAIL_KEY);

        if (savedBell) {
          setBellSettings(JSON.parse(savedBell));
        } else {
          const initial = {};
          BELL_NOTIFICATIONS.forEach(n => { initial[n.id] = true; });
          setBellSettings(initial);
        }

        if (savedEmail) {
          setEmailSettings(JSON.parse(savedEmail));
        } else {
          const initial = {};
          EMAIL_NOTIFICATIONS.forEach(n => { initial[n.id] = true; });
          setEmailSettings(initial);
        }
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
    localStorage.setItem(BELL_KEY, JSON.stringify(bellSettings));
    localStorage.setItem(EMAIL_KEY, JSON.stringify(emailSettings));
    toast.success('✅ Configurações salvas com sucesso!');
    setTimeout(() => setSaving(false), 500);
  };

  const setAllBell = (val) => {
    const all = {};
    BELL_NOTIFICATIONS.forEach(n => { all[n.id] = val; });
    setBellSettings(all);
  };

  const setAllEmail = (val) => {
    const all = {};
    EMAIL_NOTIFICATIONS.forEach(n => { all[n.id] = val; });
    setEmailSettings(all);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const bellActive = Object.values(bellSettings).filter(Boolean).length;
  const emailActive = Object.values(emailSettings).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D4371] to-[#0F2744] pt-6 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciador de Notificações</h1>
          <p className="text-white/70 text-sm mt-1">Controle todas as funções que enviam notificações na plataforma</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{bellActive}/{BELL_NOTIFICATIONS.length} sininho ativas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Mail className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{emailActive}/{EMAIL_NOTIFICATIONS.length} email ativas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Tabs defaultValue="bell">
          <TabsList className="w-full mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shadow-md">
            <TabsTrigger value="bell" className="flex-1 rounded-xl gap-2 data-[state=active]:bg-[#1D4371] data-[state=active]:text-white">
              <Bell className="w-4 h-4" />
              Notificações Sininho
              <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs">{bellActive}</Badge>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 rounded-xl gap-2 data-[state=active]:bg-[#1D4371] data-[state=active]:text-white">
              <Mail className="w-4 h-4" />
              Notificações de Email
              <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs">{emailActive}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── ABA SININHO ── */}
          <TabsContent value="bell">
            <Card className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow mb-4">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bellActive > 0 ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {bellActive > 0 ? <Bell className="w-5 h-5 text-blue-600" /> : <BellOff className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{bellActive} de {BELL_NOTIFICATIONS.length} ativas</p>
                    <p className="text-xs text-slate-500">Notificações que aparecem no sininho (🔔) do app</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setAllBell(true)} variant="outline" size="sm" className="rounded-xl">Ativar todas</Button>
                  <Button onClick={() => setAllBell(false)} variant="outline" size="sm" className="rounded-xl">Desativar todas</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {BELL_NOTIFICATIONS.map((n) => {
                const Icon = n.icon;
                const isOn = bellSettings[n.id] !== false;
                return (
                  <Card key={n.id} className={`dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow transition-all ${isOn ? '' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.bg}`}>
                          <Icon className={`w-5 h-5 ${n.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{n.label}</p>
                            <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 font-mono">
                              {n.function}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.description}</p>
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => setBellSettings(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
                          className="flex-shrink-0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── ABA EMAIL ── */}
          <TabsContent value="email">
            <Card className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow mb-4">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emailActive > 0 ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {emailActive > 0 ? <Mail className="w-5 h-5 text-blue-600" /> : <MailX className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{emailActive} de {EMAIL_NOTIFICATIONS.length} ativas</p>
                    <p className="text-xs text-slate-500">Notificações enviadas por email (via Resend)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setAllEmail(true)} variant="outline" size="sm" className="rounded-xl">Ativar todas</Button>
                  <Button onClick={() => setAllEmail(false)} variant="outline" size="sm" className="rounded-xl">Desativar todas</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {EMAIL_NOTIFICATIONS.map((n) => {
                const Icon = n.icon;
                const isOn = emailSettings[n.id] !== false;
                return (
                  <Card key={n.id} className={`dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow transition-all ${isOn ? '' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.bg}`}>
                          <Icon className={`w-5 h-5 ${n.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{n.label}</p>
                            <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 font-mono">
                              {n.function}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.description}</p>
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => setEmailSettings(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
                          className="flex-shrink-0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700 p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#1D4371] hover:bg-[#0F2744] h-12 text-base font-semibold rounded-xl"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}