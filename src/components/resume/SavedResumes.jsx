import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Download, Trash2, Loader2, FileText, Search, User, Eye, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SavedResumes({ user, isAdmin, onBack }) {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    loadResumes();
  }, [user, isAdmin]);

  const loadResumes = async () => {
    setIsLoading(true);
    try {
      let data;
      if (isAdmin) {
        // Admin vê todos os currículos
        data = await base44.entities.ProfessionalResume.list('-created_date', 500);
      } else {
        // Usuário vê apenas seus currículos
        data = await base44.entities.ProfessionalResume.filter({ user_email: user.email }, '-created_date', 100);
      }
      console.log('Currículos carregados:', data);
      setResumes(data || []);
    } catch (e) {
      console.error('Erro ao carregar currículos:', e);
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await base44.entities.ProfessionalResume.delete(deleteId);
      setResumes(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      alert('Erro ao excluir currículo');
    } finally {
      setIsDeleting(false);
    }
  };

  const generatePDF = (resume) => {
    const printContent = `
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
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredResumes = resumes.filter(r => 
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.resume_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Visualizar detalhes do currículo
  if (selectedResume) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className={`${isAdmin ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-[#0056ff] to-[#0044cc]'} pt-6 pb-4 px-4`}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setSelectedResume(null)} className="inline-flex items-center text-white/80 hover:text-white mb-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para lista
            </button>
            <h1 className="text-xl font-bold text-white">Detalhes do Currículo</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-6">
              {/* Cabeçalho */}
              <div className="flex items-center gap-4 pb-4 border-b">
                {selectedResume.profile_photo_url ? (
                  <img src={selectedResume.profile_photo_url} className="w-20 h-20 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#0056ff]/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-[#0056ff]" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedResume.full_name || 'Sem nome'}</h2>
                  <p className="text-slate-500">{selectedResume.email}</p>
                  <p className="text-sm text-slate-400">{selectedResume.phone}</p>
                  {selectedResume.city && <p className="text-sm text-slate-400">{selectedResume.city}{selectedResume.state ? `, ${selectedResume.state}` : ''}</p>}
                </div>
              </div>

              {/* Objetivo */}
              {selectedResume.professional_objective && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Objetivo Profissional</h3>
                  <p className="text-slate-600">{selectedResume.professional_objective}</p>
                </div>
              )}

              {/* Experiências */}
              {selectedResume.experiences?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Experiência Profissional</h3>
                  <div className="space-y-3">
                    {selectedResume.experiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-[#0056ff] pl-3">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-sm text-slate-500">{exp.company}</p>
                        <p className="text-xs text-slate-400">{exp.start_date} - {exp.end_date || 'Atual'}</p>
                        {exp.activities && <p className="text-sm text-slate-600 mt-1">{exp.activities}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formação */}
              {selectedResume.education?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Formação Acadêmica</h3>
                  <div className="space-y-3">
                    {selectedResume.education.map((edu, i) => (
                      <div key={i} className="border-l-2 border-green-500 pl-3">
                        <p className="font-medium">{edu.course} {edu.degree_type ? `(${edu.degree_type})` : ''}</p>
                        <p className="text-sm text-slate-500">{edu.institution}</p>
                        <p className="text-xs text-slate-400">{edu.start_year} - {edu.end_year || 'Em andamento'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Habilidades */}
              {selectedResume.skills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.skills.map((skill, i) => (
                      <span key={i} className="bg-[#0056ff]/10 text-[#0056ff] px-3 py-1 rounded-full text-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cursos */}
              {selectedResume.courses?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Cursos e Certificações</h3>
                  <div className="space-y-2">
                    {selectedResume.courses.map((c, i) => (
                      <div key={i} className="border-l-2 border-purple-500 pl-3">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.institution} {c.hours ? `• ${c.hours}h` : ''} {c.year ? `• ${c.year}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas adicionais */}
              {selectedResume.additional_notes && (
                <div>
                  <h3 className="font-semibold text-[#0056ff] mb-2">Informações Adicionais</h3>
                  <p className="text-slate-600">{selectedResume.additional_notes}</p>
                </div>
              )}

              {/* Arquivo anexado */}
              {selectedResume.resume_file_url && (
                <div className="pt-4 border-t">
                  <a href={selectedResume.resume_file_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] hover:underline flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ver arquivo anexado
                  </a>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => generatePDF(selectedResume)} className="flex-1 bg-[#0056ff] hover:bg-[#0044cc]">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                {selectedResume.resume_file_url && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(selectedResume.resume_file_url, '_blank')}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Arquivo
                  </Button>
                )}
                {(isAdmin || selectedResume.user_email === user?.email) && (
                  <Button variant="destructive" onClick={() => { setDeleteId(selectedResume.id); }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Currículo</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={async () => { await handleDelete(); setSelectedResume(null); }} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className={`${isAdmin ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-[#0056ff] to-[#0044cc]'} pt-6 pb-4 px-4`}>
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="inline-flex items-center text-white/80 hover:text-white mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Currículos Salvos ({resumes.length})</h1>
            <Button variant="ghost" size="icon" onClick={loadResumes} className="text-white hover:bg-white/10">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Busca */}
        {resumes.length > 0 && (
          <Card className="rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Buscar currículo..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 rounded-xl" 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
          </div>
        ) : filteredResumes.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Nenhum currículo salvo</h2>
              <p className="text-slate-500">
                {isAdmin ? 'Nenhum currículo foi criado pelos usuários.' : 'Crie seu primeiro currículo clicando em "Criar Currículo".'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResumes.map((resume) => (
              <Card 
                key={resume.id} 
                className="rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedResume(resume)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#0056ff]/10 flex items-center justify-center flex-shrink-0">
                        {resume.profile_photo_url ? (
                          <img src={resume.profile_photo_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                        ) : (
                          <User className="w-6 h-6 text-[#0056ff]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{resume.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-slate-500">{resume.resume_name || 'Currículo'}</p>
                        {isAdmin && <p className="text-xs text-purple-600">{resume.user_email}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setSelectedResume(resume); }}
                        className="rounded-lg"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); generatePDF(resume); }}
                        className="rounded-lg"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      {(isAdmin || resume.user_email === user?.email) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setDeleteId(resume.id); }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Currículo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este currículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}