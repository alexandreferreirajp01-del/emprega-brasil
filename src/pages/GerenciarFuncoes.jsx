import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Loader2, Lock, Save, Eye, EyeOff, CheckCircle, Edit2,
  Moon, Sun, Bell, Search, Filter, Heart, History, Share2, Users, MessageCircle,
  Mail, Newspaper, BookOpen, Wrench, Crown, FileText, Briefcase, HelpCircle,
  AlertTriangle, BarChart3, Settings, Send, MessageSquare, Plus
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MASTER_PASSWORD = "Vagas2026#";

const ICON_OPTIONS = [
  { name: 'Moon', component: Moon },
  { name: 'Sun', component: Sun },
  { name: 'Bell', component: Bell },
  { name: 'Search', component: Search },
  { name: 'Filter', component: Filter },
  { name: 'Heart', component: Heart },
  { name: 'History', component: History },
  { name: 'Share2', component: Share2 },
  { name: 'Users', component: Users },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Mail', component: Mail },
  { name: 'Newspaper', component: Newspaper },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Wrench', component: Wrench },
  { name: 'Crown', component: Crown },
  { name: 'FileText', component: FileText },
  { name: 'Briefcase', component: Briefcase },
  { name: 'HelpCircle', component: HelpCircle },
  { name: 'AlertTriangle', component: AlertTriangle },
  { name: 'BarChart3', component: BarChart3 },
  { name: 'Settings', component: Settings },
  { name: 'Send', component: Send },
  { name: 'MessageSquare', component: MessageSquare },
];

const DEFAULT_FUNCTIONS = [
  { id: 'dark_mode', name: 'Modo Claro/Escuro', description: 'Alternar tema da aplicação', icon: 'Moon', category: 'Sistema', enabled: true },
  { id: 'push_notifications', name: 'Notificações Push', description: 'Notificações no navegador', icon: 'Bell', category: 'Sistema', enabled: true },
  { id: 'job_search', name: 'Buscar Vagas', description: 'Página de busca de vagas', icon: 'Search', category: 'Vagas', enabled: true },
  { id: 'job_filters', name: 'Filtros de Vagas', description: 'Filtrar por cidade, categoria, tipo', icon: 'Filter', category: 'Vagas', enabled: true },
  { id: 'job_favorites', name: 'Vagas Favoritas', description: 'Salvar vagas favoritas', icon: 'Heart', category: 'Vagas', enabled: true },
  { id: 'job_history', name: 'Histórico de Vagas', description: 'Vagas visualizadas', icon: 'History', category: 'Vagas', enabled: true },
  { id: 'job_share', name: 'Compartilhar Vagas', description: 'Compartilhar por WhatsApp', icon: 'Share2', category: 'Vagas', enabled: true },
  { id: 'feed', name: 'Feed Social', description: 'Posts da comunidade', icon: 'MessageSquare', category: 'Social', enabled: true },
  { id: 'feed_comments', name: 'Comentários no Feed', description: 'Comentar em posts', icon: 'MessageCircle', category: 'Social', enabled: true },
  { id: 'direct_messages', name: 'Mensagens Diretas', description: 'Chat entre usuários', icon: 'Mail', category: 'Social', enabled: true },
  { id: 'whatsapp_groups', name: 'Grupos WhatsApp', description: 'Grupos de vagas', icon: 'Users', category: 'Social', enabled: true },
  { id: 'news', name: 'Notícias', description: 'Artigos e notícias', icon: 'Newspaper', category: 'Conteúdo', enabled: true },
  { id: 'biblioteca', name: 'Biblioteca', description: 'E-books e materiais', icon: 'BookOpen', category: 'Conteúdo', enabled: true },
  { id: 'utilidades_tools', name: 'Ferramentas Utilidades', description: 'Currículo, carta, simulador', icon: 'Wrench', category: 'Conteúdo', enabled: true },
  { id: 'premium_jobs', name: 'Vagas Premium', description: 'Vagas exclusivas', icon: 'Crown', category: 'Premium', enabled: true },
  { id: 'premium_curriculum', name: 'Currículos Premium', description: 'Criar e gerenciar currículos', icon: 'FileText', category: 'Premium', enabled: true },
  { id: 'recruiter_area', name: 'Área do Recrutador', description: 'Painel para recrutadores', icon: 'Briefcase', category: 'Premium', enabled: true },
  { id: 'chat_support', name: 'Chat de Suporte', description: 'Falar com admin', icon: 'HelpCircle', category: 'Suporte', enabled: true },
  { id: 'report_system', name: 'Sistema de Denúncias', description: 'Reportar conteúdo', icon: 'AlertTriangle', category: 'Suporte', enabled: true },
  { id: 'analytics', name: 'Analytics', description: 'Estatísticas do app', icon: 'BarChart3', category: 'Admin', enabled: true },
  { id: 'user_management', name: 'Gerenciar Usuários', description: 'Aprovar e gerenciar', icon: 'Users', category: 'Admin', enabled: true },
  { id: 'job_management', name: 'Gerenciar Vagas', description: 'Editar e excluir vagas', icon: 'Settings', category: 'Admin', enabled: true },
  { id: 'broadcast', name: 'Lista de Transmissão', description: 'Enviar mensagens em massa', icon: 'Send', category: 'Admin', enabled: true },
];

