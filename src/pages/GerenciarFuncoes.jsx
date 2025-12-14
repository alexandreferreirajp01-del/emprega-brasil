import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Loader2, Lock, Save, Eye, EyeOff, CheckCircle, Moon, Sun
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MASTER_PASSWORD = "Vagas2026#";

const availableFunctions = [
  // Sistema
  { id: 'dark_mode', name: 'Modo Claro/Escuro', description: 'Alternar tema', icon: Moon, category: 'Sistema' },
  { id: 'push_notifications', name: 'Notificações Push', description: 'Notificações no navegador', icon: '🔔', category: 'Sistema' },
  
  // Conteúdo Principal
  { id: 'job_search', name: 'Buscar Vagas', description: 'Página de busca de vagas', icon: '🔍', category: 'Vagas' },
  { id: 'job_filters', name: 'Filtros de Vagas', description: 'Filtrar por cidade, categoria, tipo', icon: '🎯', category: 'Vagas' },
  { id: 'job_favorites', name: 'Vagas Favoritas', description: 'Salvar vagas favoritas', icon: '❤️', category: 'Vagas' },
  { id: 'job_history', name: 'Histórico de Vagas', description: 'Vagas visualizadas', icon: '📋', category: 'Vagas' },
  { id: 'job_share', name: 'Compartilhar Vagas', description: 'Compartilhar por WhatsApp', icon: '📤', category: 'Vagas' },
  
  // Social
  { id: 'feed', name: 'Feed Social', description: 'Posts da comunidade', icon: '📱', category: 'Social' },
  { id: 'feed_comments', name: 'Comentários no Feed', description: 'Comentar em posts', icon: '💬', category: 'Social' },
  { id: 'direct_messages', name: 'Mensagens Diretas', description: 'Chat entre usuários', icon: '✉️', category: 'Social' },
  { id: 'whatsapp_groups', name: 'Grupos WhatsApp', description: 'Grupos de vagas', icon: '💚', category: 'Social' },
  
  // Conteúdo
  { id: 'news', name: 'Notícias', description: 'Artigos e notícias', icon: '📰', category: 'Conteúdo' },
  { id: 'biblioteca', name: 'Biblioteca', description: 'E-books e materiais', icon: '📚', category: 'Conteúdo' },
  { id: 'utilidades_tools', name: 'Ferramentas Utilidades', description: 'Currículo, carta, simulador', icon: '🛠️', category: 'Conteúdo' },
  
  // Premium
  { id: 'premium_jobs', name: 'Vagas Premium', description: 'Vagas exclusivas', icon: '👑', category: 'Premium' },
  { id: 'premium_curriculum', name: 'Currículos Premium', description: 'Criar e gerenciar currículos', icon: '📝', category: 'Premium' },
  { id: 'recruiter_area', name: 'Área do Recrutador', description: 'Painel para recrutadores', icon: '💼', category: 'Premium' },
  
  // Suporte
  { id: 'chat_support', name: 'Chat de Suporte', description: 'Falar com admin', icon: '🆘', category: 'Suporte' },
  { id: 'report_system', name: 'Sistema de Denúncias', description: 'Reportar conteúdo', icon: '🚫', category: 'Suporte' },
  
  // Admin
  { id: 'analytics', name: 'Analytics', description: 'Estatísticas do app', icon: '📊', category: 'Admin' },
  { id: 'user_management', name: 'Gerenciar Usuários', description: 'Aprovar e gerenciar', icon: '👥', category: 'Admin' },
  { id: 'job_management', name: 'Gerenciar Vagas', description: 'Editar e excluir vagas', icon: '⚙️', category: 'Admin' },
  { id: 'broadcast', name: 'Lista de Transmissão', description: 'Enviar mensagens em massa', icon: '📢', category: 'Admin' },
];

export default function GerenciarFuncoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [functions, setFunctions] = useState({});
  const [saving, setSaving] = useState(false);

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
        
        // Carregar funções habilitadas
        const savedFunctions = localStorage.getItem('app_functions');
        if (savedFunctions) {
          setFunctions(JSON.parse(savedFunctions));
        } else {
          // Por padrão, todas as funções habilitadas
          const defaultFunctions = {};
          availableFunctions.forEach(fn => {
            defaultFunctions[fn.id] = true;
          });
          setFunctions(defaultFunctions);
        }
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (password === MASTER_PASSWORD) {
      setAuthenticated(true);
      setPassword('');
      toast.success('Acesso autorizado!');
    } else {
      toast.error('Senha incorreta!');
      setPassword('');
    }
  };

  const handleToggle = (functionId) => {
    setFunctions(prev => ({
      ...prev,
      [functionId]: !prev[functionId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('app_functions', JSON.stringify(functions));
      toast.success('Configurações salvas com sucesso!');
      
      // Recarregar a página para aplicar mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4 transition-colors">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Funções</h1>
          <p className="text-white/70 text-sm">Habilite ou desabilite funções do aplicativo</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!authenticated ? (
          <Card className="rounded-2xl overflow-hidden shadow-lg dark:bg-slate-800 transition-colors">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Autenticação Necessária</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Digite a senha master para acessar</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 z-10" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha Master"
                    className="pl-11 pr-11 h-12 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-base"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl text-base font-semibold">
                  Autenticar
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl overflow-hidden mb-6 dark:bg-slate-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">Acesso Autorizado</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure as funções abaixo</p>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl overflow-hidden dark:bg-slate-800 transition-colors">
              <CardContent className="p-0">
                {(() => {
                  const categories = [...new Set(availableFunctions.map(f => f.category))];
                  return categories.map((category) => {
                    const funcsInCategory = availableFunctions.filter(f => f.category === category);
                    return (
                      <div key={category}>
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border-b dark:border-slate-600">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{category}</p>
                        </div>
                        {funcsInCategory.map((fn, index) => {
                          const isLast = index === funcsInCategory.length - 1;
                          const Icon = fn.icon;
                  
                          return (
                            <div
                              key={fn.id}
                              className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {typeof Icon === 'string' ? (
                                  <div className="text-2xl flex-shrink-0">{Icon}</div>
                                ) : (
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-800 dark:text-white text-sm">{fn.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fn.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={functions[fn.id] !== false}
                                onCheckedChange={() => handleToggle(fn.id)}
                                className="flex-shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
              As alterações serão aplicadas após salvar
            </p>
          </>
        )}
      </div>
    </div>
  );
}