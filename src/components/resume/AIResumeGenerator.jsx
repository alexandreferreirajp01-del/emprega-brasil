import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function AIResumeGenerator({ onGenerated }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Por favor, descreva sua experiência profissional.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const prompt = `Você é um especialista em criação de currículos profissionais brasileiros.
Com base na descrição abaixo, extraia e organize TODAS as informações disponíveis para criar um currículo completo e profissional.
${customPrompt ? `\nInstruções adicionais do usuário: ${customPrompt}` : ''}

Descrição do candidato:
${description}

Retorne um JSON com exatamente esta estrutura (deixe string vazia ou array vazio se não houver a informação):
{
  "name": "Nome completo",
  "title": "Cargo ou título profissional",
  "email": "email",
  "phone": "telefone",
  "location": "Cidade, Estado",
  "linkedin": "URL linkedin",
  "github": "URL github",
  "website": "URL site/portfolio",
  "summary": "Resumo profissional impactante de 3-4 linhas, em primeira pessoa, destacando principais pontos fortes e objetivos",
  "experience": [
    {
      "company": "Nome da empresa",
      "role": "Cargo",
      "start": "YYYY-MM",
      "end": "YYYY-MM",
      "current": false,
      "description": "Descrição otimizada das atividades e conquistas em 2-3 linhas"
    }
  ],
  "education": [
    {
      "institution": "Nome da instituição",
      "course": "Nome do curso e grau",
      "start": "YYYY-MM",
      "end": "YYYY-MM",
      "current": false
    }
  ],
  "skills": ["Habilidade 1", "Habilidade 2", "Habilidade 3"],
  "languages": [
    {"name": "Idioma", "level": "Básico|Intermediário|Avançado|Fluente|Nativo"}
  ],
  "certifications": [
    {"name": "Nome da certificação", "institution": "Instituição", "year": "Ano"}
  ]
}

REGRAS IMPORTANTES:
- Escreva o resumo de forma impactante e profissional em português brasileiro
- Otimize as descrições de experiência para destacar resultados e conquistas com verbos de ação
- Use meses no formato YYYY-MM (ex: 2023-03). Se não souber o mês exato, use 01
- Se a pessoa estiver no emprego atual, marque current: true e end: ""
- Extraia o máximo de informação possível do texto fornecido`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
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
          }
        }
      });

      onGenerated(result);
      setOpen(false);
      setDescription('');
      setCustomPrompt('');
    } catch (e) {
      setError('Erro ao gerar currículo. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-5 py-3.5 font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>✨ Gerar Currículo com Inteligência Artificial</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-700 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Assistente de IA para Currículos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Descreva sua experiência em texto livre e a IA cria um currículo profissional completo automaticamente.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Descreva sua experiência profissional *
              </label>
              <textarea
                className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg p-3 min-h-[130px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-slate-400"
                placeholder={`Ex: Meu nome é João Silva, tenho 28 anos, sou desenvolvedor de software há 5 anos. Trabalho atualmente na Empresa Tech XYZ como Desenvolvedor Sênior desde março de 2022, onde desenvolvo aplicações web com React e Node.js. Antes trabalhei na empresa ABC de 2019 a 2022 como Desenvolvedor Júnior. Sou formado em Ciências da Computação pela UFPB em 2019. Tenho habilidades em JavaScript, TypeScript, React, Node.js, SQL, Docker. Falo inglês fluente e espanhol básico. Meu e-mail é joao@email.com e meu telefone é (83) 99999-9999.`}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Personalizar com prompt (opcional)
              </label>
              <textarea
                className="w-full text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 rounded-lg p-3 min-h-[56px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-slate-400"
                placeholder="Ex: Quero um tom mais formal. Destaque liderança e gestão de equipes. Foco em resultados quantitativos..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={loading || !description.trim()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando seu currículo...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Gerar com IA</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-violet-300 text-violet-700 hover:bg-violet-50">
                Fechar
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">
              💡 A IA preencherá todos os campos automaticamente. Você poderá revisar e editar depois.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}