// Utilitário para horário de Brasília (UTC-3)
// Todas as funções de data/hora usam exclusivamente o fuso horário de Brasília

export function getBrasiliaDate() {
  const now = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (brasiliaOffset * 60000));
}

export function toBrasiliaDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const brasiliaOffset = -3 * 60;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (brasiliaOffset * 60000));
}

export function formatBrasiliaDate(date, options = {}) {
  if (!date) return '';
  
  const brasiliaDate = toBrasiliaDate(date);
  if (!brasiliaDate) return '';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return brasiliaDate.toLocaleDateString('pt-BR', defaultOptions);
}

export function formatBrasiliaDateTime(date) {
  if (!date) return '';
  const brasiliaDate = toBrasiliaDate(date);
  if (!brasiliaDate) return '';
  
  return brasiliaDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatBrasiliaTime(date) {
  if (!date) return '';
  const brasiliaDate = toBrasiliaDate(date);
  if (!brasiliaDate) return '';
  
  return brasiliaDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeAgoBrasilia(date) {
  if (!date) return '';
  
  const now = getBrasiliaDate();
  const past = new Date(date);
  if (isNaN(past.getTime())) return '';
  
  const diffMs = now.getTime() - past.getTime();
  
  if (diffMs < 0) return 'agora';
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
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
  
  return formatBrasiliaDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getBrasiliaISOString() {
  return getBrasiliaDate().toISOString();
}

// Componente React para exibir tempo relativo com atualização automática
import React, { useState, useEffect } from 'react';

export function BrasiliaTimeAgo({ date, className = '' }) {
  const [timeAgo, setTimeAgo] = useState(() => getTimeAgoBrasilia(date));
  
  useEffect(() => {
    setTimeAgo(getTimeAgoBrasilia(date));
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgoBrasilia(date));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [date]);
  
  if (!timeAgo) return null;
  
  return <span className={className}>{timeAgo}</span>;
}

// Componente para exibir data/hora de Brasília formatada
export function BrasiliaDateTime({ date, showTime = true, className = '' }) {
  const formatted = showTime 
    ? formatBrasiliaDateTime(date) 
    : formatBrasiliaDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  if (!formatted) return null;
  
  return <span className={className}>{formatted}</span>;
}