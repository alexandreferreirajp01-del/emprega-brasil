import React, { useState, useEffect } from 'react';

// Função para calcular tempo relativo
export function getTimeAgo(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffSeconds < 60) return 'agora mesmo';
    if (diffMinutes === 1) return 'há 1 minuto';
    if (diffMinutes < 60) return `há ${diffMinutes} minutos`;
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffWeeks === 1) return 'há 1 semana';
    if (diffWeeks < 4) return `há ${diffWeeks} semanas`;
    if (diffMonths === 1) return 'há 1 mês';
    if (diffMonths < 12) return `há ${diffMonths} meses`;
    
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return '';
  }
}

// Componente que atualiza automaticamente
export default function TimeAgo({ date, className = '' }) {
  const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(date));
  
  useEffect(() => {
    setTimeAgo(getTimeAgo(date));
    
    // Atualizar a cada minuto
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(date));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [date]);
  
  return <span className={className}>{timeAgo}</span>;
}