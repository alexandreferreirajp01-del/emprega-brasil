import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, Mail, Phone, Crown, Camera, LogOut, 
  Shield, Calendar, Loader2, CheckCircle, Clock, Edit, Save, X,
  Lock, Briefcase, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });

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
      setUser(prev => ({ ...prev, full_name: editForm.full_name, phone: editForm.phone }));
      setIsEditing(false);
      showToast('Perfil atualizado com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = createPageUrl('Splash');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || user?.subscription_type === 'dono';
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
  const isRecruiter = user?.subscription_type === 'recruiter';

  const getSubscriptionBadge = () => {
    if (isDono) {
      return <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 px-4 py-1"><Crown className="w-4 h-4 mr-2" />Dono</Badge>;
    }
    if (isAdmin) {
      return <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-1"><Shield className="w-4 h-4 mr-2" />Administrador</Badge>;
    }
    if (isRecruiter) {
      return <Badge className="bg-blue-100 text-blue-700 border-0 px-4 py-1"><Briefcase className="w-4 h-4 mr-2" />Recrutador</Badge>;
    }
    if (user?.subscription_type === 'premium') {
      return <Badge className="bg-green-100 text-green-700 border-0 px-4 py-1"><Crown className="w-4 h-4 mr-2" />Membro Premium</Badge>;
    }
    if (user?.subscription_type === 'basic') {
      return <Badge className="bg-blue-100 text-blue-700 border-0 px-4 py-1"><User className="w-4 h-4 mr-2" />Membro Básico</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-0 px-4 py-1"><User className="w-4 h-4 mr-2" />Visitante</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-[#0056ff]'} text-white`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-8 pb-20 px-4">
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
                  <AvatarFallback className="bg-[#0056ff] text-white text-2xl sm:text-3xl">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#0056ff] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#0044cc]">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isSaving} />
                </label>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{user?.full_name || 'Usuário'}</h2>
              {getSubscriptionBadge()}
            </div>

            {isEditing ? (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Seu nome" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="(00) 00000-0000" className="rounded-xl" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl"><X className="w-4 h-4 mr-2" />Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">E-mail</p>
                    <p className="font-medium text-slate-800 text-sm truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="font-medium text-slate-800 text-sm">{user?.phone || 'Não informado'}</p>
                  </div>
                </div>
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
                <Link to={createPageUrl('Subscription')} className="block">
                  <Button className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                    <Crown className="w-5 h-5 mr-2" />
                    {user?.subscription_type === 'basic' ? 'Upgrade para Premium' : 'Assinar Plano'}
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2" />Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}