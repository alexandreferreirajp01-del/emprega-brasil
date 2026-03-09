import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, User, Briefcase, GraduationCap, Award, Globe, Phone, Mail, MapPin, Linkedin, Github } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ResumeForm({ data, onChange }) {

  const update = (field, value) => onChange({ ...data, [field]: value });

  const updateArray = (field, index, subfield, value) => {
    const arr = [...(data[field] || [])];
    arr[index] = { ...arr[index], [subfield]: value };
    onChange({ ...data, [field]: arr });
  };

  const addItem = (field, template) => {
    onChange({ ...data, [field]: [...(data[field] || []), template] });
  };

  const removeItem = (field, index) => {
    const arr = [...(data[field] || [])];
    arr.splice(index, 1);
    onChange({ ...data, [field]: arr });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('photo', file_url);
    } catch {}
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const skill = e.target.value.trim();
      onChange({ ...data, skills: [...(data.skills || []), skill] });
      e.target.value = '';
    }
  };

  const removeSkill = (i) => {
    const skills = [...(data.skills || [])];
    skills.splice(i, 1);
    onChange({ ...data, skills });
  };

  const addLanguage = () => addItem('languages', { name: '', level: 'Básico' });
  const addExperience = () => addItem('experience', { company: '', role: '', start: '', end: '', current: false, description: '' });
  const addEducation = () => addItem('education', { institution: '', course: '', start: '', end: '', current: false });
  const addCertification = () => addItem('certifications', { name: '', institution: '', year: '' });

  const inputClass = "h-10 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-lg";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block";

  return (
    <div className="space-y-6">
      {/* Dados Pessoais */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <User className="w-4 h-4 text-[#1D4371]" /> Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex items-center gap-4">
            {data.photo ? (
              <img src={data.photo} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-[#1D4371]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-300">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4371] text-white text-xs font-semibold rounded-lg hover:bg-[#0F2744] transition-colors">
                <Upload className="w-3.5 h-3.5" /> {data.photo ? 'Alterar Foto' : 'Adicionar Foto'}
              </span>
            </label>
          </div>
          <div>
            <label className={labelClass}>Nome Completo *</label>
            <Input className={inputClass} placeholder="Seu nome completo" value={data.name || ''} onChange={e => update('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Cargo/Título Profissional</label>
            <Input className={inputClass} placeholder="Ex: Analista de Marketing" value={data.title || ''} onChange={e => update('title', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" />E-mail</label>
            <Input className={inputClass} type="email" placeholder="seu@email.com" value={data.email || ''} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Phone className="w-3 h-3 inline mr-1" />Telefone / WhatsApp</label>
            <Input className={inputClass} placeholder="(83) 99999-9999" value={data.phone || ''} onChange={e => update('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><MapPin className="w-3 h-3 inline mr-1" />Cidade / Estado</label>
            <Input className={inputClass} placeholder="João Pessoa, PB" value={data.location || ''} onChange={e => update('location', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Linkedin className="w-3 h-3 inline mr-1" />LinkedIn (URL)</label>
            <Input className={inputClass} placeholder="linkedin.com/in/seu-perfil" value={data.linkedin || ''} onChange={e => update('linkedin', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Github className="w-3 h-3 inline mr-1" />GitHub (URL)</label>
            <Input className={inputClass} placeholder="github.com/seu-usuario" value={data.github || ''} onChange={e => update('github', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Globe className="w-3 h-3 inline mr-1" />Site / Portfolio</label>
            <Input className={inputClass} placeholder="www.seusite.com.br" value={data.website || ''} onChange={e => update('website', e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Resumo Profissional</label>
          <textarea
            className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1D4371] dark:text-white"
            placeholder="Escreva um breve resumo sobre você e seus objetivos profissionais..."
            value={data.summary || ''}
            onChange={e => update('summary', e.target.value)}
          />
        </div>
      </section>

      {/* Experiência */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <Briefcase className="w-4 h-4 text-[#1D4371]" /> Experiência Profissional
        </h3>
        {(data.experience || []).map((exp, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3 border border-slate-200 dark:border-slate-600">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#1D4371]">Experiência {i + 1}</span>
              <button onClick={() => removeItem('experience', i)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Empresa</label>
                <Input className={inputClass} placeholder="Nome da empresa" value={exp.company || ''} onChange={e => updateArray('experience', i, 'company', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Cargo</label>
                <Input className={inputClass} placeholder="Seu cargo" value={exp.role || ''} onChange={e => updateArray('experience', i, 'role', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Início</label>
                <Input className={inputClass} type="month" value={exp.start || ''} onChange={e => updateArray('experience', i, 'start', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Fim</label>
                <Input className={inputClass} type="month" value={exp.end || ''} disabled={exp.current} onChange={e => updateArray('experience', i, 'end', e.target.value)} />
                <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                  <input type="checkbox" checked={exp.current || false} onChange={e => updateArray('experience', i, 'current', e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs text-slate-500">Emprego atual</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição das atividades</label>
                <textarea
                  className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1D4371] dark:text-white"
                  placeholder="Descreva suas principais responsabilidades e conquistas..."
                  value={exp.description || ''}
                  onChange={e => updateArray('experience', i, 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addExperience} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Experiência
        </Button>
      </section>

      {/* Educação */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <GraduationCap className="w-4 h-4 text-[#1D4371]" /> Formação Acadêmica
        </h3>
        {(data.education || []).map((edu, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3 border border-slate-200 dark:border-slate-600">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#1D4371]">Formação {i + 1}</span>
              <button onClick={() => removeItem('education', i)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Instituição</label>
                <Input className={inputClass} placeholder="Nome da faculdade/escola" value={edu.institution || ''} onChange={e => updateArray('education', i, 'institution', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Curso / Grau</label>
                <Input className={inputClass} placeholder="Ex: Administração - Bacharelado" value={edu.course || ''} onChange={e => updateArray('education', i, 'course', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Início</label>
                <Input className={inputClass} type="month" value={edu.start || ''} onChange={e => updateArray('education', i, 'start', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Conclusão</label>
                <Input className={inputClass} type="month" value={edu.end || ''} disabled={edu.current} onChange={e => updateArray('education', i, 'end', e.target.value)} />
                <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                  <input type="checkbox" checked={edu.current || false} onChange={e => updateArray('education', i, 'current', e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs text-slate-500">Em andamento</span>
                </label>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEducation} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Formação
        </Button>
      </section>

      {/* Habilidades */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <Award className="w-4 h-4 text-[#1D4371]" /> Habilidades
        </h3>
        <Input
          className={inputClass}
          placeholder="Digite uma habilidade e pressione Enter (ex: Excel, Gestão de Equipes...)"
          onKeyDown={addSkill}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {(data.skills || []).map((skill, i) => (
            <Badge
              key={i}
              className="bg-[#1D4371]/10 text-[#1D4371] border-[#1D4371]/20 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
              onClick={() => removeSkill(i)}
            >
              {skill} ×
            </Badge>
          ))}
        </div>
      </section>

      {/* Idiomas */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <Globe className="w-4 h-4 text-[#1D4371]" /> Idiomas
        </h3>
        {(data.languages || []).map((lang, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <Input className={`${inputClass} flex-1`} placeholder="Idioma" value={lang.name || ''} onChange={e => updateArray('languages', i, 'name', e.target.value)} />
            <select
              className="h-10 px-3 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D4371]"
              value={lang.level || 'Básico'}
              onChange={e => updateArray('languages', i, 'level', e.target.value)}
            >
              {['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'].map(l => <option key={l}>{l}</option>)}
            </select>
            <button onClick={() => removeItem('languages', i)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLanguage} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Idioma
        </Button>
      </section>

      {/* Certificações */}
      <section>
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3 text-sm">
          <Award className="w-4 h-4 text-[#1D4371]" /> Certificações & Cursos
        </h3>
        {(data.certifications || []).map((cert, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <Input className={`${inputClass} flex-1`} placeholder="Nome do curso/certificação" value={cert.name || ''} onChange={e => updateArray('certifications', i, 'name', e.target.value)} />
            <Input className={`${inputClass} w-40`} placeholder="Instituição" value={cert.institution || ''} onChange={e => updateArray('certifications', i, 'institution', e.target.value)} />
            <Input className={`${inputClass} w-20`} placeholder="Ano" value={cert.year || ''} onChange={e => updateArray('certifications', i, 'year', e.target.value)} />
            <button onClick={() => removeItem('certifications', i)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCertification} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Certificação
        </Button>
      </section>
    </div>
  );
}