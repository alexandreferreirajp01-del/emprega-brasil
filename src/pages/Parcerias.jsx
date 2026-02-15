import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Handshake, ArrowLeft, MessageSquare, CheckCircle, Instagram, Send, CreditCard, Smartphone,
  Zap, TrendingUp, Award, Target, BarChart, Users
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
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E6FB6] via-[#0B2F5B] to-[#0B2F5B] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-6 pb-16 px-4 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-6 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          
          <div className="text-center">
            <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1.5">
              <Users className="w-4 h-4 mr-2" />
              Parcerias Empresariais
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Divulgue Sua Vaga
            </h1>
            <p className="text-white/90 dark:text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
              Alcance milhares de candidatos qualificados na Paraíba
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 -mt-10">
        {/* Tabela de Preços */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 transition-colors">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700 p-4 md:p-6 border-b dark:border-slate-600 transition-colors">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white text-center">Escolha seu Plano</h2>
            <p className="text-slate-600 dark:text-slate-300 text-center text-sm md:text-base mt-1">Investimento direto em resultados</p>
          </div>
          
          <CardContent className="p-4 sm:p-5 md:p-8">
            <div className="space-y-3 sm:space-y-4">
              {planos.map((plano, i) => {
                const Icon = plano.icon;
                return (
                  <div 
                    key={i} 
                    className={`group border-2 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300 relative ${
                      plano.popular
                        ? 'border-[#0056ff] bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-500 shadow-xl md:scale-[1.02]' 
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-[#0056ff]/30 dark:hover:border-blue-500/50 hover:shadow-md'
                    }`}
                  >
                    {plano.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] text-white border-0 px-5 py-1.5 text-xs font-bold shadow-lg">
                          ⭐ MAIS ESCOLHIDO
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        plano.popular ? 'bg-[#1E6FB6]' : 'bg-slate-100 group-hover:bg-blue-50'
                      } transition-colors`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${plano.popular ? 'text-white' : 'text-slate-600 group-hover:text-[#1E6FB6]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white">{plano.dias}</span>
                          {plano.popular && (
                            <Badge variant="outline" className="border-[#1E6FB6] dark:border-blue-400 text-[#1E6FB6] dark:text-blue-400 text-[10px] sm:text-xs px-2 py-0">
                              Destaque
                            </Badge>
                          )}
                        </div>
                        <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${plano.popular ? 'text-[#1E6FB6] dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                          {plano.valor}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleWhatsApp(plano)}
                      className={`w-full h-11 sm:h-12 md:h-14 rounded-xl font-semibold text-sm sm:text-base shadow-lg ${
                        plano.popular 
                          ? 'bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] hover:from-[#0B2F5B] hover:to-[#1E6FB6] text-white' 
                          : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#1E6FB6] hover:text-[#1E6FB6] hover:bg-blue-50'
                      } transition-all`}
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">{plano.popular ? 'Contratar Agora' : 'Solicitar Proposta'}</span>
                      <span className="sm:hidden">{plano.popular ? 'Contratar' : 'Solicitar'}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-colors">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700 p-4 border-b dark:border-slate-600 transition-colors">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white text-center flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-[#1E6FB6] dark:text-blue-400" />
              Nosso Alcance nas Redes
            </h3>
          </div>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl sm:rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-center">
                  <Instagram className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">40K</div>
                  <p className="text-[10px] sm:text-xs opacity-90">Instagram</p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-green-600 rounded-xl sm:rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-center">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">12k</div>
                  <p className="text-[10px] sm:text-xs opacity-90">WhatsApp</p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 rounded-xl sm:rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-blue-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-center">
                  <Send className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">5.3k</div>
                  <p className="text-[10px] sm:text-xs opacity-90">Telegram</p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-700 rounded-xl sm:rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-blue-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">4.1k</div>
                  <p className="text-[10px] sm:text-xs opacity-90">Facebook</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800/30 transition-colors">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Badge className="bg-green-600 dark:bg-green-700 text-white border-0 px-4 py-1.5 mb-3">
                <CheckCircle className="w-4 h-4 mr-2" />
                Benefícios da Parceria
              </Badge>
            </div>
            <div className="space-y-3">
              {metricas.map((metrica, i) => (
                <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-800 dark:text-white font-medium text-sm md:text-base">{metrica}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/30 transition-colors">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700 p-4 border-b dark:border-slate-600 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1E6FB6] dark:text-blue-400" />
              Formas de Pagamento
            </h3>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E6FB6] to-[#0B2F5B] dark:from-blue-600 dark:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <span className="text-slate-800 dark:text-white text-sm font-semibold">PIX</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E6FB6] to-[#0B2F5B] dark:from-blue-600 dark:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <span className="text-slate-800 dark:text-white text-sm font-semibold">Cartão</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E6FB6] to-[#0B2F5B] dark:from-blue-600 dark:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2"/>
                    <path d="M3 11h18M7 15h4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-slate-800 dark:text-white text-sm font-semibold">Boleto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}