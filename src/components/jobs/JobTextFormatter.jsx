import React from 'react';

/**
 * Formata texto de vagas:
 * - Apenas linhas que terminam com ":" ficam em NEGRITO E MAIÚSCULA (headers)
 * - Resto do texto permanece normal
 * - Alinhamento justificado
 */
export default function JobTextFormatter({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-3 text-justify text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Linha vazia → espaçamento
        if (trimmed === '') {
          return <div key={i} className="h-2" />;
        }

        // Header: linha que termina com ":" e nada mais
        if (/^[^:]+:\s*$/.test(trimmed)) {
          return (
            <p key={i} className="font-bold text-slate-800 dark:text-white mt-4 mb-2 text-base uppercase">
              {trimmed}
            </p>
          );
        }

        // Linha normal (sem transformações)
        return (
          <p key={i} className="text-justify">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}