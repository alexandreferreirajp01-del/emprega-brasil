import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Check, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "./PlanBadge";

export default function FollowRequests({ user }) {
  const queryClient = useQueryClient();

  // Fetch pending follow requests for me
  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['pending-follow-requests', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await base44.entities.Follow.filter({ 
          following_email: user.email,
          status: 'pending'
        }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch users data
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-requests'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('-created_date', 200) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, accept, followerEmail }) => {
      await base44.entities.Follow.update(requestId, { 
        status: accept ? 'accepted' : 'rejected' 
      });

      if (accept) {
        // Notify the follower that they were accepted
        await base44.entities.SocialNotification.create({
          user_email: followerEmail,
          from_email: user.email,
          from_name: user.full_name,
          from_photo: user.profile_photo,
          type: 'follow',
          message: `${user.full_name || 'Alguém'} aceitou sua solicitação de seguir`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile-followers'] });
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    },
  });

  if (isLoading) {
    return null;
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-600" />
          Solicitações de Seguir ({pendingRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.map((request) => {
          const requester = allUsers.find(u => u.email === request.follower_email);
          
          return (
            <div key={request.id} className="flex items-center gap-3 bg-white p-3 rounded-xl">
              <Link to={`${createPageUrl('SocialProfile')}?email=${request.follower_email}`}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={requester?.profile_photo} />
                  <AvatarFallback className="bg-[#0056ff] text-white">
                    {requester?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm truncate">
                    {requester?.full_name || 'Usuário'}
                  </p>
                  <PlanBadge user={requester} />
                </div>
                <p className="text-xs text-slate-500">quer seguir você</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => respondMutation.mutate({ 
                    requestId: request.id, 
                    accept: false,
                    followerEmail: request.follower_email
                  })}
                  disabled={respondMutation.isPending}
                  className="h-8 w-8 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => respondMutation.mutate({ 
                    requestId: request.id, 
                    accept: true,
                    followerEmail: request.follower_email
                  })}
                  disabled={respondMutation.isPending}
                  className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}