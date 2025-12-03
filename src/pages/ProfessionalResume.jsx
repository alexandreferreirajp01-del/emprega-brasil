import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Save, Download, Plus, Trash2, Loader2, 
  Lock, Crown, User, Briefcase, GraduationCap, Award,
  Languages, FileText, Car, MapPin, Phone, Mail, CheckCircle, Edit, Upload, Eye, Search,
  PartyPopper
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const GRAUS_FORMACAO = ["Ensino Fundamental", "Ensino Médio", "Técnico", "Tecnólogo", "Superior", "Pós-Graduação", "Mestrado", "Doutorado"];
const NIVEIS_IDIOMA = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"];
const TIPOS_CNH = ["Não possui", "A", "B", "AB", "C", "D", "E"];

export default function ProfessionalResume() {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Para recrutadores/admins
  const [viewMode, setViewMode] = useState(false);
  const [allResumes, setAllResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    full_name: '',
    phone_whatsapp: '',
    email: '',
    address_city: '',
    address_state: 'PB',
    linkedin_url: '',
    profile_photo_url: '',
    professional_objective: '',
    professional_summary: '',
    education: [],
    courses: [],
    experiences: [],
    skills: [],
    languages: [],
    certifications: [],
    cnh: 'Não possui',
    has_vehicle: false,
    availability_schedule: '',
    availability_travel: false,
    availability_relocation: false,
    additional_notes: '',
    resume_file_url: '',
    is_confirmed: false
  });

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const isPremium = currentUser?.subscription_type === 'premium';
        const isRecruiterOrAdmin = currentUser?.subscription_type === 'recruiter' || 
                                   currentUser?.subscription_type === 'admin' || 
                                   currentUser?.role === 'admin';
        
        if (isPremium) {
          try {
            const resumes = await base44.entities.ProfessionalResume.filter({ user_email: currentUser.email });
            if (resumes && resumes.length > 0) {
              setResume(resumes[0]);
              setForm(prev => ({ ...prev, ...resumes[0] }));
            } else {
              setForm(prev => ({
                ...prev,
                full_name: currentUser.full_name || '',
                email: currentUser.email || ''
              }));
            }
          } catch (e) {
            console.log('Nenhum currículo encontrado');
            setForm(prev => ({
              ...prev,
              full_name: currentUser.full_name || '',
              email: currentUser.email || ''
            }));
          }
        } else if (isRecruiterOrAdmin) {
          setViewMode(true);
          try {
            const resumes = await base44.entities.ProfessionalResume.list('-created_date', 100);
            setAllResumes(resumes || []);
          } catch (e) {
            setAllResumes([]);
          }
        }
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const isPremium = user?.subscription_type === 'premium';
  const isAdmin = user?.subscription_type === 'admin' || user?.role === 'admin';
  const isRecruiterOrAdmin = user?.subscription_type === 'recruiter' || isAdmin;
  const canFillResume = isPremium;
  const canViewResumes = isRecruiterOrAdmin && !isPremium;
  const canAccess = canFillResume || canViewResumes;
  const canDownload = isAdmin;

  const handleSave = async () => {
    if (!isPremium || isSaving) return;
    
    setIsSaving(true);
    try {
      const data = { 
        ...form, 
        user_email: user.email,
        education: form.education || [],
        courses: form.courses || [],
        experiences: form.experiences || [],
        skills: form.skills || [],
        languages: form.languages || [],
        certifications: form.certifications || []
      };
      
      let savedResume;
      if (resume?.id) {
        await base44.entities.ProfessionalResume.update(resume.id, data);
        savedResume = { ...resume, ...data };
      } else {
        savedResume = await base44.entities.ProfessionalResume.create(data);
      }
      
      // Verificar se salvou corretamente buscando do banco
      const verifyResumes = await base44.entities.ProfessionalResume.filter({ user_email: user.email });
      if (verifyResumes && verifyResumes.length > 0) {
        setResume(verifyResumes[0]);
        setForm(prev => ({ ...prev, ...verifyResumes[0] }));
        
        // Mostrar animação de sucesso
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
      } else {
        throw new Error('Erro ao verificar salvamento');
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar. Tente novamente.');
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
      toast.success('Foto enviada!');
    } catch (e) {
      toast.error('Erro ao enviar foto');
    }
  };

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, resume_file_url: file_url }));
      toast.success('Arquivo enviado!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Funções para arrays
  const addEducation = () => setForm(prev => ({
    ...prev,
    education: [...(prev.education || []), { degree: '', institution: '', course: '', start_date: '', end_date: '', is_current: false }]
  }));

  const removeEducation = (index) => setForm(prev => ({
    ...prev,
    education: prev.education.filter((_, i) => i !== index)
  }));

  const updateEducation = (index, field, value) => setForm(prev => ({
    ...prev,
    education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
  }));

  const addCourse = () => setForm(prev => ({
    ...prev,
    courses: [...(prev.courses || []), { name: '', institution: '', hours: '', year: '' }]
  }));

  const removeCourse = (index) => setForm(prev => ({
    ...prev,
    courses: prev.courses.filter((_, i) => i !== index)
  }));

  const updateCourse = (index, field, value) => setForm(prev => ({
    ...prev,
    courses: prev.courses.map((c, i) => i === index ? { ...c, [field]: value } : c)
  }));

  const addExperience = () => setForm(prev => ({
    ...prev,
    experiences: [...(prev.experiences || []), { company: '', position: '', start_date: '', end_date: '', is_current: false, activities: '' }]
  }));

  const removeExperience = (index) => setForm(prev => ({
    ...prev,
    experiences: prev.experiences.filter((_, i) => i !== index)
  }));

  const updateExperience = (index, field, value) => setForm(prev => ({
    ...prev,
    experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
  }));

  const addLanguage = () => setForm(prev => ({
    ...prev,
    languages: [...(prev.languages || []), { language: '', level: 'Básico' }]
  }));

  const removeLanguage = (index) => setForm(prev => ({
    ...prev,
    languages: prev.languages.filter((_, i) => i !== index)
  }));

  const updateLanguage = (index, field, value) => setForm(prev => ({
    ...prev,
    languages: prev.languages.map((l, i) => i === index ? { ...l, [field]: value } : l)
  }));

  const addCertification = () => setForm(prev => ({
    ...prev,
    certifications: [...(prev.certifications || []), { name: '', institution: '', year: '' }]
  }));

  const removeCertification = (index) => setForm(prev => ({
    ...prev,
    certifications: prev.certifications.filter((_, i) => i !== index)
  }));

  const updateCertification = (index, field, value) => setForm(prev => ({
    ...prev,
    certifications: prev.certifications.map((c, i) => i === index ? { ...c, [field]: value } : c)
  }));

  const addSkill = (skill) => {
    if (skill && !form.skills?.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...(prev.skills || []), skill] }));
    }
  };

  const removeSkill = (index) => setForm(prev => ({
    ...prev,
    skills: prev.skills.filter((_, i) => i !== index)
  }));

  const generatePDF = (resumeData = form) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Currículo - ${resumeData.full_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0056ff; padding-bottom: 15px; }
          .header h1 { font-size: 24pt; color: #0056ff; margin-bottom: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14pt; color: #0056ff; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .experience-item { margin-bottom: 15px; padding-left: 10px; border-left: 3px solid #0056ff; }
          .experience-title { font-weight: bold; font-size: 12pt; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill-tag { background: #e8f0fe; color: #0056ff; padding: 3px 10px; border-radius: 15px; font-size: 9pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${resumeData.full_name || 'Nome não informado'}</h1>
          <p>${resumeData.phone_whatsapp || ''} ${resumeData.email ? '| ' + resumeData.email : ''}</p>
          <p>${resumeData.address_city || ''} ${resumeData.address_state ? ', ' + resumeData.address_state : ''}</p>
        </div>
        ${resumeData.professional_objective ? `<div class="section"><h2 class="section-title">Objetivo</h2><p>${resumeData.professional_objective}</p></div>` : ''}
        ${resumeData.professional_summary ? `<div class="section"><h2 class="section-title">Resumo</h2><p>${resumeData.professional_summary}</p></div>` : ''}
        ${resumeData.experiences?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Experiência</h2>
          ${resumeData.experiences.map(exp => `
            <div class="experience-item">
              <div class="experience-title">${exp.position || ''}</div>
              <div>${exp.company || ''}</div>
              <div style="font-size: 9pt; color: #888;">${exp.start_date || ''} - ${exp.is_current ? 'Atual' : exp.end_date || ''}</div>
              ${exp.activities ? `<p style="margin-top: 5px;">${exp.activities}</p>` : ''}
            </div>
          `).join('')}
        </div>` : ''}
        ${resumeData.education?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Formação</h2>
          ${resumeData.education.map(edu => `
            <div class="experience-item">
              <div class="experience-title">${edu.degree || ''} ${edu.course ? '- ' + edu.course : ''}</div>
              <div>${edu.institution || ''}</div>
            </div>
          `).join('')}
        </div>` : ''}
        ${resumeData.skills?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Habilidades</h2>
          <div class="skills-list">${resumeData.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
        </div>` : ''}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Currículo Profissional</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="rounded-2xl shadow-xl">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-[#0056ff] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Função Premium</h2>
              <p className="text-slate-600 mb-6">Assine o Premium para criar seu currículo profissional.</p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  <Crown className="w-5 h-5 mr-2" />
                  Assinar Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Modo visualização para Recrutadores/Admins
  if (canViewResumes && !canFillResume) {
    const filteredResumes = allResumes.filter(r => 
      r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address_city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Currículos ({allResumes.length})</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-6 space-y-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {selectedResume ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <Button variant="ghost" onClick={() => setSelectedResume(null)}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                  {canDownload && (
                    <Button onClick={() => selectedResume.resume_file_url ? window.open(selectedResume.resume_file_url, '_blank') : generatePDF(selectedResume)} className="bg-[#0056ff]">
                      <Download className="w-4 h-4 mr-2" />Baixar
                    </Button>
                  )}
                </div>
                <ResumePreview form={selectedResume} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResumes.map((r) => (
                <Card key={r.id} className="rounded-xl cursor-pointer hover:shadow-lg" onClick={() => setSelectedResume(r)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold truncate">{r.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-slate-500">{r.address_city}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Formulário Premium
  const sections = [
    { id: 'personal', label: 'Dados', icon: User },
    { id: 'objective', label: 'Objetivo', icon: Briefcase },
    { id: 'education', label: 'Formação', icon: GraduationCap },
    { id: 'experience', label: 'Experiência', icon: Briefcase },
    { id: 'skills', label: 'Habilidades', icon: Award },
    { id: 'languages', label: 'Idiomas', icon: Languages },
    { id: 'certifications', label: 'Certificações', icon: FileText },
    { id: 'additional', label: 'Adicionais', icon: Car },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Animação de Sucesso */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-slate-800 mb-2"
              >
                Currículo Salvo!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-600 text-sm"
              >
                Suas informações foram salvas com sucesso. Você pode editar a qualquer momento.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-2 mt-4"
              >
                <PartyPopper className="w-6 h-6 text-yellow-500" />
                <PartyPopper className="w-6 h-6 text-pink-500" />
                <PartyPopper className="w-6 h-6 text-blue-500" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-2">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Link>
              <h1 className="text-xl font-bold text-white">Meu Currículo</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Menu horizontal de seções com scrollbar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div 
            className="flex gap-1 overflow-x-auto py-2 pb-3"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#0056ff #e2e8f0'
            }}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-[#0056ff] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            {/* Dados Pessoais */}
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0056ff]" />
                  Dados de Contato
                </h3>
                
                <div className="flex items-center gap-4 mb-4">
                  {form.profile_photo_url ? (
                    <img src={form.profile_photo_url} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <Label>Foto (opcional)</Label>
                    <Input type="file" accept="image/*" onChange={handleUploadPhoto} className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input value={form.full_name || ''} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="Seu nome" />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={form.phone_whatsapp || ''} onChange={(e) => setForm({...form, phone_whatsapp: e.target.value})} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email || ''} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cidade</Label>
                      <Input value={form.address_city || ''} onChange={(e) => setForm({...form, address_city: e.target.value})} placeholder="João Pessoa" />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input value={form.address_state || ''} onChange={(e) => setForm({...form, address_state: e.target.value})} placeholder="PB" />
                    </div>
                  </div>
                  <div>
                    <Label>LinkedIn (opcional)</Label>
                    <Input value={form.linkedin_url || ''} onChange={(e) => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
              </div>
            )}

            {/* Objetivo */}
            {activeSection === 'objective' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#0056ff]" />
                  Objetivo Profissional
                </h3>
                <div>
                  <Label>Objetivo</Label>
                  <Textarea value={form.professional_objective || ''} onChange={(e) => setForm({...form, professional_objective: e.target.value})} placeholder="Ex: Busco uma oportunidade na área de..." className="min-h-[100px]" />
                </div>
                <div>
                  <Label>Resumo Profissional</Label>
                  <Textarea value={form.professional_summary || ''} onChange={(e) => setForm({...form, professional_summary: e.target.value})} placeholder="Fale um pouco sobre você..." className="min-h-[120px]" />
                </div>
              </div>
            )}

            {/* Formação */}
            {activeSection === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#0056ff]" />
                    Formação
                  </h3>
                  <Button type="button" onClick={addEducation} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                </div>
                
                {(form.education || []).map((edu, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <Select value={edu.degree || ''} onValueChange={(v) => updateEducation(index, 'degree', v)}>
                        <SelectTrigger><SelectValue placeholder="Grau" /></SelectTrigger>
                        <SelectContent>{GRAUS_FORMACAO.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={edu.course || ''} onChange={(e) => updateEducation(index, 'course', e.target.value)} placeholder="Curso" />
                      <Input value={edu.institution || ''} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="Instituição" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="month" value={edu.start_date || ''} onChange={(e) => updateEducation(index, 'start_date', e.target.value)} placeholder="Início" />
                        <Input type="month" value={edu.end_date || ''} onChange={(e) => updateEducation(index, 'end_date', e.target.value)} placeholder="Término" disabled={edu.is_current} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={edu.is_current || false} onCheckedChange={(c) => updateEducation(index, 'is_current', c)} />
                        <span className="text-sm">Cursando</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Cursos Complementares</h4>
                    <Button type="button" onClick={addCourse} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                  </div>
                  {(form.courses || []).map((course, index) => (
                    <Card key={index} className="border mb-3">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeCourse(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <Input value={course.name || ''} onChange={(e) => updateCourse(index, 'name', e.target.value)} placeholder="Nome do Curso" />
                        <Input value={course.institution || ''} onChange={(e) => updateCourse(index, 'institution', e.target.value)} placeholder="Instituição" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={course.hours || ''} onChange={(e) => updateCourse(index, 'hours', e.target.value)} placeholder="Carga horária" />
                          <Input value={course.year || ''} onChange={(e) => updateCourse(index, 'year', e.target.value)} placeholder="Ano" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Experiência */}
            {activeSection === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#0056ff]" />
                    Experiências
                  </h3>
                  <Button type="button" onClick={addExperience} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                </div>
                
                {(form.experiences || []).map((exp, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <Input value={exp.company || ''} onChange={(e) => updateExperience(index, 'company', e.target.value)} placeholder="Empresa" />
                      <Input value={exp.position || ''} onChange={(e) => updateExperience(index, 'position', e.target.value)} placeholder="Cargo" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="month" value={exp.start_date || ''} onChange={(e) => updateExperience(index, 'start_date', e.target.value)} placeholder="Entrada" />
                        <Input type="month" value={exp.end_date || ''} onChange={(e) => updateExperience(index, 'end_date', e.target.value)} placeholder="Saída" disabled={exp.is_current} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={exp.is_current || false} onCheckedChange={(c) => updateExperience(index, 'is_current', c)} />
                        <span className="text-sm">Emprego atual</span>
                      </div>
                      <Textarea value={exp.activities || ''} onChange={(e) => updateExperience(index, 'activities', e.target.value)} placeholder="Atividades exercidas..." className="min-h-[80px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Habilidades */}
            {activeSection === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0056ff]" />
                  Habilidades
                </h3>
                <div className="flex gap-2">
                  <Input id="skill-input" placeholder="Digite e pressione Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(e.target.value); e.target.value = ''; } }} />
                  <Button type="button" onClick={() => { const input = document.getElementById('skill-input'); addSkill(input.value); input.value = ''; }} variant="outline"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.skills || []).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5">
                      {skill}
                      <button type="button" onClick={() => removeSkill(index)} className="ml-2 text-slate-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Idiomas */}
            {activeSection === 'languages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Languages className="w-5 h-5 text-[#0056ff]" />
                    Idiomas
                  </h3>
                  <Button type="button" onClick={addLanguage} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                </div>
                {(form.languages || []).map((lang, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input value={lang.language || ''} onChange={(e) => updateLanguage(index, 'language', e.target.value)} placeholder="Idioma" />
                    </div>
                    <div className="flex-1">
                      <Select value={lang.level || 'Básico'} onValueChange={(v) => updateLanguage(index, 'level', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{NIVEIS_IDIOMA.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLanguage(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}

            {/* Certificações */}
            {activeSection === 'certifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0056ff]" />
                    Certificações
                  </h3>
                  <Button type="button" onClick={addCertification} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                </div>
                {(form.certifications || []).map((cert, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCertification(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <Input value={cert.name || ''} onChange={(e) => updateCertification(index, 'name', e.target.value)} placeholder="Nome da certificação" />
                      <Input value={cert.institution || ''} onChange={(e) => updateCertification(index, 'institution', e.target.value)} placeholder="Instituição" />
                      <Input value={cert.year || ''} onChange={(e) => updateCertification(index, 'year', e.target.value)} placeholder="Ano" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Adicionais */}
            {activeSection === 'additional' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#0056ff]" />
                  Informações Adicionais
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CNH</Label>
                    <Select value={form.cnh || 'Não possui'} onValueChange={(v) => setForm({...form, cnh: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIPOS_CNH.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={form.has_vehicle || false} onCheckedChange={(c) => setForm({...form, has_vehicle: c})} />
                    <span className="text-sm">Veículo próprio</span>
                  </div>
                </div>

                <div>
                  <Label>Disponibilidade de Horário</Label>
                  <Input value={form.availability_schedule || ''} onChange={(e) => setForm({...form, availability_schedule: e.target.value})} placeholder="Ex: Integral, manhã..." />
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.availability_travel || false} onCheckedChange={(c) => setForm({...form, availability_travel: c})} />
                    <span className="text-sm">Viagens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.availability_relocation || false} onCheckedChange={(c) => setForm({...form, availability_relocation: c})} />
                    <span className="text-sm">Mudança de cidade</span>
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.additional_notes || ''} onChange={(e) => setForm({...form, additional_notes: e.target.value})} placeholder="Informações extras..." className="min-h-[80px]" />
                </div>

                <div className="border-t pt-4">
                  <Label>Upload do Currículo (PDF/Word)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input type="file" accept=".pdf,.doc,.docx" onChange={handleUploadResume} disabled={isUploadingResume} className="flex-1" />
                    {isUploadingResume && <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />}
                  </div>
                  {form.resume_file_url && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <a href={form.resume_file_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] text-sm hover:underline">Ver arquivo enviado</a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botão Salvar no final do formulário */}
            <div className="pt-6 mt-6 border-t space-y-3">
              <Button 
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Salvar Currículo
              </Button>
              
              {resume?.id && (
                <p className="text-center text-xs text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Currículo salvo - última atualização: {new Date(resume.updated_date || resume.created_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}

function ResumePreview({ form }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b">
        {form.profile_photo_url ? (
          <img src={form.profile_photo_url} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#0056ff] flex items-center justify-center text-white text-xl font-bold">
            {form.full_name?.[0] || 'U'}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-800">{form.full_name || 'Nome não informado'}</h2>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-500">
            {form.phone_whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{form.phone_whatsapp}</span>}
            {form.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{form.email}</span>}
            {form.address_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{form.address_city}</span>}
          </div>
        </div>
      </div>

      {form.professional_objective && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-1">Objetivo</h3>
          <p className="text-slate-600 text-sm">{form.professional_objective}</p>
        </div>
      )}

      {form.experiences?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Experiência</h3>
          <div className="space-y-2">
            {form.experiences.map((exp, i) => (
              <div key={i} className="border-l-2 border-[#0056ff] pl-3">
                <p className="font-medium text-sm">{exp.position}</p>
                <p className="text-slate-500 text-xs">{exp.company}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {form.skills?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Habilidades</h3>
          <div className="flex flex-wrap gap-1">
            {form.skills.map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}