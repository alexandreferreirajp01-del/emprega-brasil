/**
 * SessionHeartbeat - Registra e mantém sessão do usuário ativa
 * Deve ser montado no Layout para funcionar em todas as plataformas (web, Android, iOS)
 */
import { useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";

export default function SessionHeartbeat() {
  const sessionIdRef = useRef(null);
  const userEmailRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || !mounted) return;

        userEmailRef.current = user.email;
        const now = new Date().toISOString();

        // Criar sessão
        const session = await base44.entities.UserSession.create({
          user_email: user.email,
          session_start: now,
          last_heartbeat: now,
          is_active: true,
          device_info: navigator.userAgent,
        });

        if (!mounted) return;
        sessionIdRef.current = session.id;

        // Atualizar last_seen no User imediatamente
        await base44.auth.updateMe({ last_seen: now });

      } catch (err) {
        // Usuário não autenticado, ignorar silenciosamente
      }
    };

    init();

    // Heartbeat a cada 30s — atualiza last_heartbeat e last_seen
    intervalRef.current = setInterval(async () => {
      if (!sessionIdRef.current || !mounted) return;
      try {
        const now = new Date().toISOString();
        await base44.entities.UserSession.update(sessionIdRef.current, {
          last_heartbeat: now,
        });
        // Atualiza last_seen no perfil do usuário
        await base44.auth.updateMe({ last_seen: now });
      } catch (err) {
        // ignorar erros silenciosamente
      }
    }, 30000);

    // Ao fechar/trocar aba — marcar sessão como inativa
    const handleVisibilityChange = async () => {
      if (!sessionIdRef.current) return;
      if (document.visibilityState === 'hidden') {
        try {
          await base44.entities.UserSession.update(sessionIdRef.current, {
            is_active: false,
            session_end: new Date().toISOString(),
          });
        } catch (err) {}
      } else {
        // Voltou para a aba — reativar
        try {
          const now = new Date().toISOString();
          await base44.entities.UserSession.update(sessionIdRef.current, {
            is_active: true,
            last_heartbeat: now,
          });
          await base44.auth.updateMe({ last_seen: now });
        } catch (err) {}
      }
    };

    const handleBeforeUnload = async () => {
      if (!sessionIdRef.current) return;
      try {
        await base44.entities.UserSession.update(sessionIdRef.current, {
          session_end: new Date().toISOString(),
          is_active: false,
        });
      } catch (err) {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return null; // Componente invisível
}