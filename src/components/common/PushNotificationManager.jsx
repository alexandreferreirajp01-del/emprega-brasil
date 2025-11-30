import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Chave pública VAPID - mesma do backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

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

export default function PushNotificationManager({ variant = 'button', showToast }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      // Verificar suporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }
      
      setIsSupported(true);

      // Registrar service worker se necessário
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // Verificar inscrição existente
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Pedir permissão
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast?.('Permissão negada para notificações', 'error');
        setIsLoading(false);
        return;
      }

      // Registrar service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Criar inscrição
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Enviar para o backend
      const response = await base44.functions.invoke('subscribePush', {
        subscription: subscription.toJSON(),
        action: 'subscribe'
      });

      if (response.data.success) {
        setIsSubscribed(true);
        showToast?.('Notificações ativadas! 🔔', 'success');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      showToast?.('Erro ao ativar notificações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
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
    return null; // Não mostrar nada se não suportado
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isSubscribed ? unsubscribe : subscribe}
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

  return (
    <Button
      onClick={isSubscribed ? unsubscribe : subscribe}
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