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

  const isMember = !user || !user?.subscription_type || user?.subscription_type === 'member';
  const hasPremium = user && !isMember && user?.subscription_type !== 'basic';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] pb-20">
        <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
                <ArrowLeft className="w-5 h-5 mr-2" />Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Utilidades</h1>
            <p className="text-white/70 text-sm">Recursos profissionais exclusivos</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#0A66C2] to-[#004182] text-white overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h2 className="font-bold text-3xl mb-3">Seja Premium</h2>
              <p className="text-white/80 text-lg mb-6">
                Acesso completo a Biblioteca e Ferramentas para alavancar sua carreira
              </p>
              <div className="text-4xl font-bold mb-6">
                R$ 29,90
                <span className="text-base font-normal text-white/70 block mt-1">pagamento único vitalício</span>
              </div>
              <Link to={createPageUrl('Subscription')}>
                <Button 
                  className="bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl h-14 px-8 text-lg font-bold"
                >
                  Ver Planos
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/70">
                <Shield className="w-5 h-5" />
                <span>Garantia de 7 dias</span>
              </div>
            </CardContent>
          </Card>
        </div>
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