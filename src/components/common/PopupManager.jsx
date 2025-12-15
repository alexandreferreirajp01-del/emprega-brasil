import React, { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from "lucide-react";

export default function PopupManager() {
  const [currentPopup, setCurrentPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: popups = [] } = useQuery({
    queryKey: ['app-popups'],
    queryFn: () => base44.entities.AppPopup.filter({ is_active: true }, '-priority', 50),
    refetchInterval: 60000, // Recarrega a cada minuto
  });

  useEffect(() => {
    if (popups.length === 0) return;

    const now = new Date();
    const popupHistory = JSON.parse(localStorage.getItem('popup_history') || '{}');

    // Encontrar popup válido para exibir
    const validPopup = popups.find(popup => {
      // Verificar datas
      if (popup.start_date && new Date(popup.start_date) > now) return false;
      if (popup.end_date && new Date(popup.end_date) < now) return false;

      const lastSeen = popupHistory[popup.id];
      
      if (!lastSeen) return true; // Nunca visto

      const lastSeenDate = new Date(lastSeen);
      const hoursSince = (now - lastSeenDate) / (1000 * 60 * 60);

      // Verificar frequência
      switch (popup.frequency) {
        case 'once':
          return false; // Já visto
        case 'daily':
          return hoursSince >= 24;
        case 'weekly':
          return hoursSince >= 168;
        case 'always':
          return true;
        default:
          return false;
      }
    });

    if (validPopup) {
      setCurrentPopup(validPopup);
      setIsOpen(true);
    }
  }, [popups]);

  const handleClose = () => {
    if (currentPopup) {
      const popupHistory = JSON.parse(localStorage.getItem('popup_history') || '{}');
      popupHistory[currentPopup.id] = new Date().toISOString();
      localStorage.setItem('popup_history', JSON.stringify(popupHistory));
    }
    setIsOpen(false);
    setCurrentPopup(null);
  };

  if (!currentPopup) return null;

  const typeConfig = {
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    announcement: { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50' },
  };

  const config = typeConfig[currentPopup.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-4`}>
            {currentPopup.icon && currentPopup.icon.startsWith('http') ? (
              <img src={currentPopup.icon} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-3xl">{currentPopup.icon || <Icon className={`w-8 h-8 ${config.color}`} />}</span>
            )}
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {currentPopup.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2 text-slate-600">
            {currentPopup.message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleClose}
            className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl px-8"
          >
            {currentPopup.button_text || 'Entendi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}