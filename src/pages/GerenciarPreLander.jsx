import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Save, Copy, Check, ExternalLink, Loader2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const RECORD_ID_KEY = 'prelander_db_id';

const DEFAULT_CONFIG = {
  link: '',
  titulo: 'Você está a 1 passo de ver a vaga! 🎯',
  subtitulo: 'Antes de acessar, você passará por um anúncio rápido. Isso é o que mantém este projeto 100% gratuito e com novas vagas todo dia!',
  btn_texto: 'CONTINUAR PARA VER A VAGA',
};

export default function GerenciarPreLander() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        const isDono = u.email === 'alexandreferreirajp01@gmail.com' || u.subscription_type === 'dono';
        if (!isDono) { window.location.href = createPageUrl('Home'); return; }
        setUser(u);
        // Carregar config salva
        const saved = localStorage.getItem('prelander_config');
        if (saved) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const save = () => {
    setSaving(true);
    localStorage.setItem('prelander_config', JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => {
      setSaving(false);
      toast.success('Configurações salvas!');
    }, 400);
  };

  const getFullPageUrl = () => {
    const params = new URLSearchParams();
    if (config.link) params.set('link', config.link);
    if (config.titulo !== DEFAULT_CONFIG.titulo) params.set('titulo', config.titulo);
    if (config.subtitulo !== DEFAULT_CONFIG.subtitulo) params.set('subtitulo', config.subtitulo);
    if (config.btn_texto !== DEFAULT_CONFIG.btn_texto) params.set('btn', config.btn_texto);
    const qs = params.toString();
    return `${window.location.origin}/prelander${qs ? '?' + qs : ''}`;
  };

  const pageUrl = `${window.location.origin}/prelander`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#1D4371]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Pre-lander</h1>
          <p className="text-white/70 text-sm">Configure a página de pré-acesso para links de vagas</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Link da página */}
        <Card className="rounded-2xl dark:bg-slate-800">
          <CardHeader className="pb-2">
            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#1D4371]" /> Link da Pre-lander
            </p>
            <p className="text-xs text-slate-500">Copie e cole este link no Instagram ou onde quiser</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={pageUrl} readOnly className="text-xs bg-slate-50 dark:bg-slate-700 rounded-xl" />
              <Button onClick={copyLink} variant="outline" className="gap-1 flex-shrink-0 rounded-xl">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <a href={pageUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1 text-[#1D4371]">
                <ExternalLink className="w-4 h-4" /> Visualizar página
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Link do Encurta.net */}
        <Card className="rounded-2xl dark:bg-slate-800">
          <CardHeader className="pb-2">
            <p className="font-bold text-slate-800 dark:text-white">🔗 Link do Encurta.net</p>
            <p className="text-xs text-slate-500">Cole aqui o link encurtado que o botão "Continuar" irá abrir</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={config.link}
              onChange={e => setConfig(c => ({ ...c, link: e.target.value }))}
              placeholder="https://encurta.net/suavaga"
              className="rounded-xl"
            />
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-bold">📋 Como obter o link no Encurta.net:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li>Acesse <strong>encurta.net</strong> e crie uma conta gratuita</li>
                <li>Clique em <strong>"Novo Link"</strong> e cole o link original da vaga</li>
                <li>Escolha o tipo <strong>"Monetizado"</strong> (com propaganda)</li>
                <li>Copie o link encurtado gerado (ex: encurta.net/abc123)</li>
                <li>Cole o link encurtado no campo acima</li>
              </ol>
              <p className="mt-2 text-blue-600 dark:text-blue-400 font-medium">⚠️ O visitante verá um anúncio de ~10 segundos e depois será redirecionado para a vaga.</p>
            </div>
          </CardContent>
        </Card>

        {/* Textos editáveis */}
        <Card className="rounded-2xl dark:bg-slate-800">
          <CardHeader className="pb-2">
            <p className="font-bold text-slate-800 dark:text-white">✏️ Textos da Página</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Título principal</label>
              <Input
                value={config.titulo}
                onChange={e => setConfig(c => ({ ...c, titulo: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Subtítulo / explicação</label>
              <Textarea
                value={config.subtitulo}
                onChange={e => setConfig(c => ({ ...c, subtitulo: e.target.value }))}
                className="rounded-xl resize-none min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Texto do botão</label>
              <Input
                value={config.btn_texto}
                onChange={e => setConfig(c => ({ ...c, btn_texto: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Salvar */}
        <Button onClick={save} disabled={saving} className="w-full bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-2xl h-12 text-base font-bold gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}