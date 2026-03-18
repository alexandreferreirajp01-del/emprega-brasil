import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const inp = 'h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg';

export default function EditorExperience({ data, onChange }) {
  const [expanded, setExpanded] = React.useState(null);

  const add = () => {
    const exp = [...(data.experience || []), { company: '', role: '', start: '', end: '', current: false, description: '' }];
    onChange({ ...data, experience: exp });
    setExpanded(exp.length - 1);
  };

  const remove = (i) => {
    const exp = [...(data.experience || [])];
    exp.splice(i, 1);
    onChange({ ...data, experience: exp });
    if (expanded === i) setExpanded(null);
  };

  const set = (i, field, val) => {
    const exp = [...(data.experience || [])];
    exp[i] = { ...exp[i], [field]: val };
    onChange({ ...data, experience: exp });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#1D4371]" /> Experiência Profissional
        </h3>
        <span className="text-xs text-slate-400">{data.experience?.length || 0} {data.experience?.length === 1 ? 'registro' : 'registros'}</span>
      </div>

      {(data.experience || []).length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhuma experiência adicionada
        </div>
      )}

      {(data.experience || []).map((exp, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-[#1D4371] truncate">{exp.role || `Experiência ${i + 1}`}</p>
              {exp.company && <p className="text-[10px] text-slate-500 truncate">{exp.company}</p>}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Empresa</label>
                  <Input className={inp} placeholder="Nome da empresa" value={exp.company || ''} onChange={e => set(i, 'company', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Cargo</label>
                  <Input className={inp} placeholder="Seu cargo" value={exp.role || ''} onChange={e => set(i, 'role', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Início</label>
                  <Input className={inp} type="month" value={exp.start || ''} onChange={e => set(i, 'start', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Fim</label>
                  <Input className={inp} type="month" value={exp.end || ''} disabled={exp.current} onChange={e => set(i, 'end', e.target.value)} />
                  <label className="flex items-center gap-1 mt-1 cursor-pointer">
                    <input type="checkbox" checked={exp.current || false} onChange={e => set(i, 'current', e.target.checked)} className="w-3 h-3" />
                    <span className="text-[10px] text-slate-500">Atual</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Descrição das atividades</label>
                <textarea
                  className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1D4371] dark:text-white"
                  placeholder="Descreva responsabilidades e conquistas (uma por linha)..."
                  value={exp.description || ''}
                  onChange={e => set(i, 'description', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={add} className="w-full border-dashed border-slate-300 text-slate-600 dark:text-slate-300">
        <Plus className="w-4 h-4 mr-1.5" /> Adicionar Experiência
      </Button>
    </div>
  );
}