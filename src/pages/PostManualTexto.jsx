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
};

// Remove emojis e caracteres especiais indesejados do texto
function cleanText(text) {
  return text
    // Remove emojis
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
    // Remove caracteres especiais específicos
    .replace(/[*"/£¢¥^°}\\∆×÷`|]/g, '')
    // Limpa espaços múltiplos e linhas em branco extras
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Extrator manual simples (sem IA, sem créditos)
function extractFromText(rawInput) {
  const text = cleanText(rawInput);
  const result = { ...emptyForm };
  if (!text.trim()) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Título: primeira linha não vazia ou linha com "vaga" / "cargo" / "função"
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('vaga') || lower.includes('cargo') || lower.includes('função') || lower.includes('contratamos') || lower.includes('procuramos')) {
      result.title = line.replace(/^(vaga|cargo|função|contratamos|procuramos)[:\s-]*/i, '').trim() || line;
      break;
    }
  }
  if (!result.title && lines.length > 0) result.title = lines[0];

  // Empresa
  for (const line of lines) {
    const m = line.match(/empresa[:\s]+(.+)/i) || line.match(/^(.+)\s+(contrata|busca|seleciona|recruta)/i);
    if (m) { result.company = m[1].trim(); break; }
  }

  // Cidade / Estado
  for (const line of lines) {
    const m = line.match(/(?:local(?:ização)?|cidade|cep)[:\s]+(.+)/i);
    if (m) {
      const loc = m[1].trim();
      const stateMatch = loc.match(/[-–,]\s*([A-Z]{2})$/) || loc.match(/\b([A-Z]{2})\b/);
      if (stateMatch) result.state = stateMatch[1];
      result.city = loc.replace(/[-–,]\s*[A-Z]{2}$/, '').trim();
      break;
    }
    // Padrão: "Cidade - UF" ou "Cidade/UF"
    const cityState = line.match(/^([A-Za-zÀ-ú\s]+)\s*[-\/]\s*([A-Z]{2})$/);
    if (cityState) {
      result.city = cityState[1].trim();
      result.state = cityState[2];
      break;
    }
  }

  // Bairro
  for (const line of lines) {
    const m = line.match(/bairro[:\s]+(.+)/i);
    if (m) { result.neighborhood = m[1].trim(); break; }
  }

  // Salário
  for (const line of lines) {
    const m = line.match(/sal[aá]rio[:\s]+(.+)/i) || line.match(/remunera[cç][aã]o[:\s]+(.+)/i) || line.match(/(R\$\s*[\d.,]+(?:\s*[-–]\s*R?\$?\s*[\d.,]+)?)/i);
    if (m) { result.salary_range = (m[1] || m[0]).trim(); break; }
  }

  // Tipo de contrato
  const textLower = text.toLowerCase();
  if (textLower.includes('clt')) result.job_type = 'CLT';
  else if (textLower.includes('estágio') || textLower.includes('estagio')) result.job_type = 'Estágio';
  else if (textLower.includes('jovem aprendiz')) result.job_type = 'Jovem Aprendiz';
  else if (textLower.includes('home office') || textLower.includes('remoto')) result.job_type = 'Home Office';
  else if (textLower.includes('temporário') || textLower.includes('temporario')) result.job_type = 'Temporário';
  else if (textLower.includes(' pj ') || textLower.includes('pessoa jurídica')) result.job_type = 'PJ';
  else if (textLower.includes('freelancer')) result.job_type = 'Freelancer';

  // Modalidade
  if (textLower.includes('home office') || textLower.includes('remoto') || textLower.includes('trabalho remoto')) result.work_mode = 'Remoto';
  else if (textLower.includes('híbrido') || textLower.includes('hibrido')) result.work_mode = 'Híbrido';

  // Contato - WhatsApp
  const waMatch = text.match(/(?:whatsapp|wpp|zap|zap zap)[:\s]+([+\d\s().()-]+)/i) || text.match(/(\(?\d{2}\)?\s*9[\d\s-]{8,})/);
  if (waMatch) result.contact_whatsapp = waMatch[1].replace(/\D/g, '');

  // Contato - Telefone
  const phoneMatch = text.match(/(?:telefone|tel|fone|celular)[:\s]+([+\d\s().()-]+)/i);
  if (phoneMatch) result.contact_phone = phoneMatch[1].replace(/\D/g, '');

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.contact_email = emailMatch[0];

  // Link de candidatura
  const linkMatch = text.match(/https?:\/\/[^\s]+/);
  if (linkMatch) result.application_link = linkMatch[0];

  // Descrição: usar o texto limpo
  result.description = text.trim();


  return result;
}

export default function PostManualTexto() {
  const [rawText, setRawText] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

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
        description: form.description.trim(),
        application_link: form.application_link.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_whatsapp: form.contact_whatsapp.trim(),
        contract_types: form.contract_types,
        status,
        is_premium: false,
        is_featured: false,
        origem: 'post_manual_texto',
        published_at: status === 'ativa' ? new Date().toISOString() : null,
        needs_review: false,
      });
      toast.success(status === 'ativa' ? '✅ Vaga publicada com sucesso!' : '💾 Salvo como rascunho!');
      setPublished(true);
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (published) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-10">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Vaga Publicada!</h2>
            <p className="text-slate-500 mb-6">A vaga foi salva com sucesso no sistema.</p>
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