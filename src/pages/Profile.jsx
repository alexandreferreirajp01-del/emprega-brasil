import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Mail, Phone, Crown, Camera, LogOut, 
  Shield, Calendar, Loader2, CheckCircle, Clock, Edit, Save, X,
  Heart, History, Users, FileText, Lock, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PlanBadge from "@/components/social/PlanBadge";

// Função de fetch com retry robusto
async function fetchWithRetry(fetchFn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      if (result && result.length >= 0) {
        return result;
      }
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} falhou:`, error.message);
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  return [];
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setEditForm({
          full_name: currentUser.full_name || '',
          phone: currentUser.phone || ''
        });
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Carregar dados de follows e usuários
  useEffect(() => {
    if (!user?.email) return;
    let isMounted = true;

    const loadSocialData = async () => {
      // Carregar follows
      const allFollows = await fetchWithRetry(() => 
        base44.entities.Follow.list('-created_date', 1000)
      );
      
      if (isMounted && allFollows.length > 0) {
        // Filtrar seguidores
        const myFollowers = allFollows.filter(f => 
          f.following_email === user.email && (f.status === 'accepted' || f.status === 'pending')
        );
        setFollowers(myFollowers);

        // Filtrar seguindo
        const myFollowing = allFollows.filter(f => 
          f.follower_email === user.email && (f.status === 'accepted' || f.status === 'pending')
        );
        setFollowing(myFollowing);
      }

      // Carregar usuários
      const users = await fetchWithRetry(() => 
        base44.entities.User.list('-created_date', 500)
      );
      if (isMounted) setAllUsers(users);
    };

    loadSocialData();

    return () => { isMounted = false; };
  }, [user?.email]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_photo: file_url });
      setUser(prev => ({ ...prev, profile_photo: file_url }));
      showToast('Foto atualizada com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar foto', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: editForm.full_name,
        phone: editForm.phone
      });
      setUser(prev => ({ 
        ...prev, 
        full_name: editForm.full_name,
        phone: editForm.phone
      }));
      setIsEditing(false);
      showToast('Perfil atualizado com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vagas_abertas_visitor_mode');
    base44.auth.logout(createPageUrl('Splash'));
  };

  const hasPremiumAccess = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.subscription_type === 'recruiter' ||
    user?.role === 'admin';

  const getSubscriptionBadge = () => {
    if (user?.email === 'alexandreferreirajp01@gmail.com' || user?.role === 'admin' || user?.subscription_type === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-1">
          <Shield className="w-4 h-4 mr-2" />
          Administrador
        </Badge>
      );
    }
    if (user?.subscription_type === 'recruiter') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-1">
          <Briefcase className="w-4 h-4 mr-2" />
          Recrutador
        </Badge>
      );
    }
    if (user?.subscription_type === 'premium') {
      return (
        <Badge className="bg-green-100 text-green-700 border-0 px-4 py-1">
          <Crown className="w-4 h-4 mr-2" />
          Membro Premium
        </Badge>
      );
    }
    if (user?.subscription_type === 'basic') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 px-4 py-1">
          <User className="w-4 h-4 mr-2" />
          Membro Básico (Grátis)
        </Badge>
      );
    }
    if (user?.access_status === 'pending') {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 px-4 py-1">
          <Clock className="w-4 h-4 mr-2" />
          Aguardando Aprovação
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-600 border-0 px-4 py-1">
        <User className="w-4 h-4 mr-2" />
        Visitante
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${
              toast.type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                : 'bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-8 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                    <AvatarImage src={user?.profile_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white text-3xl">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#0056ff] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#0044cc] transition-colors">
                    <Camera className="w-5 h-5 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoChange}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {user?.full_name || 'Usuário'}
                </h2>
                {getSubscriptionBadge()}
                
                {/* Seguidores e Seguindo */}
                <div className="flex items-center gap-6 mt-4">
                  <button 
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
                    <p className="text-lg font-bold text-slate-800">{followers.length}</p>
                    <p className="text-xs text-slate-500">Seguidores</p>
                  </button>
                  <button 
                    onClick={() => setShowFollowing(true)}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
                    <p className="text-lg font-bold text-slate-800">{following.length}</p>
                    <p className="text-xs text-slate-500">Seguindo</p>
                  </button>
                </div>
              </div>

              {/* User Info - Editable */}
              {isEditing ? (
                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl flex-1"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          full_name: user?.full_name || '',
                          phone: user?.phone || ''
                        });
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">E-mail</p>
                      <p className="font-medium text-slate-800">{user?.email || 'Não informado'}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Telefone</p>
                      <p className="font-medium text-slate-800">{user?.phone || 'Não informado'}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Membro desde</p>
                      <p className="font-medium text-slate-800">
                        {user?.created_date 
                          ? new Date(user.created_date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric' 
                            })
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>


                </div>
              )}

              {/* Minhas Seções */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link to={createPageUrl('Favoritos')}>
                  <Button variant="outline" className="w-full h-14 rounded-xl flex-col gap-1">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-xs">Favoritas</span>
                  </Button>
                </Link>
                <Link to={createPageUrl('Historico')}>
                  <Button variant="outline" className="w-full h-14 rounded-xl flex-col gap-1">
                    <History className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Histórico</span>
                  </Button>
                </Link>
                <Link to={createPageUrl('ProfessionalResume')}>
                  <Button variant="outline" className="w-full h-14 rounded-xl flex-col gap-1 relative">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-xs">Currículo</span>
                    {!hasPremiumAccess && (
                      <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />
                    )}
                  </Button>
                </Link>
                <Link to={createPageUrl('Inbox')}>
                  <Button variant="outline" className="w-full h-14 rounded-xl flex-col gap-1 relative">
                    <Mail className="w-5 h-5 text-green-500" />
                    <span className="text-xs">Mensagens</span>
                    {!hasPremiumAccess && (
                      <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />
                    )}
                  </Button>
                </Link>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.subscription_type !== 'recruiter' && user?.role !== 'admin' && user?.email !== 'alexandreferreirajp01@gmail.com' && (
                  <Link to={createPageUrl('Subscription')} className="block">
                    <Button className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                      <Crown className="w-5 h-5 mr-2" />
                      {user?.subscription_type === 'basic' ? 'Fazer Upgrade para Premium' : 'Assinar um Plano'}
                    </Button>
                  </Link>
                )}

                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seguidores ({followers.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {followers.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Nenhum seguidor ainda</p>
              ) : (
                followers.map((follow) => {
                  const followerUser = allUsers.find(u => u.email === follow.follower_email);
                  return (
                    <Link 
                      key={follow.id}
                      to={`${createPageUrl('SocialProfile')}?email=${follow.follower_email}`}
                      onClick={() => setShowFollowers(false)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <Avatar className="w-11 h-11 flex-shrink-0">
                        <AvatarImage src={followerUser?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white text-sm">
                          {followerUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-slate-800 truncate">{followerUser?.full_name || 'Usuário'}</p>
                          <PlanBadge user={followerUser} />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{followerUser?.email}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seguindo ({following.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {following.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Não está seguindo ninguém</p>
              ) : (
                following.map((follow) => {
                  const followingUser = allUsers.find(u => u.email === follow.following_email);
                  return (
                    <Link 
                      key={follow.id}
                      to={`${createPageUrl('SocialProfile')}?email=${follow.following_email}`}
                      onClick={() => setShowFollowing(false)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <Avatar className="w-11 h-11 flex-shrink-0">
                        <AvatarImage src={followingUser?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white text-sm">
                          {followingUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-slate-800 truncate">{followingUser?.full_name || 'Usuário'}</p>
                          <PlanBadge user={followingUser} />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{followingUser?.email}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}