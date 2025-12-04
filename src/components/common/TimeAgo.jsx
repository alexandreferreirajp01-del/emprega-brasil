import React, { useState, useEffect, useCallback } from 'react';

// Pegar "agora" em horário de Brasília usando Intl API (mais preciso)
function getNowBrasilia() {
  // Usa a API Intl para obter a hora atual em Brasília
  const now = new Date();
  const brasiliaString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaString);
}

// Converte qualquer data para comparação em Brasília
function toBrasiliaTime(dateInput) {
  if (!dateInput) return null;
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  
  // Se a data já veio como ISO string do servidor (UTC), converte para Brasília
  const brasiliaString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaString);
}

// Formatar data completa no padrão brasileiro
function formatDataCompleta(date) {
  const d = toBrasiliaTime(date);
  if (!d) return '';
  
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

// Formatar horário
function formatHora(date) {
  const d = toBrasiliaTime(date);
  if (!d) return '';
  
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  
  return `${hora}:${min}`;
}

// Função principal para calcular tempo relativo baseado em Brasília
export function getTimeAgo(dateString) {
  if (!dateString) return '';
  
  try {
    // Converter ambas as datas para Brasília para comparação justa
    const dateBrasilia = toBrasiliaTime(dateString);
    if (!dateBrasilia) return '';
    
    const nowBrasilia = getNowBrasilia();
    
    // Calcular diferença em milissegundos
    const diffMs = nowBrasilia.getTime() - dateBrasilia.getTime();
    
    // Se a data for no futuro (tolerância de 1 minuto para pequenas discrepâncias)
    if (diffMs < -60000) return 'Agora mesmo';
    
    // Converter para segundos
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Menos de 1 minuto
    if (diffSeconds < 60) return 'Agora mesmo';
    
    // Minutos
    if (diffMinutes === 1) return 'Há 1 minuto';
    if (diffMinutes < 60) return `Há ${diffMinutes} minutos`;
    
    // Horas
    if (diffHours === 1) return 'Há 1 hora';
    if (diffHours < 24) return `Há ${diffHours} horas`;
    
    // 1 dia
    if (diffDays === 1) {
      return `Ontem às ${formatHora(dateString)}`;
    }
    
    // 2-6 dias
    if (diffDays === 2) return 'Há 2 dias';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    // Após 7 dias, mostrar data completa
    return formatDataCompleta(dateString);
    
  } catch (e) {
    console.error('TimeAgo error:', e);
    return '';
  }
}

// Componente que atualiza automaticamente em tempo real
export default function TimeAgo({ date, className = '' }) {
  const calculateTime = useCallback(() => getTimeAgo(date), [date]);
  const [timeAgo, setTimeAgo] = useState(calculateTime);
  
  useEffect(() => {
    // Atualizar imediatamente
    setTimeAgo(calculateTime());
    
    // Determinar intervalo de atualização baseado na idade
    const getUpdateInterval = () => {
      if (!date) return 60000;
      
      const dateBrasilia = toBrasiliaTime(date);
      const nowBrasilia = getNowBrasilia();
      if (!dateBrasilia) return 60000;
      
      const diffMs = nowBrasilia.getTime() - dateBrasilia.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      // Menos de 5 minutos: atualizar a cada 10 segundos
      if (diffMinutes < 5) return 10000;
      
      // Menos de 1 hora: atualizar a cada 30 segundos
      if (diffMinutes < 60) return 30000;
      
      // Menos de 24 horas: atualizar a cada minuto
      if (diffMinutes < 1440) return 60000;
      
      // Mais de 1 dia: atualizar a cada 5 minutos
      return 300000;
    };
    
    let interval;
    
    const updateTime = () => {
      setTimeAgo(calculateTime());
      // Reagendar com novo intervalo
      clearInterval(interval);
      interval = setInterval(updateTime, getUpdateInterval());
    };
    
    interval = setInterval(updateTime, getUpdateInterval());
    
    return () => clearInterval(interval);
  }, [date, calculateTime]);
  
  if (!timeAgo) return null;
  
  return (
    <span className={className} translate="no" data-translate="no">
      {timeAgo}
    </span>
  );
}