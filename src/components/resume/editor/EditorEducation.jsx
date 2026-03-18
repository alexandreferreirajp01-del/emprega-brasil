import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const inp = 'h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg';

export default function EditorEducation({ data, onChange }) {
  const [expanded, setExpanded] = React.useState(null);

  const add = () => {
    const edu = [...(data.education || []), { institution: '', course: '', start: '', end: '', current: false }];
    onChange({ ...data, education: edu });
    setExpanded(edu.length - 1);
  };

  const remove = (i) => {
    const edu = [...(data.education || [])];
    edu.splice(i, 1);
    onChange({ ...data, education: edu });
    if (expanded === i) setExpanded(null);
  };

  const set = (i, field, val) => {
    const edu = [...(data.education || [])];
    edu[i] = { ...edu[i], [field]: val };
    onChange({ ...data, education: edu });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#1D4371]" /> Formação Acadêmica
        </h3>
        <span className="text-xs text-slate-400">{data.education?.length || 0} registros</span>
      </div>

      {(data.education || []).length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhuma formação adicionada
        </div>
      )}

      {(data.education || []).map((edu, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-[#1D4371] truncate">{edu.course || `Formação ${i + 1}`}</p>
              {edu.institution && <p className="text-[10px] text-slate-500 truncate">{edu.institution}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button onClick={(e) => { e.stopPropagation(); remove(i); }} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expanded === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {expanded === i && (
            <div className="p-3 space-y-2.5 bg-white dark:bg-slate-800">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Instituição</label>
                <Input className={inp} placeholder="Nome da faculdade/escola" value={edu.institution || ''} onChange={e => set(i, 'institution', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Curso / Grau</label>
                <Input className={inp} placeholder="Ex: Administração - Bacharelado" value={edu.course || ''} onChange={e => set(i, 'course', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Início</label>
                  <Input className={inp} type="month" value={edu.start || ''} onChange={e => set(i, 'start', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Conclusão</label>
                  <Input className={inp} type="month" value={edu.end || ''} disabled={edu.current} onChange={e => set(i, 'end', e.target.value)} />
                  <label className="flex items-center gap-1 mt-1 cursor-pointer">
                    <input type="checkbox" checked={edu.current || false} onChange={e => set(i, 'current', e.target.checked)} className="w-3 h-3" />
                    <span className="text-[10px] text-slate-500">Em andamento</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={add} className="w-full border-dashed border-slate-300 text-slate-600 dark:text-slate-300">
        <Plus className="w-4 h-4 mr-1.5" /> Adicionar Formação
      </Button>
    </div>
  );
}