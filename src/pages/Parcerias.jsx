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
  const planos = [
    { dias: '01 dia', valor: 'R$50,00', destaque: false },
    { dias: '03 dias', valor: 'R$60,00', destaque: false },
    { dias: '07 dias', valor: 'R$80,00', destaque: false },
    { dias: '15 dias', valor: 'R$140,00', destaque: true },
    { dias: '30 dias', valor: 'R$180,00', destaque: true },
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
    <div className="min-h-screen bg-slate-900 pb-20">
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
        <Card className="mb-6 shadow-2xl bg-slate-950 border-slate-800">
          <CardContent className="p-4 md:p-8">
            <div className="space-y-3">
              {planos.map((plano, i) => (
                <div 
                  key={i} 
                  className={`border-2 rounded-xl p-4 md:p-6 flex items-center justify-between gap-4 transition-all hover:shadow-lg ${
                    plano.destaque 
                      ? 'border-yellow-400 bg-slate-900/50' 
                      : 'border-slate-700 bg-slate-900/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{plano.dias}</div>
                    <div className="text-2xl md:text-4xl font-bold text-yellow-400">{plano.valor}</div>
                  </div>
                  <Button
                    onClick={() => handleWhatsApp(plano)}
                    className="bg-green-600 hover:bg-green-700 h-12 md:h-14 px-4 md:px-8 rounded-xl"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Contratar</span>
                    <span className="sm:hidden">Pedir</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card className="mb-6 shadow-lg bg-slate-950 border-slate-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Tráfego nas redes:</h3>
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
        <Card className="mb-6 shadow-lg bg-slate-950 border-slate-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              {metricas.map((metrica, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-white font-medium text-base md:text-lg">{metrica}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="shadow-lg bg-slate-950 border-slate-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Formas de pagamento:</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#0056ff] rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-medium">PIX</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#0056ff] rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Cartão</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#0056ff] rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2"/>
                    <path d="M3 11h18M7 15h4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Boleto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}