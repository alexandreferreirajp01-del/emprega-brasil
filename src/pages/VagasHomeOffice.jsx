import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Wand2, Loader2, Check, ArrowLeft, Copy, 
  Home, ExternalLink, Briefcase, X, Crown, Star
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";

export default function VagasHomeOffice() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishingIndex, setPublishingIndex] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        setIsAuthorized(isAdmin);
      } catch (e) {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  const extractWithAI = async () => {
    const text = textareaRef.current?.value || '';
    if (!text.trim()) return;
    
    setIsExtracting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o seguinte texto que contém vagas de emprego HOME OFFICE e extraia cada vaga separadamente.

TEXTO:
${text.slice(0, 5000)}

Para cada vaga encontrada, extraia:
- titulo: nome/área da vaga (ex: "Contabilidade", "Atendimento ao Cliente", "Desenvolvedor")
- link: URL completa para candidatura
- descricao: breve descrição se houver (opcional)

IMPORTANTE: 
- Extraia TODAS as vagas do texto
- Cada linha com uma área e um link é uma vaga separada
- Retorne um array com todas as vagas encontradas

Responda APENAS com o JSON, sem explicações.`,
        response_json_schema: {
          type: "object",
          properties: {
            vagas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  link: { type: "string" },
                  descricao: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.vagas && Array.isArray(result.vagas)) {
        setExtractedJobs(result.vagas);
      } else {
        setExtractedJobs([]);
      }

    } catch (error) {
      console.error('Erro ao extrair dados:', error);
    }
    setIsExtracting(false);
  };

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      // Criar descrição apenas com os nomes das vagas (sem links visíveis)
      let description = `🏠 ${extractedJobs.length} Vagas Home Office disponíveis!\n\n`;
      description += `Confira as oportunidades:\n\n`;
      
      extractedJobs.forEach((job, index) => {
        description += `${index + 1}. ${job.titulo}\n`;
      });
      
      description += `\n💼 Todas as vagas são para trabalho remoto (Home Office).`;
      
      // Salvar os links em formato JSON no additional_info para renderizar botões
      const linksData = JSON.stringify(extractedJobs.map(job => ({
        titulo: job.titulo,
        link: job.link
      })));
      
      // Criar um único post agrupado
      const jobData = {
        title: `${extractedJobs.length} Vagas Home Office`,
        description: description,
        additional_info: `__HOME_OFFICE_LINKS__${linksData}`,
        job_type: 'Home Office',
        city: 'Home Office',
        is_premium: isPremium,
        is_featured: isFeatured
      };
      
      return await base44.entities.Job.create(jobData);
    },
    onSuccess: () => {
      setShowSuccess(true);
      if (textareaRef.current) textareaRef.current.value = '';
      setExtractedJobs([]);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const publishSingleJob = async (job, index) => {
    setPublishingIndex(index);
    try {
      await base44.entities.Job.create({
        title: job.titulo,
        description: job.descricao || `Vaga Home Office - ${job.titulo}`,
        job_type: 'Home Office',
        city: 'Home Office',
        application_link: job.link,
        is_premium: false,
        is_featured: false
      });
      
      // Remover da lista após publicar
      setExtractedJobs(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Erro ao publicar:', error);
    }
    setPublishingIndex(null);
  };

  const clearAll = () => {
    if (textareaRef.current) textareaRef.current.value = '';
    setExtractedJobs([]);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500">Apenas administradores podem acessar esta função.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Home Office</h1>
              <p className="text-white/70">Cole o texto com várias vagas e publique de uma vez</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Sucesso */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Vagas publicadas com sucesso!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Input de texto */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-600" />
                Texto das Vagas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">
                  Cole aqui o texto com as vagas home office (até 5000 caracteres)
                </Label>
                <textarea
                  ref={textareaRef}
                  placeholder="Cole aqui o texto com as vagas..."
                  defaultValue=""
                  className="w-full min-h-[300px] text-base p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">
                    Até 5000 caracteres
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (textareaRef.current) textareaRef.current.value = '';
                  }}>
                    Limpar
                  </Button>
                </div>
              </div>

              <Button
                onClick={extractWithAI}
                disabled={isExtracting}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extraindo vagas...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Gerar Vagas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Coluna 2: Vagas extraídas */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {extractedJobs.length > 0 ? (
                  <span>{extractedJobs.length} Vagas Home Office</span>
                ) : (
                  <span>Vagas Extraídas</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>As vagas extraídas aparecerão aqui</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {extractedJobs.map((job, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{job.titulo}</h3>
                            {job.descricao && (
                              <p className="text-sm text-slate-500 mt-1">{job.descricao}</p>
                            )}
                            <Badge className="mt-2 bg-green-100 text-green-700">
                              Home Office
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2">
                            <a 
                              href={job.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            </a>
                            <Button 
                              size="sm"
                              onClick={() => publishSingleJob(job, index)}
                              disabled={publishingIndex === index}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {publishingIndex === index ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Publicar'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExtractedJobs(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Opções Premium e Destaque */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Vaga Premium</span>
                      </div>
                      <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">Destaque</span>
                      </div>
                      <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      className="flex-1"
                    >
                      Limpar Tudo
                    </Button>
                    <Button
                      onClick={() => publishAllMutation.mutate()}
                      disabled={publishAllMutation.isPending || extractedJobs.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {publishAllMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Publicar Todas ({extractedJobs.length})
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}