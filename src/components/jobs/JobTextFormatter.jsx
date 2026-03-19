import React from 'react';

/**
 * Formata texto de vagas com:
 * - Alinhamento justificado
 * - Headings em NEGRITO E MAIÚSCULA
 * - Espaçamento adequado entre seções
 */
export default function JobTextFormatter({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const SECTION_HEADERS = [
    'REQUISITOS',
    'DESCRIÇÃO',
    'DESCRIÇÃO DAS ATIVIDADES',
    'LOCALIZAÇÃO',
    'LOCAL',
    'BENEFÍCIOS',
    'BONIFICAÇÃO',
    'VAGA DE EMPREGO',
    'CARGO',
    'COMO SE CANDIDATAR',
    'ENVIO DE CURRÍCULOS',
    'CONTATO',
    'SALÁRIO',
    'HORÁRIO',
  ];

  return (
    <div className="space-y-3 text-justify text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const upperTrimmed = trimmed.toUpperCase();

        // Linha vazia → espaçamento
        if (trimmed === '') {
          return <div key={i} className="h-2" />;
        }

        // Verificar se é um header de seção (termina com ":")
        const isHeaderMatch = /^([^:]{1,60}):\s*$/.test(trimmed);
        const isHeader = isHeaderMatch || SECTION_HEADERS.some(header => upperTrimmed.includes(header.toUpperCase()));

        if (isHeaderMatch || isHeader) {
          return (
            <p key={i} className="font-bold text-slate-800 dark:text-white mt-4 mb-2 text-base uppercase">
              {trimmed}
            </p>
          );
        }

        // Linha que começa com label inline: "Salário: R$ 2.000"
        const inlineLabelMatch = trimmed.match(/^([^:]{1,50}):\s+(.+)$/);
        if (inlineLabelMatch) {
          return (
            <p key={i} className="text-justify">
              <strong className="text-slate-800 dark:text-white font-semibold">
                {inlineLabelMatch[1].toUpperCase()}:
              </strong>{' '}
              <span>{inlineLabelMatch[2]}</span>
            </p>
          );
        }

        // Linha normal
        return (
          <p key={i} className="text-justify">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}