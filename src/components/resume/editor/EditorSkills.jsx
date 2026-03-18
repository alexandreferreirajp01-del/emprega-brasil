import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Award, Plus, X } from 'lucide-react';

const SUGGESTIONS = [
  'Microsoft Excel', 'Word', 'PowerPoint', 'Google Workspace',
  'Atendimento ao Cliente', 'Gestão de Equipes', 'Vendas', 'Negociação',
  'Pacote Office', 'SAP', 'Gestão de Projetos', 'Liderança',
  'Comunicação', 'Trabalho em Equipe', 'Proatividade', 'Organização',
  'React', 'JavaScript', 'Python', 'Node.js', 'SQL', 'Power BI',
  'Photoshop', 'Illustrator', 'Figma', 'Canva',
  'Gestão Financeira', 'Contabilidade', 'Logística', 'Compras',
];

export default function EditorSkills({ data, onChange }) {
  const [input, setInput] = useState('');

  const add = (skill) => {
    const s = skill.trim();
    if (!s || (data.skills || []).includes(s)) return;
    onChange({ ...data, skills: [...(data.skills || []), s] });
    setInput('');
  };

  const remove = (i) => {
    const skills = [...(data.skills || [])];
    skills.splice(i, 1);
    onChange({ ...data, skills });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(input); }
  };

  const filtered = SUGGESTIONS.filter(s =>
    !((data.skills || []).includes(s)) &&
    (input === '' || s.toLowerCase().includes(input.toLowerCase()))
  ).slice(0, 8);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
        <Award className="w-4 h-4 text-[#1D4371]" /> Habilidades
      </h3>

      {/* Input + add */}
      <div className="flex gap-2">
        <Input
          className="flex-1 h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg"
          placeholder="Digite e pressione Enter..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={() => add(input)}
          disabled={!input.trim()}
          className="px-3 bg-[#1D4371] text-white rounded-lg disabled:opacity-40 hover:bg-[#0F2744] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Current skills */}
      {(data.skills || []).length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Adicionadas ({data.skills.length})</p>
          <div className="flex flex-wrap gap-2">
            {(data.skills || []).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1D4371]/10 text-[#1D4371] dark:text-blue-300 rounded-full text-xs font-semibold">
                {s}
                <button onClick={() => remove(i)} className="text-[#1D4371] hover:text-red-600 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {filtered.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Sugestões rápidas</p>
          <div className="flex flex-wrap gap-2">
            {filtered.map((s, i) => (
              <button
                key={i}
                onClick={() => add(s)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-[#1D4371]/10 hover:text-[#1D4371] transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}