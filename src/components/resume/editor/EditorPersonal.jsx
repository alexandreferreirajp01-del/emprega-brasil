import React from 'react';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const lbl = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block';
const inp = 'h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg';

export default function EditorPersonal({ data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('photo', file_url);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
        <User className="w-4 h-4 text-[#1D4371]" /> Dados Pessoais
      </h3>

      {/* Foto */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
        {data.photo ? (
          <img src={data.photo} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-[#1D4371] flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4371] text-white text-xs font-semibold rounded-lg hover:bg-[#0F2744] transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <Upload className="w-3.5 h-3.5" />
            {data.photo ? 'Alterar Foto' : 'Adicionar Foto'}
          </label>
          <p className="text-[10px] text-slate-400 mt-1">JPG, PNG até 5MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Field label="Nome Completo *" icon={<User className="w-3 h-3" />}>
          <Input className={inp} placeholder="Seu nome completo" value={data.name || ''} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Cargo / Título Profissional">
          <Input className={inp} placeholder="Ex: Analista de Marketing" value={data.title || ''} onChange={e => set('title', e.target.value)} />
        </Field>
        <Field label="E-mail" icon={<Mail className="w-3 h-3" />}>
          <Input className={inp} type="email" placeholder="seu@email.com" value={data.email || ''} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Telefone / WhatsApp" icon={<Phone className="w-3 h-3" />}>
          <Input className={inp} placeholder="(83) 99999-9999" value={data.phone || ''} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Cidade / Estado" icon={<MapPin className="w-3 h-3" />}>
          <Input className={inp} placeholder="João Pessoa, PB" value={data.location || ''} onChange={e => set('location', e.target.value)} />
        </Field>
        <Field label="LinkedIn" icon={<Linkedin className="w-3 h-3" />}>
          <Input className={inp} placeholder="linkedin.com/in/seu-perfil" value={data.linkedin || ''} onChange={e => set('linkedin', e.target.value)} />
        </Field>
        <Field label="GitHub" icon={<Github className="w-3 h-3" />}>
          <Input className={inp} placeholder="github.com/seu-usuario" value={data.github || ''} onChange={e => set('github', e.target.value)} />
        </Field>
        <Field label="Site / Portfólio" icon={<Globe className="w-3 h-3" />}>
          <Input className={inp} placeholder="www.seusite.com.br" value={data.website || ''} onChange={e => set('website', e.target.value)} />
        </Field>
        <Field label="Resumo Profissional">
          <textarea
            className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1D4371] dark:text-white"
            placeholder="Breve resumo sobre você e seus objetivos..."
            value={data.summary || ''}
            onChange={e => set('summary', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}