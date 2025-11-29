import React, { useState, useEffect, useCallback } from 'react';

// Função para calcular tempo relativo
export function getTimeAgo(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Se a data for no futuro ou muito recente
    if (diffMs < 0) return 'agora';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) return 'agora';
    if (diffMinutes === 1) return 'há 1 min';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffWeeks === 1) return 'há 1 semana';
    if (diffWeeks < 5) return `há ${diffWeeks} semanas`;
    if (diffMonths === 1) return 'há 1 mês';
    if (diffMonths < 12) return `há ${diffMonths} meses`;
    if (diffYears === 1) return 'há 1 ano';
    if (diffYears > 1) return `há ${diffYears} anos`;
    
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('TimeAgo error:', e);
    return '';
  }
}

// Componente que atualiza automaticamente
export default function TimeAgo({ date, className = '' }) {
  const calculateTime = useCallback(() => getTimeAgo(date), [date]);
  const [timeAgo, setTimeAgo] = useState(calculateTime);
  
  useEffect(() => {
    // Atualizar imediatamente
    setTimeAgo(calculateTime());
    
    // Atualizar a cada 30 segundos para ser mais responsivo
    const interval = setInterval(() => {
      setTimeAgo(calculateTime());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [date, calculateTime]);
  
  if (!timeAgo) return null;
  
  return <span className={className}>{timeAgo}</span>;
}