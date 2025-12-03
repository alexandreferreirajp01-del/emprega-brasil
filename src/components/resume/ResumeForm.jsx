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
  User, Briefcase, GraduationCap, Award, FileText, CheckCircle, Download, Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const TIPOS_CURSO = ["Técnico", "Tecnólogo", "Superior", "Pós-Graduação", "Mestrado", "Doutorado", "Outro"];

export default function ResumeForm({ user, onBack, onSaveSuccess }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [savedResume, setSavedResume] = useState(null);

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
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      // Preparar dados para salvar
      const dataToSave = {
        user_email: user.email,
        resume_name: `Currículo - ${resumeName}`,
        full_name: form.full_name || '',
        phone: form.phone || '',
        email: form.email || '',
        city: form.city || '',
        state: form.state || '',
        birth_date: form.birth_date || '',
        marital_status: form.marital_status || '',
        linkedin_url: form.linkedin_url || '',
        profile_photo_url: form.profile_photo_url || '',
        professional_objective: form.professional_objective || '',
        education: form.education || [],
        experiences: form.experiences || [],
        skills: form.skills || [],
        courses: form.courses || [],
        additional_notes: form.additional_notes || '',
        resume_file_url: form.resume_file_url || ''
      };

      // Criar o currículo
      const newResume = await base44.entities.ProfessionalResume.create(dataToSave);
      
      console.log('Currículo salvo com sucesso:', newResume);
      setSavedResume(newResume);
      setShowSuccess(true);

    } catch (error) {
      console.error('Erro ao salvar currículo:', error);
      alert('Erro ao salvar currículo. Verifique os dados e tente novamente.');
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

  // Gerar PDF do currículo
  const generatePDFContent = (resume) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Currículo - ${resume.full_name || 'Currículo'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; padding: 30px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #0056ff; padding-bottom: 20px; }
          .header h1 { font-size: 26pt; color: #0056ff; margin-bottom: 8px; }
          .header .contact { font-size: 10pt; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14pt; color: #0056ff; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 12px; font-weight: bold; }
          .item { margin-bottom: 12px; padding-left: 12px; border-left: 3px solid #0056ff; }
          .item-title { font-weight: bold; font-size: 11pt; }
          .item-subtitle { color: #555; font-size: 10pt; }
          .item-desc { font-size: 10pt; color: #666; margin-top: 4px; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill-tag { background: #e8f0fe; color: #0056ff; padding: 4px 12px; border-radius: 15px; font-size: 9pt; }
          .objective { background: #f8f9fa; padding: 15px; border-radius: 8px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${resume.full_name || 'Nome não informado'}</h1>
          <div class="contact">
            ${resume.phone ? resume.phone + ' | ' : ''}${resume.email || ''}
            ${resume.city ? '<br>' + resume.city + (resume.state ? ', ' + resume.state : '') : ''}
            ${resume.linkedin_url ? '<br>' + resume.linkedin_url : ''}
          </div>
        </div>

        ${resume.professional_objective ? `
        <div class="section">
          <h2 class="section-title">Objetivo Profissional</h2>
          <div class="objective">${resume.professional_objective}</div>
        </div>` : ''}

        ${resume.experiences?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Experiência Profissional</h2>
          ${resume.experiences.map(exp => `
            <div class="item">
              <div class="item-title">${exp.position || ''}</div>
              <div class="item-subtitle">${exp.company || ''} ${exp.start_date ? '| ' + exp.start_date + ' - ' + (exp.end_date || 'Atual') : ''}</div>
              ${exp.activities ? `<div class="item-desc">${exp.activities}</div>` : ''}
            </div>
          `).join('')}
        </div>` : ''}

        ${resume.education?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Formação Acadêmica</h2>
          ${resume.education.map(edu => `
            <div class="item">
              <div class="item-title">${edu.course || ''} ${edu.degree_type ? '(' + edu.degree_type + ')' : ''}</div>
              <div class="item-subtitle">${edu.institution || ''} ${edu.start_year ? '| ' + edu.start_year + ' - ' + (edu.end_year || 'Em andamento') : ''}</div>
            </div>
          `).join('')}
        </div>` : ''}

        ${resume.skills?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Habilidades</h2>
          <div class="skills-list">${resume.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
        </div>` : ''}

        ${resume.courses?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Cursos e Certificações</h2>
          ${resume.courses.map(c => `
            <div class="item">
              <div class="item-title">${c.name || ''}</div>
              <div class="item-subtitle">${c.institution || ''} ${c.hours ? '| ' + c.hours + 'h' : ''} ${c.year ? '| ' + c.year : ''}</div>
            </div>
          `).join('')}
        </div>` : ''}

        ${resume.additional_notes ? `
        <div class="section">
          <h2 class="section-title">Informações Adicionais</h2>
          <p>${resume.additional_notes}</p>
        </div>` : ''}
      </body>
      </html>
    `;
  };

  // Baixar PDF
  const handleDownloadPDF = (resume) => {
    const printContent = generatePDFContent(resume);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Se tem currículo salvo, mostrar tela de sucesso com opções
  if (savedResume) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-green-500 to-green-600 pt-6 pb-4 px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Currículo Salvo com Sucesso!
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Card do currículo salvo */}
          <Card className="rounded-2xl shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {savedResume.profile_photo_url ? (
                  <img src={savedResume.profile_photo_url} className="w-16 h-16 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#0056ff]/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-[#0056ff]" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{savedResume.full_name || 'Sem nome'}</h2>
                  <p className="text-slate-500">{savedResume.resume_name}</p>
                  <p className="text-sm text-slate-400">{savedResume.email}</p>
                </div>
              </div>

              {/* Resumo do currículo */}
              <div className="space-y-4 mb-6">
                {savedResume.professional_objective && (
                  <div>
                    <p className="text-sm font-semibold text-[#0056ff]">Objetivo</p>
                    <p className="text-slate-600 text-sm">{savedResume.professional_objective}</p>
                  </div>
                )}
                {savedResume.experiences?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-[#0056ff]">Experiências: {savedResume.experiences.length}</p>
                  </div>
                )}
                {savedResume.education?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-[#0056ff]">Formações: {savedResume.education.length}</p>
                  </div>
                )}
                {savedResume.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {savedResume.skills.slice(0, 5).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {savedResume.skills.length > 5 && <Badge variant="outline" className="text-xs">+{savedResume.skills.length - 5}</Badge>}
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => handleDownloadPDF(savedResume)}
                  className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Baixar PDF
                </Button>
                
                {savedResume.resume_file_url && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(savedResume.resume_file_url, '_blank')}
                    className="w-full rounded-xl h-12"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Ver Arquivo Anexado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => { setSavedResume(null); setForm({
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
              }); }}
              className="flex-1 rounded-xl h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Novo
            </Button>
            <Button 
              onClick={() => onSaveSuccess && onSaveSuccess()}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl h-12"
            >
              Ver Todos Currículos
            </Button>
          </div>
        </div>
      </div>
    );
  }

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