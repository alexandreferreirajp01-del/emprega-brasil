import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Chave pública VAPID
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

// Gerar ou recuperar ID de visitante
function getVisitorId() {
  let visitorId = localStorage.getItem('vagas_abertas_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vagas_abertas_visitor_id', visitorId);
  }
  return visitorId;
}

export default function PushNotificationManager({ variant = 'button', showToast, autoSubscribe = false }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      // Verificar suporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }
      
      setIsSupported(true);

      // Verificar permissão
      const permission = Notification.permission;
      
      if (permission === 'denied') {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      // Registrar service worker se necessário
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        } catch (e) {
          console.log('Service worker registration failed:', e);
          setIsLoading(false);
          return;
        }
      }

      // Verificar inscrição existente
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Auto-subscribe se solicitado e não inscrito
      if (autoSubscribe && !subscription && permission === 'default') {
        // Pequeno delay para não ser intrusivo
        setTimeout(() => {
          subscribe(true);
        }, 3000);
      }

    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [autoSubscribe]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async (silent = false) => {
    setIsLoading(true);
    try {
      // Pedir permissão
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        if (!silent) {
          showToast?.('Permissão negada para notificações', 'error');
        }
        setIsLoading(false);
        return false;
      }

      // Registrar service worker
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Criar inscrição push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Enviar para o backend
      const visitorId = getVisitorId();
      const response = await base44.functions.invoke('subscribePush', {
        subscription: subscription.toJSON(),
        action: 'subscribe',
        visitorId
      });

      if (response.data.success) {
        setIsSubscribed(true);
        if (!silent) {
          showToast?.('Notificações ativadas! 🔔', 'success');
        }
        return true;
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      if (!silent) {
        showToast?.('Erro ao ativar notificações', 'error');
      }
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      
      if (subscription) {
        // Remover do backend
        await base44.functions.invoke('subscribePush', {
          subscription: subscription.toJSON(),
          action: 'unsubscribe'
        });

        // Cancelar localmente
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      showToast?.('Notificações desativadas', 'success');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      showToast?.('Erro ao desativar', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isSubscribed ? unsubscribe : () => subscribe()}
        disabled={isLoading}
        className={isSubscribed ? 'text-[#0056ff]' : 'text-slate-500'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        onClick={isSubscribed ? unsubscribe : () => subscribe()}
        disabled={isLoading}
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        className={`gap-1.5 ${!isSubscribed ? 'bg-[#0056ff] hover:bg-[#0044cc]' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
        {isSubscribed ? 'Ativo' : 'Ativar'}
      </Button>
    );
  }

  return (
    <Button
      onClick={isSubscribed ? unsubscribe : () => subscribe()}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className={`gap-2 ${!isSubscribed ? 'bg-[#0056ff] hover:bg-[#0044cc]' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell className="w-4 h-4" />
          Notificações Ativadas
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          Ativar Notificações
        </>
      )}
    </Button>
  );
}

// Hook para usar em outros componentes
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const check = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        return;
      }
      
      setIsSupported(true);
      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (e) {
        console.error('Push check error:', e);
      }
    };

    check();
  }, []);

  return { isSupported, isSubscribed, permission };
}