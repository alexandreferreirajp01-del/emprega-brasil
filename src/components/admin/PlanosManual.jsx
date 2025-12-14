import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, DollarSign, Crown, Sparkles, Tag, Palette, 
  MessageCircle, CheckCircle, Info, Code
} from "lucide-react";

export default function PlanosManual() {
  return (
    <div className="space-y-6">
      {/* Introdução */}
      <Card className="rounded-2xl border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BookOpen className="w-5 h-5" />
            Manual do Gerenciador de Planos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <p>
            Este gerenciador permite criar, editar e excluir planos de assinatura de forma totalmente dinâmica. 
            Todas as alterações são refletidas automaticamente nas páginas de assinatura, banners promocionais e mensagens do WhatsApp.
          </p>
        </CardContent>
      </Card>

      {/* Campos do Formulário */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Campos do Formulário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* ID do Plano */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">ID do Plano</h4>
              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Identificador único do plano. Use apenas letras minúsculas, números e underline (_).
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 mb-1"><strong>Exemplos:</strong></p>
              <p className="text-xs font-mono text-slate-600">• premium_monthly</p>
              <p className="text-xs font-mono text-slate-600">• black_vip</p>
              <p className="text-xs font-mono text-slate-600">• recruiter_pro</p>
            </div>
            <p className="text-xs text-amber-600 mt-2">⚠️ Não pode ser alterado após criar o plano</p>
          </div>

          {/* Nome */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Nome</h4>
              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Nome do plano que será exibido aos usuários em todas as páginas.
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 mb-1"><strong>Exemplos:</strong></p>
              <p className="text-xs font-mono text-slate-600">• Premium Mensal</p>
              <p className="text-xs font-mono text-slate-600">• Premium Black Vitalício</p>
              <p className="text-xs font-mono text-slate-600">• Recrutador Pro</p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Descrição</h4>
            <p className="text-sm text-slate-600 mb-2">
              Descrição curta que aparece abaixo do nome do plano.
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 mb-1"><strong>Exemplos:</strong></p>
              <p className="text-xs font-mono text-slate-600">• Completo e mensal</p>
              <p className="text-xs font-mono text-slate-600">• Pagamento único vitalício</p>
              <p className="text-xs font-mono text-slate-600">• Para empresas e RH</p>
            </div>
          </div>

          {/* Preço */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Preço (R$)</h4>
              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Valor do plano em reais. Use ponto para decimais.
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 mb-1"><strong>Exemplos:</strong></p>
              <p className="text-xs font-mono text-slate-600">• 9.90 (nove reais e noventa centavos)</p>
              <p className="text-xs font-mono text-slate-600">• 29.90 (vinte e nove reais e noventa centavos)</p>
              <p className="text-xs font-mono text-slate-600">• 0 (para planos gratuitos)</p>
            </div>
          </div>

          {/* Ciclo de Cobrança */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Ciclo de Cobrança</h4>
            <p className="text-sm text-slate-600 mb-2">
              Define como o plano é cobrado.
            </p>
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Mensal</p>
                <p className="text-xs text-blue-700">Cobrança recorrente todo mês (R$ X/mês)</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-900 mb-1">Vitalício</p>
                <p className="text-xs text-purple-700">Pagamento único sem renovação (Pagamento único)</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-900 mb-1">Gratuito</p>
                <p className="text-xs text-green-700">Sem cobrança (GRÁTIS)</p>
              </div>
            </div>
          </div>

          {/* Ícone */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Ícone</h4>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Ícone visual que representa o plano.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-mono">Crown (Coroa)</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-mono">Sparkles (Estrelas)</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-mono">Briefcase (Maleta)</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-green-600" />
                <span className="text-xs font-mono">Users (Usuários)</span>
              </div>
            </div>
          </div>

          {/* Cor (Gradiente) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Cor (Gradiente)</h4>
              <Badge className="bg-amber-100 text-amber-800 text-xs">Importante</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Define as cores do gradiente do plano. Use o formato Tailwind CSS.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Formato:</p>
                <p className="text-xs font-mono text-slate-600 bg-white p-2 rounded border">
                  from-[cor1]-[intensidade] to-[cor2]-[intensidade]
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Exemplos de cores:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded"></div>
                    <p className="text-xs font-mono">from-blue-600 to-blue-700</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded"></div>
                    <p className="text-xs font-mono">from-purple-600 to-purple-700</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-slate-900 to-black rounded"></div>
                    <p className="text-xs font-mono">from-slate-900 to-black</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded"></div>
                    <p className="text-xs font-mono">from-green-600 to-green-700</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded"></div>
                    <p className="text-xs font-mono">from-orange-600 to-orange-700</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded"></div>
                    <p className="text-xs font-mono">from-red-600 to-red-700</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Cores disponíveis:</p>
                <p className="text-xs text-slate-600">
                  slate, gray, zinc, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Intensidades disponíveis:</p>
                <p className="text-xs text-slate-600">
                  50, 100, 200, 300, 400, 500, 600, 700, 800, 900
                </p>
                <p className="text-xs text-slate-500 mt-1">💡 Use 600-700 para cores vibrantes e profissionais</p>
              </div>
            </div>
          </div>

          {/* Características */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Características</h4>
            <p className="text-sm text-slate-600 mb-2">
              Lista de benefícios do plano. Digite uma característica por linha.
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 mb-1"><strong>Exemplo:</strong></p>
              <div className="text-xs font-mono text-slate-600 space-y-1">
                <p>Acesso a vagas exclusivas</p>
                <p>Suporte prioritário 24/7</p>
                <p>Ferramentas profissionais completas</p>
                <p>Análise de currículo por IA</p>
                <p>Alertas personalizados de vagas</p>
              </div>
            </div>
          </div>

          {/* Mensagem WhatsApp */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Mensagem WhatsApp</h4>
              <Badge className="bg-green-100 text-green-800 text-xs">Dinâmica</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Mensagem que será enviada quando o usuário clicar em assinar. Use variáveis para substituição automática.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Variáveis disponíveis:</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Code className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-mono text-blue-700">{'{'}nome{'}'}</p>
                      <p className="text-xs text-slate-600">Substitui pelo nome do plano</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Code className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-mono text-blue-700">{'{'}preco{'}'}</p>
                      <p className="text-xs text-slate-600">Substitui pelo preço formatado (R$ XX,XX)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Exemplo:</p>
                <div className="bg-white p-2 rounded border text-xs font-mono text-slate-700">
                  Olá! Quero assinar o plano {'{'}nome{'}'} por {'{'}preco{'}'} no aplicativo Vagas Abertas Paraíba.
                </div>
                <p className="text-xs text-slate-500 mt-1">↓ Resultado final:</p>
                <div className="bg-green-50 p-2 rounded border border-green-200 text-xs text-green-800">
                  Olá! Quero assinar o plano Premium Mensal por R$9,90 no aplicativo Vagas Abertas Paraíba.
                </div>
              </div>
            </div>
          </div>

          {/* Texto e Cor do Badge */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-slate-600" />
              <h4 className="font-semibold text-slate-800">Badge (Selo)</h4>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Badge opcional que aparece no canto do card do plano para destacá-lo.
            </p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Texto do Badge:</p>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-2">Exemplos de textos:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-yellow-400 text-yellow-900">Popular</Badge>
                    <Badge className="bg-red-500 text-white">Limitado</Badge>
                    <Badge className="bg-blue-500 text-white">Novo</Badge>
                    <Badge className="bg-green-500 text-white">Melhor Valor</Badge>
                    <Badge className="bg-purple-500 text-white">Exclusivo</Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Cor do Badge:</p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-slate-600 mb-2">Use o formato: <span className="font-mono">bg-[cor]-[intensidade] text-[cor]-[intensidade]</span></p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-400 text-yellow-900">Exemplo</Badge>
                      <p className="text-xs font-mono">bg-yellow-400 text-yellow-900</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500 text-white">Exemplo</Badge>
                      <p className="text-xs font-mono">bg-red-500 text-white</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500 text-white">Exemplo</Badge>
                      <p className="text-xs font-mono">bg-blue-500 text-white</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500 text-white">Exemplo</Badge>
                      <p className="text-xs font-mono">bg-purple-500 text-white</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opções Adicionais */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Opções Adicionais</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Plano Ativo</p>
                  <p className="text-xs text-slate-600">Se desmarcado, o plano não aparece para os usuários (mas não é excluído)</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                <Crown className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Em Destaque</p>
                  <p className="text-xs text-slate-600">Adiciona uma borda especial e destaca o plano na página de assinaturas</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                <span className="text-sm font-bold text-slate-700 mt-0.5">#</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ordem</p>
                  <p className="text-xs text-slate-600">Define a ordem de exibição dos planos (menor número = aparece primeiro)</p>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Dicas Importantes */}
      <Card className="rounded-2xl border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            Dicas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-800">
          <p>✅ Todas as alterações são aplicadas imediatamente em todo o app</p>
          <p>✅ Os banners na página inicial são atualizados automaticamente</p>
          <p>✅ As mensagens do WhatsApp usam os valores mais recentes</p>
          <p>✅ Você pode desativar temporariamente um plano sem excluí-lo</p>
          <p>✅ Use a ordem para controlar qual plano aparece primeiro</p>
          <p>✅ Teste sempre a mensagem do WhatsApp após criar/editar</p>
        </CardContent>
      </Card>
    </div>
  );
}