import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import OnlineUsersPanel from "./OnlineUsersPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function OnlineUsersTrigger({ user }) {
  const [open, setOpen] = useState(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ['online-sessions-trigger'],
    queryFn: async () => {
      const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const data = await base44.entities.UserSession.filter({ is_active: true });
      return Array.isArray(data) ? data.filter(s => (s.updated_date || s.session_start) >= fiveMin) : [];
    },
    refetchInterval: 20000,
  });

  const onlineCount = new Set(sessions.map(s => s.user_email).filter(Boolean)).size;

  return (
    <>
      {/* Botão trigger estilo Messenger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-150"
        title="Usuários Online"
      >
        {/* Ícone de pessoas */}
        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="white" xmlns="http://www.w3.org/2000/svg" style={{width:'18px',height:'18px'}}>
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>

        {/* Badge de contagem */}
        <AnimatePresence>
          {onlineCount > 0 && (
            <motion.span
              key={onlineCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-white text-emerald-700 text-[10px] font-bold rounded-full border-2 border-emerald-500 px-0.5"
            >
              {onlineCount > 99 ? '99+' : onlineCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulsação ao vivo */}
        {onlineCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20 pointer-events-none" />
        )}
      </button>

      <OnlineUsersPanel
        adminUser={user}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}