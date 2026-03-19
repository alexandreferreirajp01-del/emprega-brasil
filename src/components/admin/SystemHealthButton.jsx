import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import SystemHealthModal from './SystemHealthModal';

export default function SystemHealthButton() {
  const [open, setOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('ok'); // ok, warning, critical

  useEffect(() => {
    // Simular verificação de saúde
    // Em produção: buscar dados reais da API
    const checkHealth = () => {
      const randomStatus = ['ok', 'warning', 'critical'][Math.floor(Math.random() * 3)];
      setHealthStatus(randomStatus);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        title="Saúde do Sistema"
      >
        <Activity className="w-5 h-5" />
        <div className="absolute top-1 right-1">
          {getStatusIcon()}
        </div>
      </Button>

      <SystemHealthModal open={open} onOpenChange={setOpen} />
    </>
  );
}