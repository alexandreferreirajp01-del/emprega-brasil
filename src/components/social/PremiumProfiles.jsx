import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "./PlanBadge";

const USERS_PER_PAGE = 6;

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

export default function PremiumProfiles({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [myFollows, setMyFollows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowingAction, setIsFollowingAction] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      const [usersResult, profilesResult, followsResult] = await Promise.all([
        fetchWithRetry(() => base44.entities.User.list('-created_date', 500)),
        fetchWithRetry(() => base44.entities.UserProfile.list('-created_date', 100)),
        user ? fetchWithRetry(() => base44.entities.Follow.list('-created_date', 500)) : Promise.resolve([])
      ]);

      if (isMounted) {
        setAllUsers(usersResult);
        setProfiles(profilesResult);
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
    if (isFollowingAction) return;
    setIsFollowingAction(true);
    
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
      setIsFollowingAction(false);
    }
  };

  // Combine users with profiles and filter by search
  const allPremiumUsers = allUsers
    .filter(u => u.email !== user?.email)
    .map(u => {
      const profile = profiles.find(p => p.user_email === u.email);
      return {
        ...u,
        occupation: profile?.occupation || 'Profissional',
        followers_count: profile?.followers_count || 0
      };
    })
    .filter(u => 
      !searchTerm || 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(allPremiumUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const premiumUsers = allPremiumUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (premiumUsers.length === 0) return null;

  return (
    <Card className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0056ff]" />
          Usuários Cadastrados
        </CardTitle>
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar usuário..."
            className="pl-9 h-9 text-sm rounded-lg bg-white"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {premiumUsers.map((premiumUser) => {
          const isFollowing = followingEmails.includes(premiumUser.email);
          
          return (
            <div key={premiumUser.id} className="flex items-center gap-3 bg-white p-3 rounded-xl">
              <Link 
                to={`${createPageUrl('SocialProfile')}?email=${premiumUser.email}`}
                className="flex-shrink-0"
              >
                <Avatar className="w-10 h-10 ring-2 ring-blue-300">
                  <AvatarImage src={premiumUser.profile_photo} />
                  <AvatarFallback className="bg-[#0056ff] text-white">
                    {premiumUser.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link 
                to={`${createPageUrl('SocialProfile')}?email=${premiumUser.email}`}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-slate-800 hover:text-[#0056ff] text-sm truncate">
                  {premiumUser.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {premiumUser.occupation}
                </p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PlanBadge user={premiumUser} />
                <Button
                  size="sm"
                  variant={followingEmails.includes(premiumUser.email) ? 'outline' : 'default'}
                  onClick={() => handleFollow(premiumUser.email)}
                  disabled={isFollowingAction}
                  className="rounded-full h-8 px-3"
                >
                  {(() => {
                    const follow = myFollows.find(f => f.following_email === premiumUser.email);
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
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-blue-200">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {premiumUsers.length === 0 && searchTerm && (
          <p className="text-center text-sm text-slate-500 py-2">Nenhum usuário encontrado</p>
        )}
      </CardContent>
    </Card>
  );
}