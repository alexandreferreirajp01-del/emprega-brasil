import React from 'react';
import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Splash() {
  const handleVisitorAccess = () => {
    localStorage.setItem('vagas_abertas_visitor_mode', 'true');
    window.location.href = createPageUrl('Home');
  };

  const handleLogin = () => {
    localStorage.removeItem('vagas_abertas_visitor_mode');
    base44.auth.redirectToLogin(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-md w-full"
      >
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center w-32 h-32 mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/cbc7940a6_logoembranco.png" 
              alt="Vagas Abertas Paraíba" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bem-vindo a</h1>
          <h2 className="text-4xl font-bold text-white tracking-tight mt-1">Vagas Abertas Paraíba</h2>
          <p className="text-white/70 mt-3 text-lg">Encontre sua próxima oportunidade</p>
        </motion.div>

        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-4"
        >
          <Button 
            onClick={handleLogin}
            className="w-full h-14 text-lg font-semibold bg-white text-[#0056ff] hover:bg-white/90 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            Entrar / Criar Conta
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <Button 
            variant="ghost"
            onClick={handleVisitorAccess}
            className="w-full h-14 text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300"
          >
            <Eye className="mr-2 w-5 h-5" />
            Continuar como Visitante
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-white/50 text-sm"
        >
          © 2024 Vagas Abertas Paraíba. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}