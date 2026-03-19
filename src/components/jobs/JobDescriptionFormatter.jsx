import React from 'react';

const SECTION_HEADERS = [
  'REQUISITOS:',
  'DESCRIÇÃO:',
  'DESCRIÇÃO DAS ATIVIDADES:',
  'LOCALIZAÇÃO:',
  'LOCAL:',
  'BENEFÍCIOS:',
  'BONIFICAÇÃO:',
  'VAGA DE EMPREGO:',
  'CARGO:',
  'COMO SE CANDIDATAR:',
  'ENVIO DE CURRÍCULOS:',
  'CONTATO:',
  'SALÁRIO:',
  'HORÁRIO:',
];

export default function JobDescriptionFormatter({ description }) {
  if (!description) return null;

  // Dividir o texto em partes (seções e conteúdo)
  const parts = [];
  let currentText = description;
  let lastIndex = 0;

  // Encontrar todas as seções
  const lines = description.split('\n');
  const result = [];

  lines.forEach((line) => {
    const trimmed = line.trim().toUpperCase();
    
    // Verificar se a linha é um header de seção
    const isHeader = SECTION_HEADERS.some(header => trimmed.includes(header));
    
    if (isHeader) {
      result.push({
        type: 'header',
        text: line.trim(),
      });
    } else if (line.trim()) {
      result.push({
        type: 'content',
        text: line,
      });
    } else {
      result.push({
        type: 'break',
      });
    }
  });

  return (
    <div className="space-y-3 text-justify text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {result.map((item, idx) => {
        if (item.type === 'header') {
          return (
            <p key={idx} className="font-bold text-slate-800 dark:text-white mt-4 mb-2 text-base">
              {item.text.toUpperCase()}
            </p>
          );
        }
        if (item.type === 'break') {
          return <div key={idx} className="h-2" />;
        }
        return (
          <p key={idx} className="text-justify">
            {item.text}
          </p>
        );
      })}
    </div>
  );
}