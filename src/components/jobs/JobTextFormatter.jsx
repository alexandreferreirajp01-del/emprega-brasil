import React from 'react';

/**
 * Formata texto de vagas:
 * - Alinhamento justificado
 * - Linhas que terminam com ":" viram título em negrito com quebra antes
 * - Ex: "Descrição:" → quebra de linha + <strong>Descrição:</strong>
 */
export default function JobTextFormatter({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="text-slate-600 leading-relaxed text-justify space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Linha que é um label (termina com ":" ou ":" seguido de espaço)
        // Ex: "Descrição:", "Benefícios:", "Requisitos:"
        if (/^[^:]{1,60}:\s*$/.test(trimmed)) {
          return (
            <div key={i} className={i > 0 ? 'mt-3' : ''}>
              <strong className="text-slate-800 font-semibold">{trimmed}</strong>
            </div>
          );
        }

        // Linha que começa com label inline: "Salário: R$ 2.000"
        const inlineLabelMatch = trimmed.match(/^([^:]{1,50}):\s+(.+)$/);
        if (inlineLabelMatch) {
          return (
            <div key={i} className={i > 0 && lines[i - 1]?.trim() === '' ? 'mt-2' : ''}>
              <strong className="text-slate-800 font-semibold">{inlineLabelMatch[1]}:</strong>{' '}
              <span>{inlineLabelMatch[2]}</span>
            </div>
          );
        }

        // Linha vazia → espaçamento
        if (trimmed === '') {
          return <div key={i} className="h-2" />;
        }

        // Linha normal
        return (
          <div key={i}>
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}