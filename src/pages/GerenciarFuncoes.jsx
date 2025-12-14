import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Settings, Layout, Image } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const DEFAULT_CONFIG = {
  appName: 'Vagas Abertas',
  appSubtitle: 'Paraíba',
  logoUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg',
  pages: {
    page_home: { name: 'Início', enabled: true },
    page_jobs: { name: 'Vagas', enabled: true },
    page_feed: { name: 'Feed', enabled: true },
    page_profile: { name: 'Perfil', enabled: true },
    page_utilidades: { name: 'Utilidades', enabled: true },
    page_news: { name: 'Notícias', enabled: true },
    page_groups: { name: 'Grupos', enabled: true },
  },
  functions: {
    dark_mode: { name: 'Modo Escuro', enabled: true },
    push_notifications: { name: 'Notificações Push', enabled: true },
    job_favorites: { name: 'Favoritar Vagas', enabled: true },
    job_share: { name: 'Compartilhar Vagas', enabled: true },
    feed_comments: { name: 'Comentários no Feed', enabled: true },
    direct_messages: { name: 'Mensagens Diretas', enabled: true },
    whatsapp_groups: { name: 'Grupos WhatsApp', enabled: true },
    biblioteca: { name: 'Biblioteca', enabled: true },
  }
};

export default function GerenciarFuncoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('functions');

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                       user.subscription_type === 'admin' || 
                       user.role === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }

        // Carregar config salva
        const savedAppConfig = localStorage.getItem('app_config_v2');
        const savedPages = localStorage.getItem('app_pages_v2');
        const savedFunctions = localStorage.getItem('app_features_v2');
        
        if (savedAppConfig || savedPages || savedFunctions) {
          const appConfig = savedAppConfig ? JSON.parse(savedAppConfig) : {};
          const pagesConfig = savedPages ? JSON.parse(savedPages) : {};
          const functionsConfig = savedFunctions ? JSON.parse(savedFunctions) : {};
          
          setConfig({
            appName: appConfig.appName || DEFAULT_CONFIG.appName,
            appSubtitle: appConfig.appSubtitle || DEFAULT_CONFIG.appSubtitle,
            logoUrl: appConfig.logoUrl || DEFAULT_CONFIG.logoUrl,
            pages: Object.keys(DEFAULT_CONFIG.pages).reduce((acc, key) => {
              const savedPage = pagesConfig[key];
              acc[key] = {
                name: savedPage?.name || DEFAULT_CONFIG.pages[key].name,
                enabled: savedPage?.enabled !== undefined ? savedPage.enabled : DEFAULT_CONFIG.pages[key].enabled
              };
              return acc;
            }, {}),
            functions: Object.keys(DEFAULT_CONFIG.functions).reduce((acc, key) => {
              const savedFunc = functionsConfig[key];
              acc[key] = {
                name: savedFunc?.name || DEFAULT_CONFIG.functions[key].name,
                enabled: savedFunc?.enabled !== undefined ? savedFunc.enabled : DEFAULT_CONFIG.functions[key].enabled
              };
              return acc;
            }, {})
          });
        }
      } catch (error) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = () => {
    setSaving(true);
    
    // Salvar app config
    localStorage.setItem('app_config_v2', JSON.stringify({
      appName: config.appName,
      appSubtitle: config.appSubtitle,
      logoUrl: config.logoUrl
    }));
    
    // Salvar pages config
    const pagesForStorage = Object.keys(config.pages).reduce((acc, key) => {
      acc[key] = {
        name: config.pages[key].name,
        enabled: config.pages[key].enabled,
        category: 'Principal',
        type: 'page'
      };
      return acc;
    }, {});
    
    localStorage.setItem('app_pages_v2', JSON.stringify(pagesForStorage));
    
    // Salvar functions config
    const functionsForStorage = Object.keys(config.functions).reduce((acc, key) => {
      acc[key] = {
        name: config.functions[key].name,
        enabled: config.functions[key].enabled,
        category: 'Sistema',
        type: 'function'
      };
      return acc;
    }, {});
    
    localStorage.setItem('app_features_v2', JSON.stringify(functionsForStorage));
    
    // Notificar outras partes do app
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('app_config_updated'));
    
    toast.success('Salvo! Recarregando...');
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const updatePageName = (key, newName) => {
    setConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [key]: { ...prev.pages[key], name: newName }
      }
    }));
  };

  const togglePage = (key) => {
    setConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [key]: { ...prev.pages[key], enabled: !prev.pages[key].enabled }
      }
    }));
  };

  const updateFunctionName = (key, newName) => {
    setConfig(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [key]: { ...prev.functions[key], name: newName }
      }
    }));
  };

  const toggleFunction = (key) => {
    setConfig(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [key]: { ...prev.functions[key], enabled: !prev.functions[key].enabled }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-slate-800 dark:to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciar App</h1>
          <p className="text-white/80 text-sm mt-1">Personalize o nome, logo e navegação</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('functions')}
            variant={activeTab === 'functions' ? 'default' : 'outline'}
            className={activeTab === 'functions' ? 'bg-blue-600' : 'dark:bg-slate-800 dark:border-slate-700'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Funções
          </Button>
          <Button
            onClick={() => setActiveTab('pages')}
            variant={activeTab === 'pages' ? 'default' : 'outline'}
            className={activeTab === 'pages' ? 'bg-blue-600' : 'dark:bg-slate-800 dark:border-slate-700'}
          >
            <Layout className="w-4 h-4 mr-2" />
            Páginas
          </Button>
          <Button
            onClick={() => setActiveTab('app')}
            variant={activeTab === 'app' ? 'default' : 'outline'}
            className={activeTab === 'app' ? 'bg-blue-600' : 'dark:bg-slate-800 dark:border-slate-700'}
          >
            <Image className="w-4 h-4 mr-2" />
            Identidade
          </Button>
        </div>

        {/* Funções Tab */}
        {activeTab === 'functions' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Funcionalidades do App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(config.functions).map(([key, func]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Switch
                    checked={func.enabled}
                    onCheckedChange={() => toggleFunction(key)}
                  />
                  <Input
                    value={func.name}
                    onChange={(e) => updateFunctionName(key, e.target.value)}
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Nome da função"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Páginas Tab */}
        {activeTab === 'pages' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Páginas de Navegação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(config.pages).map(([key, page]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Switch
                    checked={page.enabled}
                    onCheckedChange={() => togglePage(key)}
                  />
                  <Input
                    value={page.name}
                    onChange={(e) => updatePageName(key, e.target.value)}
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Nome da página"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* App Tab */}
        {activeTab === 'app' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Identidade do App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Nome do App
                </label>
                <Input
                  value={config.appName}
                  onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Ex: Vagas Abertas"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Subtítulo
                </label>
                <Input
                  value={config.appSubtitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, appSubtitle: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Ex: Paraíba"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  URL do Logo
                </label>
                <Input
                  value={config.logoUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Cole a URL da imagem"
                />
              </div>

              {/* Preview */}
              <div className="border dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Prévia</p>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg">
                  <img 
                    src={config.logoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain rounded"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=Logo'}
                  />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">{config.appName}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">{config.appSubtitle}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}