import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Key, Users, Database, BarChart3, 
  Globe, Plug, Code, Bot, FileText, Settings, ChevronRight, 
  ExternalLink, Lock, CreditCard, Briefcase, MessageSquare, Newspaper, ClipboardList,
  PlusCircle, Sparkles, Home, BookOpen, Heart, History, MessageCircle, Shield, Crown, AlertCircle, Search, Palette
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const menuItems = [
  { id: 'dividerInteracoes', type: 'divider', label: 'Interações' },
  { id: 'favoritas', name: 'Favoritas', icon: Heart, color: 'rose', page: 'Favoritos', description: 'Vagas salvas como favoritas', permissionId: 'favoritas' },
  { id: 'historico', name: 'Histórico', icon: History, color: 'violet', page: 'Historico', description: 'Vagas visualizadas recentemente', permissionId: 'historico' },
  { id: 'mensagens', name: 'Mensagens', icon: MessageCircle, color: 'emerald', page: 'Mensagens', description: 'Conversas diretas entre usuários', permissionId: 'mensagens' },
  { id: 'feed', name: 'Feed', icon: MessageSquare, color: 'pink', page: 'GerenciarComunidade', description: 'Posts, comentários e chat', permissionId: 'gerenciar_comunidade' },
  { id: 'transmissao', name: 'Lista de Transmissão', icon: MessageSquare, color: 'lime', page: 'ListaTransmissao', description: 'Enviar mensagens em massa', permissionId: 'lista_transmissao' },
  { id: 'ocorrencias', name: 'Ocorrências', icon: AlertCircle, color: 'red', page: 'Ocorrencias', description: 'Gerenciar reports de vagas', roles: ['admin', 'dono'], permissionId: 'ocorrencias' },
  { id: 'curriculos', name: 'Ver Currículos', icon: FileText, color: 'teal', page: 'ProfessionalResume', description: 'Visualizar currículos de candidatos', permissionId: 'curriculos' },
  { id: 'responder-chat', name: 'Responder Chat', icon: MessageSquare, color: 'cyan', page: 'ResponderChat', description: 'Responder mensagens dos usuários', permissionId: 'responder_chat' },
  { id: 'dividerRecrutador', type: 'divider', label: 'Área do Recrutador', roles: ['recruiter', 'admin', 'dono'] },
  { id: 'recruiter-area', name: 'Painel do Recrutador', icon: Briefcase, color: 'blue', page: 'RecruiterArea', description: 'Ferramentas exclusivas para recrutadores', roles: ['recruiter', 'admin', 'dono'], permissionId: 'recruiter_area' },
  { id: 'solicitacoes', name: 'Solicitações', icon: ClipboardList, color: 'orange', page: 'GerenciarSolicitacoes', description: 'Aprovar conteúdos de recrutadores', roles: ['admin', 'dono'], permissionId: 'solicitacoes' },
  { id: 'divider0', type: 'divider', label: 'Gerenciamento' },
  { id: 'permissoes', name: 'Permissões de Acesso', icon: Shield, color: 'purple', page: 'Permissoes', description: 'Controlar acesso às funções do app', roles: ['admin', 'dono'], permissionId: 'permissoes' },
  { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', icon: Settings, color: 'slate', page: 'GerenciadorFiltros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros', permissionId: 'gerenciador_filtros' },
  { id: 'vagas', name: 'Gerenciar Vagas', icon: Briefcase, color: 'indigo', page: 'GerenciarVagas', description: 'Visualizar e excluir vagas', permissionId: 'gerenciar_vagas' },
  { id: 'usuarios', name: 'Gerenciar Usuários', icon: Users, color: 'blue', page: 'GerenciarUsuarios', description: 'Aprovar e gerenciar usuários', permissionId: 'gerenciar_usuarios' },
  { id: 'planos', name: 'Gerenciar Planos', icon: Crown, color: 'purple', page: 'GerenciarPlanos', description: 'Controle de assinaturas e cobranças', roles: ['admin', 'dono'], permissionId: 'gerenciar_planos' },
  { id: 'precos', name: 'Gerenciar Preços', icon: Settings, color: 'emerald', page: 'GerenciarPrecos', description: 'Ajustar valores dos planos', roles: ['admin', 'dono'] },
  { id: 'cores', name: 'Gerenciar Cores', icon: Palette, color: 'pink', page: 'GerenciarCores', description: 'Personalizar cores da aplicação', roles: ['admin', 'dono'] },
  { id: 'dividerProducao', type: 'divider', label: 'Ferramentas de Produção' },
  { id: 'postar-vaga', name: 'Postar Vagas', icon: PlusCircle, color: 'blue', page: 'PostarVaga', description: 'Criar novas vagas de emprego', permissionId: 'postar_vagas' },
  { id: 'posts-massa', name: 'Posts em Massa', icon: Sparkles, color: 'purple', page: 'PostsEmMassa', description: 'Upload múltiplas imagens e extraia vagas com IA', permissionId: 'posts_massa' },
  { id: 'vagas-ia', name: 'Vagas por IA', icon: Sparkles, color: 'violet', page: 'VagasPorIA', description: 'Gerar vagas com inteligência artificial', permissionId: 'vagas_ia' },
  { id: 'vagas-home', name: 'Vagas Home Office', icon: Home, color: 'teal', page: 'VagasHomeOffice', description: 'Publicar vagas remotas', permissionId: 'vagas_home_office' },
  { id: 'biblioteca', name: 'Biblioteca', icon: BookOpen, color: 'orange', page: 'BibliotecaAdmin', description: 'Gerenciar materiais e recursos', permissionId: 'biblioteca_admin' },
  { id: 'noticias', name: 'Notícias', icon: Newspaper, color: 'rose', page: 'GerenciarNoticias', description: 'Criar, editar e gerenciar notícias', permissionId: 'noticias' },
  { id: 'divider1', type: 'divider', label: 'Ferramentas' },
  { id: 'fluxo-usuarios', name: 'Fluxo de Usuários', icon: Users, color: 'emerald', page: 'FluxoUsuarios', description: 'Monitoramento em tempo real', roles: ['admin', 'dono'], permissionId: 'fluxo_usuarios' },
  { id: 'analytics-app', name: 'Analytics do App', icon: BarChart3, color: 'purple', page: 'AnalyticsPage', description: 'Análises em tempo real', permissionId: 'analytics' },
  { id: 'payments', name: 'Pagamentos', icon: CreditCard, color: 'green', page: 'PaymentsPage', description: 'Gerenciar pagamentos', permissionId: 'pagamentos' },
  { id: 'migrate-notifications', name: 'Migrar Notificações', icon: Database, color: 'amber', action: 'migrate', description: 'Atualizar notificações antigas (executar 1x)', roles: ['admin', 'dono'] },
  { id: 'divider2', type: 'divider', label: 'Painel Base44' },
  { id: 'base44', name: 'Abrir Painel Base44', icon: Settings, color: 'slate', external: true, description: 'Overview, Users, Data, Analytics, Domains, Integrations, Security, Code, Agents, Logs, API, Settings, Secrets' },
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
};

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

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

  const handleItemClick = async (item) => {
    if (item.action === 'migrate') {
      if (!confirm('Deseja migrar todas as notificações antigas? Isso pode levar alguns segundos.')) return;
      
      setMigrating(true);
      setMigrationResult(null);
      
      try {
        const response = await base44.functions.invoke('migrateNotifications');
        setMigrationResult(response.data);
        alert(response.data.message || 'Migração concluída com sucesso!');
      } catch (error) {
        alert('Erro na migração: ' + error.message);
      } finally {
        setMigrating(false);
      }
    } else if (item.page) {
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
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
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
        {/* Barra de Pesquisa */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar configuração..."
              className="pl-11 h-12 rounded-xl border-slate-200 text-base"
            />
          </div>
        </div>

        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {menuItems.filter(item => {
              // Filtrar por busca
              if (!searchTerm) return true;
              if (item.type === 'divider') return false;
              const search = searchTerm.toLowerCase();
              return item.name?.toLowerCase().includes(search) || 
                     item.description?.toLowerCase().includes(search);
            }).map((item, index) => {
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
                // Não renderizar dividers se houver busca ativa
                if (searchTerm) return null;
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
                  disabled={migrating && item.action === 'migrate'}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${!isLast ? 'border-b border-slate-100' : ''} ${migrating && item.action === 'migrate' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </div>
                  {migrating && item.action === 'migrate' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />
                  ) : item.external ? (
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {searchTerm && menuItems.filter(item => {
          if (item.type === 'divider') return false;
          const search = searchTerm.toLowerCase();
          return item.name?.toLowerCase().includes(search) || 
                 item.description?.toLowerCase().includes(search);
        }).length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma configuração encontrada</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          Itens com <ExternalLink className="w-3 h-3 inline" /> abrem o painel Base44
        </p>
      </div>
    </div>
  );
}