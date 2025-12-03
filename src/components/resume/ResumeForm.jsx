import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Save, Plus, Trash2, Loader2, 
  User, Briefcase, GraduationCap, Award, FileText, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const TIPOS_CURSO = ["Técnico", "Tecnólogo", "Superior", "Pós-Graduação", "Mestrado", "Doutorado", "Outro"];

export default function ResumeForm({ user, onBack, onSaveSuccess }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: '',
    email: user?.email || '',
    city: '',
    state: 'PB',
    birth_date: '',
    marital_status: '',
    linkedin_url: '',
    profile_photo_url: '',
    professional_objective: '',
    education: [],
    experiences: [],
    skills: [],
    courses: [],
    additional_notes: '',
    resume_file_url: ''
  });

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const resumeName = now.toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await base44.entities.ProfessionalResume.create({
        ...form,
        user_email: user.email,
        resume_name: resumeName
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSaveSuccess) onSaveSuccess();
      }, 2000);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar currículo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, profile_photo_url: file_url }));
    } catch (e) {
      alert('Erro ao enviar foto');
    }
  };

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, resume_file_url: file_url }));
    } catch (error) {
      alert('Erro ao enviar arquivo');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Funções para arrays
  const addEducation = () => setForm(prev => ({
    ...prev,
    education: [...prev.education, { course: '', institution: '', start_year: '', end_year: '', degree_type: '' }]
  }));

  const removeEducation = (index) => setForm(prev => ({
    ...prev,
    education: prev.education.filter((_, i) => i !== index)
  }));

  const updateEducation = (index, field, value) => setForm(prev => ({
    ...prev,
    education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
  }));

  const addExperience = () => setForm(prev => ({
    ...prev,
    experiences: [...prev.experiences, { company: '', position: '', start_date: '', end_date: '', activities: '' }]
  }));

  const removeExperience = (index) => setForm(prev => ({
    ...prev,
    experiences: prev.experiences.filter((_, i) => i !== index)
  }));

  const updateExperience = (index, field, value) => setForm(prev => ({
    ...prev,
    experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
  }));

  const addSkill = (skill) => {
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (index) => setForm(prev => ({
    ...prev,
    skills: prev.skills.filter((_, i) => i !== index)
  }));

  const addCourse = () => setForm(prev => ({
    ...prev,
    courses: [...prev.courses, { name: '', institution: '', hours: '', year: '' }]
  }));

  const removeCourse = (index) => setForm(prev => ({
    ...prev,
    courses: prev.courses.filter((_, i) => i !== index)
  }));

  const updateCourse = (index, field, value) => setForm(prev => ({
    ...prev,
    courses: prev.courses.map((c, i) => i === index ? { ...c, [field]: value } : c)
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Animação de Sucesso */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              className="bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">✔️ Currículo salvo com sucesso!</h2>
              <p className="text-slate-600 text-sm">Redirecionando para Currículos Salvos...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={onBack} className="inline-flex items-center text-white/80 hover:text-white mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-xl font-bold text-white">Criar Currículo</h1>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Informações Pessoais */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#0056ff]" />
              Informações Pessoais
            </h3>

            <div className="space-y-4">
              {/* Foto */}
              <div className="flex items-center gap-4">
                {form.profile_photo_url ? (
                  <img src={form.profile_photo_url} className="w-16 h-16 rounded-full object-cover" alt="Foto" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <Label>Foto (opcional)</Label>
                  <Input type="file" accept="image/*" onChange={handleUploadPhoto} className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Nome Completo</Label>
                <Input value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="Seu nome completo" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder="João Pessoa" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} placeholder="PB" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({...form, birth_date: e.target.value})} />
                </div>
                <div>
                  <Label>Estado Civil</Label>
                  <Select value={form.marital_status} onValueChange={(v) => setForm({...form, marital_status: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_CIVIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>LinkedIn (opcional)</Label>
                <Input value={form.linkedin_url} onChange={(e) => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objetivo Profissional */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-[#0056ff]" />
              Objetivo Profissional
            </h3>
            <Textarea 
              value={form.professional_objective} 
              onChange={(e) => setForm({...form, professional_objective: e.target.value})} 
              placeholder="Descreva seu objetivo profissional..." 
              className="min-h-[120px]" 
            />
          </CardContent>
        </Card>

        {/* Formação Acadêmica */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0056ff]" />
                Formação Acadêmica
              </h3>
              <Button type="button" onClick={addEducation} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>

            {form.education.map((edu, index) => (
              <Card key={index} className="border mb-3">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(index)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={edu.course} onChange={(e) => updateEducation(index, 'course', e.target.value)} placeholder="Nome do Curso" />
                  <Input value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="Instituição" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={edu.start_year} onChange={(e) => updateEducation(index, 'start_year', e.target.value)} placeholder="Ano Início" />
                    <Input value={edu.end_year} onChange={(e) => updateEducation(index, 'end_year', e.target.value)} placeholder="Ano Conclusão" />
                  </div>
                  <Select value={edu.degree_type} onValueChange={(v) => updateEducation(index, 'degree_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Tipo do Curso" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_CURSO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}

            {form.education.length === 0 && (
              <p className="text-slate-400 text-center py-4">Nenhuma formação adicionada</p>
            )}
          </CardContent>
        </Card>

        {/* Experiência Profissional */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#0056ff]" />
                Experiência Profissional
              </h3>
              <Button type="button" onClick={addExperience} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>

            {form.experiences.map((exp, index) => (
              <Card key={index} className="border mb-3">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(index)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} placeholder="Empresa" />
                  <Input value={exp.position} onChange={(e) => updateExperience(index, 'position', e.target.value)} placeholder="Cargo" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={exp.start_date} onChange={(e) => updateExperience(index, 'start_date', e.target.value)} placeholder="Período Início" />
                    <Input value={exp.end_date} onChange={(e) => updateExperience(index, 'end_date', e.target.value)} placeholder="Período Fim" />
                  </div>
                  <Textarea value={exp.activities} onChange={(e) => updateExperience(index, 'activities', e.target.value)} placeholder="Descrição das atividades..." className="min-h-[80px]" />
                </CardContent>
              </Card>
            ))}

            {form.experiences.length === 0 && (
              <p className="text-slate-400 text-center py-4">Nenhuma experiência adicionada</p>
            )}
          </CardContent>
        </Card>

        {/* Habilidades */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#0056ff]" />
              Habilidades
            </h3>

            <div className="flex gap-2 mb-4">
              <Input 
                id="skill-input" 
                placeholder="Digite uma habilidade e pressione Enter" 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    addSkill(e.target.value); 
                    e.target.value = ''; 
                  } 
                }} 
              />
              <Button 
                type="button" 
                onClick={() => { 
                  const input = document.getElementById('skill-input'); 
                  addSkill(input.value); 
                  input.value = ''; 
                }} 
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1.5">
                  {skill}
                  <button type="button" onClick={() => removeSkill(index)} className="ml-2 text-slate-500 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {form.skills.length === 0 && (
              <p className="text-slate-400 text-center py-4">Nenhuma habilidade adicionada</p>
            )}
          </CardContent>
        </Card>

        {/* Cursos e Certificações */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0056ff]" />
                Cursos e Certificações
              </h3>
              <Button type="button" onClick={addCourse} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>

            {form.courses.map((course, index) => (
              <Card key={index} className="border mb-3">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCourse(index)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={course.name} onChange={(e) => updateCourse(index, 'name', e.target.value)} placeholder="Nome do Curso" />
                  <Input value={course.institution} onChange={(e) => updateCourse(index, 'institution', e.target.value)} placeholder="Instituição" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={course.hours} onChange={(e) => updateCourse(index, 'hours', e.target.value)} placeholder="Carga Horária" />
                    <Input value={course.year} onChange={(e) => updateCourse(index, 'year', e.target.value)} placeholder="Ano Conclusão" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {form.courses.length === 0 && (
              <p className="text-slate-400 text-center py-4">Nenhum curso adicionado</p>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#0056ff]" />
              Informações Adicionais
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={form.additional_notes} 
                  onChange={(e) => setForm({...form, additional_notes: e.target.value})} 
                  placeholder="Informações extras que deseja incluir..." 
                  className="min-h-[100px]" 
                />
              </div>

              <div>
                <Label>Upload de Currículo (PDF/Word) - Opcional</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={handleUploadResume} disabled={isUploadingFile} />
                  {isUploadingFile && <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />}
                </div>
                {form.resume_file_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <a href={form.resume_file_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] text-sm hover:underline">
                      Ver arquivo enviado
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <Button 
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-14 text-base shadow-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Currículo
            </>
          )}
        </Button>

      </div>
    </div>
  );
}