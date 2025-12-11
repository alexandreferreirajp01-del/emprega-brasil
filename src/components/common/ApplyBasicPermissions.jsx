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
    const applyPermissions = async () => {
      if (!user) return;
      
      // Não aplicar para visitantes
      if (localStorage.getItem('vagas_abertas_visitor_mode') === 'true') return;
      
      // Se o usuário não tem permissões definidas, aplicar padrões básicos
      if (!user.permissions || Object.keys(user.permissions).length === 0) {
        try {
          await base44.auth.updateMe({ permissions: DEFAULT_BASIC_PERMISSIONS });
        } catch (error) {
          console.error('Erro ao aplicar permissões básicas:', error);
        }
      }
    };
    
    applyPermissions();
  }, [user]);

  return null;
}