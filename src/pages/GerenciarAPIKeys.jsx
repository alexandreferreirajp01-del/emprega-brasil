import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Copy, CheckCircle, Key, Plus, Trash2, Eye, EyeOff,
  Code, Link as LinkIcon, AlertCircle, Zap, Info, ExternalLink, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GerenciarAPIKeys() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secrets, setSecrets] = useState([]);
  const [copied, setCopied] = useState('');
  const [showValues, setShowValues] = useState({});
  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const baseUrl = 'https://vagasabertaspb.com.br';

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
        loadSecrets();
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadSecrets = () => {
    // Secrets conhecidas do sistema
    const knownSecrets = [
      {
        name: 'API_KEY_N8N',
        description: 'Chave de API para automação N8N',
        usage: 'Header: X-API-Key: VAGASPB_[valor]',
        category: 'Automação'
      },
      {
        name: 'ZAPI_API_KEY',
        description: 'API Key do Z-API (WhatsApp)',
        usage: 'Integração com WhatsApp',
        category: 'Mensageria'
      },
      {
        name: 'ALLOW_INTERNAL_TEST',
        description: 'Flag para testes internos',
        usage: 'Desenvolvimento',
        category: 'Sistema'
      },
      {
        name: 'Notificação',
        description: 'Configuração de notificações',
        usage: 'Push notifications',
        category: 'Notificações'
      },
      {
        name: 'Notificação2',
        description: 'Configuração de notificações alternativa',
        usage: 'Push notifications',
        category: 'Notificações'
      }
    ];
    setSecrets(knownSecrets);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleShowValue = (secretName) => {
    setShowValues(prev => ({
      ...prev,
      [secretName]: !prev[secretName]
    }));
  };

  const handleCreateSecret = () => {
    if (!newSecret.name || !newSecret.value) {
      alert('Nome e valor são obrigatórios');
      return;
    }
    
    alert(`Para criar a secret "${newSecret.name}", acesse:\n\nDashboard Base44 → Settings → Secrets\n\nOu use o botão "Abrir Dashboard" abaixo.`);
    setIsCreating(false);
    setNewSecret({ name: '', value: '', description: '' });
  };

  const n8nEndpoints = [
    {
      name: 'POST Texto',
      endpoint: `${baseUrl}/api/functions/autoPostN8NText`,
      method: 'POST',
      description: 'Criar vagas via texto',
      example: {
        texto: "VAGA: Vendedor\\nEmpresa: Loja XYZ\\nCidade: João Pessoa - PB\\nSalário: R$ 1.500\\nContato: (83) 99999-9999",
        origem: "n8n_vagaspb",
        metadados: {
          grupo: "WhatsApp Vagas Abertas PB",
          canal: "whatsapp",
          dominio: "vagasabertaspb.com.br"
        }
      }
    },
    {
      name: 'POST Imagem',
      endpoint: `${baseUrl}/api/functions/autoPostN8NImage`,
      method: 'POST',
      description: 'Criar vagas via imagem',
      example: {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">API Keys & Secrets</h1>
              <p className="text-white/80 text-sm">Gerencie suas chaves de API e configurações</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Informações Importantes */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Domínio Oficial:</strong> {baseUrl}
            <br />
            <strong>Segurança:</strong> Nunca compartilhe suas API Keys. Use apenas em servidores seguros.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="secrets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="n8n">N8N Config</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          {/* Secrets */}
          <TabsContent value="secrets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-600" />
                    Secrets Configuradas
                  </CardTitle>
                  <Button onClick={() => setIsCreating(!isCreating)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Secret
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCreating && (
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-medium text-sm">Criar Nova Secret</h3>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Nome da Secret</Label>
                          <Input
                            value={newSecret.name}
                            onChange={(e) => setNewSecret(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="MINHA_API_KEY"
                            className="font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="password"
                            value={newSecret.value}
                            onChange={(e) => setNewSecret(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="sk_test_..."
                            className="font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição (Opcional)</Label>
                          <Textarea
                            value={newSecret.description}
                            onChange={(e) => setNewSecret(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Para que serve esta secret..."
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateSecret} size="sm" className="flex-1">
                            Instruções para Criar
                          </Button>
                          <Button onClick={() => setIsCreating(false)} variant="outline" size="sm">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {secrets.map((secret) => (
                  <Card key={secret.name} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-bold text-slate-800">{secret.name}</code>
                            {secret.category && (
                              <Badge variant="outline" className="text-xs">{secret.category}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{secret.description}</p>
                          {secret.usage && (
                            <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                              {secret.usage}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              type={showValues[secret.name] ? 'text' : 'password'}
                              value={showValues[secret.name] ? `[Valor configurado no Dashboard]` : '••••••••••••••'}
                              readOnly
                              className="font-mono text-xs h-8"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleShowValue(secret.name)}
                            >
                              {showValues[secret.name] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-sm">
                    <strong>Importante:</strong> Os valores reais das secrets são armazenados de forma segura no Dashboard Base44.
                    Esta interface permite visualizar configurações, mas não os valores sensíveis.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Acesso ao Dashboard */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
              <CardContent className="p-6 text-center">
                <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 mb-2">Gerenciar no Dashboard Base44</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Para criar, editar ou deletar secrets, acesse o Dashboard oficial
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
          </TabsContent>

          {/* N8N Config */}
          <TabsContent value="n8n" className="space-y-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">Automação N8N</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Use estes endpoints para criar vagas automaticamente via N8N
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Header Obrigatório:</p>
                      <code className="text-xs text-blue-800">X-API-Key: VAGASPB_[valor_da_API_KEY_N8N]</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {n8nEndpoints.map((endpoint) => (
              <Card key={endpoint.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <Badge variant="outline">{endpoint.method}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Endpoint URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={endpoint.endpoint} 
                        readOnly 
                        className="font-mono text-xs bg-slate-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(endpoint.endpoint, `${endpoint.name}-url`)}
                      >
                        {copied === `${endpoint.name}-url` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Descrição</Label>
                    <p className="text-sm text-slate-600">{endpoint.description}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo de Body (JSON)</Label>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <pre className="text-xs text-cyan-400 font-mono overflow-x-auto">
{JSON.stringify(endpoint.example, null, 2)}
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(endpoint.example, null, 2), `${endpoint.name}-body`)}
                      className="mt-2 w-full"
                    >
                      {copied === `${endpoint.name}-body` ? (
                        <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Copiado!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-2" />Copiar Body</>
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">Exemplo cURL</Label>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <pre className="text-xs text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST '${endpoint.endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: VAGASPB_{{SUA_CHAVE}}' \\
  -d '${JSON.stringify(endpoint.example, null, 2)}'`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Documentação */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
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
                      <p className="text-slate-600 text-xs">URL: Cole o endpoint da aba "N8N Config"</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Adicione os Headers</p>
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
                      <p className="text-slate-600 text-xs mt-1">Use os exemplos da aba "N8N Config"</p>
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

            <Card className="border-l-4 border-red-500">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}