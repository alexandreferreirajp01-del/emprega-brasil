import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, TrendingUp, Bell, Plus, Loader2, Lock, Crown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import SocialFeed from "@/components/social/SocialFeed";
import CreatePostModal from "@/components/social/CreatePostModal";
import PopularProfiles from "@/components/social/PopularProfiles";
import SocialNotifications from "@/components/social/SocialNotifications";
import PremiumProfiles from "@/components/social/PremiumProfiles";

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not authenticated
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['social-notifications-unread', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await base44.entities.SocialNotification.filter({ 
          user_email: user.email,
          is_read: false 
        }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user,
  });

  // Check if user can access social
  const canAccessSocial = user && (
    user.subscription_type === 'premium' || 
    user.subscription_type === 'admin' || 
    user.subscription_type === 'basic' ||
    user.role === 'admin' ||
    user.email === 'alexandreferreirajp01@gmail.com'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  // Access denied for visitors - redirect to subscription page
  if (!user || !canAccessSocial) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white">Social Vagas Abertas</h1>
            <p className="text-white/70">Conecte-se com profissionais</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-8">
          <Card className="rounded-2xl shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Escolha um Plano</h2>
              <p className="text-slate-600 mb-6">
                Para acessar a rede social, você precisa escolher um plano.
                O plano básico é gratuito!
              </p>
              <div className="space-y-3">
                <Link to={createPageUrl('Subscription')}>
                  <Button className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12">
                    <Crown className="w-5 h-5 mr-2" />
                    Escolher um Plano
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Social Vagas Abertas</h1>
              <p className="text-white/70">Conecte-se com profissionais</p>
            </div>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-14 rounded-xl bg-white shadow mb-4">
            <TabsTrigger value="feed" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="discover" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Descobrir
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white relative">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
              {unreadNotifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <SocialFeed user={user} feedType="following" />
          </TabsContent>

          <TabsContent value="discover">
            <div className="space-y-6">
              <PremiumProfiles user={user} />
              <PopularProfiles user={user} />
              <SocialFeed user={user} feedType="all" />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <SocialNotifications user={user} />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostModal 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost} 
        user={user} 
      />
    </div>
  );
}