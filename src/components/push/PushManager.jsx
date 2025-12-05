import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2, CheckCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Chave pública VAPID
const VAPID_PUBLIC_KEY = 'BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q';

// Converter base64 para Uint8Array
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

// Gerar ID único do dispositivo
function getDeviceId() {
  let deviceId = localStorage.getItem('vagas_push_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vagas_push_device_id', deviceId);
  }
  return deviceId;
}

// Verificar suporte a push
function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// Hook para gerenciar push
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isPushSupported()) {
        setIsSupported(false);
        setLoading(false);
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (e) {
        console.log('Erro ao verificar push:', e);
      }

      setLoading(false);
    };

    checkStatus();
  }, []);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) return false;

    try {
      // Registrar service worker
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;

      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        return false;
      }

      // Inscrever para push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Enviar para o servidor
      const deviceId = getDeviceId();
      await base44.functions.invoke('pushSubscribe', {
        subscription: subscription.toJSON(),
        action: 'subscribe',
        deviceId,
        deviceInfo: navigator.userAgent
      });

      setIsSubscribed(true);
      localStorage.setItem('vagas_push_subscribed', 'true');
      return true;

    } catch (error) {
      console.error('Erro ao inscrever push:', error);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await base44.functions.invoke('pushSubscribe', {
          subscription: subscription.toJSON(),
          action: 'unsubscribe',
          deviceId: getDeviceId()
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      localStorage.removeItem('vagas_push_subscribed');
      return true;
    } catch (error) {
      console.error('Erro ao desinscrever:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe
  };
}

// Componente de botão de push
export function PushButton({ variant = 'default', className = '' }) {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();
  const [processing, setProcessing] = useState(false);

  if (!isSupported) return null;

  const handleClick = async () => {
    setProcessing(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setProcessing(false);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={processing}
        className={`p-2 rounded-full transition-colors ${
          isSubscribed ? 'text-green-600 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-100'
        } ${className}`}
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={processing}
      variant={isSubscribed ? "outline" : "default"}
      className={`${isSubscribed ? 'border-green-300 text-green-700' : 'bg-[#0056ff] hover:bg-[#0044cc]'} ${className}`}
    >
      {processing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : isSubscribed ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Notificações Ativas
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Ativar Notificações
        </>
      )}
    </Button>
  );
}

// Modal de ativação forçada
export function PushActivationModal({ onClose }) {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSupported || isSubscribed) return null;

  const handleActivate = async () => {
    setProcessing(true);
    const result = await subscribe();
    if (result) {
      setSuccess(true);
      setTimeout(() => onClose?.(), 1500);
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {success ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <Bell className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {success ? 'Notificações Ativadas!' : 'Ativar Notificações'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {success ? 'Você receberá alertas de vagas' : 'Receba alertas de novas vagas'}
          </p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center text-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="font-medium">Tudo pronto!</p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 text-sm text-center mb-4">
                Fique por dentro das melhores oportunidades de emprego na Paraíba em tempo real.
              </p>

              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Novas vagas em primeira mão
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Alertas de vagas Home Office
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Notícias e atualizações
                </li>
              </ul>

              <Button
                onClick={handleActivate}
                disabled={processing}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-medium"
              >
                {processing ? (
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

              <button
                onClick={onClose}
                className="w-full text-slate-500 text-sm mt-3 hover:text-slate-700"
              >
                Talvez depois
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente que força ativação
export default function PushManager({ forceShow = false }) {
  const [showModal, setShowModal] = useState(false);
  const { isSupported, isSubscribed, permission } = usePushNotifications();

  useEffect(() => {
    // Mostrar modal se não inscrito e nunca recusou permanentemente
    const hasDeclined = localStorage.getItem('vagas_push_declined');
    const lastPrompt = localStorage.getItem('vagas_push_last_prompt');
    const now = Date.now();
    
    // Mostrar novamente após 24h se não inscrito
    const shouldShow = isSupported && 
                       !isSubscribed && 
                       permission !== 'denied' &&
                       (!lastPrompt || now - parseInt(lastPrompt) > 24 * 60 * 60 * 1000);

    if (forceShow || shouldShow) {
      const timer = setTimeout(() => {
        setShowModal(true);
        localStorage.setItem('vagas_push_last_prompt', now.toString());
      }, forceShow ? 100 : 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission, forceShow]);

  const handleClose = () => {
    setShowModal(false);
    localStorage.setItem('vagas_push_declined', 'true');
  };

  if (!showModal) return null;

  return <PushActivationModal onClose={handleClose} />;
}