import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Loader2, Brain, Target, Wand2, FileCheck, CheckCircle,
  Lightbulb, RotateCcw, ChevronRight, User
} from 'lucide-react';

const LOADING_STEPS = [
  { icon: Brain, text: 'Analisando seu perfil...' },
  { icon: Target, text: 'Identificando pontos fortes...' },
  { icon: Wand2, text: 'Reescrevendo com linguagem profissional...' },
  { icon: FileCheck, text: 'Otimizando para ATS...' },
  { icon: Sparkles, text: 'Finalizando seu currículo...' },
];

export default function AIResumePanel({ onGenerated }) {
  const [description, setDescription] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) { setError('Descreva sua experiência profissional.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setStep(0);

    const iv = setInterval(() => setStep(p => p < LOADING_STEPS.length - 1 ? p + 1 : p), 2200);

    try {
      const prompt = `Você é especialista em currículos profissionais brasileiros.
${targetJob ? `VAGA ALVO: ${targetJob}` : ''}
DADOS DO CANDIDATO:
${description}

Analise e crie um currículo profissional. Reescreva o conteúdo com linguagem profissional.
Use verbos de ação. Corrija ortografia. Crie resumo profissional de 3-4 linhas.
NUNCA invente informações não fornecidas. Apenas valorize e reescreva o que existe.

Retorne JSON:
{
  "perfil_detectado": "string",
  "nivel_experiencia": "Júnior|Pleno|Sênior|Executivo|Sem experiência",
  "template_sugerido": "turquoise_medical|sales_gray|dark_navy_cover|magenta_minimal|gray_photo_classic|engineering_cream_blue|industrial_gray|bw_labeled|beige_education|systems_blue|classic_blue|modern_dark|executive|minimal_gray|clean_green|tech_dark",
  "justificativa_template": "string",
  "name": "string",
  "title": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "website": "string",
  "summary": "string",
  "experience": [{"company":"string","role":"string","start":"YYYY-MM","end":"YYYY-MM","current":false,"description":"string"}],
  "education": [{"institution":"string","course":"string","start":"YYYY-MM","end":"YYYY-MM","current":false}],
  "skills": ["string"],
  "languages": [{"name":"string","level":"Básico|Intermediário|Avançado|Fluente|Nativo"}],
  "certifications": [{"name":"string","institution":"string","year":"string"}],
  "sugestoes_melhoria": ["string","string","string"]
}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            perfil_detectado: { type: 'string' },
            nivel_experiencia: { type: 'string' },
            template_sugerido: { type: 'string' },
            justificativa_template: { type: 'string' },
            name: { type: 'string' }, title: { type: 'string' },
            email: { type: 'string' }, phone: { type: 'string' },
            location: { type: 'string' }, linkedin: { type: 'string' },
            github: { type: 'string' }, website: { type: 'string' },
            summary: { type: 'string' },
            experience: { type: 'array', items: { type: 'object' } },
            education: { type: 'array', items: { type: 'object' } },
            skills: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { type: 'object' } },
            certifications: { type: 'array', items: { type: 'object' } },
            sugestoes_melhoria: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      clearInterval(iv);
      setResult(res);
    } catch (e) {
      clearInterval(iv);
      setError('Erro ao gerar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onGenerated({
      name: result.name || '', title: result.title || '',
      email: result.email || '', phone: result.phone || '',
      location: result.location || '', linkedin: result.linkedin || '',
      github: result.github || '', website: result.website || '',
      summary: result.summary || '',
      experience: result.experience || [],
      education: result.education || [],
      skills: result.skills || [],
      languages: result.languages || [],
      certifications: result.certifications || [],
    }, result.template_sugerido || null);
  };

  const StepIcon = LOADING_STEPS[step]?.icon || Sparkles;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Gerador de Currículo com IA</h3>
            <p className="text-[10px] text-white/80">Motor premium Claude — cria currículos profissionais</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { icon: '🎯', text: 'Detecta seu perfil' },
            { icon: '✍️', text: 'Reescreve profissionalmente' },
            { icon: '🎨', text: 'Sugere melhor template' },
            { icon: '📊', text: 'Otimiza para ATS' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/90">
              <span>{item.icon}</span>{item.text}
            </div>
          ))}
        </div>
      </div>

      {!result ? (
        <div className="space-y-3">
          {/* Campo principal */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              📝 Descreva sua experiência em texto livre *
            </label>
            <textarea
              className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-slate-400"
              placeholder={`Escreva livremente sobre você. Quanto mais detalhar, melhor!\n\nEx: Meu nome é Maria Silva, tenho 26 anos, sou de João Pessoa - PB. Trabalhei 2 anos como atendente na Drogasil, antes disso fui caixa por 1 ano. Tenho ensino médio. Sei Excel e sou comunicativa. Meu telefone é (83) 99999-1234`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              🎯 Vaga que está buscando (opcional)
            </label>
            <input
              type="text"
              className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
              placeholder="Ex: Auxiliar Administrativo, Vendedor..."
              value={targetJob}
              onChange={e => setTargetJob(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 flex items-start gap-2">
            <span className="flex-shrink-0">⚡</span>
            <span>Usa Claude (IA premium) — pode levar 20-30 segundos.</span>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          {loading && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200">
              <div className="flex items-center gap-3 mb-3">
                <StepIcon className="w-5 h-5 text-violet-600 animate-pulse" />
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{LOADING_STEPS[step]?.text}</p>
              </div>
              <div className="flex gap-1">
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando currículo...</>
              : <><Sparkles className="w-4 h-4" /> Gerar Currículo com IA</>
            }
          </Button>
        </div>
      ) : (
        /* Resultado */
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">Currículo gerado!</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                <p className="text-slate-400 mb-0.5">Perfil</p>
                <p className="font-semibold text-violet-700 dark:text-violet-300 text-[11px]">{result.perfil_detectado}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                <p className="text-slate-400 mb-0.5">Nível</p>
                <p className="font-semibold text-blue-700 dark:text-blue-300 text-[11px]">{result.nivel_experiencia}</p>
              </div>
            </div>
          </div>

          {result.summary && (
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resumo gerado</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {result.sugestoes_melhoria?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Dicas de melhoria</span>
              </div>
              {result.sugestoes_melhoria.map((s, i) => (
                <div key={i} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 mb-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />{s}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 text-white gap-2">
              <CheckCircle className="w-4 h-4" /> Aplicar ao Editor
            </Button>
            <Button variant="outline" onClick={() => setResult(null)} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">Os dados serão aplicados ao editor. Você pode editar depois.</p>
        </div>
      )}
    </div>
  );
}