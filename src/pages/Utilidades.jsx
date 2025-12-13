import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Wrench, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import BibliotecaSection from "@/components/utilidades/BibliotecaSection";
import FerramentasSection from "@/components/utilidades/FerramentasSection";
import PremiumModal from "@/components/subscription/PremiumModal";

import VisitorRedirect from "@/components/common/VisitorRedirect";

export default function Utilidades() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('biblioteca');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Verificar acesso premium
  const hasPremiumAccess = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.role === 'admin';

  // Componente de bloqueio para não-premium
  const LockedContent = () => (
    <Card className="mt-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Conteúdo Exclusivo Premium</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          A Biblioteca e Ferramentas são recursos exclusivos para membros Premium. 
          Faça upgrade e tenha acesso a materiais profissionais para impulsionar sua carreira!
        </p>
        <Button 
          onClick={() => setShowPremiumModal(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-8 py-3"
        >
          <Crown className="w-5 h-5 mr-2" />
          Seja Premium Agora
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <VisitorRedirect>
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Utilidades</h1>
          <p className="text-white/70 text-sm">Recursos profissionais para sua carreira</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {hasPremiumAccess ? (
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
        ) : (
          <LockedContent />
        )}
      </div>

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
    </VisitorRedirect>
  );
}