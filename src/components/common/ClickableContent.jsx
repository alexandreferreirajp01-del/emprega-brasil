import React from 'react';

// Função para formatar data relativa com data absoluta
export function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Não informado';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (diffDays === 0) return `Hoje ${formattedDate}`;
  if (diffDays === 1) return `Ontem ${formattedDate}`;
  if (diffDays < 7) return `${diffDays} dias atrás ${formattedDate}`;
  if (diffDays < 14) return `1 semana atrás ${formattedDate}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás ${formattedDate}`;
  if (diffMonths === 1) return `1 mês atrás ${formattedDate}`;
  if (diffMonths < 12) return `${diffMonths} meses atrás ${formattedDate}`;
  if (diffYears === 1) return `1 ano atrás ${formattedDate}`;
  return `${diffYears} anos atrás ${formattedDate}`;
}

// Regex patterns
const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const phoneRegex = /(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/g;
const whatsappRegex = /(whatsapp|whats|zap|wpp)[:\s]*(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/gi;

// Função para limpar número de telefone
function cleanPhoneNumber(phone) {
  return phone.replace(/\D/g, '');
}

// Componente que renderiza texto com links clicáveis
export function ClickableText({ text, className = '' }) {
  if (!text) return null;

  // Dividir o texto em partes e substituir emails/telefones por links
  const parts = [];
  let lastIndex = 0;
  let key = 0;

  // Encontrar todos os matches
  const matches = [];
  
  // Emails
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({
      type: 'email',
      value: match[1],
      index: match.index,
      length: match[1].length
    });
  }
  emailRegex.lastIndex = 0;

  // WhatsApp específico
  while ((match = whatsappRegex.exec(text)) !== null) {
    const phone = match[2];
    matches.push({
      type: 'whatsapp',
      value: phone,
      fullMatch: match[0],
      index: match.index,
      length: match[0].length
    });
  }
  whatsappRegex.lastIndex = 0;

  // Telefones gerais (que não foram capturados como WhatsApp)
  while ((match = phoneRegex.exec(text)) !== null) {
    const phone = match[1];
    const isWhatsapp = matches.some(m => 
      m.type === 'whatsapp' && 
      match.index >= m.index && 
      match.index < m.index + m.length
    );
    if (!isWhatsapp) {
      matches.push({
        type: 'phone',
        value: phone,
        index: match.index,
        length: phone.length
      });
    }
  }
  phoneRegex.lastIndex = 0;

  // Ordenar matches por índice
  matches.sort((a, b) => a.index - b.index);

  // Remover overlaps
  const cleanMatches = [];
  for (const m of matches) {
    const overlaps = cleanMatches.some(cm => 
      (m.index >= cm.index && m.index < cm.index + cm.length) ||
      (cm.index >= m.index && cm.index < m.index + m.length)
    );
    if (!overlaps) {
      cleanMatches.push(m);
    }
  }

  // Construir partes
  for (const m of cleanMatches) {
    // Texto antes do match
    if (m.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, m.index)}</span>
      );
    }

    // O link
    if (m.type === 'email') {
      parts.push(
        <a
          key={key++}
          href={`mailto:${m.value}`}
          className="text-[#0056ff] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {m.value}
        </a>
      );
    } else if (m.type === 'whatsapp') {
      const cleanPhone = cleanPhoneNumber(m.value);
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      parts.push(
        <a
          key={key++}
          href={`https://wa.me/${fullPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {m.fullMatch || m.value}
        </a>
      );
    } else if (m.type === 'phone') {
      const cleanPhone = cleanPhoneNumber(m.value);
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      parts.push(
        <a
          key={key++}
          href={`https://wa.me/${fullPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {m.value}
        </a>
      );
    }

    lastIndex = m.index + m.length;
  }

  // Texto restante
  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>{text.slice(lastIndex)}</span>
    );
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{parts}</span>;
}

export default ClickableText;