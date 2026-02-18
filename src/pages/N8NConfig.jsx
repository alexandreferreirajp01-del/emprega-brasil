import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Copy, CheckCircle, ExternalLink, Code, 
  FileText, Image, Zap, AlertCircle, Link as LinkIcon, Key, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function N8NConfig() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        
        // Buscar a API Key real
        try {
          const response = await base44.functions.invoke('getApiKeyN8N');
          if (response.data.apiKey) {
            setApiKey(response.data.apiKey);
          }
        } catch (e) {
          console.error('Erro ao buscar API Key:', e);
        }
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'VAGASPB_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const newKey = generateApiKey();
      setApiKey(newKey);
      alert(`🔑 Nova API Key gerada!\n\nCopie e configure no Dashboard Base44:\n\nSecret: API_KEY_N8N\nValor: ${newKey}\n\n⚠️ Importante: Salve essa chave! Configure ela no dashboard para que funcione.`);
      copyToClipboard(newKey, 'new-key');
    } catch (error) {
      alert('❌ Erro ao gerar chave: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const baseUrl = 'https://vagasabertaspb.com.br';
  const textEndpoint = `${baseUrl}/api/functions/autoPostN8NText`;
  const imageEndpoint = `${baseUrl}/api/functions/autoPostN8NImage`;
  const homeOfficeEndpoint = `${baseUrl}/api/functions/autoPostN8NHomeOffice`;

  const endpoints = [
    {
      id: 'text',
      name: 'POST Texto',
      icon: FileText,
      color: 'blue',
      endpoint: textEndpoint,
      method: 'POST',
      description: 'Para vagas em formato de texto',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'VAGASPB_{{SUA_CHAVE_API}}'
      },
      body: {
        texto: "VAGA: Vendedor\nEmpresa: Loja XYZ\nCidade: João Pessoa - PB\nSalário: R$ 1.500\nContato: (83) 99999-9999",
        origem: "n8n_vagaspb",
        metadados: {
          grupo: "WhatsApp Vagas Abertas PB",
          canal: "whatsapp",
          dominio: "vagasabertaspb.com.br"
        }
      }
    },
    {
      id: 'image',
      name: 'POST Imagem',
      icon: Image,
      color: 'purple',
      endpoint: imageEndpoint,
      method: 'POST',
      description: 'Para vagas em imagem',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'VAGASPB_{{SUA_CHAVE_API}}'
      },
      body: {
        imagem_url: "https://exemplo.com/vaga.jpg",
        texto_adicional: "Vaga urgente",
        origem: "n8n_vagaspb",
        metadados: {
          grupo: "WhatsApp Vagas Abertas PB",
          dominio: "vagasabertaspb.com.br"
        }
      }
    },
    {
      id: 'homeoffice-text',
      name: 'POST Home Office — Texto (Premium)',
      icon: FileText,
      color: 'teal',
      endpoint: homeOfficeEndpoint,
      method: 'POST',
      description: 'Vaga remota enviada como TEXTO — marcada como Premium + Home Office',
      body: {
        tipo_mensagem: "texto",
        mensagem_texto: "VAGA HOME OFFICE: Desenvolvedor React\nEmpresa: Tech Remota\nSalário: R$ 5.000\nContato: vagas@techremota.com.br",
        canal: "whatsapp",
        grupo_nome: "Vagas Home Office PB",
        origem: "n8n_homeoffice"
      }
    },
    {
      id: 'homeoffice-image',
      name: 'POST Home Office — Imagem (Premium)',
      icon: Image,
      color: 'teal',
      endpoint: homeOfficeEndpoint,
      method: 'POST',
      description: 'Vaga remota enviada como IMAGEM — marcada como Premium + Home Office',
      body: {
        tipo_mensagem: "imagem",
        imagem_url: "https://exemplo.com/vaga-remota.jpg",
        canal: "whatsapp",
        grupo_nome: "Vagas Home Office PB",
        origem: "n8n_homeoffice"
      }
    }
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Configuração N8N</h1>
              <p className="text-white/80 text-sm">Automatize a criação de vagas via N8N</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="rounded-2xl border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Como Funcionar</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✅ Vagas são criadas automaticamente quando o N8N envia dados</li>
                  <li>✅ Você pode marcar como Premium ou Destaque depois pelo Gerenciador</li>
                  <li>✅ Vagas sem contato vão para status "pending_review"</li>
                  <li>✅ Use a API Key configurada no dashboard (secrets)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Info - CHAVE REAL */}
        <Card className="rounded-2xl border-l-4 border-amber-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                🔑 API Key - Configuração Real
              </div>
              <Button
                onClick={handleGenerateKey}
                disabled={generating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Gerar Nova Chave
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-bold text-amber-900 mb-2">Domínio oficial:</p>
              <code className="bg-white px-3 py-2 rounded text-sm font-bold text-amber-900 block">
                vagasabertaspb.com.br
              </code>
            </div>

            {apiKey ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                  ✅ Sua API Key (Valor Real - Copie e Use no N8N)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={apiKey}
                    readOnly
                    className="font-mono text-sm font-bold text-green-900 bg-white border-green-300"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey, 'api-key-real')}
                    className="border-green-300 hover:bg-green-100"
                    title="Copiar API Key"
                  >
                    {copied === 'api-key-real' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="text-xs font-bold text-blue-900 mb-1">💡 Como usar no N8N:</p>
                  <p className="text-xs text-blue-800">
                    1. Copie o valor acima (clique no ícone de copiar)<br/>
                    2. No N8N, adicione Header: <code className="bg-white px-2 py-1 rounded">X-API-Key</code><br/>
                    3. Cole exatamente o valor copiado (sem modificar)
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm font-bold text-red-900 mb-2">⚠️ API Key não encontrada</p>
                <p className="text-xs text-red-800">
                  Configure a secret <code className="bg-white px-2 py-1 rounded font-mono">API_KEY_N8N</code> no Dashboard Base44
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://app.base44.com', '_blank')}
                  className="mt-3 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoints */}
        {endpoints.map((endpoint) => {
          const Icon = endpoint.icon;
          return (
            <Card key={endpoint.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${endpoint.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${endpoint.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                      <p className="text-sm text-slate-500">{endpoint.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{endpoint.method}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* URL */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">URL do Endpoint</label>
                  <div className="flex gap-2">
                    <Input 
                      value={endpoint.endpoint} 
                      readOnly 
                      className="font-mono text-xs bg-slate-50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(endpoint.endpoint, `${endpoint.id}-url`)}
                    >
                      {copied === `${endpoint.id}-url` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Headers COM CHAVE REAL */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Headers (Valores Reais)</label>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-xs text-green-400 font-mono">
{JSON.stringify({
  'Content-Type': 'application/json',
  'X-API-Key': apiKey || '{{CONFIGURE_API_KEY_N8N_NO_DASHBOARD}}'
}, null, 2)}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify({
                      'Content-Type': 'application/json',
                      'X-API-Key': apiKey || '{{CONFIGURE_API_KEY_N8N}}'
                    }, null, 2), `${endpoint.id}-headers`)}
                    className="mt-2 w-full"
                  >
                    {copied === `${endpoint.id}-headers` ? (
                      <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" />Copiar Headers com API Key Real</>
                    )}
                  </Button>
                  {apiKey && (
                    <p className="text-xs text-green-600 mt-2">✅ Headers incluem sua API Key real e podem ser copiados diretamente</p>
                  )}
                </div>

                {/* Body Example */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo de Body (JSON)</label>
                  {endpoint.note && (
                    <div className="mb-2 bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-teal-800 mb-1">📝 Campo tipo_mensagem:</p>
                      <div className="space-y-1 text-xs text-teal-700">
                        <p><code className="bg-white px-1 rounded">"texto"</code> — envia apenas o campo <code className="bg-white px-1 rounded">mensagem_texto</code></p>
                        <p><code className="bg-white px-1 rounded">"imagem"</code> — envia apenas o campo <code className="bg-white px-1 rounded">imagem_url</code></p>
                        <p><code className="bg-white px-1 rounded">"texto_imagem"</code> — combina texto + imagem</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-xs text-cyan-400 font-mono overflow-x-auto">
{JSON.stringify(endpoint.body, null, 2)}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(endpoint.body, null, 2), `${endpoint.id}-body`)}
                    className="mt-2 w-full"
                  >
                    {copied === `${endpoint.id}-body` ? (
                      <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" />Copiar Body</>
                    )}
                  </Button>
                </div>

                {/* cURL Example COM CHAVE REAL */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo cURL (Com Chave Real)</label>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-xs text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST '${endpoint.endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey || '{{CONFIGURE_API_KEY_N8N}}'}' \\
  -d '${JSON.stringify(endpoint.body, null, 2)}'`}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`curl -X POST '${endpoint.endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Key: ${apiKey}' \\\n  -d '${JSON.stringify(endpoint.body, null, 2)}'`, `${endpoint.id}-curl`)}
                    className="mt-2 w-full"
                  >
                    {copied === `${endpoint.id}-curl` ? (
                      <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" />Copiar cURL Completo</>
                    )}
                  </Button>
                  {apiKey && (
                    <p className="text-xs text-green-600 mt-2">✅ Este cURL já inclui sua API Key real e pode ser testado diretamente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Instruções N8N - PASSO A PASSO COMPLETO */}
        <Card className="rounded-2xl border-l-4 border-green-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-600" />
              📚 Guia Completo: Passo a Passo N8N
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Passo 1 */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Crie/Abra seu Workflow no N8N</p>
                  <p className="text-slate-600 text-xs">Acesse https://app.n8n.cloud ou sua instância N8N</p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Adicione um Nó "HTTP Request"</p>
                  <p className="text-slate-600 text-xs mb-2">Clique no + e busque "HTTP Request"</p>
                  <div className="bg-slate-50 border rounded p-2 text-xs">
                    <p><strong>Authentication:</strong> None</p>
                    <p><strong>Request Method:</strong> POST</p>
                  </div>
                </div>
              </div>

              {/* Passo 3 - URL */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Configure a URL</p>
                  <p className="text-slate-600 text-xs mb-2">Cole um dos endpoints:</p>
                  <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs font-bold text-blue-900 mb-1">Para vagas em TEXTO:</p>
                      <code className="text-xs text-blue-800 break-all block">{textEndpoint}</code>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="text-xs font-bold text-purple-900 mb-1">Para vagas em IMAGEM:</p>
                      <code className="text-xs text-purple-800 break-all block">{imageEndpoint}</code>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded p-2">
                      <p className="text-xs font-bold text-teal-900 mb-1">🏠 Para vagas HOME OFFICE (Premium):</p>
                      <code className="text-xs text-teal-800 break-all block">{homeOfficeEndpoint}</code>
                      <p className="text-xs text-teal-700 mt-1">✅ Vagas criadas automaticamente como <strong>Premium + Remoto</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 4 - Headers COM CHAVE REAL */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-amber-700 font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-2">⚡ Configure os Headers (IMPORTANTE)</p>
                  <p className="text-slate-600 text-xs mb-3">No N8N, vá em "Headers" e adicione 2 headers:</p>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-50 border rounded p-3">
                      <p className="text-xs font-bold text-slate-700 mb-1">Header 1:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Name:</p>
                          <code className="bg-white px-2 py-1 rounded block mt-1">Content-Type</code>
                        </div>
                        <div>
                          <p className="text-slate-500">Value:</p>
                          <code className="bg-white px-2 py-1 rounded block mt-1">application/json</code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-2 border-green-300 rounded p-3">
                      <p className="text-xs font-bold text-green-900 mb-2">Header 2 (SUA API KEY REAL):</p>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <p className="text-green-700 font-medium mb-1">Name:</p>
                          <code className="bg-white px-2 py-1 rounded block border border-green-300">X-API-Key</code>
                        </div>
                        <div>
                          <p className="text-green-700 font-medium mb-1">Value (COPIE ESTE VALOR):</p>
                          {apiKey ? (
                            <div className="flex gap-1">
                              <code className="bg-white px-2 py-1 rounded flex-1 border-2 border-green-400 font-bold text-green-900 break-all">
                                {apiKey}
                              </code>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-green-300 hover:bg-green-100"
                                onClick={() => copyToClipboard(apiKey, `${endpoint.id}-api-key`)}
                              >
                                {copied === `${endpoint.id}-api-key` ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <code className="bg-red-50 px-2 py-1 rounded block border border-red-300 text-red-700">
                              Configure API_KEY_N8N no Dashboard
                            </code>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 5 - Body */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Configure o Body</p>
                  <p className="text-slate-600 text-xs mb-2">No N8N, em "Body":</p>
                  <div className="bg-slate-50 border rounded p-2 text-xs space-y-1">
                    <p>• Selecione <code className="bg-white px-2 py-1 rounded">JSON</code></p>
                    <p>• Cole o exemplo de body mostrado acima</p>
                  </div>
                </div>
              </div>

              {/* Passo 6 */}
              <div className="flex gap-3 border-b pb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  6
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Teste a Conexão</p>
                  <p className="text-slate-600 text-xs mb-2">No N8N, clique em "Test workflow"</p>
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                    <p className="text-green-800">✅ Resposta esperada: Status 200</p>
                    <p className="text-green-800">✅ Vagas criadas com sucesso</p>
                  </div>
                </div>
              </div>

              {/* Passo 7 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold">
                  7
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Ative o Workflow</p>
                  <p className="text-slate-600 text-xs">Após testar com sucesso, ative o workflow no N8N</p>
                  <p className="text-xs text-blue-700 mt-1">🎉 Pronto! Vagas serão criadas automaticamente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resposta Esperada */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resposta Esperada (Sucesso)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4">
              <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`{
  "success": true,
  "message": "3 vaga(s) criada(s) automaticamente via N8N",
  "vagas_criadas": 3,
  "origem": "n8n",
  "metadados": { ... },
  "vagas": [
    {
      "id": "abc123",
      "title": "Vendedor",
      "company": "Loja XYZ",
      "city": "João Pessoa",
      "state": "PB",
      "status": "ativa"
    }
  ]
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Erros Comuns */}
        <Card className="rounded-2xl border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Erros Comuns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">401 - API Key inválida ou ausente</code>
                <p className="text-slate-600 mt-1 text-xs">Verifique se o header X-API-Key está correto</p>
              </div>
              <div>
                <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">400 - Campo obrigatório faltando</code>
                <p className="text-slate-600 mt-1 text-xs">Certifique-se de enviar "texto" ou "imagem_url"</p>
              </div>
              <div>
                <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">500 - Erro interno</code>
                <p className="text-slate-600 mt-1 text-xs">Verifique os logs da função no dashboard Base44</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Dashboard */}
        <Card className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-6 text-center">
            <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 mb-2">Ver Logs e Testar</h3>
            <p className="text-sm text-slate-600 mb-4">
              Acesse o dashboard Base44 para ver logs das funções e testar manualmente
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://app.base44.com', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Dashboard Base44
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}