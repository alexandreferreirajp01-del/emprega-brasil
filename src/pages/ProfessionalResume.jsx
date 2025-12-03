import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, FileText, FolderOpen, Lock, Crown, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

import ResumeForm from "@/components/resume/ResumeForm";
import SavedResumes from "@/components/resume/SavedResumes";

export default function ProfessionalResume() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState(null); // null, 'create', 'saved'

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const isPremium = user?.subscription_type === 'premium';
  const isAdmin = user?.subscription_type === 'admin' || user?.role === 'admin';
  const canAccess = isPremium || isAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  // Usuário sem acesso (Basic ou Visitante)
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Currículo Profissional</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="rounded-2xl shadow-xl">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-[#0056ff] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Disponível no Plano Premium</h2>
              <p className="text-slate-600 mb-6">Assine o Premium para criar e gerenciar seus currículos profissionais.</p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  <Crown className="w-5 h-5 mr-2" />
                  Assinar Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela principal com 2 opções
  if (activeView === null) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Currículo Profissional</h1>
            <p className="text-white/70 mt-1">Crie e gerencie seus currículos</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6">
          <div className="grid gap-4">
            {/* Botão Criar Currículo - Apenas para Premium (não admin visualizando) */}
            {isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card 
                  className="rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#0056ff]"
                  onClick={() => setActiveView('create')}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-[#0056ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-[#0056ff]" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Criar Currículo</h2>
                    <p className="text-slate-500">Preencha seus dados e crie um novo currículo profissional</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Botão Currículos Salvos - Para Premium e Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-500"
                onClick={() => setActiveView('saved')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Currículos Salvos</h2>
                  <p className="text-slate-500">Visualize, baixe ou exclua seus currículos salvos</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Criar Currículo
  if (activeView === 'create') {
    return (
      <ResumeForm 
        user={user} 
        onBack={() => setActiveView(null)} 
        onSaveSuccess={() => setActiveView('saved')}
      />
    );
  }

  // Tela de Currículos Salvos
  if (activeView === 'saved') {
    return (
      <SavedResumes 
        user={user} 
        isAdmin={isAdmin}
        onBack={() => setActiveView(null)} 
      />
    );
  }

  return null;
}