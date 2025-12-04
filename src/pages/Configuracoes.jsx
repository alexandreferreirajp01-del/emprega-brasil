import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Loader2, BookOpen, Key, Users, Database, BarChart3, 
  Globe, Plug, Shield, Code, Bot, FileText, Settings, 
  ChevronDown, ChevronRight, CheckCircle, ExternalLink, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import BibliotecaManager from "@/components/admin/BibliotecaManager";

const base44MenuItems = [
  {
    id: 'overview',
    name: 'Overview',
    icon: BarChart3,
    description: 'Visão geral do aplicativo',
    steps: ['Veja estatísticas gerais', 'Número de usuários e visitas', 'Status geral do app']
  },
  {
    id: 'users',
    name: 'Users',
    icon: Users,
    description: 'Gerenciar usuários',
    steps: ['Clique em "Users" no menu', 'Veja todos os usuários', 'Edite dados ou convide novos'],
    important: 'Apenas admins podem gerenciar'
  },
  {
    id: 'data',
    name: 'Data',
    icon: Database,
    description: 'Gerenciar dados',
    steps: ['Clique em "Data"', 'Veja todas as entidades', 'Adicione ou edite registros'],
    subItems: ['User', 'Job', 'FeedPost', 'MensagemDireta', 'PremiumCode']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    description: 'Estatísticas e métricas',
    steps: ['Veja métricas de uso', 'Gráficos de visitas', 'Dados de performance']
  },
  {
    id: 'domains',
    name: 'Domains',
    icon: Globe,
    description: 'Domínio personalizado',
    steps: ['Clique em "Domains"', 'Adicione seu domínio', 'Configure DNS no provedor'],
    important: 'Requer plano pago Base44'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Plug,
    description: 'Serviços externos',
    steps: ['Veja integrações disponíveis', 'Ative as que precisar', 'Configure cada uma'],
    subItems: ['Email', 'Push Notifications', 'WhatsApp']
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Segurança',
    steps: ['Configure autenticação', 'Defina regras de acesso', 'Configure RLS nas entidades'],
    important: 'RLS define quem pode ver/editar registros'
  },
  {
    id: 'code',
    name: 'Code',
    icon: Code,
    description: 'Código fonte',
    steps: ['Veja páginas e componentes', 'Edite funções backend', 'Gerencie entidades'],
    subItems: ['Pages', 'Components', 'Functions', 'Entities']
  },
  {
    id: 'agents',
    name: 'Agents (Beta)',
    icon: Bot,
    description: 'Agentes de IA',
    steps: ['Crie agentes de IA', 'Configure prompts', 'Conecte a entidades']
  },
  {
    id: 'logs',
    name: 'Logs',
    icon: FileText,
    description: 'Registros',
    steps: ['Veja logs de erros', 'Debug de problemas', 'Filtre por data']
  },
  {
    id: 'api',
    name: 'API',
    icon: Code,
    description: 'Documentação API',
    steps: ['Veja endpoints', 'Copie exemplos', 'Integre com outros sistemas']
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'Configurações',
    steps: ['Nome e ícone do app', 'Configure PWA', 'Tema e cores'],
    subItems: ['General', 'PWA', 'Theme']
  },
  {
    id: 'secrets',
    name: 'Secrets',
    icon: Key,
    description: 'Chaves secretas',
    steps: ['Adicione chaves de API', 'Ex: STRIPE_API_KEY', 'Usadas nas funções backend'],
    important: 'NUNCA exponha no frontend!'
  }
];

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
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
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-[#0056ff]'} text-white`}>
          {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-700 to-slate-800 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
          <p className="text-white/70">Gerencie biblioteca e painel Base44</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="biblioteca" className="space-y-6">
          <TabsList className="w-full bg-white shadow rounded-xl p-1 grid grid-cols-2">
            <TabsTrigger value="biblioteca" className="rounded-lg text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />Biblioteca
            </TabsTrigger>
            <TabsTrigger value="base44" className="rounded-lg text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Key className="w-4 h-4 mr-2" />Painel Base44
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biblioteca">
            <BibliotecaManager showToast={showToast} />
          </TabsContent>

          <TabsContent value="base44" className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">📚 Guia do Painel Base44</h2>
              <p className="text-purple-100 text-sm">Aprenda a usar cada função do painel de administração</p>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm">Acessar Painel Base44</p>
                      <p className="text-xs text-blue-600">app.base44.com</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-blue-300 text-blue-700 text-sm" onClick={() => window.open('https://app.base44.com', '_blank')}>
                    Abrir Painel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {base44MenuItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <button onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)} className="w-full text-left">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <p className="text-xs text-slate-500">{item.description}</p>
                          </div>
                        </div>
                        {expandedItem === item.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </div>
                    </CardHeader>
                  </button>

                  {expandedItem === item.id && (
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="ml-12 pl-3 border-l-2 border-slate-200 space-y-3">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700 text-xs">📋 Passo a passo:</p>
                          {item.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">{idx + 1}</div>
                              <p className="text-xs text-slate-600">{step}</p>
                            </div>
                          ))}
                        </div>

                        {item.subItems && (
                          <div className="space-y-1">
                            <p className="font-medium text-slate-700 text-xs">📁 Itens:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.subItems.map((sub, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] bg-slate-50">{sub}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.important && (
                          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <Info className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800">{item.important}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800 flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5" />Dicas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-green-800">• Use <strong>Data</strong> para ver/editar registros</p>
                <p className="text-xs text-green-800">• Use <strong>Users</strong> para promover usuários</p>
                <p className="text-xs text-green-800">• Use <strong>Logs</strong> para debugar erros</p>
                <p className="text-xs text-green-800">• Use <strong>Secrets</strong> para chaves de API</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5 text-purple-600" />Sobre Permissões (RLS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-600">RLS define <strong>quem pode ver/editar</strong> cada registro.</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-[10px] text-green-400 whitespace-pre-wrap">
{`// Permitir leitura para todos:
"rls": { "read": {} }

// Apenas o próprio usuário:
"rls": { "read": { "created_by": "{{user.email}}" } }

// Apenas admins:
"rls": { "delete": { "user_condition": { "role": "admin" } } }`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}