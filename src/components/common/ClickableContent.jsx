import React from 'react';

// Função para formatar data relativa com data absoluta
export function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Não informado';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    const now = new Date();
    
    // Formatar data absoluta
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Criar datas apenas com dia/mês/ano para comparação
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Diferença em dias
    const diffTime = todayStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Se for hoje, mostrar horas/minutos
    if (diffDays === 0) {
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      
      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      if (diffHours < 24) return `Há ${diffHours}h`;
      return `Hoje • ${formattedDate}`;
    }
    
    if (diffDays === 1) return `Ontem • ${formattedDate}`;
    if (diffDays < 7) return `${diffDays} dias • ${formattedDate}`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} sem • ${formattedDate}`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''} • ${formattedDate}`;
    
    return formattedDate;
  } catch (e) {
    return 'Data inválida';
  }
}

// Regex patterns
const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const phoneRegex = /(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/g;
const whatsappRegex = /(whatsapp|whats|zap|wpp)[:\s]*(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/gi;

function cleanPhoneNumber(phone) {
  return phone.replace(/\D/g, '');
}

export function ClickableText({ text, className = '' }) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let key = 0;
  const matches = [];
  
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({ type: 'email', value: match[1], index: match.index, length: match[1].length });
  }
  emailRegex.lastIndex = 0;

  while ((match = whatsappRegex.exec(text)) !== null) {
    matches.push({ type: 'whatsapp', value: match[2], fullMatch: match[0], index: match.index, length: match[0].length });
  }
  whatsappRegex.lastIndex = 0;

  while ((match = phoneRegex.exec(text)) !== null) {
    const phone = match[1];
    const isWhatsapp = matches.some(m => m.type === 'whatsapp' && match.index >= m.index && match.index < m.index + m.length);
    if (!isWhatsapp) {
      matches.push({ type: 'phone', value: phone, index: match.index, length: phone.length });
    }
  }
  phoneRegex.lastIndex = 0;

  matches.sort((a, b) => a.index - b.index);

  const cleanMatches = [];
  for (const m of matches) {
    const overlaps = cleanMatches.some(cm => 
      (m.index >= cm.index && m.index < cm.index + cm.length) ||
      (cm.index >= m.index && cm.index < m.index + m.length)
    );
    if (!overlaps) cleanMatches.push(m);
  }

  for (const m of cleanMatches) {
    if (m.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, m.index)}</span>);
    }

    if (m.type === 'email') {
      parts.push(
        <a key={key++} href={`mailto:${m.value}`} className="text-[#0056ff] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
          {m.value}
        </a>
      );
    } else if (m.type === 'whatsapp' || m.type === 'phone') {
      const cleanPhone = cleanPhoneNumber(m.value);
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      parts.push(
        <a key={key++} href={`https://wa.me/${fullPhone}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
          {m.fullMatch || m.value}
        </a>
      );
    }

    lastIndex = m.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length === 0 ? <span className={className}>{text}</span> : <span className={className}>{parts}</span>;
}

export default ClickableText;