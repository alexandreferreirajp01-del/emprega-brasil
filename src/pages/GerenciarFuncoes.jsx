import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Save, Search, Loader2, CheckCircle, XCircle, Settings, Edit2, FileText, Layout, Image, Type, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_FEATURES = {
  // Sistema
  dark_mode: { name: 'Modo Escuro', category: 'Sistema', enabled: true, type: 'function' },
  push_notifications: { name: 'Notificações Push', category: 'Sistema', enabled: true, type: 'function' },
  
  // Vagas
  job_search: { name: 'Buscar Vagas', category: 'Vagas', enabled: true, type: 'function' },
  job_filters: { name: 'Filtros de Vagas', category: 'Vagas', enabled: true, type: 'function' },
  job_favorites: { name: 'Favoritar Vagas', category: 'Vagas', enabled: true, type: 'function' },
  job_history: { name: 'Histórico de Vagas', category: 'Vagas', enabled: true, type: 'function' },
  job_share: { name: 'Compartilhar Vagas', category: 'Vagas', enabled: true, type: 'function' },
  
  // Social
  feed: { name: 'Feed Social', category: 'Social', enabled: true, type: 'function' },
  feed_comments: { name: 'Comentários no Feed', category: 'Social', enabled: true, type: 'function' },
  direct_messages: { name: 'Mensagens Diretas', category: 'Social', enabled: true, type: 'function' },
  whatsapp_groups: { name: 'Grupos WhatsApp', category: 'Social', enabled: true, type: 'function' },
  
  // Conteúdo
  news: { name: 'Notícias', category: 'Conteúdo', enabled: true, type: 'function' },
  biblioteca: { name: 'Biblioteca', category: 'Conteúdo', enabled: true, type: 'function' },
  utilidades: { name: 'Utilidades', category: 'Conteúdo', enabled: true, type: 'function' },
  
  // Premium
  premium_jobs: { name: 'Vagas Premium', category: 'Premium', enabled: true, type: 'function' },
  premium_curriculum: { name: 'Currículos Premium', category: 'Premium', enabled: true, type: 'function' },
  recruiter_area: { name: 'Área Recrutador', category: 'Premium', enabled: true, type: 'function' },
  
  // Suporte
  chat_support: { name: 'Chat de Suporte', category: 'Suporte', enabled: true, type: 'function' },
  report_system: { name: 'Sistema de Denúncias', category: 'Suporte', enabled: true, type: 'function' },
  
  // Admin
  analytics: { name: 'Analytics', category: 'Admin', enabled: true, type: 'function' },
  user_management: { name: 'Gerenciar Usuários', category: 'Admin', enabled: true, type: 'function' },
  job_management: { name: 'Gerenciar Vagas', category: 'Admin', enabled: true, type: 'function' },
  broadcast: { name: 'Lista de Transmissão', category: 'Admin', enabled: true, type: 'function' },
};

const DEFAULT_PAGES = {
  // Páginas Principais
  page_home: { name: 'Início', category: 'Principal', enabled: true, type: 'page' },
  page_jobs: { name: 'Vagas', category: 'Principal', enabled: true, type: 'page' },
  page_feed: { name: 'Feed', category: 'Principal', enabled: true, type: 'page' },
  page_profile: { name: 'Perfil', category: 'Principal', enabled: true, type: 'page' },
  page_utilidades: { name: 'Utilidades', category: 'Principal', enabled: true, type: 'page' },
  
  // Páginas de Vagas
  page_job_detail: { name: 'Detalhes da Vaga', category: 'Vagas', enabled: true, type: 'page' },
  page_favoritos: { name: 'Favoritos', category: 'Vagas', enabled: true, type: 'page' },
  page_historico: { name: 'Histórico', category: 'Vagas', enabled: true, type: 'page' },
  
  // Páginas Sociais
  page_mensagens: { name: 'Mensagens', category: 'Social', enabled: true, type: 'page' },
  page_groups: { name: 'Grupos', category: 'Social', enabled: true, type: 'page' },
  
  // Páginas de Conteúdo
  page_news: { name: 'Notícias', category: 'Conteúdo', enabled: true, type: 'page' },
  page_news_detail: { name: 'Detalhe da Notícia', category: 'Conteúdo', enabled: true, type: 'page' },
  
  // Páginas Premium
  page_subscription: { name: 'Planos', category: 'Premium', enabled: true, type: 'page' },
  page_resume: { name: 'Currículos', category: 'Premium', enabled: true, type: 'page' },
  page_recruiter: { name: 'Área Recrutador', category: 'Premium', enabled: true, type: 'page' },
  
  // Páginas Institucionais
  page_about: { name: 'Sobre', category: 'Institucional', enabled: true, type: 'page' },
  page_contact: { name: 'Contato', category: 'Institucional', enabled: true, type: 'page' },
  page_faq: { name: 'FAQ', category: 'Institucional', enabled: true, type: 'page' },
  page_terms: { name: 'Termos de Uso', category: 'Institucional', enabled: true, type: 'page' },
  page_privacy: { name: 'Privacidade', category: 'Institucional', enabled: true, type: 'page' },
  page_parcerias: { name: 'Parcerias', category: 'Institucional', enabled: true, type: 'page' },
  
  // Páginas Admin
  page_configuracoes: { name: 'Configurações', category: 'Admin', enabled: true, type: 'page' },
  page_analytics: { name: 'Analytics', category: 'Admin', enabled: true, type: 'page' },
  page_gerenciar_usuarios: { name: 'Gerenciar Usuários', category: 'Admin', enabled: true, type: 'page' },
  page_gerenciar_vagas: { name: 'Gerenciar Vagas', category: 'Admin', enabled: true, type: 'page' },
  page_gerenciar_noticias: { name: 'Gerenciar Notícias', category: 'Admin', enabled: true, type: 'page' },
};

