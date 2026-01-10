import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const AD_TYPES = [
  { id: 'popunder', name: 'Popunder', description: 'Anúncio que abre em nova aba' },
  { id: 'native_banner', name: 'Native Banner', description: 'Banner integrado ao conteúdo' },
  { id: 'social_bar', name: 'Social Bar', description: 'Barra lateral social' },
  { id: 'banner_160x300', name: 'Banner 160x300', description: 'Banner vertical pequeno' },
  { id: 'banner_460x60', name: 'Banner 460x60', description: 'Banner horizontal médio' },
  { id: 'banner_300x250', name: 'Banner 300x250', description: 'Banner médio quadrado' },
  { id: 'banner_160x600', name: 'Banner 160x600', description: 'Banner vertical grande' },
  { id: 'banner_320x50', name: 'Banner 320x50', description: 'Banner mobile footer' },
  { id: 'banner_728x90', name: 'Banner 728x90', description: 'Banner desktop header' },
];

const PAGES = [
  { id: 'Home', name: 'Home' },
  { id: 'Jobs', name: 'Vagas' },
  { id: 'JobDetail', name: 'Detalhe da Vaga' },
  { id: 'News', name: 'Notícias' },
  { id: 'NewsDetail', name: 'Detalhe da Notícia' },
  { id: 'Feed', name: 'Feed' },
  { id: 'Profile', name: 'Perfil' },
];

export default function GerenciarAnuncios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isDono = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser.subscription_type === 'dono';
        const isAdmin = currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        
        if (!isDono && !isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        loadConfig();
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('adsterra_config');
      if (saved) {
        setConfig(JSON.parse(saved));
      } else {
        // Config padrão: tudo desativado
        const defaultConfig = {};
        AD_TYPES.forEach(ad => {
          defaultConfig[ad.id] = {
            enabled: false,
            pages: {}
          };
          PAGES.forEach(page => {
            defaultConfig[ad.id].pages[page.id] = false;
          });
        });
        setConfig(defaultConfig);
      }
    } catch (e) {
      console.error('Erro ao carregar config:', e);
    }
  };

  const handleToggleAdType = (adTypeId) => {
    setConfig(prev => ({
      ...prev,
      [adTypeId]: {
        ...prev[adTypeId],
        enabled: !prev[adTypeId]?.enabled
      }
    }));
  };

  const handleTogglePage = (adTypeId, pageId) => {
    setConfig(prev => ({
      ...prev,
      [adTypeId]: {
        ...prev[adTypeId],
        pages: {
          ...prev[adTypeId]?.pages,
          [pageId]: !prev[adTypeId]?.pages?.[pageId]
        }
      }
    }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('adsterra_config', JSON.stringify(config));
      window.dispatchEvent(new Event('adsterra_config_updated'));
      toast.success('Configurações salvas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = () => {
    const newConfig = { ...config };
    AD_TYPES.forEach(ad => {
      newConfig[ad.id] = {
        enabled: true,
        pages: {}
      };
      PAGES.forEach(page => {
        newConfig[ad.id].pages[page.id] = true;
      });
    });
    setConfig(newConfig);
  };

  const handleDisableAll = () => {
    const newConfig = { ...config };
    AD_TYPES.forEach(ad => {
      newConfig[ad.id] = {
        enabled: false,
        pages: {}
      };
      PAGES.forEach(page => {
        newConfig[ad.id].pages[page.id] = false;
      });
    });
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Anúncios</h1>
          <p className="text-white/70 text-sm">Configure os anúncios do AdsTerra por tipo e página</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Ações Globais */}
        <Card className="mb-6 rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Ações Rápidas</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ativar ou desativar todos os anúncios</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleEnableAll}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ativar Todos
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisableAll}
                  className="gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Desativar Todos
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#0A66C2] hover:bg-[#004182] gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Importante</p>
            <p className="text-amber-700 dark:text-amber-300">
              Após ativar os anúncios, você precisará colar os scripts reais do AdsTerra nos arquivos de código.
              As configurações aqui apenas controlam se os anúncios são exibidos ou não.
            </p>
          </div>
        </div>

        {/* Lista de Anúncios */}
        <div className="space-y-6">
          {AD_TYPES.map((adType) => {
            const isEnabled = config[adType.id]?.enabled || false;
            const enabledPages = PAGES.filter(p => config[adType.id]?.pages?.[p.id]).length;

            return (
              <Card key={adType.id} className="rounded-2xl border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{adType.name}</CardTitle>
                        <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}>
                          {isEnabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{adType.description}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleAdType(adType.id)}
                    />
                  </div>
                </CardHeader>
                
                {isEnabled && (
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
                      Páginas ({enabledPages}/{PAGES.length} ativas)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {PAGES.map((page) => {
                        const pageEnabled = config[adType.id]?.pages?.[page.id] || false;
                        
                        return (
                          <div
                            key={page.id}
                            onClick={() => handleTogglePage(adType.id, page.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              pageEnabled
                                ? 'border-[#0A66C2] bg-[#0A66C2]/5 dark:bg-[#0A66C2]/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {page.name}
                              </span>
                              {pageEnabled && (
                                <Eye className="w-4 h-4 text-[#0A66C2]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}