export default function GerenciarFuncoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [functions, setFunctions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingFunction, setEditingFunction] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

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
        
        // Carregar funções salvas
        const saved = localStorage.getItem('app_functions_config');
        if (saved) {
          setFunctions(JSON.parse(saved));
        } else {
          setFunctions(DEFAULT_FUNCTIONS);
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
      // Senha correta - salvar alterações
      setPassword('');
      setShowPasswordDialog(false);
      proceedWithSave();
    } else {
      toast.error('Senha incorreta!');
      setPassword('');
    }
  };

  const proceedWithSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('app_functions_config', JSON.stringify(functions));
      toast.success('Configurações salvas com sucesso!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      setSaving(false);
    }
  };

  const handleToggle = (functionId) => {
    setFunctions(prev => prev.map(fn => 
      fn.id === functionId ? { ...fn, enabled: !fn.enabled } : fn
    ));
  };

  const handleEdit = (fn) => {
    setEditingFunction({ ...fn });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    setFunctions(prev => prev.map(fn => 
      fn.id === editingFunction.id ? editingFunction : fn
    ));
    setShowEditDialog(false);
    setEditingFunction(null);
    toast.success('Função atualizada!');
  };

  const handleAddFunction = () => {
    const newFunction = {
      id: `custom_${Date.now()}`,
      name: 'Nova Função',
      description: 'Descrição da nova função',
      icon: 'Settings',
      category: 'Outros',
      enabled: true
    };
    setFunctions(prev => [...prev, newFunction]);
    setEditingFunction(newFunction);
    setShowEditDialog(true);
  };

  const handleSave = () => {
    // Mostrar diálogo de senha para confirmar
    setShowPasswordDialog(true);
  };

  const getIconComponent = (iconName) => {
    const icon = ICON_OPTIONS.find(opt => opt.name === iconName);
    return icon ? icon.component : Settings;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2] dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-6 pb-8 px-4 transition-colors">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Funções</h1>
          <p className="text-white/70 dark:text-slate-300 text-sm">Configure as funcionalidades do aplicativo</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Card className="flex-1 rounded-2xl overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base">Acesso Autorizado</h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">Configure as funções abaixo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleAddFunction}
                className="h-auto sm:h-full px-4 sm:px-6 py-3 sm:py-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-2xl font-semibold whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Função
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-auto sm:h-full px-4 sm:px-6 py-3 sm:py-0 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-2xl font-semibold whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>

            <Card className="rounded-2xl overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-colors">
              <CardContent className="p-0">
                {(() => {
                  const categories = [...new Set(functions.map(f => f.category))];
                  return categories.map((category) => {
                    const funcsInCategory = functions.filter(f => f.category === category);
                    return (
                      <div key={category}>
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border-b dark:border-slate-600 transition-colors">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{category}</p>
                        </div>
                        {funcsInCategory.map((fn, index) => {
                          const isLast = index === funcsInCategory.length - 1;
                          const IconComponent = getIconComponent(fn.icon);
                  
                          return (
                            <div
                              key={fn.id}
                              className={`flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                            >
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 dark:text-white text-sm">{fn.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fn.description}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(fn)}
                                className="flex-shrink-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                              >
                                <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                              <Switch
                                checked={fn.enabled}
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
          Total: {functions.length} funções • Ativas: {functions.filter(f => f.enabled).length}
        </p>
        </>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Confirmar Alterações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Digite a senha master para salvar as alterações</p>
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPassword('');
                  }}
                  className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Editar Função</DialogTitle>
          </DialogHeader>
          {editingFunction && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Nome</label>
                <Input
                  value={editingFunction.name}
                  onChange={(e) => setEditingFunction({ ...editingFunction, name: e.target.value })}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Descrição</label>
                <Textarea
                  value={editingFunction.description}
                  onChange={(e) => setEditingFunction({ ...editingFunction, description: e.target.value })}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Categoria</label>
                <Input
                  value={editingFunction.category}
                  onChange={(e) => setEditingFunction({ ...editingFunction, category: e.target.value })}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Ícone</label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full justify-start dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {(() => {
                    const Icon = getIconComponent(editingFunction.icon);
                    return <Icon className="w-5 h-5 mr-2" />;
                  })()}
                  {editingFunction.icon}
                </Button>
                {showIconPicker && (
                  <div className="mt-2 p-3 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    {ICON_OPTIONS.map((icon) => {
                      const Icon = icon.component;
                      return (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => {
                            setEditingFunction({ ...editingFunction, icon: icon.name });
                            setShowIconPicker(false);
                          }}
                          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                            editingFunction.icon === icon.name ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingFunction(null);
                    setShowIconPicker(false);
                  }}
                  className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}