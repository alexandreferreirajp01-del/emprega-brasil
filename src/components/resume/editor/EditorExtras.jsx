import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Award, Plus, Trash2 } from 'lucide-react';

const inp = 'h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg';

export default function EditorExtras({ data, onChange }) {
  const addLang = () => onChange({ ...data, languages: [...(data.languages || []), { name: '', level: 'Básico' }] });
  const removeLang = (i) => { const l = [...(data.languages || [])]; l.splice(i, 1); onChange({ ...data, languages: l }); };
  const setLang = (i, f, v) => { const l = [...(data.languages || [])]; l[i] = { ...l[i], [f]: v }; onChange({ ...data, languages: l }); };

  const addCert = () => onChange({ ...data, certifications: [...(data.certifications || []), { name: '', institution: '', year: '' }] });
  const removeCert = (i) => { const c = [...(data.certifications || [])]; c.splice(i, 1); onChange({ ...data, certifications: c }); };
  const setCert = (i, f, v) => { const c = [...(data.certifications || [])]; c[i] = { ...c[i], [f]: v }; onChange({ ...data, certifications: c }); };

  return (
    <div className="space-y-6">
      {/* Idiomas */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1D4371]" /> Idiomas
        </h3>

        {(data.languages || []).length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600">
            Nenhum idioma adicionado
          </div>
        )}

        {(data.languages || []).map((lang, i) => (
          <div key={i} className="flex gap-2 items-center p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
            <Input
              className={`${inp} flex-1`}
              placeholder="Idioma"
              value={lang.name || ''}
              onChange={e => setLang(i, 'name', e.target.value)}
            />
            <select
              className="h-9 px-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D4371]"
              value={lang.level || 'Básico'}
              onChange={e => setLang(i, 'level', e.target.value)}
            >
              {['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'].map(l => <option key={l}>{l}</option>)}
            </select>
            <button onClick={() => removeLang(i)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addLang} className="w-full border-dashed border-slate-300 text-slate-600 dark:text-slate-300">
          <Plus className="w-4 h-4 mr-1.5" /> Adicionar Idioma
        </Button>
      </div>

      {/* Certificações */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-[#1D4371]" /> Certificações & Cursos
        </h3>

        {(data.certifications || []).length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600">
            Nenhuma certificação adicionada
          </div>
        )}

        {(data.certifications || []).map((cert, i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#1D4371]">Cert. {i + 1}</span>
              <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Input className={inp} placeholder="Nome do curso/certificação" value={cert.name || ''} onChange={e => setCert(i, 'name', e.target.value)} />
            <div className="flex gap-2">
              <Input className={`${inp} flex-1`} placeholder="Instituição" value={cert.institution || ''} onChange={e => setCert(i, 'institution', e.target.value)} />
              <Input className={`${inp} w-20`} placeholder="Ano" value={cert.year || ''} onChange={e => setCert(i, 'year', e.target.value)} />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addCert} className="w-full border-dashed border-slate-300 text-slate-600 dark:text-slate-300">
          <Plus className="w-4 h-4 mr-1.5" /> Adicionar Certificação
        </Button>
      </div>
    </div>
  );
}