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
    
    const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator;
    
    // Mostrar sempre que não viu ou passou 3 dias
    if (supportsNotifications && (!hasSeenPrompt || (lastPrompt && now - parseInt(lastPrompt) > 3 * 24 * 60 * 60 * 1000))) {
      const timer = setTimeout(() => setStep(1), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribePush = async () => {
    setLoading(true);
    
    // Timeout de segurança (5 segundos)
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Timeout atingido, pulando para próximo passo');
        setLoading(false);
        setStep(2);
      }
    }, 5000);
    
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
        // Ainda assim marcar como concluído para não ficar perguntando
        localStorage.setItem('vagas_abertas_permissions_v2', 'true');
        localStorage.setItem('vagas_push_last_prompt', Date.now().toString());
        setLoading(false);
        setStep(2);
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
        setSuccess(true);
        setTimeout(() => {
          setLoading(false);
          finishSetup(); // Fechar o modal após sucesso
        }, 1500);
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
          setSuccess(true);
          setTimeout(() => {
            setLoading(false);
            finishSetup(); // Fechar o modal após sucesso
          }, 1500);
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
      setSuccess(true);
      
      setTimeout(() => {
        setLoading(false);
        finishSetup(); // Fechar o modal após sucesso
      }, 1500);
      
    } catch (error) {
      console.error('Erro geral:', error);
      clearTimeout(timeoutId);
      setLoading(false);
      setStep(2);
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
      <div className="bg-white rounded-2xl max-w-[340px] w-full shadow-2xl overflow-hidden relative">
        <button
          onClick={finishSetup}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
        
        {step === 1 && (
          <>
            <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Ativar Notificações</h2>
              <p className="text-white/80 text-xs mt-1">Receba alertas de novas vagas</p>
            </div>

            <div className="p-4">
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Novas vagas em primeira mão</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Alertas de vagas Home Office</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Notícias e atualizações</span>
                </div>
              </div>
              
              <Button
                onClick={subscribePush}
                disabled={loading}
                className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] rounded-xl text-sm font-medium mb-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Ativar Notificações
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={finishSetup}
                disabled={loading}
                className="w-full h-9 text-slate-500 text-xs hover:bg-slate-50"
              >
                Talvez depois
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Permitir Localização?</h2>
              <p className="text-white/80 text-xs mt-1">Vagas perto de você</p>
            </div>

            <div className="p-4">
              <p className="text-slate-600 text-xs text-center mb-4">
                Sua localização ajuda a mostrar vagas na sua região.
              </p>
              
              <Button
                onClick={requestLocation}
                disabled={loading}
                className="w-full h-11 bg-green-500 hover:bg-green-600 rounded-xl text-sm font-medium mb-2"
              >
                {loading ? 'Configurando...' : 'Permitir Localização'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={skipCurrent}
                disabled={loading}
                className="w-full h-9 text-slate-500 text-xs hover:bg-slate-50"
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