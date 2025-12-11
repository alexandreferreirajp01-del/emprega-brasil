import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Loader2, Key, Users, Database, BarChart3, 
  Globe, Plug, Code, Bot, FileText, Settings, ChevronRight, 
  ExternalLink, Lock, CreditCard, Briefcase, MessageSquare, Newspaper, ClipboardList,
  PlusCircle, Sparkles, Home, BookOpen, Heart, History, MessageCircle, Shield, Crown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const menuItems = [
  { id: 'dividerInteracoes', type: 'divider', label: 'Interações' },
  { id: 'favoritas', name: 'Favoritas', icon: Heart, color: 'red', page: 'Favoritos', description: 'Vagas salvas como favoritas', permissionId: 'favoritas' },
  { id: 'historico', name: 'Histórico', icon: History, color: 'purple', page: 'Historico', description: 'Vagas visualizadas recentemente', permissionId: 'historico' },
  { id: 'mensagens', name: 'Mensagens', icon: MessageCircle, color: 'green', page: 'Mensagens', description: 'Conversas diretas entre usuários', permissionId: 'mensagens' },
  { id: 'curriculos', name: 'Ver Currículos', icon: FileText, color: 'blue', page: 'ProfessionalResume', description: 'Visualizar currículos de candidatos', permissionId: 'curriculos' },
  { id: 'responder-chat', name: 'Responder Chat', icon: MessageSquare, color: 'cyan', page: 'ResponderChat', description: 'Responder mensagens dos usuários', permissionId: 'responder_chat' },
  { id: 'dividerRecrutador', type: 'divider', label: 'Área do Recrutador', roles: ['recruiter', 'admin', 'dono'] },
  { id: 'recruiter-area', name: 'Painel do Recrutador', icon: Briefcase, color: 'blue', page: 'RecruiterArea', description: 'Ferramentas exclusivas para recrutadores', roles: ['recruiter', 'admin', 'dono'], permissionId: 'recruiter_area' },
  { id: 'divider0', type: 'divider', label: 'Gerenciamento' },
  { id: 'permissoes', name: 'Permissões de Acesso', icon: Shield, color: 'indigo', page: 'Permissoes', description: 'Controlar acesso às funções do app', roles: ['admin', 'dono'], permissionId: 'permissoes' },
  { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', icon: Settings, color: 'indigo', page: 'GerenciadorFiltros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros', permissionId: 'gerenciador_filtros' },
  { id: 'transmissao', name: 'Lista de Transmissão', icon: MessageSquare, color: 'green', page: 'ListaTransmissao', description: 'Enviar mensagens em massa', permissionId: 'lista_transmissao' },
  { id: 'vagas', name: 'Gerenciar Vagas', icon: Briefcase, color: 'blue', page: 'GerenciarVagas', description: 'Visualizar e excluir vagas', permissionId: 'gerenciar_vagas' },
  { id: 'usuarios', name: 'Gerenciar Usuários', icon: Users, color: 'indigo', page: 'GerenciarUsuarios', description: 'Aprovar e gerenciar usuários', permissionId: 'gerenciar_usuarios' },
  { id: 'activate-premium', name: 'Ativar Premium Manual', icon: Crown, color: 'amber', page: 'ActivatePremiumManual', description: 'Ativar plano Premium para usuários', roles: ['admin', 'dono'], permissionId: 'activate_premium' },
  { id: 'comunidade', name: 'Gerenciar Comunidade', icon: MessageSquare, color: 'purple', page: 'GerenciarComunidade', description: 'Posts, comentários e chat', permissionId: 'gerenciar_comunidade' },
  { id: 'solicitacoes', name: 'Solicitações', icon: ClipboardList, color: 'orange', page: 'GerenciarSolicitacoes', description: 'Aprovar conteúdos de recrutadores', permissionId: 'solicitacoes' },
  { id: 'dividerProducao', type: 'divider', label: 'Ferramentas de Produção' },
  { id: 'postar-vaga', name: 'Postar Vagas', icon: PlusCircle, color: 'blue', page: 'PostarVaga', description: 'Criar novas vagas de emprego', permissionId: 'postar_vagas' },
  { id: 'posts-massa', name: 'Posts em Massa', icon: Sparkles, color: 'purple', page: 'PostsEmMassa', description: 'Upload múltiplas imagens e extraia vagas com IA', permissionId: 'posts_massa' },
  { id: 'vagas-ia', name: 'Vagas por IA', icon: Sparkles, color: 'violet', page: 'VagasPorIA', description: 'Gerar vagas com inteligência artificial', permissionId: 'vagas_ia' },
  { id: 'vagas-home', name: 'Vagas Home Office', icon: Home, color: 'green', page: 'VagasHomeOffice', description: 'Publicar vagas remotas', permissionId: 'vagas_home_office' },
  { id: 'biblioteca', name: 'Biblioteca', icon: BookOpen, color: 'amber', page: 'BibliotecaAdmin', description: 'Gerenciar materiais e recursos', permissionId: 'biblioteca_admin' },
  { id: 'noticias', name: 'Gerenciar Notícias', icon: Newspaper, color: 'red', page: 'GerenciarNoticias', description: 'Publicar e gerenciar notícias', permissionId: 'noticias' },
  { id: 'divider1', type: 'divider', label: 'Ferramentas' },
  { id: 'estatisticas', name: 'Estatísticas', icon: BarChart3, color: 'purple', page: 'Estatisticas', description: 'Estatísticas e análises de desempenho', permissionId: 'estatisticas' },
  { id: 'analytics-app', name: 'Analytics do App', icon: BarChart3, color: 'purple', page: 'AnalyticsPage', description: 'Análises em tempo real', permissionId: 'analytics' },
  { id: 'payments', name: 'Pagamentos', icon: CreditCard, color: 'green', page: 'PaymentsPage', description: 'Gerenciar pagamentos', permissionId: 'pagamentos' },
  { id: 'feed', name: 'Feed', icon: MessageCircle, color: 'purple', page: 'Feed', description: 'Gerenciar posts do feed', permissionId: 'feed' },
  { id: 'divider2', type: 'divider', label: 'Painel Base44' },
  { id: 'base44', name: 'Abrir Painel Base44', icon: Settings, color: 'slate', external: true, description: 'Overview, Users, Data, Analytics, Domains, Integrations, Security, Code, Agents, Logs, API, Settings, Secrets' },
];

const colorClasses = {
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  orange: 'bg-orange-100 text-orange-600',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  rose: 'bg-rose-100 text-rose-600',
};

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (item.page) {
      window.location.href = createPageUrl(item.page);
    } else if (item.external) {
      window.open('https://app.base44.com', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
          <p className="text-white/70 text-sm">Gerencie seu app e acesse o painel Base44</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              // Verificar permissão de acesso
              const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || 
                             user?.subscription_type === 'dono';
              const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
              const isRecruiter = user?.subscription_type === 'recruiter';
              
              // Dono e Admin têm acesso total
              if (!isDono && !isAdmin) {
                // Verificar permissões do usuário
                if (item.permissionId) {
                  const userPermissions = user?.permissions || {};
                  // Se a permissão não está definida ou é false, esconder
                  if (userPermissions[item.permissionId] === false) {
                    return null;
                  }
                }
              }
              
              if (item.roles) {
                const hasAccess = item.roles.some(role => {
                  if (role === 'dono') return isDono;
                  if (role === 'admin') return isAdmin;
                  if (role === 'recruiter') return isRecruiter;
                  return false;
                });
                if (!hasAccess) return null;
              }
              
              if (item.type === 'divider') {
                return (
                  <div key={item.id} className="px-4 py-3 bg-slate-50 border-t border-b">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              }

              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${!isLast ? 'border-b border-slate-100' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </div>
                  {item.external ? (
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          Itens com <ExternalLink className="w-3 h-3 inline" /> abrem o painel Base44
        </p>
      </div>
    </div>
  );
}