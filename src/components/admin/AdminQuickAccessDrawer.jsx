import React, { useState, useEffect } from 'react';
import { Package, Send, Settings, Users, AlertTriangle, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import OnlineUsersPanel from './OnlineUsersPanel';

const quickAccessItems = [
  {
    id: 'vagas',
    name: 'Gestão de Vagas',
    icon: Send,
    page: 'VagasPendentes',
    description: 'Gerenciador central de vagas',
  },
  {
    id: 'configuracoes',
    name: 'Configurações Gerais',
    icon: Settings,
    page: 'Configuracoes',
    description: 'Ajustes da plataforma',
  },
  {
    id: 'usuarios',
    name: 'Gerenciar Usuários',
    icon: Users,
    page: 'GerenciarUsuarios',
    description: 'Controle de acesso',
  },
  {
    id: 'pendentes',
    name: 'Vagas Pendentes',
    icon: AlertTriangle,
    page: 'VagasPendentes',
    description: 'Revisar aprovações',
  },
  {
    id: 'pendentes-ia',
    name: 'Vagas Pendentes IA',
    icon: Bot,
    page: 'VagasPendentesIA',
    description: 'Capturadas por agentes',
  },
  {
    id: 'saude',
    name: 'Saúde do Sistema',
    icon: Zap,
    page: 'SaudeDoSistema',
    description: 'Créditos e uso de funções',
  },
];

export default function AdminQuickAccessDrawer() {
  const [open, setOpen] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  const handleNavigate = (page) => {
    setOpen(false);
    window.location.href = createPageUrl(page);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Painel de Administração"
        className="text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Package className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              Painel de Administração
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Seção de Atalhos */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">
                Atalhos Rápidos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.page)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 dark:text-white text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t dark:border-slate-700 my-4" />

            {/* Seção de Usuários Online */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">
                Usuários Online
              </h3>
              <OnlineUsersPanel compact={true} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}