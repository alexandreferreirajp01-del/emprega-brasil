import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, CheckCircle, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function getJobLocation(job) {
  const workMode = (job.work_mode || '').trim();
  const jobType = (job.job_type || '').trim();
  const city = (job.city || job.cidade_normalizada || '').trim();
  const state = (job.state || job.uf_normalizada || '').trim();

  // Se for remoto/home office, mostrar modalidade
  if (workMode === 'Remoto' || jobType === 'Home Office' || job.is_remote) return 'Remoto';
  if (workMode === 'Híbrido') return 'Híbrido';

  // Se tiver cidade
  if (city && state) return `${city} - ${state}`;
  if (city) return city;

  // Sem localidade
  return 'Não Informado';
}

function buildSummaryText(jobs) {
  const count = jobs.length;
  const today = new Date().toLocaleDateString('pt-BR');

  // Filtrar apenas vagas da Paraíba (ou remotas/sem estado)
  const PB_VARIANTS = ['pb', 'paraiba', 'paraíba'];
  const jobsFiltrados = jobs.filter(job => {
    const workMode = (job.work_mode || '').trim();
    const jobType = (job.job_type || '').trim();
    if (workMode === 'Remoto' || jobType === 'Home Office' || job.is_remote) return true;
    const state = (job.state || job.uf_normalizada || '').trim().toLowerCase().replace(/\s/g, '');
    if (!state) return true; // sem estado: inclui
    return PB_VARIANTS.some(v => state === v);
  });

  // Agrupar por título + localidade + empresa
  const groups = {};
  jobsFiltrados.forEach(job => {
    const title = (job.title || job.titulo || '').trim() || 'Cargo não informado';
    const company = (job.company || '').trim();
    const location = getJobLocation(job);
    const key = `${title}||${location}||${company}`;
    if (!groups[key]) groups[key] = { title, company, location, count: 0 };
    groups[key].count++;
  });

  let text = `🟢 *${count} VAGA${count !== 1 ? 'S' : ''} DISPONÍV${count !== 1 ? 'EIS' : 'EL'} HOJE — ${today}*\n\n`;

  Object.values(groups).forEach(g => {
    const vagasLabel = g.count === 1 ? '1 Vaga' : `${g.count} Vagas`;
    text += `*${vagasLabel} de ${g.title}*\n`;
    if (g.company) text += `🏢 ${g.company}\n`;
    text += `📍 ${g.location}\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👉 Acesse todas as vagas:\n`;
  text += `🌐 https://vagasabertaspb.com.br\n\n`;
  text += `📱 Siga no Instagram: @vagasabertaspb`;

  return text;
}

export default function JobsSummaryClipboard({ jobs = [], onReset }) {
  const [copied, setCopied] = useState(false);
  const summaryText = buildSummaryText(jobs);

  const handleCopy = () => {
    const copy = (text) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {}).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    };
    const fallbackCopy = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    };
    copy(summaryText);
    setCopied(true);
    toast.success('Resumo copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Success badge */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-green-800 dark:text-green-300">
            {jobs.length} vaga{jobs.length !== 1 ? 's' : ''} publicada{jobs.length !== 1 ? 's' : ''} com sucesso!
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Copie o resumo abaixo para compartilhar nos grupos
          </p>
        </div>
      </div>

      {/* Summary card */}
      <Card className="rounded-xl border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              📋 Resumo para compartilhar nos grupos
            </h3>
            <Button
              onClick={handleCopy}
              size="sm"
              className={`gap-1.5 text-xs ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1D4371] hover:bg-[#0F2744]'}`}
            >
              {copied ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Copiado!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copiar Texto</>
              )}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-lg p-4 font-sans leading-relaxed border border-slate-200 dark:border-slate-600 max-h-80 overflow-y-auto select-all">
            {summaryText}
          </pre>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onReset}
          className="flex-1 bg-[#1D4371] hover:bg-[#0F2744] gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Postagem
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open('https://vagasabertaspb.com.br', '_blank')}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Ver Site
        </Button>
      </div>
    </div>
  );
}