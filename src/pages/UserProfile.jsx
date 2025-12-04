import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, Loader2, Crown, Shield, Briefcase, User, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('email');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (userEmail) {
          const users = await base44.entities.User.filter({ email: userEmail });
          if (users.length > 0) {
            setProfileUser(users[0]);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar perfil:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [userEmail]);

  const handleSendMessage = () => {
    if (!profileUser) return;
    navigate(createPageUrl('Chat') + `?to=${encodeURIComponent(profileUser.email)}&name=${encodeURIComponent(profileUser.full_name || 'Usuário')}&photo=${encodeURIComponent(profileUser.profile_photo || '')}`);
  };

  const getBadge = (u) => {
    if (u?.role === 'admin' || u?.subscription_type === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-0">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (u?.subscription_type === 'recruiter') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0">
          <Briefcase className="w-3 h-3 mr-1" />
          Recrutador
        </Badge>
      );
    }
    if (u?.subscription_type === 'premium') {
      return (
        <Badge className="bg-green-100 text-green-700 border-0">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-600 border-0">
        <User className="w-3 h-3 mr-1" />
        Membro
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

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="rounded-xl max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Usuário não encontrado.</p>
            <Link to={createPageUrl('Comunidade')}>
              <Button className="mt-4">Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.email === profileUser.email;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Comunidade')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full mb-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <Card className="shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            {/* Avatar & Info */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg mb-4">
                <AvatarImage src={profileUser.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white text-3xl">
                  {profileUser.full_name?.[0] || profileUser.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {profileUser.full_name || 'Usuário'}
              </h2>
              
              {getBadge(profileUser)}

              {profileUser.bio && (
                <p className="text-slate-600 mt-4 max-w-md">{profileUser.bio}</p>
              )}

              {profileUser.city && (
                <p className="text-slate-500 text-sm mt-2">📍 {profileUser.city}</p>
              )}

              <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Membro desde {profileUser.created_date 
                    ? new Date(profileUser.created_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Action Button */}
            {!isOwnProfile && (
              <Button
                onClick={handleSendMessage}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Enviar Mensagem
              </Button>
            )}

            {isOwnProfile && (
              <Link to={createPageUrl('Profile')}>
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Editar Meu Perfil
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}