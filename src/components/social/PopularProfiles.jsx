import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Loader2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "./PlanBadge";

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

export default function PopularProfiles({ user }) {
  const [profiles, setProfiles] = useState([]);
  const [myFollows, setMyFollows] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      const [profilesResult, usersResult, followsResult] = await Promise.all([
        fetchWithRetry(() => base44.entities.UserProfile.list('-followers_count', 10)),
        fetchWithRetry(() => base44.entities.User.list('-created_date', 100)),
        user ? fetchWithRetry(() => base44.entities.Follow.list('-created_date', 500)) : Promise.resolve([])
      ]);

      if (isMounted) {
        setProfiles(profilesResult);
        setAllUsers(usersResult);
        // Filtrar follows do usuário atual
        const userFollows = followsResult.filter(f => f.follower_email === user?.email);
        setMyFollows(userFollows);
        setIsLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [user?.email]);

  const followingEmails = myFollows.map(f => f.following_email);

  const handleFollow = async (targetEmail) => {
    if (isFollowing) return;
    setIsFollowing(true);
    
    try {
      const existingFollow = myFollows.find(f => f.following_email === targetEmail);
      
      if (existingFollow) {
        await base44.entities.Follow.delete(existingFollow.id);
        setMyFollows(prev => prev.filter(f => f.id !== existingFollow.id));
      } else {
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail,
          status: 'pending'
        });
        setMyFollows(prev => [...prev, newFollow]);

        await base44.entities.SocialNotification.create({
          user_email: targetEmail,
          from_email: user.email,
          from_name: user.full_name,
          from_photo: user.profile_photo,
          type: 'follow',
          message: `${user.full_name || 'Alguém'} solicitou seguir você`
        });
      }
    } catch (e) {
      console.warn('Erro ao seguir:', e);
    } finally {
      setIsFollowing(false);
    }
  };

  // Combinar perfis com dados de usuário
  const enrichedProfiles = profiles
    .filter(p => p.user_email !== user?.email)
    .map(profile => {
      const userData = allUsers.find(u => u.email === profile.user_email);
      return {
        ...profile,
        full_name: userData?.full_name || 'Usuário',
        profile_photo: userData?.profile_photo,
        subscription_type: userData?.subscription_type,
        role: userData?.role,
        email: userData?.email
      };
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#0056ff]" />
          Perfis Populares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrichedProfiles.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum perfil encontrado ainda
          </p>
        ) : (
          enrichedProfiles.map((profile) => {
            const isFollowing = followingEmails.includes(profile.user_email);
            
            return (
              <div key={profile.id} className="flex items-center justify-between">
                <Link 
                  to={`${createPageUrl('SocialProfile')}?email=${profile.user_email}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.profile_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white">
                      {profile.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 hover:text-[#0056ff] text-sm">
                        {profile.full_name}
                      </p>
                      <PlanBadge user={profile} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {profile.occupation || 'Profissional'} • {profile.followers_count || 0} seguidores
                    </p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant={followingEmails.includes(profile.user_email) ? 'outline' : 'default'}
                  onClick={() => handleFollow(profile.user_email)}
                  disabled={isFollowing}
                  className="rounded-full h-8"
                >
                  {(() => {
                    const follow = myFollows.find(f => f.following_email === profile.user_email);
                    if (follow?.status === 'pending') return 'Pendente';
                    if (follow?.status === 'accepted') return 'Seguindo';
                    return (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Seguir
                      </>
                    );
                  })()}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}