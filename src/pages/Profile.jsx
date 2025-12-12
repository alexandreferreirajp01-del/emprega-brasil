import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, Mail, Phone, Crown, Camera, LogOut, 
  Shield, Calendar, Loader2, CheckCircle, Edit, Save, X,
  Lock, Briefcase, Settings, MapPin, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PasswordInput from "@/components/common/PasswordInput";
import PremiumModal from "@/components/subscription/PremiumModal";
import OnlineUsersCounter from "@/components/admin/OnlineUsersCounter";

export default function Profile() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [editForm, setEditForm] = useState({ 
    custom_full_name: '', 
    username: '',
    phone: '', 
    city: '', 
    state: 'PB',
    password: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Buscar dados do usuário com React Query
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      return userData;
    },
    staleTime: Infinity, // Não refazer query automaticamente
    retry: 3
  });

  // Sincronizar form com dados do usuário apenas no carregamento inicial
  useEffect(() => {
    if (user && !isEditing) {
      setEditForm({
        custom_full_name: user.custom_full_name || '',
        username: user.username || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || 'PB',
        password: ''
      });
    }
  }, [user?.id]); // Apenas quando o ID do usuário mudar

  // Redirecionar se não autenticado
  useEffect(() => {
    if (error) {
      window.location.href = createPageUrl('Splash');
    }
  }, [error]);

  // Mutation para atualizar foto de perfil
  const updatePhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('updateProfile', { photo_url: file_url });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      showToast('✅ Foto atualizada com sucesso!');
    },
    onError: () => {
      showToast('❌ Erro ao atualizar foto', 'error');
    }
  });

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      updatePhotoMutation.mutate(file);
    }
  };

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('auth', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar perfil');
      }
      return response.data.user;
    },
    onSuccess: (freshUser) => {
      // Atualizar cache com dados frescos do servidor
      queryClient.setQueryData(['currentUser'], freshUser);
      
      // Atualizar formulário com dados salvos
      setEditForm({
        custom_full_name: freshUser.custom_full_name || '',
        username: freshUser.username || '',
        phone: freshUser.phone || '',
        city: freshUser.city || '',
        state: freshUser.state || 'PB',
        password: ''
      });
      
      setIsEditing(false);
      showToast('✅ Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar perfil:', error);
      showToast('❌ Erro ao atualizar perfil: ' + (error.message || 'Tente novamente'), 'error');
    }
  });

  const handleSaveProfile = async () => {
    // Validação
    if (!editForm.custom_full_name || editForm.custom_full_name.trim().length < 3) {
      showToast('Nome completo deve ter no mínimo 3 caracteres', 'error');
      return;
    }

    if (!editForm.username || editForm.username.trim().length < 3) {
      showToast('Nome de usuário deve ter no mínimo 3 caracteres', 'error');
      return;
    }

    // Preparar dados
    const updateData = {
      custom_full_name: editForm.custom_full_name.trim(),
      username: editForm.username.trim(),
      phone: editForm.phone.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim().toUpperCase() || 'PB'
    };
    
    // Adicionar senha apenas se foi preenchida
    if (editForm.password && editForm.password.trim()) {
      if (editForm.password.length < 6) {
        showToast('Senha deve ter no mínimo 6 caracteres', 'error');
        return;
      }
      updateData.password = editForm.password;
    }
    
    updateProfileMutation.mutate(updateData);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        custom_full_name: user.custom_full_name || '',
        username: user.username || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || 'PB',
        password: ''
      });
    }
    setIsEditing(false);
  };

  // Verificar se houve mudanças no formulário (dirty check)
  const hasChanges = user && (
    editForm.custom_full_name.trim() !== (user.custom_full_name || '') ||
    editForm.username.trim() !== (user.username || '') ||
    editForm.phone.trim() !== (user.phone || '') ||
    editForm.city.trim() !== (user.city || '') ||
    editForm.state.trim().toUpperCase() !== (user.state || 'PB').toUpperCase() ||
    (editForm.password && editForm.password.trim().length > 0)
  );

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = createPageUrl('Splash');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || user?.subscription_type === 'dono';
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
  const isRecruiter = user?.subscription_type === 'recruiter';

  const getSubscriptionBadge = () => {
    if (isDono) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
          <Crown className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Dono</span>
        </div>
      );
    }
    if (isAdmin) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Administrador</span>
        </div>
      );
    }
    if (isRecruiter) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Recrutador</span>
        </div>
      );
    }
    if (user?.subscription_type === 'premium') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <Crown className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Premium</span>
        </div>
      );
    }
    if (user?.subscription_type === 'basic') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
          <User className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Básico</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
        <User className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-600">Visitante</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-[#C30000]' : 'bg-[#057642]'} text-white`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-8 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <Card className="shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-lg">
                  <AvatarImage src={user?.profile_photo} />
                  <AvatarFallback className="bg-[#0A66C2] text-white text-2xl sm:text-3xl">
                    {user?.custom_full_name?.[0] || user?.username?.[0] || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#0A66C2] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#004182]">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={updatePhotoMutation.isPending} />
                </label>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{user?.custom_full_name || user?.username || 'Usuário'}</h2>
              {getSubscriptionBadge()}
            </div>

            {isEditing ? (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={editForm.custom_full_name} 
                    onChange={(e) => setEditForm({ ...editForm, custom_full_name: e.target.value })} 
                    placeholder="Seu nome completo" 
                    className="rounded-xl h-11" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nome de Usuário</Label>
                  <Input 
                    value={editForm.username} 
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })} 
                    placeholder="seu.usuario" 
                    className="rounded-xl h-11" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input 
                    value={user?.email} 
                    disabled 
                    className="rounded-xl h-11 bg-slate-50" 
                  />
                  <p className="text-xs text-slate-500">E-mail não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                    placeholder="(83) 99999-9999" 
                    className="rounded-xl h-11" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Cidade</Label>
                    <Input 
                      value={editForm.city} 
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                      placeholder="Sua cidade" 
                      className="rounded-xl h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input 
                      value={editForm.state} 
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })} 
                      maxLength={2}
                      placeholder="PB" 
                      className="rounded-xl h-11" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nova Senha (opcional)</Label>
                  <PasswordInput
                    value={editForm.password} 
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                    placeholder="Deixe em branco para não alterar" 
                    className="rounded-xl h-11" 
                  />
                  <p className="text-xs text-slate-500">Mínimo 6 caracteres</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit} 
                    className="rounded-xl flex-1 h-11"
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfileMutation.isPending || !hasChanges} 
                    className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl flex-1 h-11 disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Nome Completo</p>
                    <p className="font-medium text-slate-800 text-sm">{user?.custom_full_name || 'Não informado'}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 hover:bg-slate-200 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Nome de Usuário</p>
                    <p className="font-medium text-slate-800 text-sm">{user?.username || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">E-mail</p>
                    <p className="font-medium text-slate-800 text-sm truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="font-medium text-slate-800 text-sm">{user?.phone || 'Não informado'}</p>
                  </div>
                </div>
                {(user?.city || user?.state) && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Localização</p>
                      <p className="font-medium text-slate-800 text-sm">{user?.city}, {user?.state}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Membro desde</p>
                    <p className="font-medium text-slate-800 text-sm">
                      {user?.created_date ? new Date(user.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isDono || isAdmin) && (
              <OnlineUsersCounter />
            )}

            {(isDono || isAdmin || isRecruiter) && (
              <Link to={createPageUrl('Configuracoes')} className="block mb-4">
                <Button variant="outline" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-slate-300 bg-slate-50 hover:bg-slate-100">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-700 font-medium text-sm">Configurações Gerais</span>
                </Button>
              </Link>
            )}

            <div className="space-y-3">
              {user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.subscription_type !== 'recruiter' && user?.subscription_type !== 'dono' && user?.role !== 'admin' && (
                <Button 
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  {user?.subscription_type === 'basic' ? 'Upgrade para Premium' : 'Assinar Plano'}
                </Button>
              )}
              <Button variant="outline" className="w-full h-12 rounded-xl text-[#C30000] border-red-200 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2" />Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => {
          refetch();
          showToast('🎉 Bem-vindo ao Premium!');
        }}
      />
    </div>
  );
}