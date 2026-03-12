import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, CheckCircle, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function buildSummaryText(jobs) {
  const count = jobs.length;
  const today = new Date().toLocaleDateString('pt-BR');
  let text = `🟢 *${count} VAGA${count !== 1 ? 'S' : ''} DISPONÍV${count !== 1 ? 'EIS' : 'EL'} HOJE — ${today}*\n\n`;

  jobs.forEach((job, i) => {
    const title = (job.title || job.titulo || '').trim() || 'Cargo não informado';
    const city = (job.city || '').trim();
    const state = (job.state || '').trim();
    const salary = (job.salary_range || '').trim();

    let location = '';
    if (city && state) location = `${city} - ${state}`;
    else if (city) location = city;
    else if (job.job_type === 'Home Office') location = 'Home Office / Remoto';
    else location = 'Local não informado';

    text += `${i + 1}. *${title}*\n`;
    text += `📍 ${location}\n`;
    if (salary) text += `💰 ${salary}\n`;
    text += '\n';
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