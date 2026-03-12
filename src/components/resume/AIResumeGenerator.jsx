import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Sparkles, ChevronDown, ChevronUp, Loader2,
  User, Briefcase, Lightbulb, CheckCircle, Target, Wand2, Brain, FileCheck
} from 'lucide-react';

// Mapeamento de template interno → template_id do sistema
const PROFILE_TEMPLATE_MAP = {
  'Primeiro emprego': 'fresh_light',
  'Jovem aprendiz': 'fresh_light',
  'Estagiário': 'clean_green',
  'Profissional operacional': 'bw_infographic',
  'Profissional administrativo': 'classic_blue',
  'Profissional comercial': 'orange_accent',
  'Profissional técnico': 'blue_gray_pro',
  'Profissional de atendimento': 'clean_green',
  'Profissional de gestão/liderança': 'executive',
  'Freelancer/autônomo': 'beige_soft_photo',
  'Profissional criativo': 'creative_purple',
  'Profissional da saúde': 'clean_green',
  'Profissional da educação': 'navy_professional',
  'Profissional da tecnologia': 'tech_dark',
  'Mudança de carreira': 'blue_gray_pro',
  'Retorno ao mercado': 'classic_blue',
  'Perfil sem experiência formal': 'fresh_light',
  'Perfil com experiência extensa': 'dark_sidebar_cv',
};

const PROFILE_ICON_MAP = {
  'Primeiro emprego': '🌱',
  'Jovem aprendiz': '📚',
  'Estagiário': '🎓',
  'Profissional operacional': '⚙️',
  'Profissional administrativo': '📋',
  'Profissional comercial': '💼',
  'Profissional técnico': '🔧',
  'Profissional de atendimento': '🤝',
  'Profissional de gestão/liderança': '👑',
  'Freelancer/autônomo': '🚀',
  'Profissional criativo': '🎨',
  'Profissional da saúde': '🏥',
  'Profissional da educação': '📖',
  'Profissional da tecnologia': '💻',
  'Mudança de carreira': '🔄',
  'Retorno ao mercado': '🔁',
  'Perfil sem experiência formal': '✨',
  'Perfil com experiência extensa': '🏆',
};

const LOADING_STEPS = [
  { icon: Brain, text: 'Analisando seu perfil profissional...' },
  { icon: Target, text: 'Identificando pontos fortes...' },
  { icon: Wand2, text: 'Reescrevendo conteúdo com linguagem profissional...' },
  { icon: FileCheck, text: 'Otimizando para ATS e recrutadores...' },
  { icon: Sparkles, text: 'Finalizando seu currículo premium...' },
];

