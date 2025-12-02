import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Languages, FileText, Car, MapPin, Phone, Mail, Calendar, CheckCircle, Edit, Upload, Eye, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

async function safeFetch(fetchFn, fallback = null) {
  for (let i = 0; i < 3; i++) {
    try {
      const result = await fetchFn();
      return result;
    } catch (e) {
      if (i === 2) return fallback;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return fallback;
}

function calculateAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const GRAUS_FORMACAO = ["Ensino Fundamental", "Ensino Médio", "Técnico", "Tecnólogo", "Superior", "Pós-Graduação", "Mestrado", "Doutorado"];
const NIVEIS_IDIOMA = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"];
const TIPOS_CNH = ["Não possui", "A", "B", "AB", "C", "D", "E"];

export default function ProfessionalResume() {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  
  // Para recrutadores/admins visualizarem currículos
  const [viewMode, setViewMode] = useState(false);
  const [allResumes, setAllResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    cpf: '',
    rg: '',
    marital_status: '',
    nationality: 'Brasileira',
    phone_whatsapp: '',
    email: '',
    address_street: '',
    address_number: '',
    address_neighborhood: '',
    address_city: '',
    address_state: 'PB',
    address_cep: '',
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
                                   currentUser?.role === 'admin' ||
                                   currentUser?.email === 'alexandreferreirajp01@gmail.com';
        
        // Premium pode preencher formulário
        // Recrutador/Admin (não premium) só visualizam
        if (isPremium) {
          // Premium: modo formulário próprio
          const resumes = await safeFetch(
            () => base44.entities.ProfessionalResume.filter({ user_email: currentUser.email }),
            []
          );
          
          if (resumes && resumes.length > 0) {
            setResume(resumes[0]);
            setForm({ ...form, ...resumes[0] });
          } else {
            setForm(prev => ({
              ...prev,
              full_name: currentUser.full_name || '',
              email: currentUser.email || ''
            }));
            setIsEditing(true);
          }
        } else if (isRecruiterOrAdmin) {
          // Recrutador/Admin (não premium): modo visualização de currículos
          setViewMode(true);
          const resumes = await safeFetch(
            () => base44.entities.ProfessionalResume.list('-created_date', 100),
            []
          );
          setAllResumes(resumes || []);
        }
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Verificar permissões
  const isPremium = user?.subscription_type === 'premium';
  
  const isRecruiterOrAdmin = user?.subscription_type === 'recruiter' || 
                             user?.subscription_type === 'admin' || 
                             user?.role === 'admin' ||
                             user?.email === 'alexandreferreirajp01@gmail.com';
  
  // Premium pode preencher/editar currículo (prioridade)
  // Recrutador/Admin (que NÃO são premium) podem apenas visualizar e baixar
  const canFillResume = isPremium;
  const canViewResumes = isRecruiterOrAdmin && !isPremium;
  const canAccess = canFillResume || canViewResumes;

  const handleSave = async () => {
    if (!isPremium) return; // Só premium pode salvar
    setIsSaving(true);
    try {
      const data = { ...form, user_email: user.email };
      
      if (resume?.id) {
        await base44.entities.ProfessionalResume.update(resume.id, data);
        setResume({ ...resume, ...data });
      } else {
        const newResume = await base44.entities.ProfessionalResume.create(data);
        setResume(newResume);
      }
      
      toast.success('Currículo salvo com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar currículo. Tente novamente.');
    }
    setIsSaving(false);
  };

  const handleConfirm = async () => {
    if (!isPremium) return;
    const updatedForm = { ...form, is_confirmed: true };
    setForm(updatedForm);
    
    setIsSaving(true);
    try {
      const data = { ...updatedForm, user_email: user.email };
      
      if (resume?.id) {
        await base44.entities.ProfessionalResume.update(resume.id, data);
        setResume({ ...resume, ...data });
      } else {
        const newResume = await base44.entities.ProfessionalResume.create(data);
        setResume(newResume);
      }
      
      toast.success('Currículo confirmado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      toast.error('Erro ao confirmar currículo. Tente novamente.');
      setForm(prev => ({ ...prev, is_confirmed: false }));
    }
    setIsSaving(false);
  };

  const handleUploadPhoto = async (e) => {
    if (!isPremium) return;
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, profile_photo_url: file_url }));
      toast.success('Foto enviada!');
    } catch (e) {
      toast.error('Erro ao enviar foto');
    }
  };

  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const handleUploadResume = async (e) => {
    if (!isPremium) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, resume_file_url: file_url }));
      toast.success('Currículo enviado com sucesso!');
    } catch (error) {
      console.error('Erro upload:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const addEducation = () => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', course: '', start_date: '', end_date: '', is_current: false }]
    }));
  };

  const removeEducation = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index, field, value) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
    }));
  };

  const addCourse = () => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      courses: [...prev.courses, { name: '', institution: '', hours: '', year: '' }]
    }));
  };

  const removeCourse = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  const updateCourse = (index, field, value) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => i === index ? { ...course, [field]: value } : course)
    }));
  };

  const addExperience = () => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      experiences: [...prev.experiences, { company: '', position: '', start_date: '', end_date: '', is_current: false, activities: '' }]
    }));
  };

  const removeExperience = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index, field, value) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
    }));
  };

  const addLanguage = () => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', level: 'Básico' }]
    }));
  };

  const removeLanguage = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const updateLanguage = (index, field, value) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? { ...lang, [field]: value } : lang)
    }));
  };

  const addCertification = () => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', institution: '', year: '', file_url: '' }]
    }));
  };

  const removeCertification = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index, field, value) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? { ...cert, [field]: value } : cert)
    }));
  };

  const addSkill = (skill) => {
    if (!isPremium) return;
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (index) => {
    if (!isPremium) return;
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

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
          .header p { font-size: 10pt; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14pt; color: #0056ff; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
          .info-item { font-size: 10pt; }
          .info-label { font-weight: bold; }
          .experience-item, .education-item { margin-bottom: 15px; padding-left: 10px; border-left: 3px solid #0056ff; }
          .experience-title { font-weight: bold; font-size: 12pt; }
          .experience-company { color: #666; font-style: italic; }
          .experience-period { font-size: 9pt; color: #888; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill-tag { background: #e8f0fe; color: #0056ff; padding: 3px 10px; border-radius: 15px; font-size: 9pt; }
          .languages-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${resumeData.profile_photo_url ? `<img src="${resumeData.profile_photo_url}" class="photo" />` : ''}
          <h1>${resumeData.full_name}</h1>
          <p>${resumeData.phone_whatsapp} | ${resumeData.email}</p>
          <p>${resumeData.address_city}, ${resumeData.address_state}</p>
          ${resumeData.linkedin_url ? `<p>LinkedIn: ${resumeData.linkedin_url}</p>` : ''}
        </div>

        ${resumeData.professional_objective ? `
        <div class="section">
          <h2 class="section-title">Objetivo Profissional</h2>
          <p>${resumeData.professional_objective}</p>
        </div>
        ` : ''}

        ${resumeData.professional_summary ? `
        <div class="section">
          <h2 class="section-title">Resumo Profissional</h2>
          <p>${resumeData.professional_summary}</p>
        </div>
        ` : ''}

        ${resumeData.experiences?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Experiência Profissional</h2>
          ${resumeData.experiences.map(exp => `
            <div class="experience-item">
              <div class="experience-title">${exp.position}</div>
              <div class="experience-company">${exp.company}</div>
              <div class="experience-period">${exp.start_date} - ${exp.is_current ? 'Atual' : exp.end_date}</div>
              ${exp.activities ? `<p style="margin-top: 5px;">${exp.activities}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${resumeData.education?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Formação Acadêmica</h2>
          ${resumeData.education.map(edu => `
            <div class="education-item">
              <div class="experience-title">${edu.degree} - ${edu.course}</div>
              <div class="experience-company">${edu.institution}</div>
              <div class="experience-period">${edu.start_date} - ${edu.is_current ? 'Cursando' : edu.end_date}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${resumeData.courses?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Cursos Complementares</h2>
          ${resumeData.courses.map(course => `
            <div class="education-item">
              <div class="experience-title">${course.name}</div>
              <div class="experience-company">${course.institution} - ${course.hours}h</div>
              <div class="experience-period">${course.year}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${resumeData.skills?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Habilidades e Competências</h2>
          <div class="skills-list">
            ${resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${resumeData.languages?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Idiomas</h2>
          <div class="languages-grid">
            ${resumeData.languages.map(lang => `<div>${lang.language}: ${lang.level}</div>`).join('')}
          </div>
        </div>
        ` : ''}

        ${resumeData.certifications?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Certificações</h2>
          ${resumeData.certifications.map(cert => `
            <div class="education-item">
              <div class="experience-title">${cert.name}</div>
              <div class="experience-company">${cert.institution} - ${cert.year}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">Informações Adicionais</h2>
          <div class="info-grid">
            ${resumeData.cnh !== 'Não possui' ? `<div class="info-item"><span class="info-label">CNH:</span> ${resumeData.cnh}</div>` : ''}
            ${resumeData.has_vehicle ? `<div class="info-item"><span class="info-label">Veículo próprio:</span> Sim</div>` : ''}
            ${resumeData.availability_schedule ? `<div class="info-item"><span class="info-label">Disponibilidade:</span> ${resumeData.availability_schedule}</div>` : ''}
            ${resumeData.availability_travel ? `<div class="info-item"><span class="info-label">Disponível para viagens:</span> Sim</div>` : ''}
            ${resumeData.availability_relocation ? `<div class="info-item"><span class="info-label">Disponível para mudança:</span> Sim</div>` : ''}
          </div>
          ${resumeData.additional_notes ? `<p style="margin-top: 10px;">${resumeData.additional_notes}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  // Tela de bloqueio para usuários básicos/visitantes
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
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Função Exclusiva para Usuários Premium</h2>
              <p className="text-slate-600 mb-6">
                O formulário de Currículo Profissional é exclusivo para assinantes Premium.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  <Crown className="w-5 h-5 mr-2" />
                  Adquira o Premium para Desbloquear
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Recrutador/Admin: apenas modo visualização (sem formulário)
  if (canViewResumes && !canFillResume) {
    const filteredResumes = allResumes.filter(r => 
      r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.professional_objective?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Currículos de Candidatos</h1>
                <p className="text-white/70">{allResumes.length} currículos disponíveis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-6">
          {!selectedResume ? (
            <>
              {/* Busca */}
              <Card className="rounded-2xl shadow-lg mb-6">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, cidade, objetivo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Currículos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResumes.map((r) => (
                  <Card 
                    key={r.id} 
                    className="rounded-xl hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedResume(r)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {r.profile_photo_url ? (
                          <img src={r.profile_photo_url} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-7 h-7 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">{r.full_name}</h3>
                          {r.address_city && (
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.address_city}, {r.address_state}
                            </p>
                          )}
                          {r.professional_objective && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.professional_objective}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {r.is_confirmed && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                        {r.experiences?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {r.experiences.length} exp.
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredResumes.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum currículo encontrado</p>
                </div>
              )}
            </>
          ) : (
            /* Visualização do currículo selecionado */
            <Card className="rounded-2xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedResume(null)}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar à lista
                </Button>
                <Button 
                  onClick={() => generatePDF(selectedResume)} 
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <ResumePreview form={selectedResume} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }



  // ========== MODO FORMULÁRIO PARA PREMIUM ==========
  const sections = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'objective', label: 'Objetivo', icon: Briefcase },
    { id: 'education', label: 'Formação', icon: GraduationCap },
    { id: 'experience', label: 'Experiência', icon: Briefcase },
    { id: 'skills', label: 'Habilidades', icon: Award },
    { id: 'languages', label: 'Idiomas', icon: Languages },
    { id: 'certifications', label: 'Certificações', icon: FileText },
    { id: 'additional', label: 'Adicionais', icon: Car },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Currículo Profissional</h1>
              <p className="text-white/70">Preencha todas as informações do seu currículo</p>
            </div>
            {resume?.is_confirmed && (
              <Badge className="bg-green-500 text-white border-0">
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmado
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-xl sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeSection === section.id
                          ? 'bg-[#0056ff] text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <section.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-6">
                {!isEditing && resume ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-800">Seu Currículo</h2>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button onClick={() => generatePDF(form)} className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </Button>
                      </div>
                    </div>
                    <ResumePreview form={form} />
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-6 pr-4">
                      {/* Dados Pessoais */}
                      {activeSection === 'personal' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#0056ff]" />
                            Dados Pessoais
                          </h3>
                          
                          {/* Foto */}
                          <div className="flex items-center gap-4">
                            {form.profile_photo_url ? (
                              <img src={form.profile_photo_url} className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="w-10 h-10 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <Label>Foto Profissional (opcional)</Label>
                              <Input type="file" accept="image/*" onChange={handleUploadPhoto} className="mt-1" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Nome Completo</Label>
                              <Input value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} />
                            </div>
                            <div>
                              <Label>Data de Nascimento</Label>
                              <Input type="date" value={form.birth_date} onChange={(e) => setForm({...form, birth_date: e.target.value})} />
                              {form.birth_date && <p className="text-sm text-slate-500 mt-1">Idade: {calculateAge(form.birth_date)} anos</p>}
                            </div>
                            <div>
                              <Label>CPF</Label>
                              <Input value={form.cpf} onChange={(e) => setForm({...form, cpf: e.target.value})} placeholder="000.000.000-00" />
                            </div>
                            <div>
                              <Label>RG</Label>
                              <Input value={form.rg} onChange={(e) => setForm({...form, rg: e.target.value})} />
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
                            <div>
                              <Label>Nacionalidade</Label>
                              <Input value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} />
                            </div>
                            <div>
                              <Label>Telefone (WhatsApp)</Label>
                              <Input value={form.phone_whatsapp} onChange={(e) => setForm({...form, phone_whatsapp: e.target.value})} placeholder="(00) 00000-0000" />
                            </div>
                            <div>
                              <Label>E-mail</Label>
                              <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                            </div>
                          </div>

                          <h4 className="font-medium text-slate-700 mt-6">Endereço</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Label>Rua</Label>
                              <Input value={form.address_street} onChange={(e) => setForm({...form, address_street: e.target.value})} />
                            </div>
                            <div>
                              <Label>Número</Label>
                              <Input value={form.address_number} onChange={(e) => setForm({...form, address_number: e.target.value})} />
                            </div>
                            <div>
                              <Label>Bairro</Label>
                              <Input value={form.address_neighborhood} onChange={(e) => setForm({...form, address_neighborhood: e.target.value})} />
                            </div>
                            <div>
                              <Label>Cidade</Label>
                              <Input value={form.address_city} onChange={(e) => setForm({...form, address_city: e.target.value})} />
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <Input value={form.address_state} onChange={(e) => setForm({...form, address_state: e.target.value})} />
                            </div>
                            <div>
                              <Label>CEP</Label>
                              <Input value={form.address_cep} onChange={(e) => setForm({...form, address_cep: e.target.value})} placeholder="00000-000" />
                            </div>
                          </div>

                          <div>
                            <Label>LinkedIn</Label>
                            <Input value={form.linkedin_url} onChange={(e) => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/seu-perfil" />
                          </div>
                        </div>
                      )}

                      {/* Objetivo */}
                      {activeSection === 'objective' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#0056ff]" />
                            Objetivo e Resumo Profissional
                          </h3>
                          <div>
                            <Label>Objetivo Profissional</Label>
                            <Textarea 
                              value={form.professional_objective} 
                              onChange={(e) => setForm({...form, professional_objective: e.target.value})}
                              placeholder="Descreva seu objetivo profissional ou área em que deseja atuar..."
                              className="min-h-[100px]"
                            />
                          </div>
                          <div>
                            <Label>Resumo Profissional</Label>
                            <Textarea 
                              value={form.professional_summary} 
                              onChange={(e) => setForm({...form, professional_summary: e.target.value})}
                              placeholder="Escreva um breve resumo sobre você (3-5 linhas)..."
                              className="min-h-[120px]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Formação */}
                      {activeSection === 'education' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-[#0056ff]" />
                              Formação Acadêmica
                            </h3>
                            <Button onClick={addEducation} variant="outline" size="sm" className="rounded-lg">
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {form.education.map((edu, index) => (
                            <Card key={index} className="border-2">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Formação {index + 1}</span>
                                  <Button variant="ghost" size="sm" onClick={() => removeEducation(index)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label>Grau</Label>
                                    <Select value={edu.degree} onValueChange={(v) => updateEducation(index, 'degree', v)}>
                                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                      <SelectContent>
                                        {GRAUS_FORMACAO.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Curso</Label>
                                    <Input value={edu.course} onChange={(e) => updateEducation(index, 'course', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Instituição</Label>
                                    <Input value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Data de Início</Label>
                                    <Input type="month" value={edu.start_date} onChange={(e) => updateEducation(index, 'start_date', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Data de Conclusão</Label>
                                    <Input 
                                      type="month" 
                                      value={edu.end_date} 
                                      onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                                      disabled={edu.is_current}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <Checkbox 
                                        checked={edu.is_current} 
                                        onCheckedChange={(c) => updateEducation(index, 'is_current', c)}
                                      />
                                      <span className="text-sm">Cursando</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          <div className="border-t pt-4 mt-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-slate-800">Cursos Complementares</h4>
                              <Button onClick={addCourse} variant="outline" size="sm" className="rounded-lg">
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                            {form.courses.map((course, index) => (
                              <Card key={index} className="border-2 mb-3">
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Curso {index + 1}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeCourse(index)} className="text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="md:col-span-2">
                                      <Label>Nome do Curso</Label>
                                      <Input value={course.name} onChange={(e) => updateCourse(index, 'name', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Instituição</Label>
                                      <Input value={course.institution} onChange={(e) => updateCourse(index, 'institution', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Carga Horária</Label>
                                      <Input value={course.hours} onChange={(e) => updateCourse(index, 'hours', e.target.value)} placeholder="Ex: 40h" />
                                    </div>
                                    <div>
                                      <Label>Ano de Conclusão</Label>
                                      <Input value={course.year} onChange={(e) => updateCourse(index, 'year', e.target.value)} placeholder="Ex: 2024" />
                                    </div>
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
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-[#0056ff]" />
                              Experiências Profissionais
                            </h3>
                            <Button onClick={addExperience} variant="outline" size="sm" className="rounded-lg">
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {form.experiences.map((exp, index) => (
                            <Card key={index} className="border-2">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Experiência {index + 1}</span>
                                  <Button variant="ghost" size="sm" onClick={() => removeExperience(index)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label>Nome da Empresa</Label>
                                    <Input value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Cargo</Label>
                                    <Input value={exp.position} onChange={(e) => updateExperience(index, 'position', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Data de Entrada</Label>
                                    <Input type="month" value={exp.start_date} onChange={(e) => updateExperience(index, 'start_date', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Data de Saída</Label>
                                    <Input 
                                      type="month" 
                                      value={exp.end_date} 
                                      onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                                      disabled={exp.is_current}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <Checkbox 
                                        checked={exp.is_current} 
                                        onCheckedChange={(c) => updateExperience(index, 'is_current', c)}
                                      />
                                      <span className="text-sm">Emprego Atual</span>
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label>Atividades Exercidas</Label>
                                    <Textarea 
                                      value={exp.activities} 
                                      onChange={(e) => updateExperience(index, 'activities', e.target.value)}
                                      placeholder="Descreva suas principais atividades e responsabilidades..."
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Habilidades */}
                      {activeSection === 'skills' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#0056ff]" />
                            Habilidades e Competências
                          </h3>
                          
                          <div className="flex gap-2">
                            <Input 
                              id="skill-input"
                              placeholder="Digite uma habilidade e pressione Enter"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addSkill(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <Button 
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
                              <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                                {skill}
                                <button onClick={() => removeSkill(index)} className="ml-2 text-slate-500 hover:text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Idiomas */}
                      {activeSection === 'languages' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                              <Languages className="w-5 h-5 text-[#0056ff]" />
                              Idiomas
                            </h3>
                            <Button onClick={addLanguage} variant="outline" size="sm" className="rounded-lg">
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {form.languages.map((lang, index) => (
                            <div key={index} className="flex gap-3 items-end">
                              <div className="flex-1">
                                <Label>Idioma</Label>
                                <Input value={lang.language} onChange={(e) => updateLanguage(index, 'language', e.target.value)} placeholder="Ex: Inglês" />
                              </div>
                              <div className="flex-1">
                                <Label>Nível</Label>
                                <Select value={lang.level} onValueChange={(v) => updateLanguage(index, 'level', v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {NIVEIS_IDIOMA.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeLanguage(index)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Certificações */}
                      {activeSection === 'certifications' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-[#0056ff]" />
                              Certificações
                            </h3>
                            <Button onClick={addCertification} variant="outline" size="sm" className="rounded-lg">
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {form.certifications.map((cert, index) => (
                            <Card key={index} className="border-2">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Certificação {index + 1}</span>
                                  <Button variant="ghost" size="sm" onClick={() => removeCertification(index)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="md:col-span-2">
                                    <Label>Nome da Certificação</Label>
                                    <Input value={cert.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Instituição Emissora</Label>
                                    <Input value={cert.institution} onChange={(e) => updateCertification(index, 'institution', e.target.value)} />
                                  </div>
                                  <div>
                                    <Label>Ano</Label>
                                    <Input value={cert.year} onChange={(e) => updateCertification(index, 'year', e.target.value)} placeholder="Ex: 2024" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Informações Adicionais */}
                      {activeSection === 'additional' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Car className="w-5 h-5 text-[#0056ff]" />
                            Informações Adicionais
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>CNH</Label>
                              <Select value={form.cnh} onValueChange={(v) => setForm({...form, cnh: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {TIPOS_CNH.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <Checkbox checked={form.has_vehicle} onCheckedChange={(c) => setForm({...form, has_vehicle: c})} />
                              <span>Possui veículo próprio</span>
                            </div>
                            <div>
                              <Label>Disponibilidade de Horário</Label>
                              <Input value={form.availability_schedule} onChange={(e) => setForm({...form, availability_schedule: e.target.value})} placeholder="Ex: Integral, manhã, tarde..." />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={form.availability_travel} onCheckedChange={(c) => setForm({...form, availability_travel: c})} />
                              <span>Disponível para viagens</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={form.availability_relocation} onCheckedChange={(c) => setForm({...form, availability_relocation: c})} />
                              <span>Disponível para mudança</span>
                            </div>
                          </div>

                          <div>
                            <Label>Observações Gerais</Label>
                            <Textarea 
                              value={form.additional_notes} 
                              onChange={(e) => setForm({...form, additional_notes: e.target.value})}
                              placeholder="Outras informações relevantes..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="border-t pt-4 mt-4">
                            <Label>Upload do Currículo (PDF/Word)</Label>
                            <div className="flex items-center gap-3 mt-1">
                              <Input 
                                type="file" 
                                accept=".pdf,.doc,.docx" 
                                onChange={handleUploadResume} 
                                disabled={isUploadingResume}
                                className="flex-1"
                              />
                              {isUploadingResume && <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />}
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
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-6 border-t">
                        <Button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSave();
                          }} 
                          disabled={isSaving} 
                          className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Salvar
                        </Button>
                        {!form.is_confirmed && (
                          <Button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleConfirm();
                            }} 
                            disabled={isSaving} 
                            variant="outline" 
                            className="rounded-xl border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Informações
                          </Button>
                        )}
                        <Button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (form.resume_file_url) {
                              window.open(form.resume_file_url, '_blank');
                            } else {
                              generatePDF(form);
                            }
                          }} 
                          variant="outline" 
                          className="rounded-xl"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Currículo
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumePreview({ form }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b">
        {form.profile_photo_url ? (
          <img src={form.profile_photo_url} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#0056ff] flex items-center justify-center text-white text-2xl font-bold">
            {form.full_name?.[0] || 'U'}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{form.full_name}</h2>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
            {form.phone_whatsapp && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{form.phone_whatsapp}</span>}
            {form.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{form.email}</span>}
            {form.address_city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{form.address_city}, {form.address_state}</span>}
          </div>
        </div>
      </div>

      {form.professional_objective && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Objetivo Profissional</h3>
          <p className="text-slate-600">{form.professional_objective}</p>
        </div>
      )}

      {form.professional_summary && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Resumo Profissional</h3>
          <p className="text-slate-600">{form.professional_summary}</p>
        </div>
      )}

      {form.experiences?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Experiência Profissional</h3>
          <div className="space-y-3">
            {form.experiences.map((exp, i) => (
              <div key={i} className="border-l-2 border-[#0056ff] pl-4">
                <p className="font-medium">{exp.position}</p>
                <p className="text-slate-500 text-sm">{exp.company}</p>
                <p className="text-slate-400 text-xs">{exp.start_date} - {exp.is_current ? 'Atual' : exp.end_date}</p>
                {exp.activities && <p className="text-slate-600 text-sm mt-1">{exp.activities}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {form.education?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Formação Acadêmica</h3>
          <div className="space-y-2">
            {form.education.map((edu, i) => (
              <div key={i} className="border-l-2 border-[#0056ff] pl-4">
                <p className="font-medium">{edu.degree} - {edu.course}</p>
                <p className="text-slate-500 text-sm">{edu.institution}</p>
                <p className="text-slate-400 text-xs">{edu.start_date} - {edu.is_current ? 'Cursando' : edu.end_date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {form.skills?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {form.languages?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Idiomas</h3>
          <div className="flex flex-wrap gap-3">
            {form.languages.map((lang, i) => (
              <span key={i} className="text-sm text-slate-600">{lang.language}: {lang.level}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}