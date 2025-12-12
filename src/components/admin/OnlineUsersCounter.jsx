import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, TrendingUp, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function OnlineUsersCounter() {
  const [sessionId, setSessionId] = useState(null);

  // Buscar sessões ativas (últimos 5 minutos)
  const { data: activeSessions = [], refetch } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const sessions = await base44.entities.UserSession.filter({
        is_active: true,
        session_start: { $gte: fiveMinutesAgo }
      });
      return sessions;
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Registrar entrada do usuário
  useEffect(() => {
    const registerEntry = async () => {
      try {
        const user = await base44.auth.me();
        const deviceInfo = navigator.userAgent;
        
        const session = await base44.entities.UserSession.create({
          user_email: user.email,
          session_start: new Date().toISOString(),
          is_active: true,
          device_info: deviceInfo
        });
        
        setSessionId(session.id);
      } catch (err) {
        console.error('Erro ao registrar entrada:', err);
      }
    };

    registerEntry();

    // Atualizar sessão periodicamente para manter ativa
    const keepAliveInterval = setInterval(async () => {
      if (sessionId) {
        try {
          await base44.entities.UserSession.update(sessionId, {
            session_start: new Date().toISOString() // Atualiza timestamp
          });
        } catch (err) {
          console.error('Erro ao manter sessão ativa:', err);
        }
      }
      refetch();
    }, 30000); // A cada 30 segundos

    // Registrar saída ao fechar
    const handleBeforeUnload = async () => {
      if (sessionId) {
        try {
          await base44.entities.UserSession.update(sessionId, {
            session_end: new Date().toISOString(),
            is_active: false
          });
        } catch (err) {
          console.error('Erro ao registrar saída:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(keepAliveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [sessionId]);

  const onlineCount = activeSessions.length;
  const uniqueUsers = new Set(activeSessions.map(s => s.user_email)).size;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card className="rounded-xl border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{onlineCount}</p>
              <p className="text-xs text-green-600">Sessões Ativas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{uniqueUsers}</p>
              <p className="text-xs text-blue-600">Usuários Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}