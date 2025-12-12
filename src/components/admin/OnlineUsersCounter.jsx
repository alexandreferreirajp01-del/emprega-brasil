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
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Card className="rounded-xl border-emerald-200 bg-emerald-50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">{onlineCount}</p>
              <p className="text-[10px] text-emerald-600">Sessões Ativas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-sky-200 bg-sky-50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-sky-700">{uniqueUsers}</p>
              <p className="text-[10px] text-sky-600">Usuários Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}