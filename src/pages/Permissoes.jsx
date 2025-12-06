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
  User, Mail, Eye, EyeOff, AlertTriangle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const ADMIN_PASSWORD = "Vagas2026#";

const APP_FUNCTIONS = [
  { id: 'postar_vagas', label: 'Postar Vagas', category: 'Produção' },
  { id: 'vagas_ia', label: 'Vagas por IA', category: 'Produção' },
  { id: 'vagas_home_office', label: 'Vagas Home Office', category: 'Produção' },
  { id: 'posts_massa', label: 'Posts em Massa', category: 'Produção' },
  { id: 'gerenciar_vagas', label: 'Gerenciar Vagas', category: 'Gerenciamento' },
  { id: 'biblioteca_profissional', label: 'Base de Dados Profissionais', category: 'Gerenciamento' },
  { id: 'gerenciar_usuarios', label: 'Gerenciar Usuários', category: 'Gerenciamento' },
  { id: 'gerenciar_comunidade', label: 'Gerenciar Comunidade', category: 'Gerenciamento' },
  { id: 'solicitacoes', label: 'Solicitações', category: 'Gerenciamento' },
  { id: 'lista_transmissao', label: 'Lista de Transmissão', category: 'Comunicação' },
  { id: 'responder_chat', label: 'Responder Chat', category: 'Comunicação' },
  { id: 'noticias', label: 'Gerenciar Notícias', category: 'Conteúdo' },
  { id: 'biblioteca_admin', label: 'Biblioteca Admin', category: 'Conteúdo' },
  { id: 'analytics', label: 'Analytics do App', category: 'Análise' },
  { id: 'pagamentos', label: 'Pagamentos', category: 'Financeiro' },
  { id: 'curriculos', label: 'Ver Currículos', category: 'Interações' },
  { id: 'permissoes', label: 'Permissões', category: 'Configurações' },
];

const CATEGORIES = ['Produção', 'Gerenciamento', 'Comunicação', 'Conteúdo', 'Análise', 'Financeiro', 'Interações', 'Configurações'];

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
    queryFn: () => base44.entities.User.list('-created_date', 500),
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Usuários */}
          <div>
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
                      <Card
                        key={u.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedUser?.id === u.id ? 'border-2 border-indigo-500 bg-indigo-50' : ''
                        }`}
                        onClick={() => handleSelectUser(u)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={u.profile_photo} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {u.full_name?.[0] || u.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {u.subscription_type || 'basic'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Permissões */}
          <div>
            {selectedUser ? (
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Permissões</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedUser.profile_photo} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
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
                    <div className="space-y-4">
                      {CATEGORIES.map(category => {
                        const funcs = groupedFunctions[category];
                        if (!funcs || funcs.length === 0) return null;
                        return (
                          <div key={category}>
                            <h3 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
                              <div className="w-1 h-4 bg-indigo-600 rounded"></div>
                              {category}
                            </h3>
                            <div className="space-y-2 ml-3">
                              {funcs.map(func => (
                                <div
                                  key={func.id}
                                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <label htmlFor={func.id} className="flex-1 cursor-pointer text-sm">
                                    {func.label}
                                  </label>
                                  <Checkbox
                                    id={func.id}
                                    checked={permissions[func.id]}
                                    onCheckedChange={() => handleTogglePermission(func.id)}
                                    className="data-[state=checked]:bg-indigo-600"
                                  />
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
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
    </div>
  );
}