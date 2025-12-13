import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Wrench, Lock, Crown, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import BibliotecaSection from "@/components/utilidades/BibliotecaSection";
import FerramentasSection from "@/components/utilidades/FerramentasSection";
import PremiumModal from "@/components/subscription/PremiumModal";

export default function Utilidades() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('biblioteca');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        // Permite visualizar sem autenticação para mostrar upgrade
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Verificar acesso Premium (apenas premium, admin, recruiter)
  const hasPremium = user?.subscription_type === 'premium' || 
                     user?.subscription_type === 'admin' || 
                     user?.subscription_type === 'recruiter' ||
                     user?.role === 'admin';

  // Redirecionar imediatamente se não tem premium
  React.useEffect(() => {
    if (!loading && user && !hasPremium) {
      window.location.href = createPageUrl('Subscription');
    }
  }, [loading, user, hasPremium]);

  // Mostrar loading ou redirecionar
  if (loading || (user && !hasPremium)) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Utilidades</h1>
          <p className="text-white/70 text-sm">Recursos profissionais para sua carreira</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-white shadow rounded-xl p-1 grid grid-cols-2">
            <TabsTrigger value="biblioteca" className="rounded-lg data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="rounded-lg data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white">
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

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}