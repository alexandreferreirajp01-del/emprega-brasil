import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Check, X, Loader2 } from "lucide-react";
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

export default function FollowRequests({ user }) {
  const [processingIds, setProcessingIds] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      const [followsResult, usersResult] = await Promise.all([
        fetchWithRetry(() => base44.entities.Follow.list('-created_date', 500)),
        fetchWithRetry(() => base44.entities.User.list('-created_date', 500))
      ]);

      if (isMounted) {
        // Filtrar solicitações pendentes para o usuário atual
        const pending = followsResult.filter(f => 
          f.following_email === user.email && f.status === 'pending'
        );
        setPendingRequests(pending);
        setAllUsers(usersResult);
        setIsLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [user?.email]);

  const handleRespond = async (requestId, accept, followerEmail) => {
    setProcessingIds(prev => [...prev, requestId]);
    try {
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
      
      // Atualizar lista local
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error('Erro ao responder solicitação:', e);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

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
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleRespond(request.id, false, request.follower_email)}
                  disabled={processingIds.includes(request.id)}
                  className="h-8 w-8 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  {processingIds.includes(request.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleRespond(request.id, true, request.follower_email)}
                  disabled={processingIds.includes(request.id)}
                  className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                >
                  {processingIds.includes(request.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}