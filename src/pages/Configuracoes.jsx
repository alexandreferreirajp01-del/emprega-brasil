import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Key, Users, Database, BarChart3, 
  Globe, Plug, Code, Bot, FileText, Settings, ChevronRight, 
  ExternalLink, Lock, CreditCard, Briefcase, MessageSquare, Newspaper, ClipboardList,
  PlusCircle, Sparkles, Home, BookOpen, Heart, History, MessageCircle, Shield, Crown, AlertCircle, Search, Palette, MapPin, Trash2, Image, AlertTriangle, Link as LinkIcon, TrendingUp, X, Filter, Send, Megaphone, Wrench, Bell, UsersRound, Activity
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SystemHealthModal from "@/components/admin/SystemHealthModal";

// ─── Submenus ─────────────────────────────────────────────────────────────────

const submenuConfigs = {
  sistema: {
    title: 'Sistema & Aparência',
    icon: Settings,
    items: [
      { id: 'saude-sistema', name: 'Saúde do Sistema', icon: Activity, color: 'emerald', component: 'SystemHealth', description: 'Créditos, consumo e status das funções', roles: ['admin', 'dono'] },
      { id: 'gerenciar-funcoes', name: 'Gerenciar Funções', icon: Settings, color: 'purple', page: 'GerenciarFuncoes', description: 'Habilitar/desabilitar funções do app', roles: ['admin', 'dono'] },
      { id: 'permissoes', name: 'Permissões de Acesso', icon: Shield, color: 'purple', page: 'Permissoes', description: 'Controlar acesso às funções do app', roles: ['admin', 'dono'] },
      { id: 'cores', name: 'Gerenciar Cores', icon: Palette, color: 'pink', page: 'GerenciarCores', description: 'Personalizar cores da aplicação', roles: ['admin', 'dono'] },
      { id: 'popups', name: 'Gerenciar Popups', icon: AlertCircle, color: 'indigo', page: 'GerenciarPopups', description: 'Avisos e mensagens no app', roles: ['admin', 'dono'] },
      { id: 'anuncios', name: 'Gerenciar Anúncios', icon: Image, color: 'orange', page: 'GerenciarAnuncios', description: 'Configurar anúncios do AdsTerra', roles: ['admin', 'dono'] },
    ]
  },
  usuarios: {
    title: 'Gestão de Usuários',
    icon: Users,
    items: [
      { id: 'usuarios', name: 'Gerenciar Usuários', icon: Users, color: 'blue', page: 'GerenciarUsuarios', description: 'Aprovar e gerenciar usuários', roles: ['admin', 'dono'] },
      { id: 'acessos', name: 'Gerenciar Acessos', icon: Key, color: 'purple', page: 'GerenciarAcessos', description: 'Links de ativação únicos', roles: ['admin', 'dono'] },
      { id: 'solicitacoes', name: 'Solicitações', icon: ClipboardList, color: 'orange', page: 'GerenciarSolicitacoes', description: 'Aprovar conteúdos de recrutadores', roles: ['admin', 'dono'] },
    ]
  },
  financeiro: {
    title: 'Planos & Financeiro',
    icon: CreditCard,
    items: [
      { id: 'precos', name: 'Gerenciar Preços', icon: CreditCard, color: 'emerald', page: 'GerenciarPrecos', description: 'Ajustar valores dos planos', roles: ['admin', 'dono'] },
      { id: 'controle-financeiro', name: 'Controle Financeiro', icon: CreditCard, color: 'green', page: 'ControleFinanceiro', description: 'Gerenciar assinaturas, ciclos e receitas', roles: ['admin', 'dono'] },
      { id: 'extrato', name: 'Extrato Financeiro', icon: FileText, color: 'emerald', page: 'Extrato', description: 'Lançamentos e relatório de extrato', roles: ['admin', 'dono'] },
      { id: 'dashboard-financeiro', name: 'Dashboard Financeiro', icon: BarChart3, color: 'cyan', page: 'DashboardFinanceiro', description: 'Análise de receitas e despesas com gráficos', roles: ['admin', 'dono'] },
    ]
  },
  vagas: {
    title: 'Gestão de Vagas',
    icon: Briefcase,
    items: [
      { id: 'gerenciar-vagas', name: 'Gerenciador de Vagas', icon: Briefcase, color: 'indigo', page: 'GerenciarVagas', description: 'Central única de controle e manutenção', roles: ['admin', 'dono'] },
      { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', icon: Filter, color: 'slate', page: 'GerenciadorFiltros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros', roles: ['admin', 'dono'] },
      { id: 'postar-vaga', name: 'Postar Vagas', icon: PlusCircle, color: 'blue', page: 'PostarVaga', description: 'Criar novas vagas de emprego', permissionId: 'postar_vagas' },
      { id: 'post-manual-texto-sub', name: 'Post Manual — Texto', icon: ClipboardList, color: 'amber', page: 'PostManualTexto', description: 'Cole texto de vaga e preencha manualmente', roles: ['admin', 'dono'] },
      { id: 'post-manual', name: 'Vagas N8N (Revisão)', icon: PlusCircle, color: 'emerald', page: 'PostManual', description: 'Revisar e publicar vagas recebidas do N8N', roles: ['admin', 'dono'] },
      { id: 'posts-massa', name: 'Posts em Massa', icon: Sparkles, color: 'purple', page: 'PostsEmMassa', description: 'Upload múltiplas imagens e extraia vagas com IA', permissionId: 'posts_massa' },
      { id: 'posts-massa-txt', name: 'Posts em Massa TXT', icon: FileText, color: 'indigo', page: 'PostsEmMassaTXT', description: 'Upload arquivos TXT/DOC/PDF e extraia até 50 vagas', permissionId: 'posts_massa_txt' },
      { id: 'vagas-ia', name: 'Vagas por IA', icon: Sparkles, color: 'violet', page: 'VagasPorIA', description: 'Gerar vagas com inteligência artificial', permissionId: 'vagas_ia' },
      { id: 'vagas-home', name: 'Vagas Home Office', icon: Home, color: 'teal', page: 'VagasHomeOffice', description: 'Publicar vagas remotas', permissionId: 'vagas_home_office' },
      { id: 'vagas-pendentes', name: 'Vagas Pendentes', icon: AlertTriangle, color: 'orange', page: 'VagasPendentes', description: 'Vagas aguardando revisão', roles: ['admin', 'dono'] },
      { id: 'pendencias', name: 'Pendências de Contato', icon: AlertTriangle, color: 'red', page: 'Pendencias', description: 'Vagas sem contato que precisam revisão', roles: ['admin', 'dono'] },
    ]
  },
  conteudo: {
    title: 'Conteúdo & Comunidade',
    icon: Newspaper,
    items: [
      { id: 'noticias', name: 'Gerenciar Notícias', icon: Newspaper, color: 'rose', page: 'GerenciarNoticias', description: 'Criar e gerenciar notícias', permissionId: 'noticias' },
      { id: 'blog', name: 'Gerenciar Blog', icon: BookOpen, color: 'emerald', page: 'GerenciarBlog', description: 'Criar e gerenciar posts do blog', roles: ['admin', 'dono'] },
      { id: 'feed', name: 'Feed da Comunidade', icon: MessageSquare, color: 'pink', page: 'GerenciarComunidade', description: 'Posts, comentários e chat', permissionId: 'gerenciar_comunidade' },
      { id: 'grupos', name: 'Gerenciar Grupos', icon: UsersRound, color: 'green', page: 'GerenciarGrupos', description: 'WhatsApp, Telegram e Facebook', roles: ['admin', 'dono'] },
      { id: 'biblioteca', name: 'Biblioteca', icon: BookOpen, color: 'orange', page: 'BibliotecaAdmin', description: 'Gerenciar materiais e recursos', permissionId: 'biblioteca_admin' },
    ]
  },
  marketing: {
    title: 'Marketing & Comunicação',
    icon: Megaphone,
    items: [
      { id: 'central-promocoes', name: 'Central de Promoções', icon: Megaphone, color: 'purple', page: 'CentralPromocoes', description: 'Enviar campanhas de email e WhatsApp', roles: ['admin', 'dono'] },
      { id: 'enviar-todos', name: 'Enviar para Todos', icon: Send, color: 'blue', page: 'EnviarParaTodos', description: 'Notificação + Push + Email em massa', roles: ['admin', 'dono'] },
      { id: 'notificacoes-admin', name: 'Notificações de Admin', icon: Bell, color: 'amber', page: 'NotificacoesAdmin', description: 'Habilitar/desabilitar notificações do sininho', roles: ['admin', 'dono'] },
      { id: 'links-especiais', name: 'Links Especiais', icon: LinkIcon, color: 'violet', page: 'GerenciarLinksEspeciais', description: 'Links que habilitam planos automaticamente', roles: ['admin', 'dono'] },
      { id: 'gerenciar-prelander', name: 'Gerenciar Pre-lander', icon: Globe, color: 'blue', page: 'GerenciarPreLander', description: 'Configurar página de pré-acesso com link Encurta.net', roles: ['dono'] },
    ]
  },
  automacao: {
    title: 'Automação & Integrações',
    icon: Plug,
    items: [
      { id: 'n8n-config', name: 'Configuração N8N', icon: Plug, color: 'emerald', page: 'N8NConfig', description: 'Conectar N8N para posts automáticos', roles: ['admin', 'dono'] },
      { id: 'telegram-config', name: 'Bot Telegram', icon: Bot, color: 'cyan', page: 'TelegramConfig', description: 'Configurar webhook e monitorar bot do Telegram', roles: ['admin', 'dono'] },
      { id: 'api-keys', name: 'API Keys & Secrets', icon: Shield, color: 'amber', page: 'GerenciarAPIKeys', description: 'Gerenciar chaves de API e secrets', roles: ['admin', 'dono'] },
      { id: 'auditoria-links', name: 'Auditoria de Links', icon: Search, color: 'slate', page: 'AuditoriaLinks', description: 'Verificar e corrigir links quebrados nas vagas', roles: ['admin', 'dono'] },
    ]
  },
  analytics: {
    title: 'Analytics & IA',
    icon: BarChart3,
    items: [
      { id: 'analytics-app', name: 'Analytics do App', icon: BarChart3, color: 'purple', page: 'AnalyticsPage', description: 'Análises em tempo real', permissionId: 'analytics' },
      { id: 'agente-adsense', name: 'Agente AdSense', icon: Bot, color: 'amber', page: 'AgenteAdSense', description: 'Orienta sobre aprovação e otimização do Google AdSense', roles: ['admin', 'dono'] },
    ]
  },
  recrutador: {
    title: 'Área do Recrutador',
    icon: Briefcase,
    items: [
      { id: 'recruiter-area', name: 'Painel do Recrutador', icon: Briefcase, color: 'blue', page: 'RecruiterArea', description: 'Ferramentas exclusivas para recrutadores', roles: ['recruiter', 'admin', 'dono'] },
    ]
  },
  minhaarea: {
    title: 'Minha Área',
    icon: Heart,
    items: [
      { id: 'usuarios-mensagens', name: 'Central de Suporte', icon: MessageCircle, color: 'green', page: 'ResponderChat', description: 'Responder mensagens de suporte dos usuários', roles: ['admin', 'dono'] },
      { id: 'favoritas', name: 'Favoritas', icon: Heart, color: 'rose', page: 'Favoritos', description: 'Vagas salvas como favoritas', permissionId: 'favoritas' },
      { id: 'historico', name: 'Histórico', icon: History, color: 'violet', page: 'Historico', description: 'Vagas visualizadas recentemente', permissionId: 'historico' },
      { id: 'curriculos', name: 'Ver Currículos', icon: FileText, color: 'teal', page: 'ProfessionalResume', description: 'Visualizar currículos de candidatos', permissionId: 'curriculos' },
      { id: 'documentacao-app', name: 'Documentação do App', icon: BookOpen, color: 'slate', page: 'DocumentacaoApp', description: 'Documentação técnica em PDF, Word ou TXT', roles: ['admin', 'dono'] },
    ]
  },
};

// Menu principal — cada item abre um submenu
const menuItems = [
  { id: 'divider-admin', type: 'divider', label: 'Administração', roles: ['admin', 'dono'] },
  { id: 'sistema',     name: 'Sistema & Aparência',       icon: Settings,   color: 'purple',  submenuKey: 'sistema',    description: 'Funções, permissões, cores, popups e anúncios',   roles: ['admin', 'dono'] },
  { id: 'usuarios',    name: 'Gestão de Usuários',         icon: Users,      color: 'blue',    submenuKey: 'usuarios',   description: 'Usuários, acessos e solicitações',                roles: ['admin', 'dono'] },
  { id: 'financeiro',  name: 'Planos & Financeiro',        icon: CreditCard, color: 'emerald', submenuKey: 'financeiro', description: 'Preços, assinaturas, extrato e dashboard',         roles: ['admin', 'dono'] },

  { id: 'divider-vagas', type: 'divider', label: 'Vagas & Conteúdo' },
  { id: 'vagas',       name: 'Gestão de Vagas',            icon: Briefcase,  color: 'indigo',  submenuKey: 'vagas',      description: 'Publicar, revisar, filtros e vagas por IA',       roles: ['admin', 'dono'] },
  { id: 'conteudo',    name: 'Conteúdo & Comunidade',      icon: Newspaper,  color: 'rose',    submenuKey: 'conteudo',   description: 'Notícias, blog, feed, grupos e biblioteca',        permissionId: 'noticias' },

  { id: 'divider-marketing', type: 'divider', label: 'Marketing & Automação', roles: ['admin', 'dono'] },
  { id: 'marketing',   name: 'Marketing & Comunicação',    icon: Megaphone,  color: 'violet',  submenuKey: 'marketing',  description: 'Promoções, notificações, push e links especiais', roles: ['admin', 'dono'] },
  { id: 'automacao',   name: 'Automação & Integrações',    icon: Plug,       color: 'teal',    submenuKey: 'automacao',  description: 'N8N, API Keys e secrets',                         roles: ['admin', 'dono'] },

  { id: 'divider-dados', type: 'divider', label: 'Dados & IA', roles: ['admin', 'dono'] },
  { id: 'analytics',   name: 'Analytics & IA',             icon: BarChart3,  color: 'purple',  submenuKey: 'analytics',  description: 'Métricas em tempo real e agente AdSense',         roles: ['admin', 'dono'] },

  { id: 'divider-recrutador', type: 'divider', label: 'Área do Recrutador', roles: ['recruiter', 'admin', 'dono'] },
  { id: 'recrutador',  name: 'Área do Recrutador',         icon: Briefcase,  color: 'blue',    submenuKey: 'recrutador', description: 'Painel exclusivo para recrutadores',              roles: ['recruiter', 'admin', 'dono'] },

  { id: 'divider-minhaarea', type: 'divider', label: 'Minha Área' },
  { id: 'minhaarea',   name: 'Minha Área',                 icon: Heart,      color: 'rose',    submenuKey: 'minhaarea',  description: 'Suporte, favoritas, histórico e documentação' },
];

const colorClasses = {
  red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600',
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600',
  green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600',
  cyan: 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600',
  slate: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600',
  violet: 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600',
  amber: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600',
  indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600',
  rose: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600',
  pink: 'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600',
  teal: 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600',
  lime: 'bg-gradient-to-br from-lime-50 to-lime-100 text-lime-600',
  emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600',
  violet: 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600',
};

// ─── Componente Submenu Dialog ────────────────────────────────────────────────
function SubmenuDialog({ open, onClose, submenuKey, user }) {
  const [systemHealthOpen, setSystemHealthOpen] = useState(false);
  const config = submenuConfigs[submenuKey];
  if (!config) return null;

  const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || user?.subscription_type === 'dono';
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
  const isRecruiter = user?.subscription_type === 'recruiter';

  const visibleItems = config.items.filter(item => {
    if (item.roles) {
      return item.roles.some(r => {
        if (r === 'dono') return isDono;
        if (r === 'admin') return isAdmin;
        if (r === 'recruiter') return isRecruiter;
        return false;
      });
    }
    if (!isDono && !isAdmin && item.permissionId) {
      const perms = user?.permissions || {};
      if (perms[item.permissionId] === false) return false;
    }
    return true;
  });

  const TitleIcon = config.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <TitleIcon className="w-6 h-6" />
              {config.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-1">
            {visibleItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === visibleItems.length - 1;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.component === 'SystemHealth') {
                      setSystemHealthOpen(true);
                    } else {
                      onClose();
                      window.location.href = createPageUrl(item.page);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left rounded-xl ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <SystemHealthModal open={systemHealthOpen} onOpenChange={setSystemHealthOpen} />
    </>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // submenuKey string
  const [systemHealthOpen, setSystemHealthOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isDono = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser.subscription_type === 'dono';
        const isAdmin = currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        const isRecruiter = currentUser.subscription_type === 'recruiter';
        
        if (!isDono && !isAdmin && !isRecruiter) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleItemClick = (item) => {
    if (item.submenuKey) {
      setActiveSubmenu(item.submenuKey);
      return;
    }
    if (item.page) {
      window.location.href = createPageUrl(item.page);
    }
  };

  // Pesquisa global — busca em todos os submenus
  const allSearchableItems = Object.values(submenuConfigs).flatMap(c => c.items);
  const searchResults = searchTerm.trim()
    ? allSearchableItems.filter(item => {
        const s = searchTerm.toLowerCase();
        return item.name?.toLowerCase().includes(s) || item.description?.toLowerCase().includes(s);
      })
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || user?.subscription_type === 'dono';
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
  const isRecruiter = user?.subscription_type === 'recruiter';

  const isItemVisible = (item) => {
    if (item.roles) {
      return item.roles.some(r => {
        if (r === 'dono') return isDono;
        if (r === 'admin') return isAdmin;
        if (r === 'recruiter') return isRecruiter;
        return false;
      });
    }
    if (!isDono && !isAdmin && item.permissionId) {
      const perms = user?.permissions || {};
      if (perms[item.permissionId] === false) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4 transition-colors">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
          <p className="text-white/70 text-sm">Gerencie seu app — selecione uma categoria</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Barra de Pesquisa */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em todas as configurações..."
              className="pl-11 h-12 rounded-xl border-slate-200 text-base"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Resultados da Pesquisa */}
        {searchTerm.trim() ? (
          searchResults.length > 0 ? (
            <Card className="rounded-2xl overflow-hidden dark:bg-slate-800 transition-colors">
              <CardContent className="p-0">
                {searchResults.filter(isItemVisible).map((item, index, arr) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { window.location.href = createPageUrl(item.page); }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left ${index < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma configuração encontrada para "{searchTerm}"</p>
            </div>
          )
        ) : (
          /* Menu principal por categoria */
          <Card className="rounded-2xl overflow-hidden dark:bg-slate-800 transition-colors">
            <CardContent className="p-0">
              {menuItems.map((item, index) => {
                if (!isItemVisible(item)) return null;

                if (item.type === 'divider') {
                  return (
                    <div key={item.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-b dark:border-slate-600 transition-colors">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                  );
                }

                const Icon = item.icon;
                const submenuConfig = item.submenuKey ? submenuConfigs[item.submenuKey] : null;
                const itemCount = submenuConfig
                  ? submenuConfig.items.filter(isItemVisible).length
                  : null;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {itemCount !== null && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.5 font-medium">
                          {itemCount}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submenu Dialog genérico */}
      <SubmenuDialog
        open={!!activeSubmenu}
        onClose={() => setActiveSubmenu(null)}
        submenuKey={activeSubmenu}
        user={user}
      />
    </div>
  );
}