import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import BibliotecaSection from "@/components/utilidades/BibliotecaSection";
import FerramentasSection from "@/components/utilidades/FerramentasSection";

export default function Utilidades() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('biblioteca');

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Utilidades</h1>
          <p className="text-white/70 text-sm">Recursos profissionais para sua carreira</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-white shadow rounded-xl p-1 grid grid-cols-2">
            <TabsTrigger value="biblioteca" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Wrench className="w-4 h-4 mr-2" />
              Ferramentas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biblioteca" className="mt-4">
            <BibliotecaSection user={user} />
          </TabsContent>

          <TabsContent value="ferramentas" className="mt-4">
            <FerramentasSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}