import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function OnlineUsersCounter() {
  const { data: activeSessions = [] } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const threeMin = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      return await base44.entities.UserSession.filter({
        is_active: true,
        last_heartbeat: { $gte: threeMin }
      });
    },
    refetchInterval: 15000,
  });

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