import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { FileText, Download, Crown, ChevronRight, ChevronLeft, Eye, Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import ResumeForm from '@/components/resume/ResumeForm';
import ResumeRenderer from '@/components/resume/ResumeRenderer';
import AIResumeGenerator from '@/components/resume/AIResumeGenerator';
import { TEMPLATES, CATEGORIES } from '@/components/resume/ResumeTemplates';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EMPTY_DATA = {
  name: '', title: '', email: '', phone: '', location: '',
  linkedin: '', github: '', website: '', photo: '', summary: '',
  experience: [], education: [], skills: [], languages: [], certifications: [],
};

function getPlanLimits(user) {
  if (!user) return { canCreate: false, limit: 0, watermark: true, reason: 'login' };
  const sub = user.subscription_type;
  const role = user.role;
  if (role === 'admin' || sub === 'admin' || sub === 'dono') return { canCreate: true, limit: Infinity, watermark: false };
  if (sub === 'premium_trimestral') return { canCreate: true, limit: 4, watermark: false };
  if (sub === 'premium' || sub === 'premium_mensal') return { canCreate: true, limit: 2, watermark: false };
  // basic / free
  return { canCreate: true, limit: 1, watermark: true };
}

export default function GeradorCurriculo() {
  const [user, setUser] = useState(undefined);
  const [step, setStep] = useState('templates'); // templates | form | preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(EMPTY_DATA);
  const [filterCat, setFilterCat] = useState('🆕 Novos');

  const templatePreviewStyles = {
    turquoise_medical: { sidebar: '#4DC8C8', main: '#fff', accent: '#4DC8C8' },
    sales_gray: { sidebar: '#D8DEE6', main: '#fff', accent: '#888' },
    dark_navy_cover: { sidebar: '#2D3748', main: '#fff', accent: '#2D3748' },
    magenta_minimal: { sidebar: '#fff', main: '#fff', accent: '#9B2163' },
    gray_photo_classic: { sidebar: '#DADADA', main: '#fff', accent: '#555' },
    engineering_cream_blue: { sidebar: '#fff', main: '#fff', accent: '#2B4F9E' },
    industrial_gray: { sidebar: '#F3F4F6', main: '#fff', accent: '#4B5563' },
    bw_labeled: { sidebar: '#F9FAFB', main: '#F9FAFB', accent: '#111' },
    beige_education: { sidebar: '#F5F2EB', main: '#F5F2EB', accent: '#3D5A3E' },
    systems_blue: { sidebar: '#fff', main: '#fff', accent: '#4169E1' },
  };
  const [downloading, setDownloading] = useState(false);
  const [downloadsThisMonth, setDownloadsThisMonth] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    base44.auth.me().then(u => { setUser(u); loadDownloads(u); }).catch(() => setUser(null));
  }, []);

  const loadDownloads = async (u) => {
    if (!u) return;
    const monthYear = new Date().toISOString().slice(0, 7);
    try {
      const recs = await base44.entities.ResumeDownload.filter({ user_email: u.email, month_year: monthYear });
      setDownloadsThisMonth(recs?.[0]?.count || 0);
    } catch {}
  };

  const planInfo = getPlanLimits(user);
  const filteredTemplates = filterCat === 'Todos' ? TEMPLATES : filterCat === '🆕 Novos' ? TEMPLATES.filter(t => t.isNew) : TEMPLATES.filter(t => t.category === filterCat);

  const canDownloadMore = () => {
    if (!user) return false;
    if (planInfo.limit === Infinity) return true;
    return downloadsThisMonth < planInfo.limit;
  };

  const handleDownload = async () => {
    if (!canDownloadMore() && !planInfo.watermark) return;
    setDownloading(true);
    try {
      const element = previewRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pdfW / imgW;
      const renderedH = imgH * ratio;

      if (renderedH <= pdfH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, renderedH);
      } else {
        let yOffset = 0;
        while (yOffset < imgH) {
          const sliceH = Math.min(pdfH / ratio, imgH - yOffset);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgW;
          pageCanvas.height = sliceH;
          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, -yOffset);
          const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(pageImg, 'JPEG', 0, 0, pdfW, sliceH * ratio);
          yOffset += sliceH;
        }
      }

      const filename = `curriculo-${(formData.name || 'sem-nome').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      pdf.save(filename);

      // Track download
      const monthYear = new Date().toISOString().slice(0, 7);
      try {
        const recs = await base44.entities.ResumeDownload.filter({ user_email: user.email, month_year: monthYear });
        const newCount = (recs?.[0]?.count || 0) + 1;
        if (recs?.[0]?.id) {
          await base44.entities.ResumeDownload.update(recs[0].id, { count: newCount });
        } else {
          await base44.entities.ResumeDownload.create({ user_email: user.email, month_year: monthYear, count: 1 });
        }
        setDownloadsThisMonth(newCount);
      } catch {}

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setDownloading(false);
    }
  };

  if (user === undefined) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]">
      <Loader2 className="w-8 h-8 animate-spin text-[#1D4371]" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-2xl border-0 shadow-xl text-center p-8">
        <FileText className="w-16 h-16 text-[#1D4371] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gerador de Currículos</h2>
        <p className="text-slate-500 mb-6">Faça login para criar seu currículo profissional</p>
        <Button onClick={() => { sessionStorage.setItem('needs_login', 'true'); sessionStorage.setItem('redirect_after_login', 'GeradorCurriculo'); window.location.href = createPageUrl('Splash'); }} className="w-full bg-[#1D4371] text-white">
          Entrar / Cadastrar
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D4371] to-[#2B5A8F] text-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl font-bold">Gerador de Currículos Profissional</h1>
          </div>
          <p className="text-white/70 text-sm ml-9">Crie seu currículo com templates modernos e baixe em PDF</p>

          {/* Plano info */}
          <div className="ml-9 mt-3 flex flex-wrap gap-2 items-center">
            {planInfo.watermark && (
              <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Plano Básico — 1 currículo com marca d'água
              </Badge>
            )}
            {!planInfo.watermark && planInfo.limit !== Infinity && (
              <Badge className="bg-green-500/20 text-green-200 border-green-400/30 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {downloadsThisMonth}/{planInfo.limit} currículos este mês
              </Badge>
            )}
            {planInfo.limit === Infinity && (
              <Badge className="bg-green-500/20 text-green-200 border-green-400/30 text-xs">
                <Crown className="w-3 h-3 mr-1" /> Downloads ilimitados
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Steps nav */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-[64px] z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          {[
            { id: 'templates', label: '1. Escolher Template' },
            { id: 'form', label: '2. Preencher Dados' },
            { id: 'preview', label: '3. Visualizar & Baixar' },
          ].map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => {
                  if (s.id === 'form' && !selectedTemplate) return;
                  if (s.id === 'preview' && !selectedTemplate) return;
                  setStep(s.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  step === s.id ? 'bg-[#1D4371] text-white' : 'text-slate-500 hover:text-slate-800'
                } ${(s.id === 'form' || s.id === 'preview') && !selectedTemplate ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {s.label}
              </button>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* STEP 1: Templates */}
        {step === 'templates' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterCat === cat ? 'bg-[#1D4371] text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredTemplates.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTemplate(t.id); setStep('form'); }}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-xl ${selectedTemplate === t.id ? 'border-[#1D4371] shadow-xl' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  {/* Template preview card */}
                  <div style={{ background: t.preview_color, height: 120 }} className="flex flex-col items-center justify-center gap-2 relative">
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', marginBottom: 4 }} />
                    <div style={{ width: '60%', height: 6, background: 'rgba(255,255,255,0.6)', borderRadius: 3 }} />
                    <div style={{ width: '40%', height: 4, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                    {[1, 2].map(j => (
                      <div key={j} style={{ width: '70%', height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2, marginTop: 2 }} />
                    ))}
                    {t.isNew && (
                      <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#f59e0b', color: '#fff' }}>NOVO</span>
                    )}
                    <Badge className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none' }}>{t.isNew ? 'Novo' : t.category}</Badge>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3">
                    <p className="font-semibold text-slate-800 dark:text-white text-xs truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Form */}
        {step === 'form' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Preencha seus dados</h2>
              <Button onClick={() => setStep('preview')} className="bg-[#1D4371] text-white gap-2">
                Visualizar Currículo <Eye className="w-4 h-4" />
              </Button>
            </div>
            <AIResumeGenerator onGenerated={(data, suggestedTemplate) => {
              setFormData(data);
              if (suggestedTemplate) {
                setSelectedTemplate(suggestedTemplate);
              }
            }} />
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-5">
                <ResumeForm data={formData} onChange={setFormData} />
              </CardContent>
            </Card>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep('templates')} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Trocar Template
              </Button>
              <Button onClick={() => setStep('preview')} className="bg-[#1D4371] text-white flex-1 gap-2">
                Visualizar e Baixar <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 'preview' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('form')} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Editar
                </Button>
                <Button variant="outline" onClick={() => setStep('templates')} className="gap-2">
                  Trocar Template
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {planInfo.watermark && (
                  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Currículo com marca d'água — <button onClick={() => window.location.href = createPageUrl('Subscription')} className="font-bold underline">Assine Premium</button> para remover</span>
                  </div>
                )}
                {!canDownloadMore() && !planInfo.watermark && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800">
                    <Lock className="w-4 h-4" />
                    <span>Limite mensal atingido — <button onClick={() => window.location.href = createPageUrl('Subscription')} className="font-bold underline">Upgrade</button></span>
                  </div>
                )}
                {downloadSuccess && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle className="w-3 h-3" /> Baixado com sucesso!
                  </Badge>
                )}
                <Button
                  onClick={handleDownload}
                  disabled={downloading || (!canDownloadMore() && !planInfo.watermark)}
                  className="bg-[#1D4371] text-white gap-2 px-6"
                >
                  {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</> : <><Download className="w-4 h-4" /> Baixar PDF</>}
                </Button>
              </div>
            </div>

            {/* Watermark notice */}
            {planInfo.watermark && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Este currículo terá a marca d'água <b>VAGAS ABERTAS PB</b>. Para remover, assine o plano Premium.</span>
              </div>
            )}

            {/* A4 Preview */}
            <div className="overflow-auto">
              <div
                ref={previewRef}
                className="bg-white shadow-2xl mx-auto overflow-hidden"
                style={{ width: 794, minHeight: 1123 }}
              >
                <ResumeRenderer data={formData} templateId={selectedTemplate} watermark={planInfo.watermark} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}