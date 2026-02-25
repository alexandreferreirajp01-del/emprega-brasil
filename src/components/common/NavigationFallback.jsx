import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

const NO_REDIRECT_PAGES = ['PreLander'];

/**
 * Componente de fallback para prevenir tela branca
 * Monitora o estado do DOM e redireciona se necessário
 */
export default function NavigationFallback() {
  useEffect(() => {
    // Não redirecionar em páginas standalone como PreLander
    const hash = window.location.hash.replace('#/', '');
    if (NO_REDIRECT_PAGES.some(p => hash.startsWith(p))) return;

    let checkCount = 0;
    const maxChecks = 10;
    
    const checkInterval = setInterval(() => {
      checkCount++;
      
      // Verificar se o body está vazio ou muito pequeno
      const bodyHTML = document.body.innerHTML;
      const isBlank = !bodyHTML || 
                      bodyHTML.trim().length < 50 || 
                      bodyHTML === '<div></div>';
      
      if (isBlank) {
        console.warn('NavigationFallback: Tela branca detectada, aplicando correção...');
        clearInterval(checkInterval);
        
        // Recuperar última rota válida
        const lastRoute = localStorage.getItem('last_valid_route');
        const fallbackRoute = lastRoute || 'Home';
        
        // Redirecionar usando replace para não adicionar ao histórico
        window.location.replace(createPageUrl(fallbackRoute));
        return;
      }
      
      // Parar após número máximo de checagens
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval);
      }
    }, 300);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  return null;
}