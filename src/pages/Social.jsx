import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

import SocialFeed from "@/components/social/SocialFeed";
import SocialUsers from "@/components/social/SocialUsers";
import SocialMessages from "@/components/social/SocialMessages";
import SocialSaved from "@/components/social/SocialSaved";

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[96px] z-30 bg-white border-b">
            <TabsList className="w-full h-12 bg-white rounded-none grid grid-cols-4 gap-0 p-0">
              <TabsTrigger 
                value="feed" 
                className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff]"
              >
                Feed
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff]"
              >
                Usuários
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff]"
              >
                Mensagens
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff]"
              >
                Salvos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="mt-0">
            <SocialFeed user={user} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <SocialUsers user={user} />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <SocialMessages user={user} />
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <SocialSaved user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}