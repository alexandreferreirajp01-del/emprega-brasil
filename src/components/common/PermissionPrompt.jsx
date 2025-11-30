import React, { useState, useEffect } from 'react';
import { Bell, MapPin, X } from 'lucide-react';
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
  const [step, setStep] = useState(0); // 0: hidden, 1: notifications, 2: location, 3: done
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('vagas_abertas_permissions_asked');
    
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => setStep(1), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestNotifications = async () => {
    setLoading(true);
    
    // Timeout de segurança para não travar
    const timeout = setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 8000);
    
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            await base44.functions.invoke('subscribePush', {
              subscription: subscription.toJSON(),
              action: 'subscribe'
            });
          } catch (e) {
            console.log('Push subscription error:', e);
          }
        }
      }
    } catch (e) {
      console.log('Notification error:', e);
    }
    
    clearTimeout(timeout);
    setLoading(false);
    setStep(2);
  };

  const requestLocation = async () => {
    setLoading(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }
    } catch (e) {
      console.log('Location error:', e);
    }
    setLoading(false);
    finishSetup();
  };

  const finishSetup = () => {
    localStorage.setItem('vagas_abertas_permissions_asked', 'true');
    setStep(0);
  };

  const skipCurrent = () => {
    if (step === 1) {
      setStep(2); // Pular notificações, ir para localização
    } else {
      finishSetup();
    }
  };

  const skipAll = () => {
    finishSetup();
  };

  if (step === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden relative">
        
        {/* Botão X para fechar */}
        <button
          onClick={finishSetup}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        {/* Step 1: Notificações */}
        {step === 1 && (
          <>
            <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Ativar Notificações?</h2>
              <p className="text-white/80 text-sm mt-1">Receba alertas de novas vagas</p>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-sm text-center mb-6">
                Fique por dentro das melhores oportunidades de emprego na Paraíba em tempo real.
              </p>
              
              <Button
                onClick={requestNotifications}
                disabled={loading}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-medium mb-3"
              >
                {loading ? 'Ativando...' : 'Ativar Notificações'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={skipCurrent}
                disabled={loading}
                className="w-full text-slate-500"
              >
                Pular
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Localização */}
        {step === 2 && (
          <>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Permitir Localização?</h2>
              <p className="text-white/80 text-sm mt-1">Encontre vagas perto de você</p>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-sm text-center mb-6">
                Usamos sua localização apenas para mostrar vagas na sua região.
              </p>
              
              <Button
                onClick={requestLocation}
                disabled={loading}
                className="w-full h-12 bg-green-500 hover:bg-green-600 rounded-xl text-base font-medium mb-3"
              >
                {loading ? 'Configurando...' : 'Permitir Localização'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={skipCurrent}
                disabled={loading}
                className="w-full text-slate-500"
              >
                Pular
              </Button>
            </div>
          </>
        )}

        {/* Link para pular tudo */}
        <div className="px-6 pb-4">
          <button 
            onClick={skipAll}
            className="w-full text-xs text-slate-400 hover:text-slate-600"
          >
            Configurar depois
          </button>
        </div>
      </div>
    </div>
  );
}