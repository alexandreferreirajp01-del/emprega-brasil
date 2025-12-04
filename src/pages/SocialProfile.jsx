import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, MessageCircle, Edit, 
  Loader2, Crown, Shield, Briefcase, User, MapPin, ExternalLink,
  Grid
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import SocialPostCard from "@/components/social/SocialPostCard";

export default function SocialProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

  // Autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileEmail) return;
      
      setLoadingData(true);
      
      try {
        // Buscar usuário
        const users = await base44.entities.User.filter({ email: profileEmail });
        if (users && users.length > 0) {
          setProfileUser(users[0]);
        }

        // Buscar perfil adicional
        try {
          const profiles = await base44.entities.UserProfile.filter({ user_email: profileEmail });
          if (profiles && profiles.length > 0) {
            setUserProfile(profiles[0]);
          }
        } catch (e) {
          // UserProfile pode não existir
        }

        // Buscar posts
        try {
          const userPosts = await base44.entities.SocialPost.filter({ 
            author_email: profileEmail, 
            status: 'active' 
          }, '-created_date', 100);
          setPosts(userPosts || []);
        } catch (e) {
          setPosts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadProfileData();
  }, [profileEmail]);

  const isOwnProfile = user?.email === profileEmail;

  const getPlanBadge = (u) => {
    if (!u) return null;
    
    if (u.subscription_type === 'admin' || u.role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-0 text-sm px-3 py-1.5 font-medium">
          <Shield className="w-4 h-4 mr-1.5" />
          Admin
        </Badge>
      );
    }
    if (u.subscription_type === 'recruiter') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 text-sm px-3 py-1.5 font-medium">
          <Briefcase className="w-4 h-4 mr-1.5" />
          Recrutador
        </Badge>
      );
    }
    if (u.subscription_type === 'premium') {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-sm px-3 py-1.5 font-medium">
          <Crown className="w-4 h-4 mr-1.5" />
          Premium
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-600 border-0 text-sm px-3 py-1.5 font-medium">
        <User className="w-4 h-4 mr-1.5" />
        Básico
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Fixo */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-slate-800 truncate">
            {profileUser?.full_name || 'Perfil'}
          </h1>
        </div>
      </header>

      {/* Card do Perfil */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {loadingData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
            </div>
          ) : (
            <>
              {/* Avatar Centralizado */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-28 h-28 ring-4 ring-[#0056ff]/10 mb-4">
                  <AvatarImage src={profileUser?.profile_photo} />
                  <AvatarFallback className="bg-[#0056ff] text-white text-4xl font-bold">
                    {profileUser?.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Nome */}
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  {profileUser?.full_name || 'Usuário'}
                </h2>
                
                {/* Badge do Plano */}
                <div className="mb-4">
                  {getPlanBadge(profileUser)}
                </div>
                
                {/* Bio */}
                {userProfile?.bio && (
                  <p className="text-slate-600 max-w-md leading-relaxed mb-4">
                    {userProfile.bio}
                  </p>
                )}

                {/* Ocupação e Cidade */}
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-6 flex-wrap">
                  {userProfile?.occupation && (
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                      <Briefcase className="w-4 h-4" />
                      {userProfile.occupation}
                    </span>
                  )}
                  {userProfile?.city && (
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                      <MapPin className="w-4 h-4" />
                      {userProfile.city}
                    </span>
                  )}
                </div>

                {/* Contador de Posts */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-5 mb-6 w-full max-w-xs">
                  <p className="text-3xl font-bold text-slate-800">{posts.length}</p>
                  <p className="text-sm text-slate-500 mt-1">Publicações</p>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-center gap-3">
                  {isOwnProfile ? (
                    <Link to={createPageUrl('EditProfile')}>
                      <Button size="lg" variant="outline" className="rounded-xl px-6 h-12">
                        <Edit className="w-5 h-5 mr-2" />
                        Editar Perfil
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`${createPageUrl('SocialChat')}?email=${profileEmail}`}>
                      <Button size="lg" className="rounded-xl px-8 h-12 bg-[#0056ff] hover:bg-[#0044cc] shadow-lg shadow-blue-500/25">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Enviar Mensagem
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Links Sociais */}
                {(userProfile?.linkedin_url || userProfile?.instagram_url || userProfile?.portfolio_url) && (
                  <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                    {userProfile.linkedin_url && (
                      <a 
                        href={userProfile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0056ff] hover:underline text-sm flex items-center gap-1.5 bg-[#0056ff]/5 px-4 py-2 rounded-full transition-colors hover:bg-[#0056ff]/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {userProfile.instagram_url && (
                      <a 
                        href={userProfile.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0056ff] hover:underline text-sm flex items-center gap-1.5 bg-[#0056ff]/5 px-4 py-2 rounded-full transition-colors hover:bg-[#0056ff]/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                    {userProfile.portfolio_url && (
                      <a 
                        href={userProfile.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0056ff] hover:underline text-sm flex items-center gap-1.5 bg-[#0056ff]/5 px-4 py-2 rounded-full transition-colors hover:bg-[#0056ff]/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Portfólio
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full h-12 bg-white rounded-none border-b grid grid-cols-1 gap-0 p-0">
            <TabsTrigger 
              value="posts" 
              className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff] font-medium"
            >
              <Grid className="w-4 h-4 mr-2" />
              Publicações ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0 p-4">
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">Nenhuma publicação</p>
                <p className="text-sm text-slate-400 mt-1">
                  {isOwnProfile ? 'Crie sua primeira publicação no Feed!' : 'Este usuário ainda não publicou nada.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <SocialPostCard key={post.id} post={post} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}