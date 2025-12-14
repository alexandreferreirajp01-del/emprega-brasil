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
  { id: 'dark_mode', name: 'Modo Claro/Escuro', description: 'Permite alternar entre tema claro e escuro', icon: Moon },
  { id: 'push_notifications', name: 'Notificações Push', description: 'Notificações no navegador', icon: '🔔' },
  { id: 'whatsapp_groups', name: 'Grupos WhatsApp', description: 'Acesso aos grupos do WhatsApp', icon: '💬' },
  { id: 'job_favorites', name: 'Vagas Favoritas', description: 'Salvar vagas como favoritas', icon: '❤️' },
  { id: 'job_history', name: 'Histórico de Vagas', description: 'Visualizar vagas já vistas', icon: '📋' },
  { id: 'feed', name: 'Feed Social', description: 'Posts e interações da comunidade', icon: '📱' },
  { id: 'news', name: 'Notícias', description: 'Seção de notícias e artigos', icon: '📰' },
  { id: 'biblioteca', name: 'Biblioteca', description: 'Materiais e recursos profissionais', icon: '📚' },
  { id: 'chat_support', name: 'Chat de Suporte', description: 'Chat com administradores', icon: '💬' },
  { id: 'premium_features', name: 'Recursos Premium', description: 'Acesso a vagas exclusivas Premium', icon: '👑' },
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
    if (password === MASTER_PASSWORD) {
      setAuthenticated(true);
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
                {availableFunctions.map((fn, index) => {
                  const isLast = index === availableFunctions.length - 1;
                  const Icon = fn.icon;
                  
                  return (
                    <div
                      key={fn.id}
                      className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
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