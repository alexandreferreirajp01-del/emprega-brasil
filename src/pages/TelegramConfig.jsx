import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Bot, Webhook, CheckCircle2, XCircle,
  Loader2, RefreshCw, Trash2, Info, Copy, ExternalLink,
  AlertTriangle, Send, Settings
} from "lucide-react";
import { toast } from "sonner";

const FUNCTION_WEBHOOK_URL = `${window.location.origin.replace('3000', '443')}`; // placeholder

export default function TelegramConfig() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botInfo, setBotInfo] = useState(null);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [loadingBot, setLoadingBot] = useState(false);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showManual, setShowManual] = useState(false);

  // URL automática da função telegramWebhook (Base44 pattern)
  const appId = window.location.hostname.split('.')[0];
  const suggestedWebhookUrl = `https://api.base44.com/api/apps/${appId}/functions/telegramWebhook`;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const hasAccess = currentUser?.role === 'admin' ||
          currentUser?.email === 'alexandreferreirajp01@gmail.com' ||
          currentUser?.subscription_type === 'admin';
        if (!hasAccess) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        fetchBotInfo();
        fetchWebhookInfo();
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchBotInfo = async () => {
    setLoadingBot(true);
    try {
      const res = await base44.functions.invoke('telegramConfig', { action: 'get_bot_info' });
      setBotInfo(res.data);
    } catch (e) {
      toast.error('Erro ao buscar info do bot: ' + e.message);
    } finally {
      setLoadingBot(false);
    }
  };

  const fetchWebhookInfo = async () => {
    setLoadingWebhook(true);
    try {
      const res = await base44.functions.invoke('telegramConfig', { action: 'get_webhook_info' });
      setWebhookInfo(res.data);
      if (res.data?.result?.url) {
        setCustomUrl(res.data.result.url);
      }
    } catch (e) {
      toast.error('Erro ao buscar status do webhook: ' + e.message);
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleSetWebhook = async () => {
    const url = customUrl.trim();
    if (!url) return toast.error('Informe a URL do webhook');
    setSettingWebhook(true);
    try {
      const res = await base44.functions.invoke('telegramConfig', {
        action: 'set_webhook',
        webhook_url: url
      });
      if (res.data?.result === true || res.data?.ok === true) {
        toast.success('✅ Webhook registrado com sucesso!');
        fetchWebhookInfo();
      } else {
        toast.error('Erro: ' + (res.data?.description || 'Resposta inesperada'));
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm('Remover o webhook? O bot vai parar de receber mensagens.')) return;
    try {
      const res = await base44.functions.invoke('telegramConfig', { action: 'delete_webhook' });
      if (res.data?.ok) {
        toast.success('Webhook removido!');
        setWebhookInfo(null);
        setCustomUrl('');
        fetchWebhookInfo();
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const webhookUrl = webhookInfo?.result?.url;
  const webhookActive = !!webhookUrl;
  const webhookErrors = webhookInfo?.result?.last_error_message;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2CA5E0] to-[#1a85c0] pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Configuração do Bot Telegram</h1>
              <p className="text-white/80 text-sm">Gerencie o webhook e monitore o status do bot</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-4">

        {/* Bot Info */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="w-5 h-5 text-[#2CA5E0]" />
              Informações do Bot
              <Button variant="ghost" size="icon" onClick={fetchBotInfo} className="ml-auto h-8 w-8">
                <RefreshCw className={`w-4 h-4 ${loadingBot ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBot ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : botInfo?.ok ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-14 h-14 bg-[#2CA5E0]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-8 h-8 text-[#2CA5E0]" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-white text-lg">
                    {botInfo.result.first_name}
                  </p>
                  <p className="text-slate-500 text-sm">@{botInfo.result.username}</p>
                  <p className="text-xs text-slate-400">ID: {botInfo.result.id}</p>
                  <Badge className="bg-green-100 text-green-700">✅ Bot ativo e conectado</Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">
                  {botInfo?.description || 'Token inválido ou não configurado. Verifique o secret TELEGRAM_BOT_TOKEN.'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Status */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="w-5 h-5 text-purple-600" />
              Status do Webhook
              <Button variant="ghost" size="icon" onClick={fetchWebhookInfo} className="ml-auto h-8 w-8">
                <RefreshCw className={`w-4 h-4 ${loadingWebhook ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingWebhook ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {webhookActive ? (
                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Webhook ativo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Nenhum webhook configurado
                    </Badge>
                  )}
                </div>

                {webhookActive && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">URL atual:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all flex-1">
                        {webhookUrl}
                      </p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyToClipboard(webhookUrl)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {webhookInfo?.result?.pending_update_count > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⏳ {webhookInfo.result.pending_update_count} mensagens pendentes na fila
                      </p>
                    )}
                  </div>
                )}

                {webhookErrors && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700">Último erro:</p>
                      <p className="text-xs text-red-600">{webhookErrors}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Configurar Webhook */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurar Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Instrução de como obter a URL */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Como obter a URL da função</p>
              </div>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>No painel da Base44, clique em <strong>Code</strong> no menu lateral</li>
                <li>Clique em <strong>Functions</strong></li>
                <li>Clique na função <strong>telegramWebhook</strong></li>
                <li>Copie o <strong>Endpoint URL</strong> exibido na página</li>
                <li>Cole no campo abaixo e clique em <strong>Registrar Webhook</strong></li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                URL da função <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">telegramWebhook</code>
              </label>
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://api.base44.com/api/apps/.../functions/telegramWebhook"
                className="font-mono text-sm rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSetWebhook}
                disabled={settingWebhook || !customUrl.trim()}
                className="bg-[#2CA5E0] hover:bg-[#1a85c0] rounded-xl flex-1"
              >
                {settingWebhook ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Registrar Webhook
              </Button>
              {webhookActive && (
                <Button
                  onClick={handleDeleteWebhook}
                  variant="outline"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual alternativo */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-slate-500" />
                Registrar manualmente pelo navegador
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowManual(!showManual)} className="text-xs">
                {showManual ? 'Ocultar' : 'Mostrar'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showManual && (
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Se preferir, você pode registrar o webhook manualmente copiando o link abaixo, substituindo os campos e abrindo no seu navegador:
              </p>
              <div className="bg-slate-800 rounded-xl p-4 relative">
                <code className="text-green-400 text-xs break-all">
                  https://api.telegram.org/bot<span className="text-yellow-300">[SEU_TOKEN]</span>/setWebhook?url=<span className="text-cyan-300">[URL_DA_FUNÇÃO_telegramWebhook]</span>
                </code>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>Substitua:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><span className="text-yellow-600 font-mono font-bold">[SEU_TOKEN]</span> → Seu TELEGRAM_BOT_TOKEN (obtido do BotFather)</li>
                  <li><span className="text-cyan-600 font-mono font-bold">[URL_DA_FUNÇÃO_telegramWebhook]</span> → A URL do endpoint da função</li>
                </ul>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mt-3">
                  <p className="text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Nunca compartilhe seu token com ninguém!
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Passo a passo BotFather */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="w-5 h-5 text-[#2CA5E0]" />
              Configurar privacidade do bot no BotFather
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Para que o bot leia <strong>todas</strong> as mensagens em grupos (não apenas menções), você precisa desativar o modo de privacidade:
            </p>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {[
                'Abra o Telegram e procure por @BotFather',
                'Envie o comando /mybots',
                'Selecione o seu bot na lista',
                'Clique em "Bot Settings"',
                'Clique em "Group Privacy"',
                'Clique em "Turn OFF" para desativar a privacidade',
                'O status deve mostrar: "Group privacy is currently DISABLED"',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#2CA5E0]/10 text-[#2CA5E0] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#2CA5E0] hover:underline mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir BotFather no Telegram
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}