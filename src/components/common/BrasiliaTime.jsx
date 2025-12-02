// Utilitário para horário de Brasília (UTC-3)

export function getBrasiliaDate() {
  const now = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (brasiliaOffset * 60000));
}

export function formatBrasiliaDate(date, options = {}) {
  if (!date) return '';
  
  const d = new Date(date);
  const brasiliaOffset = -3 * 60;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const brasiliaDate = new Date(utc + (brasiliaOffset * 60000));
  
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

export function getTimeAgoBrasilia(date) {
  if (!date) return '';
  
  const now = getBrasiliaDate();
  const past = new Date(date);
  const brasiliaOffset = -3 * 60;
  const utc = past.getTime() + (past.getTimezoneOffset() * 60000);
  const pastBrasilia = new Date(utc + (brasiliaOffset * 60000));
  
  const diffMs = now - pastBrasilia;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffSeconds < 60) return 'agora mesmo';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffWeeks < 4) return `há ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
  if (diffMonths < 12) return `há ${diffMonths} mês${diffMonths > 1 ? 'es' : ''}`;
  
  return formatBrasiliaDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getBrasiliaISOString() {
  return getBrasiliaDate().toISOString();
}