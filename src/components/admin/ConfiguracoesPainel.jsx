import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Database, BarChart3, Globe, Plug, Shield, Code, 
  Bot, FileText, Settings, Key, ChevronDown, ChevronRight,
  CheckCircle, Circle, ExternalLink, Copy, Info
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const menuItems = [
  {
    id: 'overview',
    name: 'Overview',
    icon: BarChart3,
    description: 'Visão geral do seu aplicativo',
    steps: [
      'Aqui você vê estatísticas gerais do app',
      'Número de usuários, visitas e uso',
      'Status geral do aplicativo'
    ]
  },
  {
    id: 'users',
    name: 'Users',
    icon: Users,
    description: 'Gerenciar usuários do app',
    steps: [
      'Clique em "Users" no menu lateral',
      'Veja todos os usuários cadastrados',
      'Clique em um usuário para editar seus dados',
      'Você pode alterar: nome, email, role (admin/user)',
      'Para convidar novo usuário: clique em "Invite User"'
    ],
    important: 'Apenas admins podem gerenciar usuários'
  },
  {
    id: 'data',
    name: 'Data',
    icon: Database,
    description: 'Gerenciar entidades e dados',
    steps: [
      'Clique em "Data" no menu lateral',
      'Veja todas as entidades (tabelas) do app',
      'Clique em uma entidade para ver/editar registros',
      'Use "Add Record" para criar novo registro',
      'Use os filtros para buscar dados específicos'
    ],
    subItems: [
      { name: 'User', desc: 'Usuários do sistema' },
      { name: 'Job', desc: 'Vagas de emprego' },
      { name: 'FeedPost', desc: 'Posts da comunidade' },
      { name: 'MensagemDireta', desc: 'Mensagens entre usuários' },
      { name: 'PremiumCode', desc: 'Códigos de ativação premium' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    description: 'Estatísticas e métricas',
    steps: [
      'Veja métricas de uso do app',
      'Gráficos de visitas e engajamento',
      'Dados de performance'
    ]
  },
  {
    id: 'domains',
    name: 'Domains',
    icon: Globe,
    description: 'Configurar domínio personalizado',
    steps: [
      'Clique em "Domains"',
      'Clique em "Add Domain"',
      'Digite seu domínio (ex: vagasabertasparaiba.com)',
      'Copie os registros DNS mostrados',
      'Configure no seu provedor de domínio (Registro.br, GoDaddy, etc)',
      'Aguarde propagação DNS (até 48h)'
    ],
    important: 'Requer plano pago do Base44'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Plug,
    description: 'Conectar serviços externos',
    steps: [
      'Clique em "Integrations"',
      'Veja integrações disponíveis',
      'Para ativar: clique na integração desejada',
      'Siga as instruções de configuração'
    ],
    subItems: [
      { name: 'Email', desc: 'Envio de emails automáticos' },
      { name: 'Push Notifications', desc: 'Notificações no navegador' },
      { name: 'WhatsApp', desc: 'Integração com WhatsApp' }
    ]
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Configurações de segurança',
    steps: [
      'Clique em "Security"',
      'Configure autenticação (login)',
      'Defina regras de acesso',
      'Configure RLS (Row Level Security) nas entidades'
    ],
    important: 'RLS define quem pode ver/editar cada registro'
  },
  {
    id: 'code',
    name: 'Code',
    icon: Code,
    description: 'Código fonte e funções',
    steps: [
      'Clique em "Code"',
      'Veja todas as páginas, componentes e funções',
      'Páginas: telas do app',
      'Components: partes reutilizáveis',
      'Functions: código backend (APIs)',
      'Entities: estrutura dos dados'
    ],
    subItems: [
      { name: 'Pages', desc: 'Telas do aplicativo' },
      { name: 'Components', desc: 'Componentes reutilizáveis' },
      { name: 'Functions', desc: 'Funções backend' },
      { name: 'Entities', desc: 'Modelos de dados' }
    ]
  },
  {
    id: 'agents',
    name: 'Agents (Beta)',
    icon: Bot,
    description: 'Agentes de IA',
    steps: [
      'Clique em "Agents"',
      'Crie agentes de IA para automatizar tarefas',
      'Configure prompts e comportamentos',
      'Conecte a entidades do app'
    ]
  },
  {
    id: 'logs',
    name: 'Logs',
    icon: FileText,
    description: 'Registros de atividade',
    steps: [
      'Clique em "Logs"',
      'Veja logs de erros e atividades',
      'Útil para debugar problemas',
      'Filtre por data ou tipo de log'
    ]
  },
  {
    id: 'api',
    name: 'API',
    icon: Code,
    description: 'Documentação da API',
    steps: [
      'Clique em "API"',
      'Veja endpoints disponíveis',
      'Copie exemplos de código',
      'Use para integrar com outros sistemas'
    ]
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'Configurações gerais',
    steps: [
      'Clique em "Settings"',
      'Configure nome do app',
      'Defina ícone e cores',
      'Configure PWA (instalação no celular)',
      'Outras configurações gerais'
    ],
    subItems: [
      { name: 'General', desc: 'Nome, descrição, ícone' },
      { name: 'PWA', desc: 'App instalável no celular' },
      { name: 'Theme', desc: 'Cores e aparência' }
    ]
  },
  {
    id: 'secrets',
    name: 'Secrets',
    icon: Key,
    description: 'Chaves e senhas secretas',
    steps: [
      'Clique em "Secrets"',
      'Adicione chaves de API aqui',
      'Ex: STRIPE_API_KEY, OPENAI_KEY',
      'Nunca compartilhe essas chaves!',
      'São usadas nas funções backend'
    ],
    important: 'NUNCA exponha secrets no código frontend!'
  }
];

export default function ConfiguracoesPainel() {
  const [expandedItem, setExpandedItem] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📚 Guia de Configuração do Base44</h2>
        <p className="text-purple-100">
          Aprenda a usar cada função do painel de administração
        </p>
      </div>

      {/* Link para o painel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Acessar Painel Base44</p>
                <p className="text-sm text-blue-600">app.base44.com</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-blue-300 text-blue-700"
              onClick={() => window.open('https://app.base44.com', '_blank')}
            >
              Abrir Painel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <button
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              className="w-full text-left"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  {expandedItem === item.id ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
            </button>

            {expandedItem === item.id && (
              <CardContent className="pt-0 pb-4">
                <div className="ml-13 pl-4 border-l-2 border-slate-200 space-y-4">
                  {/* Passo a passo */}
                  <div className="space-y-2">
                    <p className="font-medium text-slate-700 text-sm">📋 Passo a passo:</p>
                    {item.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sub-items */}
                  {item.subItems && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700 text-sm">📁 Itens disponíveis:</p>
                      <div className="grid gap-2">
                        {item.subItems.map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <Circle className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-sm text-slate-700">{sub.name}</span>
                            <span className="text-xs text-slate-500">- {sub.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Importante */}
                  {item.important && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{item.important}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Dicas Rápidas */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Dicas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">1</Badge>
            <p className="text-sm text-green-800">Use <strong>Data</strong> para ver e editar registros diretamente</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">2</Badge>
            <p className="text-sm text-green-800">Use <strong>Users</strong> para promover usuários a admin</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">3</Badge>
            <p className="text-sm text-green-800">Use <strong>Logs</strong> quando algo não funcionar</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">4</Badge>
            <p className="text-sm text-green-800">Use <strong>Secrets</strong> para guardar chaves de API com segurança</p>
          </div>
        </CardContent>
      </Card>

      {/* Permissões RLS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Sobre Permissões (RLS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            RLS (Row Level Security) define <strong>quem pode ver/editar cada registro</strong> nas entidades.
          </p>
          
          <div className="space-y-2">
            <p className="font-medium text-sm">Como configurar:</p>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                Vá em <strong>Code → Entities</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                Clique na entidade desejada
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                Edite o JSON da entidade
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                Adicione/edite a seção "rls"
              </li>
            </ol>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-green-400">
{`// Exemplo de RLS - Permitir leitura para todos:
"rls": {
  "read": {}  // Vazio = todos podem ler
}

// Apenas o próprio usuário pode ler:
"rls": {
  "read": {
    "created_by": "{{user.email}}"
  }
}

// Apenas admins podem deletar:
"rls": {
  "delete": {
    "user_condition": {
      "role": "admin"
    }
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}