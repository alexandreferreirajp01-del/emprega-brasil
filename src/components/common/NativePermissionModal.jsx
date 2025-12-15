import React, { useState, useEffect } from 'react';
import { Bell, MapPin } from 'lucide-react';

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

function getDeviceId() {
  let deviceId = localStorage.getItem('vagas_push_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vagas_push_device_id', deviceId);
  }
  return deviceId;
}

export default function NativePermissionModal() {
  const [step, setStep] = useState('none'); // 'none', 'notification', 'location'
  const [appName, setAppName] = useState('Vagas Abertas PB');

  useEffect(() => {
    // Carregar nome do app
    try {
      const config = JSON.parse(localStorage.getItem('app_config_v2') || '{}');
      if (config.appName) setAppName(config.appName);
    } catch (e) {}

    // Verificar se já mostrou
    const hasShown = localStorage.getItem('native_permissions_shown');
    const lastPrompt = localStorage.getItem('native_permissions_last');
    const now = Date.now();
    
    // Mostrar apenas 1x por dia
    if (hasShown && lastPrompt && now - parseInt(lastPrompt) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Verificar suporte a notificações
    const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator;
    
    if (supportsNotifications && Notification.permission === 'default') {
      // Mostrar após 3 segundos
      const timer = setTimeout(() => {
        setStep('notification');
        localStorage.setItem('native_permissions_last', now.toString());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNotificationPermit = async () => {
    try {
      // Solicitar permissão do navegador nativo
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Tentar registrar push
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });

          // Enviar ao backend (não bloquear se falhar)
          try {
            const response = await fetch('/api/functions/pushSubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: subscription.toJSON(),
                action: 'subscribe',
                deviceId: getDeviceId(),
                deviceInfo: navigator.userAgent
              })
            });
            console.log('Push subscription saved:', await response.json());
          } catch (e) {
            console.log('Backend error (continuando):', e);
          }

          localStorage.setItem('vagas_push_subscribed', 'true');
        } catch (e) {
          console.log('Push subscribe error (continuando):', e);
        }
      }
    } catch (e) {
      console.log('Notification error:', e);
    }

    // Ir para localização
    setStep('location');
  };

  const handleNotificationDeny = () => {
    localStorage.setItem('native_permissions_shown', 'true');
    setStep('location');
  };

  const handleLocationPermit = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Localização permitida:', position.coords);
          localStorage.setItem('location_permission', 'granted');
        },
        (error) => {
          console.log('Localização negada:', error);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
    localStorage.setItem('native_permissions_shown', 'true');
    setStep('none');
  };

  const handleLocationDeny = () => {
    localStorage.setItem('native_permissions_shown', 'true');
    setStep('none');
  };

  if (step === 'none') return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {step === 'notification' && (
        <div className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 text-center border-b border-slate-300">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Privacidade de Dados</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Para melhorar sua experiência no {appName}, com seu consentimento podemos coletar e utilizar certos dados para exibir ofertas publicitárias de acordo com seu perfil de interesses.
            </p>
          </div>

          {/* Notification Request Card - Native Style */}
          <div className="bg-white m-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-slate-700" />
              </div>
              <p className="text-slate-800 text-base font-medium leading-snug">
                Permitir que o app <span className="font-bold">{appName}</span> envie notificações?
              </p>
            </div>

            {/* Buttons - Native Android Style */}
            <div className="border-t border-slate-200">
              <button
                onClick={handleNotificationPermit}
                className="w-full py-4 text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors text-base"
              >
                Permitir
              </button>
            </div>
            <div className="border-t border-slate-200">
              <button
                onClick={handleNotificationDeny}
                className="w-full py-4 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors text-base"
              >
                Não permitir
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-slate-500">
              Ao continuar você concorda com nossos{' '}
              <span className="text-blue-600">Termos de Uso</span> e{' '}
              <span className="text-blue-600">Política de Privacidade</span>
            </p>
          </div>
        </div>
      )}

      {step === 'location' && (
        <div className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 text-center border-b border-green-300">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Permissão de Localização</h2>
            <p className="text-sm text-green-700 leading-relaxed">
              Para mostrar vagas mais próximas de você, precisamos acessar sua localização.
            </p>
          </div>

          {/* Location Request Card - Native Style */}
          <div className="bg-white m-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-7 h-7 text-green-700" />
              </div>
              <p className="text-slate-800 text-base font-medium leading-snug">
                Permitir que o app <span className="font-bold">{appName}</span> acesse sua localização?
              </p>
            </div>

            {/* Buttons - Native Android Style */}
            <div className="border-t border-slate-200">
              <button
                onClick={handleLocationPermit}
                className="w-full py-4 text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors text-base"
              >
                Permitir
              </button>
            </div>
            <div className="border-t border-slate-200">
              <button
                onClick={handleLocationDeny}
                className="w-full py-4 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors text-base"
              >
                Não permitir
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-slate-500">
              Sua localização será usada apenas para filtrar vagas próximas.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}