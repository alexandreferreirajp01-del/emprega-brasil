import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, MessageCircle, Rss } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

import CommunityFeed from "@/components/community/CommunityFeed";
import UsersList from "@/components/community/UsersList";
import InboxList from "@/components/community/InboxList";

export default function Comunidade() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check URL param for initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'feed';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Comunidade</h1>
          <p className="text-white/70 text-sm">Conecte-se com outros profissionais</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-sm rounded-xl p-1 grid grid-cols-3">
            <TabsTrigger 
              value="feed" 
              className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white"
            >
              <Rss className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger 
              value="inbox" 
              className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <CommunityFeed user={user} />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersList user={user} />
          </TabsContent>

          <TabsContent value="inbox" className="mt-4">
            <InboxList user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}