import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Copy, CheckCircle, ExternalLink, Code, 
  FileText, Image, Zap, AlertCircle, Link as LinkIcon, Key
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function N8NConfig() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

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

  const baseUrl = 'https://vagasabertaspb.com.br';
  const textEndpoint = `${baseUrl}/api/functions/autoPostN8NText`;
  const imageEndpoint = `${baseUrl}/api/functions/autoPostN8NImage`;

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

        {/* API Key Info */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Domínio oficial: <code className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">vagasabertaspb.com.br</code>
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Sua API Key está configurada no sistema. Use o formato: <code className="bg-slate-100 px-2 py-1 rounded text-xs">VAGASPB_[sua_chave]</code>
            </p>
            <p className="text-sm text-slate-600 mt-2">
              No N8N, adicione header: <code className="bg-slate-100 px-2 py-1 rounded text-xs">X-API-Key: VAGASPB_[valor da API_KEY_N8N]</code>
            </p>
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

                {/* Headers */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Headers</label>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-xs text-green-400 font-mono">
{JSON.stringify(endpoint.headers, null, 2)}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(endpoint.headers, null, 2), `${endpoint.id}-headers`)}
                    className="mt-2 w-full"
                  >
                    {copied === `${endpoint.id}-headers` ? (
                      <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" />Copiar Headers</>
                    )}
                  </Button>
                </div>

                {/* Body Example */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo de Body (JSON)</label>
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

                {/* cURL Example */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo cURL</label>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-xs text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST '${endpoint.endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: VAGASPB_{{SUA_CHAVE_API}}' \\
  -d '${JSON.stringify(endpoint.body, null, 2)}'`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Instruções N8N */}
        <Card className="rounded-2xl border-l-4 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-600" />
              Como Configurar no N8N
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Adicione um nó HTTP Request</p>
                  <p className="text-slate-600 text-xs">No seu workflow N8N, adicione um nó "HTTP Request"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Configure o Método e URL</p>
                  <p className="text-slate-600 text-xs">Method: <code className="bg-slate-100 px-1 rounded">POST</code></p>
                  <p className="text-slate-600 text-xs">URL: Cole o endpoint acima (texto ou imagem)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Adicione os Headers</p>
                  <p className="text-slate-600 text-xs">Em "Headers" → Add Header:</p>
                  <ul className="text-xs text-slate-600 ml-4 mt-1 space-y-1">
                    <li>• <code className="bg-slate-100 px-1 rounded">Content-Type: application/json</code></li>
                    <li>• <code className="bg-slate-100 px-1 rounded">X-API-Key: VAGASPB_[sua_chave]</code></li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Configure o Body</p>
                  <p className="text-slate-600 text-xs">Body Type: <code className="bg-slate-100 px-1 rounded">JSON</code></p>
                  <p className="text-slate-600 text-xs mt-1">Use os exemplos de body acima</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  5
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Teste a Conexão</p>
                  <p className="text-slate-600 text-xs">Execute o workflow e verifique se a vaga foi criada</p>
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