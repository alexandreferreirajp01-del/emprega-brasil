import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, UserPlus, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "./PlanBadge";

const USERS_PER_PAGE = 6;

export default function PremiumProfiles({ user }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['premium-users'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list('-created_date', 100) || [];
        return users.filter(u => 
          u.subscription_type === 'premium' || 
          u.subscription_type === 'admin' || 
          u.role === 'admin'
        );
      } catch (e) {
        return [];
      }
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles-premium'],
    queryFn: async () => {
      try {
        return await base44.entities.UserProfile.list('-created_date', 100) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['my-follows', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await base44.entities.Follow.filter({ follower_email: user.email }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user,
  });

  const followingEmails = myFollows.map(f => f.following_email);

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const isFollowing = followingEmails.includes(targetEmail);
      
      if (isFollowing) {
        const follow = myFollows.find(f => f.following_email === targetEmail);
        if (follow) {
          await base44.entities.Follow.delete(follow.id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail
        });

        await base44.entities.SocialNotification.create({
          user_email: targetEmail,
          from_email: user.email,
          from_name: user.full_name,
          from_photo: user.profile_photo,
          type: 'follow',
          message: `${user.full_name || 'Alguém'} começou a seguir você`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
    },
  });

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
    <Card className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          Usuários Premium
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
            <div key={premiumUser.id} className="flex items-center justify-between bg-white p-3 rounded-xl">
              <Link 
                to={`${createPageUrl('SocialProfile')}?email=${premiumUser.email}`}
                className="flex items-center gap-3 flex-1"
              >
                <Avatar className="w-10 h-10 ring-2 ring-amber-400">
                  <AvatarImage src={premiumUser.profile_photo} />
                  <AvatarFallback className="bg-amber-500 text-white">
                    {premiumUser.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 hover:text-[#0056ff] text-sm">
                      {premiumUser.full_name}
                    </p>
                    <PlanBadge user={premiumUser} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {premiumUser.occupation}
                  </p>
                </div>
              </Link>
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={() => followMutation.mutate(premiumUser.email)}
                disabled={followMutation.isPending}
                className="rounded-full h-8"
              >
                {isFollowing ? (
                  'Seguindo'
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Seguir
                  </>
                )}
              </Button>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-amber-200">
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