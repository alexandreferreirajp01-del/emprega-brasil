import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function PendingAccess() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Se já foi aprovado, redireciona
        if (currentUser.access_status === 'approved') {
          window.location.href = createPageUrl('Home');
        }
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    loadUser();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('workly_visitor_mode');
    base44.auth.logout(createPageUrl('Splash'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="rounded-3xl shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-3">
              Cadastro Pendente
            </h1>
            
            <p className="text-slate-600 mb-6">
              Seu cadastro foi recebido e está aguardando aprovação do administrador. 
              Você receberá acesso assim que for aprovado.
            </p>

            {user?.access_status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-medium">Acesso Negado</p>
                {user?.rejection_reason && (
                  <p className="text-red-600 text-sm mt-1">{user.rejection_reason}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleRefresh}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Verificar Status
              </Button>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}