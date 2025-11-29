import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Copy, MessageCircle, Instagram, Phone, Send, 
  TrendingUp, Users, Eye, Target, Zap, Star, Shield
} from "lucide-react";
import { motion } from "framer-motion";

export default function Parcerias() {
  const [copiedPix, setCopiedPix] = useState(false);

  const PIX_CNPJ = "51.993.993/0001-01";
  const WHATSAPP = "5583991971320";

  const pacotes = [
    { dias: "01 dia", preco: "R$50,00", popular: false },
    { dias: "03 dias", preco: "R$60,00", popular: false },
    { dias: "07 dias", preco: "R$80,00", popular: true },
    { dias: "15 dias", preco: "R$140,00", popular: false },
    { dias: "30 dias", preco: "R$180,00", popular: false },
  ];

  const beneficios = [
    { icon: Eye, text: "+ de 5 milhões de visualizações mensais" },
    { icon: Users, text: "+ de 400 clientes satisfeitos" },
    { icon: Target, text: "Público 100% Paraibano" },
    { icon: TrendingUp, text: "Alcance orgânico massivo" },
    { icon: Zap, text: "Divulgação imediata após pagamento" },
    { icon: Shield, text: "Suporte dedicado via WhatsApp" },
  ];

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_CNPJ);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleWhatsApp = (pacote = null) => {
    let message = "Olá! Tenho interesse em anunciar no Vagas Abertas Paraíba.";
    if (pacote) {
      message = `Olá! Quero contratar o pacote de ${pacote.dias} por ${pacote.preco} para divulgar minha vaga.`;
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0056ff] via-[#0044cc] to-[#003399] pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10" />
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="bg-white text-[#0056ff] border-0 mb-4 px-4 py-1 text-sm font-semibold">
              <Star className="w-4 h-4 mr-1" />
              PARCERIA COMERCIAL
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              <span className="text-white/90">TABELA</span> DE{" "}
              <span className="text-white/90">VALORES</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Divulgue sua vaga para milhares de candidatos qualificados na Paraíba
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 rounded-3xl overflow-hidden backdrop-blur">
            <CardContent className="p-6">
              <div className="space-y-3">
                {pacotes.map((pacote, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                      pacote.popular 
                        ? 'bg-amber-500/20 border-amber-500/50' 
                        : 'bg-slate-700/50 border-slate-600 hover:border-amber-500/30'
                    }`}
                    onClick={() => handleWhatsApp(pacote)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{pacote.dias}</span>
                      {pacote.popular && (
                        <Badge className="bg-amber-500 text-amber-900 border-0 text-xs">
                          MAIS POPULAR
                        </Badge>
                      )}
                    </div>
                    <span className="text-2xl font-black text-amber-400">{pacote.preco}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tráfego nas Redes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h2 className="text-xl font-bold text-white mb-4">Tráfego nas redes:</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Benefícios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 rounded-3xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {beneficios.map((beneficio, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-amber-900" />
                    </div>
                    <span className="text-slate-200">{beneficio.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Copy de Vendas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30 rounded-3xl">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                🚀 Encontre o candidato ideal hoje!
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Sua vaga divulgada para <strong className="text-amber-400">milhares de candidatos qualificados</strong> na Paraíba. 
                Com nosso alcance massivo, você encontra o profissional perfeito em tempo recorde!
              </p>
              <div className="bg-slate-800/50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-slate-400 mb-2">✨ Processo simples:</p>
                <ol className="text-left text-slate-300 text-sm space-y-2">
                  <li>1️⃣ Escolha o pacote ideal</li>
                  <li>2️⃣ Faça o pagamento via PIX</li>
                  <li>3️⃣ Envie o comprovante + criativos da vaga via WhatsApp</li>
                  <li>4️⃣ Sua vaga é publicada imediatamente!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Formas de Pagamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg text-white text-center">Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="bg-slate-700/50 rounded-2xl p-4 mb-4">
                <p className="text-sm text-slate-400 mb-2">Chave PIX (CNPJ):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 text-amber-400 p-3 rounded-xl font-mono text-lg">
                    {PIX_CNPJ}
                  </code>
                  <Button 
                    onClick={copyPix}
                    variant="outline" 
                    className="rounded-xl border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                  >
                    {copiedPix ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                {copiedPix && (
                  <p className="text-green-400 text-sm mt-2">✓ Chave PIX copiada!</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💳</span>
                  </div>
                  <span>PIX</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏦</span>
                  </div>
                  <span>Transferência</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Button 
            onClick={() => handleWhatsApp()}
            className="w-full h-16 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] rounded-2xl shadow-xl"
          >
            <MessageCircle className="w-6 h-6 mr-3" />
            Falar com Consultor via WhatsApp
          </Button>
          <p className="text-center text-slate-400 text-sm mt-4">
            Após o pagamento, envie o comprovante e os criativos da vaga pelo WhatsApp
          </p>
        </motion.div>
      </div>
    </div>
  );
}