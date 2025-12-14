import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, RefreshCw, Save, Loader2, Image, Type, Layout, Palette, Eye
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const DEFAULT_CONFIG = {
  // Identidade Visual
  appName: 'Vagas Abertas',
  appSubtitle: 'Paraíba',
  logoUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg',
  
  // Cores
  primaryColor: '#0A66C2',
  secondaryColor: '#004182',
  accentColor: '#057642',
  
  // Textos Personalizados
  homeTitle: 'Encontre Sua Próxima Oportunidade',
  homeSubtitle: 'A maior plataforma de empregos da Paraíba.',
  
  // Nomes de Páginas
  pages: {
    home: 'Início',
    jobs: 'Vagas',
    feed: 'Feed',
    profile: 'Perfil',
    utilidades: 'Utilidades',
    news: 'Notícias',
    groups: 'Grupos',
    subscription: 'Planos',
  }
};

export default function ModoConstutor() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('identity');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        const saved = localStorage.getItem('builder_config_v1');
        if (saved) {
          try {
            setConfig(JSON.parse(saved));
          } catch (e) {
            console.error('Erro ao carregar:', e);
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

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('builder_config_v1', JSON.stringify(config));
      toast.success('Alterações salvas! Clique em "Atualizar Aplicativo" para ver as mudanças.');
      setHasChanges(false);
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    toast.loading('Atualizando aplicativo...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Restaurar configurações padrão?')) {
      setConfig(DEFAULT_CONFIG);
      setHasChanges(true);
      toast.success('Configurações restauradas');
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updatePageName = (page, name) => {
    setConfig(prev => ({
      ...prev,
      pages: { ...prev.pages, [page]: name }
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'identity', label: 'Identidade', icon: Image },
    { id: 'colors', label: 'Cores', icon: Palette },
    { id: 'texts', label: 'Textos', icon: Type },
    { id: 'pages', label: 'Páginas', icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Modo Construtor</h1>
              <p className="text-white/80 text-sm">Personalize totalmente seu aplicativo</p>
            </div>
            {hasChanges && (
              <Badge className="bg-amber-500 text-white">Alterações não salvas</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 bg-green-600 hover:bg-green-700 h-14"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar Alterações
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-14"
          >
            {refreshing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2" />
            )}
            Atualizar Aplicativo
          </Button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className={`h-auto py-4 ${activeTab === tab.id ? 'bg-blue-600' : 'dark:bg-slate-700 dark:border-slate-600 dark:text-white'}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Identidade Visual */}
        {activeTab === 'identity' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Nome do Aplicativo
                </label>
                <Input
                  value={config.appName}
                  onChange={(e) => updateConfig('appName', e.target.value)}
                  placeholder="Ex: Vagas Abertas"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Subtítulo
                </label>
                <Input
                  value={config.appSubtitle}
                  onChange={(e) => updateConfig('appSubtitle', e.target.value)}
                  placeholder="Ex: Paraíba"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  URL do Logo
                </label>
                <Textarea
                  value={config.logoUrl}
                  onChange={(e) => updateConfig('logoUrl', e.target.value)}
                  placeholder="Cole a URL da imagem"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="border dark:border-slate-600 rounded-xl p-6 bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Prévia</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={config.logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                      {config.appName || 'Nome do App'}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {config.appSubtitle || 'Subtítulo'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cores */}
        {activeTab === 'colors' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Paleta de Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Cor Primária
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig('primaryColor', e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => updateConfig('primaryColor', e.target.value)}
                    placeholder="#0A66C2"
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Cor Secundária
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                    placeholder="#004182"
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Cor de Destaque
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => updateConfig('accentColor', e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={config.accentColor}
                    onChange={(e) => updateConfig('accentColor', e.target.value)}
                    placeholder="#057642"
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Textos */}
        {activeTab === 'texts' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Textos da Home</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Título Principal
                </label>
                <Input
                  value={config.homeTitle}
                  onChange={(e) => updateConfig('homeTitle', e.target.value)}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Subtítulo
                </label>
                <Textarea
                  value={config.homeSubtitle}
                  onChange={(e) => updateConfig('homeSubtitle', e.target.value)}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Páginas */}
        {activeTab === 'pages' && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Nomes das Páginas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.pages).map(([key, name]) => (
                <div key={key} className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-32 justify-center capitalize">
                    {key}
                  </Badge>
                  <Input
                    value={name}
                    onChange={(e) => updatePageName(key, e.target.value)}
                    className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        {hasChanges && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Você tem alterações não salvas. Salve e depois clique em "Atualizar Aplicativo" para aplicar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}