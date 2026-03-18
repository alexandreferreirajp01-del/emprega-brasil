import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import {
  FileText, Download, Crown, ChevronLeft, AlertTriangle, CheckCircle,
  Loader2, Sparkles, User, Briefcase, GraduationCap, Award, Globe,
  LayoutTemplate, Wand2, Lock, RotateCcw, Eye, EyeOff
} from 'lucide-react';
import ResumeRenderer from '@/components/resume/ResumeRenderer';
import { TEMPLATES, CATEGORIES } from '@/components/resume/ResumeTemplates';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importar sub-componentes do editor
import EditorPersonal from '@/components/resume/editor/EditorPersonal';
import EditorExperience from '@/components/resume/editor/EditorExperience';
import EditorEducation from '@/components/resume/editor/EditorEducation';
import EditorSkills from '@/components/resume/editor/EditorSkills';
import EditorExtras from '@/components/resume/editor/EditorExtras';
import AIResumePanel from '@/components/resume/editor/AIResumePanel';
import TemplatePicker from '@/components/resume/editor/TemplatePicker';

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
  return { canCreate: true, limit: 1, watermark: true };
}

const EDITOR_TABS = [
  { id: 'ai', label: 'IA', icon: Sparkles, color: 'text-violet-600' },
  { id: 'templates', label: 'Template', icon: LayoutTemplate, color: 'text-blue-600' },
  { id: 'personal', label: 'Dados', icon: User, color: 'text-slate-600' },
  { id: 'experience', label: 'Experiência', icon: Briefcase, color: 'text-slate-600' },
  { id: 'education', label: 'Formação', icon: GraduationCap, color: 'text-slate-600' },
  { id: 'skills', label: 'Habilidades', icon: Award, color: 'text-slate-600' },
  { id: 'extras', label: 'Idiomas & +', icon: Globe, color: 'text-slate-600' },
];

export default function GeradorCurriculo() {
  const [user, setUser] = useState(undefined);
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedTemplate, setSelectedTemplate] = useState('turquoise_medical');
  const [formData, setFormData] = useState(EMPTY_DATA);
  const [downloading, setDownloading] = useState(false);
  const [downloadsThisMonth, setDownloadsThisMonth] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mobileShowPreview, setMobileShowPreview] = useState(false);
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
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl text-center p-8">
        <FileText className="w-16 h-16 text-[#1D4371] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gerador de Currículos</h2>
        <p className="text-slate-500 mb-6">Faça login para criar seu currículo profissional</p>
        <Button onClick={() => { sessionStorage.setItem('needs_login', 'true'); sessionStorage.setItem('redirect_after_login', 'GeradorCurriculo'); window.location.href = createPageUrl('Splash'); }} className="w-full bg-[#1D4371] text-white">
          Entrar / Cadastrar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* TOP BAR */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 py-2 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-1 text-slate-600 dark:text-slate-300 hidden sm:flex">
            <ChevronLeft className="w-4 h-4" /> Sair
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1D4371]" />
            <span className="font-bold text-slate-800 dark:text-white text-sm">Editor de Currículo</span>
          </div>
          {formData.name && (
            <span className="text-xs text-slate-500 hidden sm:block">— {formData.name}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: toggle preview */}
          <button
            onClick={() => setMobileShowPreview(v => !v)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {mobileShowPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {mobileShowPreview ? 'Editor' : 'Preview'}
          </button>

          {/* Plan badge */}
          {planInfo.watermark && (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs hidden sm:flex">
              <AlertTriangle className="w-3 h-3 mr-1" /> Básico
            </Badge>
          )}
          {planInfo.limit === Infinity && (
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs hidden sm:flex">
              <Crown className="w-3 h-3 mr-1" /> Ilimitado
            </Badge>
          )}

          {downloadSuccess && (
            <Badge className="bg-green-100 text-green-700 gap-1 text-xs">
              <CheckCircle className="w-3 h-3" /> Salvo!
            </Badge>
          )}

          {/* Download button */}
          {planInfo.watermark ? (
            <Button onClick={handleDownload} disabled={downloading} size="sm" className="bg-[#1D4371] text-white gap-1.5">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloading ? 'Gerando...' : 'Baixar PDF'}</span>
            </Button>
          ) : !canDownloadMore() ? (
            <Button size="sm" onClick={() => window.location.href = createPageUrl('Subscription')} className="bg-amber-500 text-white gap-1.5">
              <Lock className="w-4 h-4" /> Upgrade
            </Button>
          ) : (
            <Button onClick={handleDownload} disabled={downloading} size="sm" className="bg-[#1D4371] text-white gap-1.5">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloading ? 'Gerando...' : 'Baixar PDF'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* MAIN EDITOR LAYOUT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — Editor */}
        <div className={`${mobileShowPreview ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700`}>

          {/* Tab navigation */}
          <div className="flex items-center gap-0.5 px-2 pt-2 pb-0 border-b border-slate-200 dark:border-slate-700 overflow-x-auto flex-shrink-0">
            {EDITOR_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#1D4371] text-[#1D4371] bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  } ${tab.id === 'ai' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:text-violet-700' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.id === 'ai' && !isActive ? 'text-violet-500' : ''}`} />
                  {tab.label}
                  {tab.id === 'ai' && <span className="ml-0.5 text-[9px] bg-violet-200 text-violet-700 px-1 rounded font-bold">IA</span>}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'ai' && (
              <AIResumePanel
                onGenerated={(data, tpl) => {
                  setFormData(data);
                  if (tpl) setSelectedTemplate(tpl);
                  setActiveTab('personal');
                }}
              />
            )}
            {activeTab === 'templates' && (
              <TemplatePicker
                selected={selectedTemplate}
                onSelect={(id) => { setSelectedTemplate(id); }}
              />
            )}
            {activeTab === 'personal' && (
              <EditorPersonal data={formData} onChange={setFormData} />
            )}
            {activeTab === 'experience' && (
              <EditorExperience data={formData} onChange={setFormData} />
            )}
            {activeTab === 'education' && (
              <EditorEducation data={formData} onChange={setFormData} />
            )}
            {activeTab === 'skills' && (
              <EditorSkills data={formData} onChange={setFormData} />
            )}
            {activeTab === 'extras' && (
              <EditorExtras data={formData} onChange={setFormData} />
            )}
          </div>

          {/* Watermark warning */}
          {planInfo.watermark && (
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-yellow-800">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>PDF com marca d'água. <button onClick={() => window.location.href = createPageUrl('Subscription')} className="font-bold underline">Assine Premium</button> para remover.</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — A4 Preview */}
        <div className={`${!mobileShowPreview ? 'hidden' : 'flex'} lg:flex flex-1 bg-slate-200 dark:bg-slate-900 overflow-auto items-start justify-center p-6`}>
          <div className="w-full flex flex-col items-center">
            {/* Scale hint */}
            <div className="mb-4 flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                📄 Prévia A4 em tempo real
              </span>
              <span className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                Template: <b>{TEMPLATES.find(t => t.id === selectedTemplate)?.name || selectedTemplate}</b>
              </span>
              <button
                onClick={() => setFormData(EMPTY_DATA)}
                className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Limpar
              </button>
            </div>

            {/* A4 Canvas */}
            <div
              ref={previewRef}
              className="bg-white shadow-2xl"
              style={{
                width: 794,
                minHeight: 1123,
                maxWidth: '100%',
                transformOrigin: 'top center',
              }}
            >
              <ResumeRenderer
                data={formData}
                templateId={selectedTemplate}
                watermark={planInfo.watermark}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}