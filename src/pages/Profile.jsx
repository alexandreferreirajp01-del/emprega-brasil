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
  Lock, Briefcase, Settings, MapPin, Eye, EyeOff, Trash2, Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PasswordInput from "@/components/common/PasswordInput";
import PremiumModal from "@/components/subscription/PremiumModal";
import OnlineUsersCounter from "@/components/admin/OnlineUsersCounter";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";

export default function Profile() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  // Estado inicial otimizado - renderiza UI imediatamente
  const [userLocal, setUserLocal] = useState(null);
  
  // Buscar dados do usuário com React Query
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUserLocal(userData); // Atualiza estado local
      return userData;
    },
    staleTime: 60000, // Cache por 1 minuto
    retry: 1, // Apenas 1 retry para não atrasar
    refetchOnWindowFocus: false
  });

  // Usar dados em cache se disponível
  const displayUser = user || userLocal;

  // Sincronizar form com dados do usuário apenas no carregamento inicial
  useEffect(() => {
    if (displayUser && !isEditing) {
      setEditForm({
        custom_full_name: displayUser.custom_full_name || '',
        username: displayUser.username || '',
        phone: displayUser.phone || '',
        city: displayUser.city || '',
        state: displayUser.state || 'PB',
        password: ''
      });
    }
  }, [displayUser?.id]); // Apenas quando o ID do usuário mudar

  // Não redirecionar - permite visualizar perfil para mostrar upgrade
  useEffect(() => {
    if (error) {
      // Permite visualizar perfil mesmo sem login
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
      await base44.auth.updateMe(data);
      await new Promise(resolve => setTimeout(resolve, 300));
      const freshUser = await base44.auth.me();
      return freshUser;
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
    if (displayUser) {
      setEditForm({
        custom_full_name: displayUser.custom_full_name || '',
        username: displayUser.username || '',
        phone: displayUser.phone || '',
        city: displayUser.city || '',
        state: displayUser.state || 'PB',
        password: ''
      });
    }
    setIsEditing(false);
  };

  // Verificar se houve mudanças no formulário (dirty check)
  const hasChanges = displayUser && (
    editForm.custom_full_name.trim() !== (displayUser.custom_full_name || '') ||
    editForm.username.trim() !== (displayUser.username || '') ||
    editForm.phone.trim() !== (displayUser.phone || '') ||
    editForm.city.trim() !== (displayUser.city || '') ||
    editForm.state.trim().toUpperCase() !== (displayUser.state || 'PB').toUpperCase() ||
    (editForm.password && editForm.password.trim().length > 0)
  );

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = createPageUrl('Splash');
  };

  // Renderizar estrutura imediatamente, carregar dados depois
  if (!displayUser && isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
        <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-8 pb-20 px-4 transition-colors">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-12">
          <Card className="shadow-xl rounded-3xl overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-colors">
            <CardContent className="p-6 sm:p-8 flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E6FB6] dark:text-blue-400" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se não há usuário, redirecionar para página de planos
  if (!isLoading && !displayUser) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Faça login para acessar seu perfil</h2>
            <p className="text-slate-600 mb-6">Entre ou escolha um plano para continuar</p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  sessionStorage.setItem('needs_login', 'true');
                  sessionStorage.setItem('redirect_after_login', 'Profile');
                  window.location.href = createPageUrl('Splash');
                }}
                className="w-full bg-[#1E6FB6] hover:bg-[#0B2F5B]"
              >
                Fazer Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = createPageUrl('Subscription')}
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Ver Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDono = displayUser?.email === 'alexandreferreirajp01@gmail.com' || displayUser?.subscription_type === 'dono';
  const isAdmin = displayUser?.role === 'admin' || displayUser?.subscription_type === 'admin';
  const isRecruiter = displayUser?.subscription_type === 'recruiter';
  const isBasic = displayUser?.subscription_type === 'basic';
  const isPremium = displayUser?.subscription_type === 'premium';
  const canEdit = true;

  // Links de renovação por tier
  const RENEW_LINKS = {
    select: 'https://mpago.la/2QMKuFo',
    padrao: 'https://mpago.la/1EwRFu9',
    unlimited: 'https://mpago.la/2jBux69',
  };

  // Config visual por tier
  const TIER_CONFIG = {
    padrao: { label: 'Premium Padrão', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600', renewLabel: 'Renovar — R$27,00' },
    select: { label: 'Premium Select', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600', renewLabel: 'Renovar — R$9,90' },
    unlimited: { label: 'Premium Unlimited', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600', renewLabel: 'Renovar — R$59,00' },
  };

  const premiumTier = displayUser?.premium_tier || 'padrao';
  const tierConfig = TIER_CONFIG[premiumTier] || TIER_CONFIG.padrao;

  const getSubscriptionBadge = () => {
    if (isDono) return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
        <Crown className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-700">Dono</span>
      </div>
    );
    if (isAdmin) return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200">
        <Shield className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-700">Administrador</span>
      </div>
    );
    if (isRecruiter) return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200">
        <Briefcase className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">Recrutador</span>
      </div>
    );
    if (isPremium) return (
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${tierConfig.bg} border ${tierConfig.border}`}>
        <Crown className={`w-4 h-4 ${tierConfig.icon}`} />
        <span className={`text-sm font-medium ${tierConfig.text}`}>{tierConfig.label}</span>
      </div>
    );
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
        <User className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Básico</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
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

      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-8 pb-20 px-4 transition-colors">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <Card className="shadow-xl rounded-3xl overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-colors">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-lg">
                  <AvatarImage src={displayUser?.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-2xl sm:text-3xl">
                    {displayUser?.profile_photo ? null : (
                      <User className="w-12 h-12 sm:w-14 sm:h-14" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {canEdit && (
                  <label className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#1E6FB6] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#0B2F5B]">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={updatePhotoMutation.isPending} />
                  </label>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">{displayUser?.custom_full_name || displayUser?.username || 'Usuário'}</h2>
              {getSubscriptionBadge()}
            </div>



            {isEditing && canEdit ? (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Nome Completo</Label>
                  <Input 
                    value={editForm.custom_full_name} 
                    onChange={(e) => setEditForm({ ...editForm, custom_full_name: e.target.value })} 
                    placeholder="Seu nome completo" 
                    className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Nome de Usuário</Label>
                  <Input 
                    value={editForm.username} 
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })} 
                    placeholder="seu.usuario" 
                    className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="dark:text-slate-300">E-mail</Label>
                  <Input 
                    value={displayUser?.email} 
                    disabled 
                    className="rounded-xl h-11 bg-slate-50 dark:bg-slate-700/50 dark:text-slate-400" 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">E-mail não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Telefone</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                    placeholder="(83) 99999-9999" 
                    className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label className="dark:text-slate-300">Cidade</Label>
                    <Input 
                      value={editForm.city} 
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                      placeholder="Sua cidade" 
                      className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Estado</Label>
                    <Input 
                      value={editForm.state} 
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })} 
                      maxLength={2}
                      placeholder="PB" 
                      className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Nova Senha (opcional)</Label>
                  <PasswordInput
                    value={editForm.password} 
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                    placeholder="Deixe em branco para não alterar" 
                    className="rounded-xl h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 6 caracteres</p>
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
                    className="bg-[#1E6FB6] hover:bg-[#0B2F5B] rounded-xl flex-1 h-11 disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nome Completo</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{displayUser?.custom_full_name || 'Não informado'}</p>
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nome de Usuário</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{displayUser?.username || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                  <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">E-mail</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{displayUser?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                  <Phone className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{displayUser?.phone || 'Não informado'}</p>
                  </div>
                </div>
                {(displayUser?.city || displayUser?.state) && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Localização</p>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{displayUser?.city}, {displayUser?.state}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors">
                  <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Membro desde</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {displayUser?.created_date ? new Date(displayUser.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* Datas e renovação para Premium */}
                {isPremium && (
                  <div className={`p-4 rounded-xl border ${tierConfig.border} ${tierConfig.bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className={`w-4 h-4 ${tierConfig.icon}`} />
                      <span className={`text-sm font-semibold ${tierConfig.text}`}>{tierConfig.label}</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      {displayUser?.premium_activated_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ativado em:</span>
                          <span className="font-medium">{new Date(displayUser.premium_activated_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {displayUser?.premium_expires_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expira em:</span>
                          <span className={`font-medium ${new Date(displayUser.premium_expires_at) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                            {new Date(displayUser.premium_expires_at).toLocaleDateString('pt-BR')}
                            {new Date(displayUser.premium_expires_at) < new Date() ? ' ⚠️ Expirado' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    {RENEW_LINKS[premiumTier] && (
                      <a href={RENEW_LINKS[premiumTier]} target="_blank" rel="noopener noreferrer">
                        <button className={`w-full h-9 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${premiumTier === 'select' ? 'from-blue-500 to-blue-600' : premiumTier === 'unlimited' ? 'from-purple-600 to-purple-700' : 'from-amber-500 to-amber-600'} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                          <Crown className="w-3.5 h-3.5" />
                          {tierConfig.renewLabel}
                        </button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}



            {/* Ferramentas para todos os usuários */}
            <Link to={createPageUrl('Utilidades')} className="block mb-3">
              <Button variant="outline" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <Wrench className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">Ferramentas</span>
              </Button>
            </Link>

            {(isDono || isAdmin || isRecruiter) && (
              <Link to={createPageUrl('Configuracoes')} className="block mb-4">
                <Button variant="outline" className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Configurações Gerais</span>
                </Button>
              </Link>
            )}

            <div className="space-y-3">
              {isBasic && (
                <Button 
                  onClick={() => window.location.href = createPageUrl('Subscription')}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-xl shadow-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Seja Premium
                </Button>
              )}
              <Button variant="outline" className="w-full h-12 rounded-xl text-[#C30000] dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2" />Sair da Conta
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-5 h-5 mr-2" />Deletar Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={displayUser}
        onSuccess={() => {
          refetch();
          showToast('🎉 Bem-vindo ao Premium!');
        }}
      />

      {/* Modal Deletar Conta */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        user={displayUser}
      />
    </div>
  );
}