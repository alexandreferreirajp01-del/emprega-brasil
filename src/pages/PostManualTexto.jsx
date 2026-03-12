import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardPaste, Send, Loader2, CheckCircle, RefreshCw, FileText, Briefcase, Star, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import JobsSummaryClipboard from "@/components/admin/JobsSummaryClipboard";

const JOB_TYPES = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Freelancer', 'Jovem Aprendiz', 'Home Office', 'PCD'];
const WORK_MODES = ['Presencial', 'Híbrido', 'Remoto'];
const CONTRACT_TYPES_OPTIONS = ['CLT', 'PJ', 'Autônomo', 'Estágio', 'Jovem Aprendiz', 'Temporário', 'Freelancer', 'Trainee', 'Banco de Talentos'];
const CATEGORIES = ['Administrativo', 'Atendimento', 'Comercial', 'Construção Civil', 'Educação', 'Financeiro', 'Indústria', 'Logística', 'Saúde', 'Serviços Gerais', 'TI', 'Outros'];

const emptyForm = {
  title: '',
  company: '',
  city: '',
  state: '',
  neighborhood: '',
  salary_range: '',
  job_type: '',
  work_mode: 'Presencial',
  category: '',
  description: '',
  application_link: '',
  contact_email: '',
  contact_phone: '',
  contact_whatsapp: '',
  contract_types: [],
  is_featured: false,
  is_premium: false,
};

// Cidades comuns da Paraíba e outros estados para detecção sem prefixo
const CIDADES_CONHECIDAS = [
  'joão pessoa','campina grande','patos','cajazeiras','sousa','guarabira','bayeux','santa rita',
  'cabedelo','sapé','queimadas','pombal','catolé do rocha','cuité','picuí','monteiro','sumé',
  'recife','fortaleza','natal','maceió','teresina','são luís','salvador','aracaju','belém',
  'manaus','porto alegre','curitiba','florianópolis','belo horizonte','rio de janeiro','são paulo',
  'brasília','goiânia','campo grande','cuiabá','porto velho','macapá','boa vista','rio branco','palmas',
  'vitória','macaió','caruaru','petrolina','mossoró','juazeiro do norte','montes claros','uberlândia',
  'londrina','maringá','joinville','blumenau','caxias do sul','pelotas'
];

const ESTADOS_MAP = {
  'paraíba': 'PB', 'pernambuco': 'PE', 'ceará': 'CE', 'rio grande do norte': 'RN',
  'bahia': 'BA', 'alagoas': 'AL', 'sergipe': 'SE', 'maranhão': 'MA', 'piauí': 'PI',
  'pará': 'PA', 'amazonas': 'AM', 'roraima': 'RR', 'amapá': 'AP', 'acre': 'AC',
  'rondônia': 'RO', 'tocantins': 'TO', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'goiás': 'GO', 'minas gerais': 'MG', 'espírito santo': 'ES', 'rio de janeiro': 'RJ',
  'são paulo': 'SP', 'paraná': 'PR', 'santa catarina': 'SC', 'rio grande do sul': 'RS',
  'distrito federal': 'DF'
};