export default function AIResumeGenerator({ onGenerated }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Por favor, descreva sua experiência profissional.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    // Simulação de progresso visual
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);

    try {
      const prompt = `Você é um especialista premium em criação de currículos profissionais brasileiros, com vasta experiência em recrutamento, design de documentos, copywriting profissional e otimização para ATS.

Sua missão é analisar os dados brutos do candidato abaixo e transformá-los em um currículo de ALTA QUALIDADE, com linguagem profissional, estrutura moderna e forte potencial de aprovação em processos seletivos.

${targetJob ? `VAGA ALVO / OBJETIVO: ${targetJob}` : ''}

DADOS DO CANDIDATO:
${description}

EXECUTE AS ETAPAS A SEGUIR:

ETAPA 1 — ANÁLISE DO PERFIL
Classifique em UMA das categorias:
Primeiro emprego | Jovem aprendiz | Estagiário | Profissional operacional | Profissional administrativo | Profissional comercial | Profissional técnico | Profissional de atendimento | Profissional de gestão/liderança | Freelancer/autônomo | Profissional criativo | Profissional da saúde | Profissional da educação | Profissional da tecnologia | Mudança de carreira | Retorno ao mercado | Perfil sem experiência formal | Perfil com experiência extensa

ETAPA 2 — NÍVEL DE EXPERIÊNCIA
Classifique: Júnior | Pleno | Sênior | Executivo | Sem experiência

ETAPA 3 — FORMATO IDEAL
Escolha: Cronológico reverso | Funcional | Combinado/Híbrido | Enxuto 1 página | Estratégico 2 páginas

ETAPA 4 — REESCRITA PROFISSIONAL
- Transforme linguagem informal em linguagem profissional
- Substitua frases fracas por verbos de ação e linguagem de mercado
- Use verbos: Realizei, Executei, Organizei, Implementei, Desenvolvi, Acompanhei, Apoiei, Otimizei, etc.
- Corrija ortografia, padronize datas e cargos
- Elimine redundâncias e informações fracas
- Cada experiência deve ter 3-5 bullets fortes com verbo de ação, responsabilidade clara e valor

ETAPA 5 — RESUMO PROFISSIONAL PODEROSO
Crie um resumo de 3-4 linhas:
- Humano, estratégico e convincente
- Destaca pontos fortes, experiência e objetivo
- Sem exageros, focado em empregabilidade
- Tom profissional e atual

ETAPA 6 — TEMPLATE SUGERIDO
Com base no perfil, sugira o melhor template_id de: classic_blue | modern_dark | clean_green | executive | creative_purple | tech_dark | elegant_red | minimal_gray | teal_modern | orange_accent | navy_professional | fresh_light | bold_black | pink_creative | golden_executive | bw_infographic | beige_brown | blue_gray_pro | blue_photo_sidebar | beige_soft_photo | dark_sidebar_cv

ETAPA 7 — SUGESTÕES DE MELHORIA
Liste 3-5 sugestões práticas para o candidato melhorar o perfil antes de se candidatar.

REGRAS FUNDAMENTAIS:
- NUNCA invente informações não fornecidas pelo candidato
- NUNCA crie experiências, cursos, certificados ou idiomas inexistentes
- PODE e DEVE reescrever e valorizar o conteúdo existente
- Mantenha apenas informações reais fornecidas pelo candidato

Retorne o JSON com EXATAMENTE esta estrutura:
{
  "perfil_detectado": "string",
  "nivel_experiencia": "string",
  "formato_curriculo": "string",
  "template_sugerido": "string (template_id)",
  "justificativa_template": "string (1-2 linhas explicando a escolha)",
  "titulo_profissional": "string (título/cargo ideal para o perfil)",
  "name": "string",
  "title": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "website": "string",
  "summary": "string (resumo profissional reescrito e otimizado, 3-4 linhas)",
  "experience": [
    {
      "company": "string",
      "role": "string (cargo reescrito de forma profissional)",
      "start": "YYYY-MM",
      "end": "YYYY-MM",
      "current": false,
      "description": "string (3-5 bullets separados por ponto final, com verbos de ação)"
    }
  ],
  "education": [
    {
      "institution": "string",
      "course": "string",
      "start": "YYYY-MM",
      "end": "YYYY-MM",
      "current": false
    }
  ],
  "skills": ["array de habilidades técnicas e comportamentais organizadas por relevância"],
  "languages": [
    {"name": "string", "level": "Básico|Intermediário|Avançado|Fluente|Nativo"}
  ],
  "certifications": [
    {"name": "string", "institution": "string", "year": "string"}
  ],
  "sugestoes_melhoria": ["string", "string", "string"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            perfil_detectado: { type: 'string' },
            nivel_experiencia: { type: 'string' },
            formato_curriculo: { type: 'string' },
            template_sugerido: { type: 'string' },
            justificativa_template: { type: 'string' },
            titulo_profissional: { type: 'string' },
            name: { type: 'string' },
            title: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            location: { type: 'string' },
            linkedin: { type: 'string' },
            github: { type: 'string' },
            website: { type: 'string' },
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

      clearInterval(stepInterval);
      setResult(result);

    } catch (e) {
      clearInterval(stepInterval);
      setError('Erro ao gerar currículo. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    const resumeData = {
      name: result.name || '',
      title: result.title || result.titulo_profissional || '',
      email: result.email || '',
      phone: result.phone || '',
      location: result.location || '',
      linkedin: result.linkedin || '',
      github: result.github || '',
      website: result.website || '',
      summary: result.summary || '',
      experience: result.experience || [],
      education: result.education || [],
      skills: result.skills || [],
      languages: result.languages || [],
      certifications: result.certifications || [],
    };
    onGenerated(resumeData, result.template_sugerido || null);
    setOpen(false);
    setResult(null);
    setDescription('');
    setTargetJob('');
  };

  const StepIcon = LOADING_STEPS[loadingStep]?.icon || Sparkles;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-4 font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>✨ Gerar Currículo Premium com Inteligência Artificial</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-700 rounded-xl p-5 space-y-4">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Motor de IA Premium para Currículos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detecta seu perfil, reescreve o conteúdo profissionalmente, sugere o melhor template e otimiza para ATS.
              </p>
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
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg p-3 min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-slate-400"
                  placeholder={`Escreva livremente tudo sobre você. Quanto mais detalhar, melhor o resultado.\n\nExemplo:\nMeu nome é Maria Silva, tenho 26 anos, sou de João Pessoa - PB. Trabalhei 2 anos como atendente de farmácia na Drogasil, antes disso fui caixa de supermercado por 1 ano. Tenho ensino médio completo. Sei usar computador básico e Excel. Sou comunicativa, pontual e gosto de trabalhar com o público. Meu telefone é (83) 99999-1234 e e-mail maria@email.com`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Vaga alvo (opcional) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  🎯 Vaga ou área que está buscando (opcional)
                </label>
                <input
                  type="text"
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-slate-400"
                  placeholder="Ex: Auxiliar Administrativo, Vendedor, Programador..."
                  value={targetJob}
                  onChange={e => setTargetJob(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Recursos da IA */}
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 grid grid-cols-2 gap-2">
                {[
                  { icon: '🎯', text: 'Detecta perfil automaticamente' },
                  { icon: '✍️', text: 'Reescreve com linguagem profissional' },
                  { icon: '🎨', text: 'Sugere o melhor template' },
                  { icon: '📊', text: 'Otimiza para sistemas ATS' },
                  { icon: '💡', text: 'Dicas de melhoria do perfil' },
                  { icon: '🚀', text: 'Resumo profissional poderoso' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>

              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 flex items-start gap-2">
                <span>⚡</span>
                <span>Usa modelo premium (Claude) — pode levar 15-30 segundos para gerar o currículo completo.</span>
              </div>

              {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}

              {/* Loading state */}
              {loading && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-violet-200 dark:border-violet-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center">
                      <StepIcon className="w-4 h-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {LOADING_STEPS[loadingStep]?.text}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= loadingStep ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !description.trim()}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analisando e gerando...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Gerar Currículo Premium com IA</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="border-violet-300 text-violet-700 hover:bg-violet-50" disabled={loading}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            /* Resultado da análise */
            <div className="space-y-4">
              {/* Perfil detectado */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-violet-200 dark:border-violet-600">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Análise concluída!</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Perfil detectado</p>
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                      {PROFILE_ICON_MAP[result.perfil_detectado] || '👤'} {result.perfil_detectado}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nível</p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{result.nivel_experiencia}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Formato</p>
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{result.formato_curriculo}</p>
                  </div>
                </div>
              </div>

              {/* Template sugerido */}
              {result.template_sugerido && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Template recomendado para você</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{result.justificativa_template}</p>
                </div>
              )}

              {/* Resumo gerado */}
              {result.summary && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-500" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Resumo profissional gerado</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* Sugestões de melhoria */}
              {result.sugestoes_melhoria?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Sugestões para fortalecer seu perfil</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {result.sugestoes_melhoria.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resumo dos dados */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p><strong>Nome:</strong> {result.name || '—'}</p>
                <p><strong>Cargo:</strong> {result.title || result.titulo_profissional || '—'}</p>
                <p><strong>Experiências:</strong> {result.experience?.length || 0} {result.experience?.length === 1 ? 'registro' : 'registros'}</p>
                <p><strong>Formação:</strong> {result.education?.length || 0} {result.education?.length === 1 ? 'registro' : 'registros'}</p>
                <p><strong>Habilidades:</strong> {result.skills?.length || 0} {result.skills?.length === 1 ? 'item' : 'itens'}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aplicar ao Currículo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResult(null)}
                  className="border-slate-300 text-slate-600"
                >
                  Refazer
                </Button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Os dados serão preenchidos automaticamente. Você poderá revisar e editar depois.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}