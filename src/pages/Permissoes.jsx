import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Search, Loader2, CheckCircle, Shield, Lock, 
  User, Mail, Eye, EyeOff, AlertTriangle, Unlock
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import PasswordInput from "@/components/common/PasswordInput";
import PasswordDialog from "@/components/common/PasswordDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const ADMIN_PASSWORD = "Vagas2026#";

const APP_FUNCTIONS = [
  { id: 'favoritas', label: 'Favoritas', category: 'Interações' },
  { id: 'historico', label: 'Histórico', category: 'Interações' },
  { id: 'mensagens', label: 'Mensagens', category: 'Interações' },
  { id: 'curriculos', label: 'Ver Currículos', category: 'Interações' },
  { id: 'responder_chat', label: 'Responder Chat', category: 'Interações' },
  { id: 'recruiter_area', label: 'Painel do Recrutador', category: 'Recrutador' },
  { id: 'lista_transmissao', label: 'Lista de Transmissão', category: 'Gerenciamento' },
  { id: 'gerenciar_vagas', label: 'Gerenciar Vagas', category: 'Gerenciamento' },
  { id: 'gerenciar_usuarios', label: 'Usuários', category: 'Gerenciamento' },
  { id: 'gerenciar_comunidade', label: 'Gerenciar Comunidade', category: 'Gerenciamento' },
  { id: 'solicitacoes', label: 'Solicitações', category: 'Gerenciamento' },
  { id: 'gerenciador_filtros', label: 'Gerenciador de Filtros', category: 'Gerenciamento' },
  { id: 'postar_vagas', label: 'Postar Vagas', category: 'Produção' },
  { id: 'posts_massa', label: 'Posts em Massa', category: 'Produção' },
  { id: 'vagas_ia', label: 'Vagas por IA', category: 'Produção' },
  { id: 'vagas_home_office', label: 'Vagas Home Office', category: 'Produção' },
  { id: 'biblioteca_admin', label: 'Biblioteca', category: 'Produção' },
  { id: 'noticias', label: 'Gerenciar Notícias', category: 'Produção' },
  { id: 'analytics', label: 'Analytics do App', category: 'Ferramentas' },
  { id: 'pagamentos', label: 'Pagamentos', category: 'Ferramentas' },
  { id: 'feed', label: 'Feed', category: 'Ferramentas' },
  { id: 'permissoes', label: 'Permissões', category: 'Administração' },
];

const CATEGORIES = ['Interações', 'Recrutador', 'Gerenciamento', 'Produção', 'Ferramentas', 'Administração'];

