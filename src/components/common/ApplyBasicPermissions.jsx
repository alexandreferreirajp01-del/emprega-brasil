import { useEffect } from 'react';
import { base44 } from "@/api/base44Client";

// Permissões básicas padrão para todos os usuários autenticados (exceto visitantes)
const DEFAULT_BASIC_PERMISSIONS = {
  favoritas: true,
  historico: true,
  mensagens: true,
};

export default function ApplyBasicPermissions({ user }) {
  useEffect(() => {
    if (!user || localStorage.getItem('vagas_abertas_visitor_mode') === 'true') return;
    
    const applyPermissions = async () => {
      try {
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          await base44.auth.updateMe({ permissions: DEFAULT_BASIC_PERMISSIONS });
        }
      } catch (error) {
        console.warn('Permissions error:', error);
      }
    };
    
    applyPermissions().catch(() => {});
  }, [user]);

  return null;
}