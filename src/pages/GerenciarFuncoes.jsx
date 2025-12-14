import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Settings, Layout, Image, ArrowUp, ArrowDown } from "lucide-react";
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
  },
  settings: [
    { id: 'divider-sistema', type: 'divider', label: 'Sistema', locked: true },
    { id: 'gerenciar-funcoes', name: 'Gerenciar Funções', description: 'Habilitar/desabilitar funções do app' },
    { id: 'dividerInteracoes', type: 'divider', label: 'Interações', locked: true },
    { id: 'favoritas', name: 'Favoritas', description: 'Vagas salvas como favoritas' },
    { id: 'historico', name: 'Histórico', description: 'Vagas visualizadas recentemente' },
    { id: 'mensagens', name: 'Mensagens', description: 'Conversas diretas entre usuários' },
    { id: 'feed', name: 'Feed', description: 'Posts, comentários e chat' },
    { id: 'transmissao', name: 'Lista de Transmissão', description: 'Enviar mensagens em massa' },
    { id: 'ocorrencias', name: 'Ocorrências', description: 'Gerenciar reports de vagas' },
    { id: 'curriculos', name: 'Ver Currículos', description: 'Visualizar currículos de candidatos' },
    { id: 'responder-chat', name: 'Responder Chat', description: 'Responder mensagens dos usuários' },
    { id: 'dividerRecrutador', type: 'divider', label: 'Área do Recrutador', locked: true },
    { id: 'recruiter-area', name: 'Painel do Recrutador', description: 'Ferramentas exclusivas para recrutadores' },
    { id: 'solicitacoes', name: 'Solicitações', description: 'Aprovar conteúdos de recrutadores' },
    { id: 'divider0', type: 'divider', label: 'Gerenciamento', locked: true },
    { id: 'permissoes', name: 'Permissões de Acesso', description: 'Controlar acesso às funções do app' },
    { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros' },
    { id: 'vagas', name: 'Gerenciar Vagas', description: 'Visualizar e excluir vagas' },
    { id: 'usuarios', name: 'Gerenciar Usuários', description: 'Aprovar e gerenciar usuários' },
    { id: 'planos', name: 'Gerenciar Planos', description: 'Controle de assinaturas e cobranças' },
    { id: 'precos', name: 'Gerenciar Preços', description: 'Ajustar valores dos planos' },
    { id: 'cores', name: 'Gerenciar Cores', description: 'Personalizar cores da aplicação' },
    { id: 'dividerProducao', type: 'divider', label: 'Ferramentas de Produção', locked: true },
    { id: 'postar-vaga', name: 'Postar Vagas', description: 'Criar novas vagas de emprego' },
    { id: 'posts-massa', name: 'Posts em Massa', description: 'Upload múltiplas imagens e extraia vagas com IA' },
    { id: 'vagas-ia', name: 'Vagas por IA', description: 'Gerar vagas com inteligência artificial' },
    { id: 'vagas-home', name: 'Vagas Home Office', description: 'Publicar vagas remotas' },
    { id: 'biblioteca', name: 'Biblioteca', description: 'Gerenciar materiais e recursos' },
    { id: 'noticias', name: 'Notícias', description: 'Criar, editar e gerenciar notícias' },
    { id: 'divider1', type: 'divider', label: 'Ferramentas', locked: true },
    { id: 'fluxo-usuarios', name: 'Fluxo de Usuários', description: 'Monitoramento em tempo real' },
    { id: 'analytics-app', name: 'Analytics do App', description: 'Análises em tempo real' },
    { id: 'payments', name: 'Pagamentos', description: 'Gerenciar pagamentos' },
  ]
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
        const savedSettings = localStorage.getItem('app_settings_v2');

        if (savedAppConfig || savedPages || savedFunctions || savedSettings) {
          const appConfig = savedAppConfig ? JSON.parse(savedAppConfig) : {};
          const pagesConfig = savedPages ? JSON.parse(savedPages) : {};
          const functionsConfig = savedFunctions ? JSON.parse(savedFunctions) : {};
          const settingsConfig = savedSettings ? JSON.parse(savedSettings) : DEFAULT_CONFIG.settings;

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
            }, {}),
            settings: settingsConfig
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

    // Salvar settings config
    localStorage.setItem('app_settings_v2', JSON.stringify(config.settings));

    // Notificar outras partes do app
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('app_config_updated'));
    
    toast.success('Salvo! Recarregando...');
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleRestore = () => {
    if (!confirm('Tem certeza que deseja restaurar todas as configurações para o padrão? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setSaving(true);
    
    // Limpar localStorage
    localStorage.removeItem('app_config_v2');
    localStorage.removeItem('app_pages_v2');
    localStorage.removeItem('app_features_v2');
    localStorage.removeItem('app_settings_v2');
    
    // Notificar
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('app_config_updated'));
    
    toast.success('Restaurado! Recarregando...');
    
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

  const moveItem = (type, index, direction) => {
    const items = type === 'functions' ? Object.entries(config.functions) : Object.entries(config.pages);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    const reordered = Object.fromEntries(newItems);
    
    setConfig(prev => ({
      ...prev,
      [type]: reordered
    }));
  };

  const moveSettingItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.settings.length) return;
    
    const newSettings = [...config.settings];
    const item = newSettings[index];
    
    // Se for um divider, mover o grupo inteiro
    if (item.type === 'divider') {
      // Encontrar o próximo divider
      let groupEnd = index + 1;
      while (groupEnd < newSettings.length && newSettings[groupEnd].type !== 'divider') {
        groupEnd++;
      }
      
      // Extrair o grupo (divider + itens)
      const group = newSettings.splice(index, groupEnd - index);
      
      // Calcular nova posição
      let targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Se for para cima, encontrar o início do grupo anterior
      if (direction === 'up' && targetIndex >= 0) {
        while (targetIndex > 0 && newSettings[targetIndex - 1].type !== 'divider') {
          targetIndex--;
        }
      }
      
      // Se for para baixo, pular o próximo grupo
      if (direction === 'down' && targetIndex < newSettings.length) {
        while (targetIndex < newSettings.length && newSettings[targetIndex].type !== 'divider') {
          targetIndex++;
        }
      }
      
      // Inserir o grupo na nova posição
      newSettings.splice(Math.max(0, Math.min(targetIndex, newSettings.length)), 0, ...group);
    } else {
      // Mover item individual normalmente
      [newSettings[index], newSettings[newIndex]] = [newSettings[newIndex], newSettings[index]];
    }
    
    setConfig(prev => ({
      ...prev,
      settings: newSettings
    }));
  };

  const updateSettingName = (index, field, value) => {
    const newSettings = [...config.settings];
    newSettings[index] = { ...newSettings[index], [field]: value };
    
    setConfig(prev => ({
      ...prev,
      settings: newSettings
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
        <div className="grid grid-cols-2 gap-2 mb-4">
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
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('settings')}
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            className={activeTab === 'settings' ? 'bg-blue-600' : 'dark:bg-slate-800 dark:border-slate-700'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
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
              {Object.entries(config.functions).map(([key, func], index) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveItem('functions', index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveItem('functions', index, 'down')}
                      disabled={index === Object.keys(config.functions).length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
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
              {Object.entries(config.pages).map(([key, page], index) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveItem('pages', index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveItem('pages', index, 'down')}
                      disabled={index === Object.keys(config.pages).length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Itens das Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.settings.map((setting, index) => {
                if (setting.type === 'divider') {
                  return (
                    <div key={setting.id} className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSettingItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSettingItem(index, 'down')}
                          disabled={index === config.settings.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <span>{setting.label}</span>
                          <span className="text-[10px] text-slate-400 normal-case font-normal">• Bloqueado para edição</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={setting.id} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSettingItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSettingItem(index, 'down')}
                        disabled={index === config.settings.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={setting.name}
                        onChange={(e) => updateSettingName(index, 'name', e.target.value)}
                        className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="Nome da configuração"
                      />
                      <Input
                        value={setting.description}
                        onChange={(e) => updateSettingName(index, 'description', e.target.value)}
                        className="dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                        placeholder="Descrição"
                      />
                    </div>
                  </div>
                );
              })}
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

        {/* Action Buttons */}
        <div className="space-y-3">
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

          <Button
            onClick={handleRestore}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 dark:border-slate-600"
          >
            Restaurar Padrão
          </Button>
        </div>
      </div>
    </div>
  );
}