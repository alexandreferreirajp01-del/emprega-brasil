import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Loader2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PopularProfiles({ user }) {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['popular-profiles'],
    queryFn: async () => {
      return await base44.entities.UserProfile.list('-followers_count', 10) || [];
    },
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['my-follows', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Follow.filter({ follower_email: user.email }) || [];
    },
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-basic'],
    queryFn: async () => await base44.entities.User.list('-created_date', 100) || [],
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

        const targetUser = allUsers.find(u => u.email === targetEmail);
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

  // Combinar perfis com dados de usuário
  const enrichedProfiles = profiles
    .filter(p => p.user_email !== user?.email)
    .map(profile => {
      const userData = allUsers.find(u => u.email === profile.user_email);
      return {
        ...profile,
        full_name: userData?.full_name || 'Usuário',
        profile_photo: userData?.profile_photo
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
                    <p className="font-medium text-slate-800 hover:text-[#0056ff] text-sm">
                      {profile.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile.occupation || 'Profissional'} • {profile.followers_count || 0} seguidores
                    </p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={() => followMutation.mutate(profile.user_email)}
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
          })
        )}
      </CardContent>
    </Card>
  );
}