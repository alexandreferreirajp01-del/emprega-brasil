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
    
    // Verificar se o navegador suporta notificações
    const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator;
    
    // Mostrar se nunca viu OU se passou mais de 7 dias (e suporta notificações)
    if (supportsNotifications && (!hasSeenPrompt || (lastPrompt && now - parseInt(lastPrompt) > 7 * 24 * 60 * 60 * 1000))) {
      const timer = setTimeout(() => setStep(1), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribePush = async () => {
    setLoading(true);
    
    // Timeout de segurança (2 segundos)
    const timeoutId = setTimeout(() => {
      console.log('Timeout atingido, finalizando setup');
      localStorage.setItem('vagas_abertas_permissions_v2', 'true');
      localStorage.setItem('vagas_push_last_prompt', Date.now().toString());
      setLoading(false);
      setStep(0);
    }, 2000);
    
    try {
      // Verificar suporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.log('Push não suportado');
        clearTimeout(timeoutId);
        setLoading(false);
        setStep(2);
        return;
      }

      // Solicitar permissão do navegador
      let permission = Notification.permission;
      
      if (permission === 'default') {
        try {
          permission = await Notification.requestPermission();
        } catch (err) {
          console.log('Erro ao solicitar permissão:', err);
          permission = 'denied';
        }
      }
      
      if (permission !== 'granted') {
        console.log('Permissão não concedida:', permission);
        clearTimeout(timeoutId);
        localStorage.setItem('vagas_abertas_permissions_v2', 'true');
        localStorage.setItem('vagas_push_last_prompt', Date.now().toString());
        setLoading(false);
        setStep(0); // Fechar direto
        return;
      }

      // Aguardar SW com timeout
      const registration = await Promise.race([
        navigator.serviceWorker.ready.then(() => navigator.serviceWorker.getRegistration('/')),
        new Promise(resolve => setTimeout(() => resolve(null), 3000))
      ]);
      
      if (!registration) {
        console.log('SW não disponível, mas permissão concedida');
        clearTimeout(timeoutId);
        localStorage.setItem('vagas_push_subscribed', 'true');
        localStorage.setItem('vagas_abertas_permissions_v2', 'true');
        setSuccess(true);
        setTimeout(() => {
          setLoading(false);
          setStep(0);
        }, 800);
        return;
      }
      
      // Verificar subscrição existente
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        } catch (subError) {
          console.log('Erro ao inscrever, mas permissão ok:', subError);
          clearTimeout(timeoutId);
          localStorage.setItem('vagas_push_subscribed', 'true');
          localStorage.setItem('vagas_abertas_permissions_v2', 'true');
          setSuccess(true);
          setTimeout(() => {
            setLoading(false);
            setStep(0);
          }, 800);
          return;
        }
      }
      
      // Enviar ao servidor (não bloquear se falhar)
      try {
        const deviceId = getDeviceId();
        await base44.functions.invoke('pushSubscribe', {
          subscription: subscription.toJSON(),
          action: 'subscribe',
          deviceId,
          deviceInfo: navigator.userAgent
        });
      } catch (apiError) {
        console.log('Erro API mas seguindo:', apiError);
      }
      
      clearTimeout(timeoutId);
      localStorage.setItem('vagas_push_subscribed', 'true');
      localStorage.setItem('vagas_abertas_permissions_v2', 'true');
      setSuccess(true);
      
      setTimeout(() => {
        setLoading(false);
        setStep(0);
      }, 800);
      
    } catch (error) {
      console.error('Erro geral:', error);
      clearTimeout(timeoutId);
      localStorage.setItem('vagas_abertas_permissions_v2', 'true');
      setLoading(false);
      setStep(0);
    }
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