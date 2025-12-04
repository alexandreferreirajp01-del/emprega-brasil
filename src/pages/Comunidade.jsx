import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, MessageCircle, Rss } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

import FeedTab from "@/components/social/FeedTab";
import UsuariosTab from "@/components/social/UsuariosTab";
import MensagensTab from "@/components/social/MensagensTab";

export default function Comunidade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const urlParams = new URLSearchParams(window.location.search);
  const tabInicial = urlParams.get('tab') || 'feed';
  const [tab, setTab] = useState(tabInicial);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Comunidade</h1>
          <p className="text-white/70 text-sm">Conecte-se com outros profissionais</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-white shadow rounded-xl p-1 grid grid-cols-3">
            <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Rss className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <FeedTab user={user} />
          </TabsContent>

          <TabsContent value="usuarios" className="mt-4">
            <UsuariosTab user={user} />
          </TabsContent>

          <TabsContent value="mensagens" className="mt-4">
            <MensagensTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}