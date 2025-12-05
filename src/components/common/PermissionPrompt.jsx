import React, { useState, useEffect } from 'react';
import { Bell, MapPin, X, CheckCircle, Loader2 } from 'lucide-react';
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

function getDeviceId() {
  let deviceId = localStorage.getItem('vagas_push_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vagas_push_device_id', deviceId);
  }
  return deviceId;
}

export default function PermissionPrompt() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('vagas_abertas_permissions_v2');
    const lastPrompt = localStorage.getItem('vagas_push_last_prompt');
    const now = Date.now();
    
    // Mostrar se nunca viu OU se passou mais de 7 dias
    if (!hasSeenPrompt || (lastPrompt && now - parseInt(lastPrompt) > 7 * 24 * 60 * 60 * 1000)) {
      const timer = setTimeout(() => setStep(1), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribePush = async () => {
    setLoading(true);
    
    const timeout = setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 15000);
    
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        // Registrar service worker
        let registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        await navigator.serviceWorker.ready;
        
        // Solicitar permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            
            const deviceId = getDeviceId();
            await base44.functions.invoke('pushSubscribe', {
              subscription: subscription.toJSON(),
              action: 'subscribe',
              deviceId,
              deviceInfo: navigator.userAgent
            });
            
            localStorage.setItem('vagas_push_subscribed', 'true');
            setSuccess(true);
            
            setTimeout(() => {
              clearTimeout(timeout);
              setLoading(false);
              setStep(2);
            }, 1000);
            return;
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
    localStorage.setItem('vagas_abertas_permissions_v2', 'true');
    localStorage.setItem('vagas_push_last_prompt', Date.now().toString());
    setStep(0);
  };

  const skipCurrent = () => {
    if (step === 1) setStep(2);
    else finishSetup();
  };

  if (step === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden relative">
        <button
          onClick={finishSetup}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        {step === 1 && (
          <>
            <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {success ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <Bell className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {success ? 'Ativado com Sucesso!' : 'Ativar Notificações?'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {success ? 'Você receberá alertas de vagas' : 'Receba alertas de novas vagas'}
              </p>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <p className="text-green-600 font-medium">Notificações ativadas!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>Novas vagas em primeira mão</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span>Alertas de Home Office</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <span>Notícias e atualizações</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={subscribePush}
                    disabled={loading}
                    className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-medium mb-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Ativar Notificações
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={finishSetup}
                    disabled={loading}
                    className="w-full text-slate-500"
                  >
                    Pular
                  </Button>
                </>
              )}
            </div>
          </>
        )}

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

      </div>
    </div>
  );
}