export default function GerenciarFuncoes() {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('functions');
  const [editingItem, setEditingItem] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [appConfig, setAppConfig] = useState({
    appName: 'Vagas Abertas',
    appSubtitle: 'Paraíba',
    logoUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                       user.subscription_type === 'admin' || 
                       user.subscription_type === 'dono' ||
                       user.role === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }

        // Carregar configurações salvas
        const savedFeatures = localStorage.getItem('app_features_v2');
        if (savedFeatures) {
          try {
            setFeatures(JSON.parse(savedFeatures));
          } catch (e) {
            console.error('Erro ao carregar funções:', e);
          }
        }
        
        const savedPages = localStorage.getItem('app_pages_v2');
        if (savedPages) {
          try {
            setPages(JSON.parse(savedPages));
          } catch (e) {
            console.error('Erro ao carregar páginas:', e);
          }
        }
        
        const savedAppConfig = localStorage.getItem('app_config_v2');
        if (savedAppConfig) {
          try {
            setAppConfig(JSON.parse(savedAppConfig));
          } catch (e) {
            console.error('Erro ao carregar configurações do app:', e);
          }
        }
      } catch (error) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = (key, isPage = false) => {
    if (isPage) {
      setPages(prev => ({
        ...prev,
        [key]: { ...prev[key], enabled: !prev[key].enabled }
      }));
    } else {
      setFeatures(prev => ({
        ...prev,
        [key]: { ...prev[key], enabled: !prev[key].enabled }
      }));
    }
    setHasChanges(true);
  };

  const handleEditName = (key, newName, isPage = false) => {
    if (isPage) {
      setPages(prev => ({
        ...prev,
        [key]: { ...prev[key], name: newName }
      }));
    } else {
      setFeatures(prev => ({
        ...prev,
        [key]: { ...prev[key], name: newName }
      }));
    }
    setEditingItem(null);
    setHasChanges(true);
    toast.success('Nome atualizado!');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('app_features_v2', JSON.stringify(features));
      localStorage.setItem('app_pages_v2', JSON.stringify(pages));
      localStorage.setItem('app_config_v2', JSON.stringify(appConfig));
      toast.success('Alterações salvas! Recarregando...');
      setHasChanges(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Restaurar configurações padrão?')) {
      if (activeTab === 'functions') {
        setFeatures(DEFAULT_FEATURES);
      } else {
        setPages(DEFAULT_PAGES);
      }
      setHasChanges(true);
      toast.success('Configurações restauradas');
    }
  };

  const handleUpdateItem = async (key, isPage = false) => {
    setUpdatingItem(key);
    try {
      // Salvar tudo no localStorage
      localStorage.setItem('app_features_v2', JSON.stringify(features));
      localStorage.setItem('app_pages_v2', JSON.stringify(pages));
      localStorage.setItem('app_config_v2', JSON.stringify(appConfig));
      
      // Disparar evento para notificar o app
      window.dispatchEvent(new Event('app_config_updated'));
      
      setHasChanges(false);
      toast.success('Aplicado! Recarregando...');
      
      // Forçar reload completo
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 600);
    } catch (error) {
      toast.error('Erro ao aplicar');
      setUpdatingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Dados ativos baseado na aba
  const activeData = activeTab === 'functions' ? features : pages;
  
  // Filtrar e agrupar por categoria
  const filtered = Object.entries(activeData).filter(([key, item]) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(Object.values(activeData).map(f => f.category))];
  const enabledCount = Object.values(activeData).filter(f => f.enabled).length;
  const totalCount = Object.keys(activeData).length;
  
  const functionsEnabled = Object.values(features).filter(f => f.enabled).length;
  const pagesEnabled = Object.values(pages).filter(p => p.enabled).length;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Gerenciar Funções</h1>
              <p className="text-white/80 text-sm">Controle as funcionalidades do aplicativo</p>
            </div>
            <div className="flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{enabledCount}/{totalCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('functions')}
            variant={activeTab === 'functions' ? 'default' : 'outline'}
            className={`${activeTab === 'functions' ? 'bg-blue-600' : 'dark:bg-slate-700 dark:border-slate-600 dark:text-white'}`}
          >
            <Settings className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Funções ({functionsEnabled})</span>
          </Button>
          <Button
            onClick={() => setActiveTab('pages')}
            variant={activeTab === 'pages' ? 'default' : 'outline'}
            className={`${activeTab === 'pages' ? 'bg-blue-600' : 'dark:bg-slate-700 dark:border-slate-600 dark:text-white'}`}
          >
            <Layout className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Páginas ({pagesEnabled})</span>
          </Button>
          <Button
            onClick={() => setActiveTab('app')}
            variant={activeTab === 'app' ? 'default' : 'outline'}
            className={`${activeTab === 'app' ? 'bg-blue-600' : 'dark:bg-slate-700 dark:border-slate-600 dark:text-white'}`}
          >
            <Image className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">App</span>
          </Button>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Buscar ${activeTab === 'functions' ? 'função' : 'página'}...`}
                  className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white whitespace-nowrap"
              >
                <Settings className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Config Tab */}
        {activeTab === 'app' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Configurações do Aplicativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Nome do Aplicativo
                </label>
                <Input
                  value={appConfig.appName}
                  onChange={(e) => {
                    setAppConfig(prev => ({ ...prev, appName: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Ex: Vagas Abertas"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Subtítulo do Aplicativo
                </label>
                <Input
                  value={appConfig.appSubtitle}
                  onChange={(e) => {
                    setAppConfig(prev => ({ ...prev, appSubtitle: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Ex: Paraíba"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  URL do Logo
                </label>
                <Textarea
                  value={appConfig.logoUrl}
                  onChange={(e) => {
                    setAppConfig(prev => ({ ...prev, logoUrl: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Cole a URL da imagem do logo"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="border dark:border-slate-600 rounded-xl p-6 bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Prévia</p>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={appConfig.logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48?text=Logo';
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                      {appConfig.appName || 'Nome do App'}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {appConfig.appSubtitle || 'Subtítulo'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features by Category */}
        {activeTab !== 'app' && (
          <div className="space-y-4">
          {categories.map(category => {
            const categoryFeatures = filtered.filter(([_, f]) => f.category === category);
            if (categoryFeatures.length === 0) return null;

            const categoryEnabled = categoryFeatures.filter(([_, f]) => f.enabled).length;
            const categoryTotal = categoryFeatures.length;

            return (
              <Card key={category} className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg dark:text-white">{category}</CardTitle>
                    <Badge variant={categoryEnabled === categoryTotal ? "default" : "secondary"}>
                      {categoryEnabled}/{categoryTotal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryFeatures.map(([key, item]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        {editingItem === key ? (
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              if (activeTab === 'pages') {
                                setPages(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], name: newName }
                                }));
                              } else {
                                setFeatures(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], name: newName }
                                }));
                              }
                            }}
                            onBlur={() => {
                              setEditingItem(null);
                              setHasChanges(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingItem(null);
                                setHasChanges(true);
                                toast.success('Nome atualizado!');
                              }
                            }}
                            className="h-8 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-slate-800 dark:text-white truncate">
                            {item.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateItem(key, activeTab === 'pages')}
                          disabled={updatingItem === key}
                          className="h-8 w-8"
                          title="Aplicar alterações agora"
                        >
                          {updatingItem === key ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingItem(key)}
                          className="h-8 w-8"
                          title="Editar nome"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </Button>
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={() => handleToggle(key, activeTab === 'pages')}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Empty State */}
          {filtered.length === 0 && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhuma função encontrada</p>
            </CardContent>
          </Card>
          )}
        </div>
        )}

        {/* Info */}
        {hasChanges && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}