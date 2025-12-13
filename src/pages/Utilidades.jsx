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
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('biblioteca');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          window.location.replace(createPageUrl('Subscription'));
          return;
        }
        
        const u = await base44.auth.me();
        
        const isPremium = u?.subscription_type === 'premium' || 
                         u?.subscription_type === 'admin' || 
                         u?.subscription_type === 'recruiter' ||
                         u?.role === 'admin';
        
        if (!isPremium) {
          window.location.replace(createPageUrl('Subscription'));
          return;
        }
        
        setUser(u);
        setAuthChecked(true);
      } catch (error) {
        window.location.replace(createPageUrl('Subscription'));
      }
    };
    loadUser();
  }, []);

  if (!authChecked) {
    return null;
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