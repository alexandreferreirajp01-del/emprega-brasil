import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Handshake, ArrowLeft, MessageSquare, CheckCircle, Instagram, Send, CreditCard, Smartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Parcerias() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const planos = [
    { dias: '01 dia', valor: 'R$50,00', popular: false, icon: Zap },
    { dias: '03 dias', valor: 'R$60,00', popular: false, icon: TrendingUp },
    { dias: '07 dias', valor: 'R$80,00', popular: true, icon: Award },
    { dias: '15 dias', valor: 'R$140,00', popular: false, icon: Target },
    { dias: '30 dias', valor: 'R$180,00', popular: false, icon: BarChart },
  ];

  const metricas = [
    '+ de 5 milhões de visualizações mensais',
    '+ de 400 clientes satisfeitos',
    'Público 100% Paraibano'
  ];

  const handleWhatsApp = (plano) => {
    const mensagem = `🎯 *Interesse em Anúncio*\n\n` +
      `📅 *Plano:* ${plano.dias}\n` +
      `💰 *Valor:* ${plano.valor}\n\n` +
      `Gostaria de mais informações sobre este pacote de anúncios.`;
    
    const whatsappURL = `https://wa.me/5583991971320?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              TABELA <span className="text-yellow-400">DE</span> VALORES
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto">
              Anuncie sua vaga e alcance milhares de candidatos na Paraíba
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Tabela de Preços */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 md:p-6 border-b">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">Escolha seu Plano</h2>
            <p className="text-slate-600 text-center text-sm mt-1">Investimento direto em resultados</p>
          </div>
          
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {planos.map((plano, i) => {
                const Icon = plano.icon;
                return (
                  <div 
                    key={i} 
                    className={`group border-2 rounded-2xl p-5 md:p-6 transition-all duration-300 relative ${
                      plano.popular
                        ? 'border-[#0056ff] bg-gradient-to-r from-blue-50 to-blue-100 shadow-xl scale-[1.02]' 
                        : 'border-slate-200 bg-white hover:border-[#0056ff]/30 hover:shadow-md'
                    }`}
                  >
                    {plano.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white border-0 px-5 py-1.5 text-xs font-bold shadow-lg">
                          ⭐ MAIS ESCOLHIDO
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        plano.popular ? 'bg-[#0056ff]' : 'bg-slate-100 group-hover:bg-blue-50'
                      } transition-colors`}>
                        <Icon className={`w-7 h-7 ${plano.popular ? 'text-white' : 'text-slate-600 group-hover:text-[#0056ff]'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg md:text-xl font-bold text-slate-800">{plano.dias}</span>
                          {plano.popular && (
                            <Badge variant="outline" className="border-[#0056ff] text-[#0056ff] text-xs">
                              Destaque
                            </Badge>
                          )}
                        </div>
                        <div className={`text-3xl md:text-4xl font-bold ${plano.popular ? 'text-[#0056ff]' : 'text-slate-800'}`}>
                          {plano.valor}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleWhatsApp(plano)}
                      className={`w-full h-12 md:h-14 rounded-xl font-semibold text-base shadow-lg ${
                        plano.popular 
                          ? 'bg-gradient-to-r from-[#0056ff] to-[#0044cc] hover:from-[#0044cc] hover:to-[#003399] text-white' 
                          : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#0056ff] hover:text-[#0056ff] hover:bg-blue-50'
                      } transition-all`}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      {plano.popular ? 'Contratar Agora' : 'Solicitar Proposta'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Tráfego nas redes:</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Send className="w-7 h-7 text-white" />
              </div>
              <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Badge className="bg-green-600 text-white border-0 px-4 py-1.5 mb-3">
                <CheckCircle className="w-4 h-4 mr-2" />
                Benefícios da Parceria
              </Badge>
            </div>
            <div className="space-y-3">
              {metricas.map((metrica, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-slate-800 font-medium text-sm md:text-base">{metrica}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-b">
            <h3 className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0056ff]" />
              Formas de Pagamento
            </h3>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0056ff] to-[#0044cc] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <span className="text-slate-800 text-sm font-semibold">PIX</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0056ff] to-[#0044cc] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <span className="text-slate-800 text-sm font-semibold">Cartão</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0056ff] to-[#0044cc] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2"/>
                    <path d="M3 11h18M7 15h4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-slate-800 text-sm font-semibold">Boleto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}