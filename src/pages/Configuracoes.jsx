import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Key, Users, Database, BarChart3, 
  Globe, Plug, Code, Bot, FileText, Settings, ChevronRight, 
  ExternalLink, Lock, CreditCard, Briefcase, MessageSquare, Newspaper, ClipboardList,
  PlusCircle, Sparkles, Home, BookOpen, Heart, History, MessageCircle, Shield, Crown, AlertCircle, Search, Palette, MapPin, Trash2, Image
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const menuItems = [
  // Sistema
  { id: 'divider-sistema', type: 'divider', label: 'Sistema', roles: ['admin', 'dono'] },
  { id: 'gerenciar-funcoes', name: 'Gerenciar Funções', icon: Settings, color: 'purple', page: 'GerenciarFuncoes', description: 'Habilitar/desabilitar funções do app', roles: ['admin', 'dono'] },
  { id: 'popups', name: 'Gerenciar Popups', icon: AlertCircle, color: 'indigo', page: 'GerenciarPopups', description: 'Avisos e mensagens no app', roles: ['admin', 'dono'] },
  { id: 'permissoes', name: 'Permissões de Acesso', icon: Shield, color: 'purple', page: 'Permissoes', description: 'Controlar acesso às funções do app', roles: ['admin', 'dono'], permissionId: 'permissoes' },
  { id: 'cores', name: 'Gerenciar Cores', icon: Palette, color: 'pink', page: 'GerenciarCores', description: 'Personalizar cores da aplicação', roles: ['admin', 'dono'] },

  // Gerenciamento
  { id: 'divider0', type: 'divider', label: 'Gerenciamento' },
  { id: 'anuncios', name: 'Gerenciar Anúncios', icon: Settings, color: 'orange', page: 'GerenciarAnuncios', description: 'Configurar anúncios do AdsTerra', roles: ['admin', 'dono'] },
  { id: 'notificacoes-admin', name: 'Notificações de Admin', icon: AlertCircle, color: 'amber', page: 'NotificacoesAdmin', description: 'Habilitar/desabilitar notificações do sininho', roles: ['admin', 'dono'] },
  { id: 'vagas', name: 'Gerenciar Vagas', icon: Briefcase, color: 'indigo', page: 'GerenciarVagas', description: 'Visualizar e excluir vagas', permissionId: 'gerenciar_vagas' },
  { id: 'apagar-vagas-periodo', name: 'Apagar Vagas por Período', icon: Trash2, color: 'red', page: 'ApagarVagasPorPeriodo', description: 'Remover vagas antigas do sistema', roles: ['admin', 'dono'] },
  { id: 'delete-no-contact', name: 'Excluir Vagas Sem Contato', icon: Trash2, color: 'orange', page: 'ExcluirVagasSemContato', description: 'Remove vagas sem informação de contato', roles: ['admin', 'dono'] },
  { id: 'usuarios', name: 'Gerenciar Usuários', icon: Users, color: 'blue', page: 'GerenciarUsuarios', description: 'Aprovar e gerenciar usuários', permissionId: 'gerenciar_usuarios' },
  { id: 'noticias', name: 'Notícias', icon: Newspaper, color: 'rose', page: 'GerenciarNoticias', description: 'Criar e gerenciar notícias', permissionId: 'noticias' },
  { id: 'feed', name: 'Feed', icon: MessageSquare, color: 'pink', page: 'GerenciarComunidade', description: 'Posts, comentários e chat', permissionId: 'gerenciar_comunidade' },
  { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', icon: Settings, color: 'slate', page: 'GerenciadorFiltros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros', permissionId: 'gerenciador_filtros' },
  { id: 'biblioteca', name: 'Biblioteca', icon: BookOpen, color: 'orange', page: 'BibliotecaAdmin', description: 'Gerenciar materiais e recursos', permissionId: 'biblioteca_admin' },
  { id: 'planos', name: 'Gerenciar Planos', icon: Crown, color: 'purple', page: 'GerenciarPlanos', description: 'Controle de assinaturas e cobranças', roles: ['admin', 'dono'], permissionId: 'gerenciar_planos' },
  { id: 'precos', name: 'Gerenciar Preços', icon: Settings, color: 'emerald', page: 'GerenciarPrecos', description: 'Ajustar valores dos planos', roles: ['admin', 'dono'] },
  { id: 'acessos', name: 'Gerenciar Acessos', icon: Key, color: 'purple', page: 'GerenciarAcessos', description: 'Links de ativação únicos', roles: ['admin', 'dono'] },
  
  // Ferramentas de Produção
  { id: 'dividerProducao', type: 'divider', label: 'Ferramentas de Produção' },
  { id: 'postar-vaga', name: 'Postar Vagas', icon: PlusCircle, color: 'blue', page: 'PostarVaga', description: 'Criar novas vagas de emprego', permissionId: 'postar_vagas' },
  { id: 'posts-massa', name: 'Posts em Massa', icon: Sparkles, color: 'purple', page: 'PostsEmMassa', description: 'Upload múltiplas imagens e extraia vagas com IA', permissionId: 'posts_massa' },
  { id: 'posts-massa-txt', name: 'Posts em Massa TXT', icon: FileText, color: 'indigo', page: 'PostsEmMassaTXT', description: 'Upload arquivos TXT/DOC/PDF e extraia até 50 vagas', permissionId: 'posts_massa_txt' },
  { id: 'vagas-ia', name: 'Vagas por IA', icon: Sparkles, color: 'violet', page: 'VagasPorIA', description: 'Gerar vagas com inteligência artificial', permissionId: 'vagas_ia' },
  { id: 'vagas-home', name: 'Vagas Home Office', icon: Home, color: 'teal', page: 'VagasHomeOffice', description: 'Publicar vagas remotas', permissionId: 'vagas_home_office' },


  
  // Área do Recrutador
  { id: 'dividerRecrutador', type: 'divider', label: 'Área do Recrutador', roles: ['recruiter', 'admin', 'dono'] },
  { id: 'recruiter-area', name: 'Painel do Recrutador', icon: Briefcase, color: 'blue', page: 'RecruiterArea', description: 'Ferramentas exclusivas para recrutadores', roles: ['recruiter', 'admin', 'dono'], permissionId: 'recruiter_area' },
  { id: 'solicitacoes', name: 'Solicitações', icon: ClipboardList, color: 'orange', page: 'GerenciarSolicitacoes', description: 'Aprovar conteúdos de recrutadores', roles: ['admin', 'dono'], permissionId: 'solicitacoes' },
  
  // Assistente IA
  { id: 'dividerAssistente', type: 'divider', label: 'Assistente IA', roles: ['admin', 'dono'] },
  { id: 'agentes', name: 'Agentes de IA', icon: Bot, color: 'purple', page: 'Agentes', description: 'Chat com assistentes inteligentes (Dev, Público e Validador)', roles: ['admin', 'dono'] },
  { id: 'banco-dados-assistente', name: 'Banco de Dados do Assistente', icon: MessageCircle, color: 'cyan', page: 'BancoDadosAssistente', description: 'Histórico completo de conversas da IA', roles: ['admin', 'dono'] },

  // Interações
  { id: 'dividerInteracoes', type: 'divider', label: 'Interações' },
  { id: 'favoritas', name: 'Favoritas', icon: Heart, color: 'rose', page: 'Favoritos', description: 'Vagas salvas como favoritas', permissionId: 'favoritas' },
  { id: 'historico', name: 'Histórico', icon: History, color: 'violet', page: 'Historico', description: 'Vagas visualizadas recentemente', permissionId: 'historico' },
  { id: 'curriculos', name: 'Ver Currículos', icon: FileText, color: 'teal', page: 'ProfessionalResume', description: 'Visualizar currículos de candidatos', permissionId: 'curriculos' },
  
  // Analytics e Monitoramento
  { id: 'divider1', type: 'divider', label: 'Analytics e Monitoramento' },
  { id: 'analytics-app', name: 'Analytics do App', icon: BarChart3, color: 'purple', page: 'AnalyticsPage', description: 'Análises em tempo real', permissionId: 'analytics' },
  { id: 'payments', name: 'Pagamentos', icon: CreditCard, color: 'green', page: 'PaymentsPage', description: 'Gerenciar pagamentos', permissionId: 'pagamentos' },
  
  // Manutenção
  { id: 'divider-manutencao', type: 'divider', label: 'Manutenção', roles: ['admin', 'dono'] },
  { id: 'update-jobs-location', name: 'Atualizar Localização de Vagas', icon: MapPin, color: 'blue', action: 'updateJobs', description: 'Atualizar cidade/UF de vagas antigas', roles: ['admin', 'dono'] },
  { id: 'migrate-notifications', name: 'Migrar Notificações', icon: Database, color: 'amber', action: 'migrate', description: 'Atualizar notificações antigas (executar 1x)', roles: ['admin', 'dono'] },
  

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
  const [items, setItems] = useState(() => {
    // Sempre usar menuItems atualizados (prioriza código sobre cache)
    // Tenta mesclar nomes customizados do localStorage, mas mantém estrutura atual
    try {
      const savedSettings = localStorage.getItem('app_settings_v2');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return menuItems.map(item => {
          const saved = parsed.find(s => s.id === item.id);
          if (saved && saved.name) {
            return { ...item, name: saved.name, description: saved.description || item.description };
          }
          return item;
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações:', e);
    }
    return menuItems;
  });

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
    if (item.action === 'updateJobs') {
      if (!confirm('Atualizar cidade/UF de todas as vagas antigas? Pode levar alguns minutos.')) return;
      
      setMigrating(true);
      try {
        const response = await base44.functions.invoke('updateJobsLocation');
        alert(response.data.message || 'Atualização concluída!');
      } catch (error) {
        alert('Erro: ' + error.message);
      } finally {
        setMigrating(false);
      }
    } else if (item.action === 'migrate') {
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
    } else if (item.action === 'deleteNoContact') {
      if (!confirm('ATENÇÃO: Isso irá excluir TODAS as vagas sem informação de contato. Deseja continuar?')) return;
      
      setMigrating(true);
      try {
        const response = await base44.functions.invoke('deleteJobsWithoutContact');
        alert(response.data.message || 'Exclusão concluída!');
        console.log('Resultado:', response.data);
      } catch (error) {
        alert('Erro: ' + error.message);
      } finally {
        setMigrating(false);
      }
    } else if (item.page) {
      window.location.href = createPageUrl(item.page);
    } else if (item.external) {
      window.open(item.externalUrl || 'https://app.base44.com', '_blank');
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
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4 transition-colors">
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

        <Card className="rounded-2xl overflow-hidden dark:bg-slate-800 transition-colors">
          <CardContent className="p-0">
            {items.filter(item => {
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
                  <div key={item.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-b dark:border-slate-600 transition-colors">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
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
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''} ${migrating && item.action === 'migrate' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
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

        {searchTerm && items.filter(item => {
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