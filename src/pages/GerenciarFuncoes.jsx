import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Save, Search, Loader2, CheckCircle, XCircle, Settings
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const DEFAULT_FEATURES = {
  // Sistema
  dark_mode: { name: 'Modo Escuro', category: 'Sistema', enabled: true },
  push_notifications: { name: 'Notificações Push', category: 'Sistema', enabled: true },
  
  // Vagas
  job_search: { name: 'Buscar Vagas', category: 'Vagas', enabled: true },
  job_filters: { name: 'Filtros de Vagas', category: 'Vagas', enabled: true },
  job_favorites: { name: 'Favoritar Vagas', category: 'Vagas', enabled: true },
  job_history: { name: 'Histórico de Vagas', category: 'Vagas', enabled: true },
  job_share: { name: 'Compartilhar Vagas', category: 'Vagas', enabled: true },
  
  // Social
  feed: { name: 'Feed Social', category: 'Social', enabled: true },
  feed_comments: { name: 'Comentários no Feed', category: 'Social', enabled: true },
  direct_messages: { name: 'Mensagens Diretas', category: 'Social', enabled: true },
  whatsapp_groups: { name: 'Grupos WhatsApp', category: 'Social', enabled: true },
  
  // Conteúdo
  news: { name: 'Notícias', category: 'Conteúdo', enabled: true },
  biblioteca: { name: 'Biblioteca', category: 'Conteúdo', enabled: true },
  utilidades: { name: 'Utilidades', category: 'Conteúdo', enabled: true },
  
  // Premium
  premium_jobs: { name: 'Vagas Premium', category: 'Premium', enabled: true },
  premium_curriculum: { name: 'Currículos Premium', category: 'Premium', enabled: true },
  recruiter_area: { name: 'Área Recrutador', category: 'Premium', enabled: true },
  
  // Suporte
  chat_support: { name: 'Chat de Suporte', category: 'Suporte', enabled: true },
  report_system: { name: 'Sistema de Denúncias', category: 'Suporte', enabled: true },
  
  // Admin
  analytics: { name: 'Analytics', category: 'Admin', enabled: true },
  user_management: { name: 'Gerenciar Usuários', category: 'Admin', enabled: true },
  job_management: { name: 'Gerenciar Vagas', category: 'Admin', enabled: true },
  broadcast: { name: 'Lista de Transmissão', category: 'Admin', enabled: true },
};

export default function GerenciarFuncoes() {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
        const saved = localStorage.getItem('app_features_v2');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setFeatures(parsed);
          } catch (e) {
            console.error('Erro ao carregar configurações:', e);
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

  const handleToggle = (key) => {
    setFeatures(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('app_features_v2', JSON.stringify(features));
      toast.success('Configurações salvas!');
      setHasChanges(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Restaurar configurações padrão?')) {
      setFeatures(DEFAULT_FEATURES);
      setHasChanges(true);
      toast.success('Configurações restauradas');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Filtrar e agrupar por categoria
  const filtered = Object.entries(features).filter(([key, feature]) =>
    feature.name.toLowerCase().includes(search.toLowerCase()) ||
    feature.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(Object.values(features).map(f => f.category))];
  const enabledCount = Object.values(features).filter(f => f.enabled).length;
  const totalCount = Object.keys(features).length;

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
        {/* Actions Bar */}
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar função..."
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

        {/* Features by Category */}
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
                  {categoryFeatures.map(([key, feature]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {feature.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 dark:text-white">
                          {feature.name}
                        </span>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => handleToggle(key)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhuma função encontrada</p>
            </CardContent>
          </Card>
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