// Remove emojis e caracteres especiais indesejados do texto
function cleanText(text) {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
    .replace(/[*"/£¢¥^°}\\∆×÷`|]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractFromText(rawInput) {
  const text = cleanText(rawInput);
  const result = { ...emptyForm };
  if (!text.trim()) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const textLower = text.toLowerCase();

  // ── TÍTULO ──────────────────────────────────────────────────────────────
  // Prioridade 1: linha com prefixo "vaga:", "cargo:", "função:", etc.
  for (const line of lines) {
    const m = line.match(/^(?:vaga|cargo|fun[cç][aã]o|oportunidade|vaga de emprego)[:\s-]+(.+)/i);
    if (m) { result.title = m[1].trim(); break; }
  }
  // Prioridade 2: linha "contratamos / procuramos / selecionamos [cargo]"
  if (!result.title) {
    for (const line of lines) {
      const m = line.match(/^(?:contratamos|procuramos|selecionamos|buscamos|precisa-se de|vaga para)[:\s]+(.+)/i);
      if (m) { result.title = m[1].trim(); break; }
    }
  }
  // Prioridade 3: primeira linha
  if (!result.title && lines.length > 0) result.title = lines[0];

  // ── EMPRESA ─────────────────────────────────────────────────────────────
  for (const line of lines) {
    const m = line.match(/^(?:empresa|empregador|recrutador|contratante)[:\s]+(.+)/i);
    if (m) { result.company = m[1].trim(); break; }
  }
  if (!result.company) {
    for (const line of lines) {
      const m = line.match(/^(.{3,50}?)\s+(?:contrata|busca|seleciona|recruta|está contratando)/i);
      if (m) { result.company = m[1].trim(); break; }
    }
  }

  // ── LOCALIZAÇÃO (Cidade, UF, Bairro) ────────────────────────────────────
  // 1) Prefixo "local:", "localização:", "cidade:", "endereço:", "onde:", "lotação:"
  for (const line of lines) {
    const m = line.match(/^(?:local(?:iza[cç][aã]o)?|cidade|endere[cç]o|onde|lota[cç][aã]o|local de trabalho)[:\s]+(.+)/i);
    if (m) {
      const loc = m[1].trim();
      // Extrai UF sigla
      const ufMatch = loc.match(/[-–,\/]\s*([A-Z]{2})\b/) || loc.match(/\b([A-Z]{2})\b/);
      if (ufMatch) result.state = ufMatch[1];
      // Extrai nome do estado por extenso
      if (!result.state) {
        for (const [name, uf] of Object.entries(ESTADOS_MAP)) {
          if (loc.toLowerCase().includes(name)) { result.state = uf; break; }
        }
      }
      result.city = loc.replace(/[-–,\/]\s*[A-Z]{2}\b/, '').replace(/,?\s*bairro.+/i, '').trim();
      // Bairro embutido: "João Pessoa - PB - Bairro dos Estados"
      const bairroEmbutido = loc.match(/[-–,]\s*(?:bairro\s+)?(.+)$/i);
      if (bairroEmbutido && !result.neighborhood) result.neighborhood = bairroEmbutido[1].trim();
      break;
    }
  }

  // 2) Padrão "Cidade - UF" ou "Cidade/UF" em qualquer linha
  if (!result.city) {
    for (const line of lines) {
      const m = line.match(/^([A-Za-zÀ-ú][A-Za-zÀ-ú\s]{2,40}?)\s*[-–\/]\s*([A-Z]{2})\b/);
      if (m) {
        result.city = m[1].trim();
        result.state = m[2];
        break;
      }
    }
  }

  // 3) Detectar cidade por nome conhecido no texto
  if (!result.city) {
    for (const cidade of CIDADES_CONHECIDAS) {
      const idx = textLower.indexOf(cidade);
      if (idx !== -1) {
        result.city = text.substring(idx, idx + cidade.length)
          .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
  }

  // 4) UF por nome de estado por extenso
  if (!result.state) {
    for (const [name, uf] of Object.entries(ESTADOS_MAP)) {
      if (textLower.includes(name)) { result.state = uf; break; }
    }
  }

  // ── BAIRRO ──────────────────────────────────────────────────────────────
  if (!result.neighborhood) {
    for (const line of lines) {
      const m = line.match(/^(?:bairro|localidade)[:\s]+(.+)/i);
      if (m) { result.neighborhood = m[1].trim(); break; }
    }
  }

  // ── SALÁRIO ─────────────────────────────────────────────────────────────
  for (const line of lines) {
    // Prefixo "salário:", "remuneração:", "faixa salarial:", "valor:", "pagamento:"
    const m = line.match(/^(?:sal[aá]rio|remunera[cç][aã]o|faixa salarial|pagamento|valor|benefícios salariais)[:\s]+(.+)/i);
    if (m) { result.salary_range = m[1].trim(); break; }
  }
  if (!result.salary_range) {
    // Detecta "R$ X" ou "R$ X - R$ Y" em qualquer linha
    const m = text.match(/R\$\s*[\d.,]+(?:\s*(?:[-–a]|até)\s*R?\$?\s*[\d.,]+)?(?:\s*(?:\/hora|\/h|por hora|mensais?|mês)?)?/i);
    if (m) result.salary_range = m[0].trim();
  }
  if (!result.salary_range) {
    // "a combinar", "à combinar", "a definir"
    const m = text.match(/(?:sal[aá]rio|remunera[cç][aã]o)[^.\n]{0,30}(a combinar|à combinar|a definir|conforme experiência)/i);
    if (m) result.salary_range = m[1].trim();
  }

  // ── TIPO DE CONTRATO ─────────────────────────────────────────────────────
  if (textLower.includes('jovem aprendiz')) result.job_type = 'Jovem Aprendiz';
  else if (textLower.includes('estágio') || textLower.includes('estagio') || textLower.includes('estagiário')) result.job_type = 'Estágio';
  else if (textLower.includes('pcd') || textLower.includes('pessoa com deficiência')) result.job_type = 'PCD';
  else if (textLower.includes('freelancer') || textLower.includes('free-lancer')) result.job_type = 'Freelancer';
  else if (textLower.includes('temporári') || textLower.includes('temporario')) result.job_type = 'Temporário';
  else if (textLower.match(/\bpj\b/) || textLower.includes('pessoa jurídica')) result.job_type = 'PJ';
  else if (textLower.includes('clt')) result.job_type = 'CLT';
  else if (textLower.includes('home office') || textLower.includes('remoto')) result.job_type = 'Home Office';

  // Contract types array
  const ctMap = { 'CLT': 'clt', 'PJ': /\bpj\b/, 'Estágio': /est[aá]gi/, 'Jovem Aprendiz': 'jovem aprendiz', 'Temporário': /temporári/, 'Freelancer': 'freelancer', 'Trainee': 'trainee', 'Autônomo': /aut[ôo]nom/ };
  for (const [label, pattern] of Object.entries(ctMap)) {
    const found = typeof pattern === 'string' ? textLower.includes(pattern) : pattern.test(textLower);
    if (found && !result.contract_types.includes(label)) result.contract_types.push(label);
  }

  // ── MODALIDADE ───────────────────────────────────────────────────────────
  if (textLower.includes('home office') || textLower.includes('remoto') || textLower.includes('trabalho remoto') || textLower.includes('100% remoto')) result.work_mode = 'Remoto';
  else if (textLower.includes('híbrido') || textLower.includes('hibrido') || textLower.includes('semi-presencial')) result.work_mode = 'Híbrido';

  // ── CATEGORIA ────────────────────────────────────────────────────────────
  const categoryMap = [
    { cat: 'TI', keywords: ['desenvolvedor', 'programador', 'ti ', 'tecnologia da informação', 'suporte técnico', 'analista de sistemas', 'analista de ti', 'web', 'software', 'hardware', 'infra'] },
    { cat: 'Saúde', keywords: ['enfermeiro', 'médico', 'médica', 'enfermagem', 'farmacêutico', 'fisioterapeuta', 'nutricionista', 'psicólogo', 'técnico de enfermagem', 'cuidador', 'saúde'] },
    { cat: 'Educação', keywords: ['professor', 'professora', 'pedagogo', 'educação', 'docente', 'tutor', 'instrutor', 'escola', 'ensino'] },
    { cat: 'Administrativo', keywords: ['auxiliar administrativo', 'assistente administrativo', 'secretária', 'recepcionista', 'escritório', 'administrativ'] },
    { cat: 'Atendimento', keywords: ['atendente', 'atendimento ao cliente', 'sac', 'call center', 'telemarketing', 'operador de caixa', 'caixa', 'balconista'] },
    { cat: 'Comercial', keywords: ['vendedor', 'vendas', 'representante comercial', 'consultor de vendas', 'promotor', 'comercial'] },
    { cat: 'Logística', keywords: ['logística', 'motorista', 'entregador', 'mototaxista', 'motoboy', 'conferente', 'estoquista', 'almoxarife', 'armazém'] },
    { cat: 'Construção Civil', keywords: ['pedreiro', 'servente', 'eletricista', 'encanador', 'pintor', 'construção', 'obra', 'engenheiro civil', 'mestre de obras', 'carpinteiro', 'azulejista'] },
    { cat: 'Indústria', keywords: ['operador de máquina', 'produção', 'fábrica', 'industrial', 'linha de produção', 'montador', 'mecânico', 'soldador', 'torneiro'] },
    { cat: 'Serviços Gerais', keywords: ['serviços gerais', 'limpeza', 'faxineiro', 'zelador', 'porteiro', 'vigilante', 'segurança', 'copeiro', 'auxiliar de limpeza'] },
    { cat: 'Financeiro', keywords: ['financeiro', 'contador', 'contabilidade', 'tesoureiro', 'analista financeiro', 'cobrança', 'fiscal'] },
  ];
  for (const { cat, keywords } of categoryMap) {
    if (keywords.some(kw => textLower.includes(kw))) { result.category = cat; break; }
  }

  // ── CONTATOS ─────────────────────────────────────────────────────────────
  // WhatsApp (prefixo específico primeiro)
  const waExplicit = text.match(/(?:whatsapp|wpp|wha?ts?|zap)[:\s]+([+\d\s().()-]{8,20})/i);
  if (waExplicit) result.contact_whatsapp = waExplicit[1].replace(/\D/g, '');

  // Telefone (prefixo específico)
  const phoneExplicit = text.match(/(?:telefone|tel\.?|fone|celular|contato)[:\s]+([+\d\s().()-]{7,20})/i);
  if (phoneExplicit) result.contact_phone = phoneExplicit[1].replace(/\D/g, '');

  // Fallback: número genérico com DDD
  if (!result.contact_whatsapp && !result.contact_phone) {
    const numMatch = text.match(/\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
    if (numMatch) result.contact_whatsapp = numMatch[0].replace(/\D/g, '');
  }

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.contact_email = emailMatch[0];

  // Link de candidatura (exclui links de imagens/mídias)
  const linkMatch = text.match(/https?:\/\/(?!(?:wa\.me|api\.whatsapp|t\.me|instagram|facebook|twitter))[^\s]+/i)
    || text.match(/https?:\/\/[^\s]+/);
  if (linkMatch) result.application_link = linkMatch[0].replace(/[.,;)]+$/, '');

  // ── DESCRIÇÃO ────────────────────────────────────────────────────────────
  // Remove linhas que são apenas o título para não repetir
  const titleNorm = result.title.toLowerCase().trim();
  const descLines = lines.filter(line => {
    const l = line.toLowerCase().trim();
    return l !== titleNorm && l !== `vaga: ${titleNorm}` && l !== `cargo: ${titleNorm}`;
  });
  result.description = descLines.join('\n').trim();

  return result;
}

export default function PostManualTexto() {
  const [rawText, setRawText] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedJobs, setPublishedJobs] = useState(null);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleExtract = () => {
    if (!rawText.trim()) { toast.error('Cole o texto da vaga primeiro!'); return; }
    const data = extractFromText(rawText);
    setForm(data);
    setExtracted(true);
    toast.success('Dados extraídos! Revise e ajuste os campos antes de publicar.');
  };

  const handleReset = () => {
    setRawText('');
    setForm(emptyForm);
    setExtracted(false);
    setPublished(false);
  };

  const handlePublish = async (status = 'ativa') => {
    if (!form.title.trim()) { toast.error('Título é obrigatório!'); return; }
    if (!form.description.trim()) { toast.error('Descrição é obrigatória!'); return; }

    setSaving(true);
    try {
      // Enriquecimento com pipeline
      let descricaoEnriquecida = form.description.trim();
      try {
        const enriquecimento = await base44.integrations.Core.InvokeLLM({
          prompt: `Como especialista em recursos humanos, forneça contexto profissional genérico APENAS para a área de "${form.title.trim()}":

1. Resumo da função (2-3 linhas sobre o cargo de forma genérica)
2. Atividades comuns desta profissão (4-6 exemplos típicos)
3. Competências profissionais comuns (5-8 skills esperadas)

IMPORTANTE: Não mencionar empresa ou informações específicas. Apenas contexto geral.`,
          model: 'gpt_5',
          response_json_schema: {
            type: "object",
            properties: {
              resumo: { type: "string" },
              atividades: { type: "array", items: { type: "string" } },
              competencias: { type: "array", items: { type: "string" } }
            }
          }
        });

        if (enriquecimento?.resumo) {
          descricaoEnriquecida = `${enriquecimento.resumo}\n\n${descricaoEnriquecida}`;
        }
        if (enriquecimento?.atividades?.length > 0) {
          descricaoEnriquecida += `\n\nAtividades comuns dessa área:\n${enriquecimento.atividades.map(a => `- ${a}`).join('\n')}`;
        }
        if (enriquecimento?.competencias?.length > 0) {
          descricaoEnriquecida += `\n\nCompetências profissionais comuns:\n${enriquecimento.competencias.map(c => `- ${c}`).join('\n')}`;
        }
      } catch (e) {
        console.error('Erro ao enriquecer:', e);
      }

      await base44.entities.Job.create({
        title: form.title.trim(),
        company: form.company.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        neighborhood: form.neighborhood.trim(),
        salary_range: form.salary_range.trim(),
        job_type: form.job_type || undefined,
        work_mode: form.work_mode || 'Presencial',
        category: form.category.trim(),
        description: descricaoEnriquecida,
        application_link: form.application_link.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_whatsapp: form.contact_whatsapp.trim(),
        contract_types: form.contract_types,
        status,
        is_premium: form.is_premium,
        is_featured: form.is_featured,
        origem: 'post_manual_texto',
        published_at: status === 'ativa' ? new Date().toISOString() : null,
        needs_review: false,
      });
      toast.success(status === 'ativa' ? '✅ Vaga publicada com sucesso!' : '💾 Salvo como rascunho!');
      if (status === 'ativa') {
        setPublishedJobs([{ title: form.title, city: form.city, state: form.state, salary_range: form.salary_range }]);
      } else {
        setPublished(true);
      }
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (publishedJobs) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-xl font-bold text-white">Post Manual — Texto</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <JobsSummaryClipboard
            jobs={publishedJobs}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-10">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Rascunho Salvo!</h2>
            <p className="text-slate-500 mb-6">A vaga foi salva como rascunho.</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <Button onClick={handleReset} className="flex-1 gap-2">
                <FileText className="w-4 h-4" /> Nova Vaga
              </Button>
              <Link to={createPageUrl('GerenciarVagas')} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Briefcase className="w-4 h-4" /> Ver Vagas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Configurações
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ClipboardPaste className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Post Manual — Texto</h1>
              <p className="text-white/60 text-xs mt-0.5">Cole o texto da vaga, ajuste os campos e publique sem usar créditos de IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Passo 1: Colar texto */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1D4371] text-white text-xs flex items-center justify-center font-bold">1</span>
                  Cole o texto da vaga
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 ml-8">O sistema tentará preencher os campos automaticamente</p>
              </div>
              {extracted && (
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Recomeçar
                </Button>
              )}
            </div>
            <Textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Cole aqui o texto completo da vaga de emprego...&#10;&#10;Exemplo:&#10;Vaga: Auxiliar de Limpeza&#10;Empresa: XYZ Serviços&#10;Local: João Pessoa - PB&#10;Salário: R$ 1.500,00&#10;Tipo: CLT&#10;WhatsApp: 83 99999-0000&#10;..."
              rows={8}
              className="font-mono text-sm resize-none"
              disabled={extracted}
            />
            <Button onClick={handleExtract} disabled={extracted || !rawText.trim()} className="w-full sm:w-auto gap-2 bg-[#1D4371] hover:bg-[#0F2744]">
              <ClipboardPaste className="w-4 h-4" />
              {extracted ? 'Dados Extraídos ✓' : 'Extrair Dados do Texto'}
            </Button>
          </CardContent>
        </Card>

        {/* Passo 2: Formulário */}
        {extracted && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1D4371] text-white text-xs flex items-center justify-center font-bold">2</span>
                Revise e complete os dados
              </h2>

              {/* Linha 1: Título */}
              <div>
                <Label className="text-sm font-medium">Título da Vaga *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Auxiliar Administrativo" className="mt-1" />
              </div>

              {/* Linha 2: Empresa + Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Empresa</Label>
                  <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Nome da empresa" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Linha 3: Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label className="text-sm font-medium">Cidade</Label>
                  <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ex: João Pessoa" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">UF</Label>
                  <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="PB" maxLength={2} className="mt-1 uppercase" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Bairro</Label>
                  <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Centro" className="mt-1" />
                </div>
              </div>

              {/* Linha 4: Contrato + Modalidade + Salário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">Tipo de Vaga</Label>
                  <Select value={form.job_type} onValueChange={v => set('job_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Modalidade</Label>
                  <Select value={form.work_mode} onValueChange={v => set('work_mode', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Salário</Label>
                  <Input value={form.salary_range} onChange={e => set('salary_range', e.target.value)} placeholder="R$ 1.500,00" className="mt-1" />
                </div>
              </div>

              {/* Tipos de contratação (multi-select via badges) */}
              <div>
                <Label className="text-sm font-medium">Tipos de Contratação</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CONTRACT_TYPES_OPTIONS.map(ct => {
                    const selected = form.contract_types.includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          set('contract_types', selected
                            ? form.contract_types.filter(x => x !== ct)
                            : [...form.contract_types, ct]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-[#1D4371] text-white border-[#1D4371]' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#1D4371]'}`}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">WhatsApp</Label>
                  <Input value={form.contact_whatsapp} onChange={e => set('contact_whatsapp', e.target.value)} placeholder="83999990000" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="8333330000" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="rh@empresa.com" className="mt-1" />
                </div>
              </div>

              {/* Link de candidatura */}
              <div>
                <Label className="text-sm font-medium">Link de Candidatura</Label>
                <Input value={form.application_link} onChange={e => set('application_link', e.target.value)} placeholder="https://..." className="mt-1" />
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-sm font-medium">Descrição Completa *</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={8} className="mt-1 text-sm" placeholder="Descrição da vaga..." />
              </div>

              {/* Destaque e Premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set('is_featured', !form.is_featured)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.is_featured ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-amber-300'}`}
                >
                  <Star className={`w-5 h-5 flex-shrink-0 ${form.is_featured ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${form.is_featured ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>Vaga em Destaque</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aparece no topo e em evidência</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.is_featured ? 'bg-amber-400 border-amber-400' : 'border-slate-300'}`}>
                    {form.is_featured && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => set('is_premium', !form.is_premium)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.is_premium ? 'bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-purple-300'}`}
                >
                  <Crown className={`w-5 h-5 flex-shrink-0 ${form.is_premium ? 'text-purple-500' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${form.is_premium ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>Vaga Premium</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Visível apenas para assinantes</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.is_premium ? 'bg-purple-400 border-purple-400' : 'border-slate-300'}`}>
                    {form.is_premium && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              </div>

              {/* Botões de publicação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handlePublish('draft')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Salvar Rascunho
                </Button>
                <Button
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handlePublish('ativa')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publicar Vaga
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}