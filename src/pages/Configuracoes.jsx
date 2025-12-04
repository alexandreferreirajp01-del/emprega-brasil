import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Loader2, Shield, Key, Users, Database, BarChart3, 
  Globe, Plug, Code, Bot, FileText, Settings, ChevronRight, 
  ExternalLink, Lock, CreditCard
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const menuItems = [
  { id: 'admin', name: 'Painel Administrativo', icon: Shield, color: 'red', page: 'Admin', description: 'Gerenciar vagas, usuários e comunidade' },
  { id: 'analytics-app', name: 'Analytics do App', icon: BarChart3, color: 'purple', page: 'AnalyticsPage', description: 'Análises em tempo real do aplicativo' },
  { id: 'payments', name: 'Pagamentos', icon: CreditCard, color: 'green', page: 'PaymentsPage', description: 'Gerenciar pagamentos e assinaturas' },
  { id: 'divider1', type: 'divider', label: 'Painel Base44' },
  { id: 'overview', name: 'Overview', icon: BarChart3, color: 'slate', external: true, description: 'Visão geral do aplicativo' },
  { id: 'users', name: 'Users', icon: Users, color: 'blue', external: true, description: 'Gerenciar usuários' },
  { id: 'data', name: 'Data', icon: Database, color: 'green', external: true, description: 'Ver e editar dados' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'purple', external: true, description: 'Estatísticas e métricas' },
  { id: 'domains', name: 'Domains', icon: Globe, color: 'cyan', external: true, description: 'Domínio personalizado' },
  { id: 'integrations', name: 'Integrations', icon: Plug, color: 'orange', external: true, description: 'Serviços externos' },
  { id: 'security', name: 'Security', icon: Lock, color: 'red', external: true, description: 'Segurança e permissões' },
  { id: 'code', name: 'Code', icon: Code, color: 'slate', external: true, description: 'Código fonte' },
  { id: 'agents', name: 'Agents', icon: Bot, color: 'violet', external: true, description: 'Agentes de IA' },
  { id: 'logs', name: 'Logs', icon: FileText, color: 'amber', external: true, description: 'Registros e debug' },
  { id: 'api', name: 'API', icon: Code, color: 'indigo', external: true, description: 'Documentação API' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'slate', external: true, description: 'Configurações do app' },
  { id: 'secrets', name: 'Secrets', icon: Key, color: 'rose', external: true, description: 'Chaves de API' },
];

const colorClasses = {
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  orange: 'bg-orange-100 text-orange-600',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  rose: 'bg-rose-100 text-rose-600',
};

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const handleItemClick = (item) => {
    if (item.page) {
      window.location.href = createPageUrl(item.page);
    } else if (item.external) {
      window.open('https://app.base44.com', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
          <p className="text-white/70 text-sm">Gerencie seu app e acesse o painel Base44</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={item.id} className="px-4 py-3 bg-slate-50 border-t border-b">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              }

              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${!isLast ? 'border-b border-slate-100' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </div>
                  {item.external ? (
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          Itens com <ExternalLink className="w-3 h-3 inline" /> abrem o painel Base44
        </p>
      </div>
    </div>
  );
}