export default function Permissoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSettings, setPasswordSettings] = useState({});
  const [togglePasswordDialog, setTogglePasswordDialog] = useState(false);
  const [targetFunction, setTargetFunction] = useState(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        
        // Carregar configurações de senha do localStorage
        const savedSettings = localStorage.getItem('function_password_settings');
        if (savedSettings) {
          setPasswordSettings(JSON.parse(savedSettings));
        } else {
          // Inicializar com valores padrão
          const initial = {};
          APP_FUNCTIONS.forEach(fn => {
            initial[fn.id] = false;
          });
          setPasswordSettings(initial);
          localStorage.setItem('function_password_settings', JSON.stringify(initial));
        }
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users-permissions'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list('-created_date', 500);
      // Adicionar o dono à lista se não estiver
      const donoEmail = 'alexandreferreirajp01@gmail.com';
      const hasDono = allUsers.some(u => u.email === donoEmail);
      if (!hasDono) {
        allUsers.unshift({
          id: 'dono-special',
          email: donoEmail,
          full_name: 'Alexandre Ferreira (Dono)',
          subscription_type: 'dono',
          role: 'admin',
          permissions: {}
        });
      }
      return allUsers;
    },
    staleTime: 60000,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-permissions'] });
      showToast('Permissões atualizadas!');
      setPasswordDialog(false);
      setPassword('');
      setSelectedUser(null);
      setSaving(false);
    },
    onError: () => {
      showToast('Erro ao atualizar', 'error');
      setSaving(false);
    }
  });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.id?.includes(search)
  );

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    const userPermissions = u.permissions || {};
    const perms = {};
    APP_FUNCTIONS.forEach(func => {
      perms[func.id] = userPermissions[func.id] !== false;
    });
    setPermissions(perms);
  };

  const handleTogglePermission = (funcId) => {
    setPermissions(prev => ({ ...prev, [funcId]: !prev[funcId] }));
  };

  const handleTogglePasswordRequirement = (functionId) => {
    setTargetFunction(functionId);
    setTogglePasswordDialog(true);
  };

  const handleConfirmToggle = () => {
    const newSettings = {
      ...passwordSettings,
      [targetFunction]: !passwordSettings[targetFunction]
    };
    setPasswordSettings(newSettings);
    localStorage.setItem('function_password_settings', JSON.stringify(newSettings));
    showToast(`Exigência de senha ${!passwordSettings[targetFunction] ? 'ativada' : 'desativada'}`);
    setTargetFunction(null);
  };

  const handleSave = () => {
    setPasswordDialog(true);
  };

  const handleConfirmSave = async () => {
    if (password !== ADMIN_PASSWORD) {
      showToast('Senha incorreta! Acesso negado.', 'error');
      return;
    }

    setSaving(true);
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: { permissions }
    });
  };

  const groupedFunctions = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = APP_FUNCTIONS.filter(f => f.category === cat);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Permissões de Acesso
          </h1>
          <p className="text-white/70 text-sm">Controle granular de acesso às funções do aplicativo</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Lista de Usuários */}
          <div className="lg:col-span-2">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, email, telefone ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
                <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className={`cursor-pointer transition-all rounded-xl p-3 border-2 ${
                        selectedUser?.id === u.id 
                          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                          : 'border-transparent bg-white hover:border-indigo-200 hover:shadow-sm'
                      }`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={u.profile_photo} />
                          <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                            {u.full_name?.[0] || u.email?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 break-words">{u.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500 break-all">{u.email}</p>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs mt-1 ${
                              u.subscription_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.subscription_type === 'premium' ? 'bg-green-100 text-green-700' :
                              u.subscription_type === 'recruiter' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.subscription_type || 'basic'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Permissões */}
          <div className="lg:col-span-3">
            {selectedUser ? (
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Permissões</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedUser.profile_photo} />
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                        {selectedUser.full_name?.[0] || selectedUser.email?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedUser.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-slate-500">{selectedUser.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px] pr-4">
                    <div className="space-y-5">
                      {CATEGORIES.map(category => {
                        const funcs = groupedFunctions[category];
                        if (!funcs || funcs.length === 0) return null;
                        return (
                          <div key={category}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-5 bg-indigo-600 rounded"></div>
                              <h3 className="font-bold text-sm text-slate-800">{category}</h3>
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {funcs.filter(f => permissions[f.id]).length}/{funcs.length}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {funcs.map(func => (
                                <div key={func.id} className="bg-slate-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <label htmlFor={func.id} className="flex-1 cursor-pointer text-sm font-medium">
                                      {func.label}
                                    </label>
                                    <Checkbox
                                      id={func.id}
                                      checked={permissions[func.id]}
                                      onCheckedChange={() => handleTogglePermission(func.id)}
                                      className="data-[state=checked]:bg-indigo-600"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleTogglePasswordRequirement(func.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                      passwordSettings[func.id]
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                                  >
                                    {passwordSettings[func.id] ? (
                                      <>
                                        <Lock className="w-3 h-3" />
                                        Senha obrigatória
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3 h-3" />
                                        Sem senha
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 pt-4 border-t">
                    <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11">
                      <Lock className="w-4 h-4 mr-2" />
                      Salvar e Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum usuário selecionado</h3>
                  <p className="text-sm text-slate-500">
                    Selecione um usuário na lista ao lado para gerenciar permissões
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmação Obrigatória
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Para salvar as permissões, digite a senha de administrador:
            </p>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialog(false);
                setPassword('');
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving || !password}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        open={togglePasswordDialog}
        onOpenChange={setTogglePasswordDialog}
        onSuccess={handleConfirmToggle}
        title="Alterar Exigência de Senha"
        description="Digite a senha de administrador para modificar esta configuração"
      />
    </div>
  );
}