import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User, Mail, Phone, Crown, Calendar, MapPin,
  Shield, Briefcase, X
} from "lucide-react";

const TIER_CONFIG = {
  padrao: { label: 'Premium Padrão', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
  select: { label: 'Premium Select', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  unlimited: { label: 'Premium Unlimited', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
};

export default function UserProfileViewModal({ open, onOpenChange, targetUser }) {
  if (!targetUser) return null;

  const isPremium = targetUser.subscription_type === 'premium';
  const isAdmin = targetUser.subscription_type === 'admin' || targetUser.role === 'admin';
  const isDono = targetUser.subscription_type === 'dono';
  const isRecruiter = targetUser.subscription_type === 'recruiter';
  const isBasic = !isPremium && !isAdmin && !isDono && !isRecruiter;

  const premiumTier = targetUser.premium_tier || 'padrao';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Visualizar Perfil</DialogTitle>
        </DialogHeader>

        {/* Replica exatamente o visual da página Profile */}
        <div className="bg-[#F3F2EF]">
          {/* Banner */}
          <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-8 pb-16 px-4 relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-white/70 text-xs text-center">Visualizando como o usuário vê</p>
            <h1 className="text-lg font-bold text-white text-center mt-1">Meu Perfil</h1>
          </div>

          <div className="px-4 -mt-10 pb-6">
            <Card className="shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                {/* Avatar + Nome */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={targetUser.profile_photo} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-2xl">
                        <User className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    {targetUser.custom_full_name || targetUser.username || targetUser.full_name || 'Usuário'}
                  </h2>
                  {getSubscriptionBadge()}
                </div>

                {/* Informações */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Nome Completo</p>
                      <p className="font-medium text-slate-800 text-sm">{targetUser.custom_full_name || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Nome de Usuário</p>
                      <p className="font-medium text-slate-800 text-sm">{targetUser.username || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">E-mail</p>
                      <p className="font-medium text-slate-800 text-sm truncate">{targetUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="font-medium text-slate-800 text-sm">{targetUser.phone || 'Não informado'}</p>
                    </div>
                  </div>

                  {(targetUser.city || targetUser.state) && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Localização</p>
                        <p className="font-medium text-slate-800 text-sm">{targetUser.city}{targetUser.city && targetUser.state ? ', ' : ''}{targetUser.state}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Membro desde</p>
                      <p className="font-medium text-slate-800 text-sm">
                        {targetUser.created_date
                          ? new Date(targetUser.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Bloco Premium */}
                  {isPremium && (
                    <div className={`p-4 rounded-xl border ${tierConfig.border} ${tierConfig.bg}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className={`w-4 h-4 ${tierConfig.icon}`} />
                        <span className={`text-sm font-semibold ${tierConfig.text}`}>{tierConfig.label}</span>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600">
                        {targetUser.premium_activated_at && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ativado em:</span>
                            <span className="font-medium">{new Date(targetUser.premium_activated_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {targetUser.premium_expires_at && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expira em:</span>
                            <span className={`font-medium ${new Date(targetUser.premium_expires_at) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                              {new Date(targetUser.premium_expires_at).toLocaleDateString('pt-BR')}
                              {new Date(targetUser.premium_expires_at) < new Date() ? ' ⚠️ Expirado' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isBasic && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-amber-700 font-medium">Este usuário é do plano Básico</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}