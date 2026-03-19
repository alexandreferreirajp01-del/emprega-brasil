import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function OnlineUsersCounter() {
  const sessionIdRef = useRef(null);

  const { data: activeSessions = [], refetch } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      // Considera online quem teve heartbeat nos últimos 3 minutos
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const sessions = await base44.entities.UserSession.filter({
        is_active: true,
        last_heartbeat: { $gte: threeMinutesAgo }
      });
      return sessions;
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    const registerEntry = async () => {
      try {
        const user = await base44.auth.me();
        const now = new Date().toISOString();
        const session = await base44.entities.UserSession.create({
          user_email: user.email,
          session_start: now,
          last_heartbeat: now,
          is_active: true,
          device_info: navigator.userAgent,
        });
        sessionIdRef.current = session.id;
      } catch (err) {
        console.error('Erro ao registrar sessão:', err);
      }
    };

    registerEntry();

    // Heartbeat a cada 30s — atualiza last_heartbeat
    const keepAliveInterval = setInterval(async () => {
      if (sessionIdRef.current) {
        try {
          await base44.entities.UserSession.update(sessionIdRef.current, {
            last_heartbeat: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Erro no heartbeat:', err);
        }
      }
      refetch();
    }, 30000);

    const handleBeforeUnload = async () => {
      if (sessionIdRef.current) {
        try {
          await base44.entities.UserSession.update(sessionIdRef.current, {
            session_end: new Date().toISOString(),
            is_active: false,
          });
        } catch (err) {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(keepAliveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

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