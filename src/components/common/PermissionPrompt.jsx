import React, { useState, useEffect } from 'react';
import { Bell, MapPin, X, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = 'BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false
  });

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('vagas_abertas_permissions_asked');
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    // Mostrar prompt apenas se nunca viu e está em modo PWA/app instalado
    // ou se é a primeira visita
    if (!hasSeenPrompt) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  const requestNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await base44.functions.invoke('subscribePush', {
        subscription: subscription.toJSON(),
        action: 'subscribe'
      });

      return true;
    } catch (e) {
      console.error('Erro notificações:', e);
      return false;
    }
  };

  const requestLocation = async () => {
    try {
      if (!('geolocation' in navigator)) {
        return false;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { enableHighAccuracy: false, timeout: 5000 }
        );
      });
    } catch (e) {
      return false;
    }
  };

  const handleAllowAll = async () => {
    setLoading(true);
    
    const notifResult = await requestNotifications();
    const locResult = await requestLocation();
    
    setPermissions({
      notifications: notifResult,
      location: locResult
    });

    localStorage.setItem('vagas_abertas_permissions_asked', 'true');
    setLoading(false);
    
    setTimeout(() => setShowPrompt(false), 1500);
  };

  const handleSkip = () => {
    localStorage.setItem('vagas_abertas_permissions_asked', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Permissões do App</h2>
          <p className="text-white/80 text-sm mt-1">Para uma melhor experiência</p>
        </div>

        {/* Permissions List */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-800">Notificações</h3>
              <p className="text-xs text-slate-500">Receba alertas de novas vagas</p>
            </div>
            {permissions.notifications && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>

          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-800">Localização</h3>
              <p className="text-xs text-slate-500">Vagas perto de você</p>
            </div>
            {permissions.location && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>

          <p className="text-xs text-slate-400 text-center">
            Suas permissões podem ser alteradas a qualquer momento nas configurações do dispositivo.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={handleAllowAll}
            disabled={loading}
            className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-medium"
          >
            {loading ? 'Configurando...' : 'Permitir Tudo'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="w-full text-slate-500"
          >
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}