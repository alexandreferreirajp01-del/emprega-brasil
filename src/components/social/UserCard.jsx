import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, MessageCircle, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function UserCard({ userData, currentUser, onMessage }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isOwnProfile = currentUser?.email === userData.email;

  useEffect(() => {
    if (!currentUser) return;
    
    const checkFollow = async () => {
      try {
        const [follows, followers] = await Promise.all([
          base44.entities.Follow.filter({ 
            follower_email: currentUser.email, 
            following_email: userData.email 
          }),
          base44.entities.Follow.filter({ following_email: userData.email })
        ]);
        setIsFollowing(follows.length > 0);
        setFollowersCount(followers.length);
      } catch (e) {}
    };
    checkFollow();
  }, [currentUser, userData.email]);

  const handleFollow = async () => {
    if (!currentUser || loading) return;
    setLoading(true);
    
    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({ 
          follower_email: currentUser.email, 
          following_email: userData.email 
        });
        if (follows[0]) {
          await base44.entities.Follow.delete(follows[0].id);
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userData.email
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (e) {}
    setLoading(false);
  };

  const getPlanBadge = () => {
    if (userData.role === 'admin' || userData.subscription_type === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge>;
    }
    if (userData.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 text-xs">Recrutador</Badge>;
    }
    if (userData.subscription_type === 'premium') {
      return <Badge className="bg-green-100 text-green-700 text-xs">Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 text-xs">Básico</Badge>;
  };

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={`${createPageUrl('SocialProfile')}?email=${userData.email}`}>
            <Avatar className="w-14 h-14 border-2 border-slate-100">
              <AvatarImage src={userData.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold text-lg">
                {userData.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link to={`${createPageUrl('SocialProfile')}?email=${userData.email}`}>
              <h3 className="font-semibold text-slate-800 truncate hover:text-[#0056ff]">
                {userData.full_name || 'Usuário'}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {getPlanBadge()}
              <span className="text-xs text-slate-500">{followersCount} seguidores</span>
            </div>
          </div>
        </div>

        {!isOwnProfile && currentUser && (
          <div className="flex gap-2 mt-4">
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={loading}
              className={`flex-1 rounded-xl ${isFollowing ? '' : 'bg-[#0056ff] hover:bg-[#0044cc]'}`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4 mr-1" />
                  Seguindo
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Seguir
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessage?.(userData)}
              className="flex-1 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Mensagem
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}