import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowRight, CheckCircle, Clock, Instagram, Shield, AlertTriangle } from "lucide-react";

// Lê config do localStorage (salva pelo admin)
function getConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('prelander_config') || '{}');
    return {
      link: c.link || '',
      titulo: c.titulo || 'Você está a 1 passo de ver a vaga! 🎯',
      subtitulo: c.subtitulo || 'Antes de acessar, você passará por um anúncio rápido. Isso é o que mantém este projeto 100% gratuito e com novas vagas todo dia!',
      btn_texto: c.btn_texto || 'CONTINUAR PARA VER A VAGA',
    };
  } catch {
    return { link: '', titulo: 'Você está a 1 passo de ver a vaga! 🎯', subtitulo: '', btn_texto: 'CONTINUAR PARA VER A VAGA' };
  }
}

export default function PreLander() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(getConfig());

  // Atualiza config se mudar no storage
  useEffect(() => {
    const handleStorage = () => setConfig(getConfig());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Preserva parâmetro ?vaga= no redirecionamento
  const getRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const vaga = params.get('vaga');
    let url = config.link || '#';
    if (vaga && url !== '#') {
      url += (url.includes('?') ? '&' : '?') + `vaga=${vaga}`;
    }
    return url;
  };

  const handleClick = () => {
    if (!config.link) {
      alert('Link não configurado. Configure em Configurações > Pre-lander.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      window.location.href = getRedirectUrl();
    }, 1200);
  };

  const steps = [
    { icon: '👆', text: 'Clique no botão "Continuar" abaixo' },
    { icon: '⏳', text: 'Você será levado para uma página com um breve anúncio — aguarde o contador zerar (geralmente 5 a 15 segundos)' },
    { icon: '✅', text: 'Clique em "Pular" ou "Continuar" quando aparecer o botão' },
    { icon: '🎉', text: 'Pronto! A vaga será liberada para você acessar' },
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #0A1628, #0D2045, #0A1628)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', boxSizing: 'border-box' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur mb-3 border border-white/20">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png"
              alt="Vagas Abertas PB"
              className="w-14 h-14 object-contain"
            />
          </div>
          <p className="text-blue-300 text-sm font-medium">@vagasabertaspb</p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Faixa topo */}
          <div className="bg-gradient-to-r from-[#1D4371] to-[#1E6FB6] px-6 py-4 text-center">
            <p className="text-white text-xs font-semibold tracking-widest uppercase">Vagas Abertas Paraíba</p>
          </div>

          <div className="px-6 py-7">
            {/* Headline */}
            <h1 className="text-2xl font-extrabold text-slate-900 text-center leading-tight mb-3">
              {config.titulo}
            </h1>

            {/* Explicação transparente */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
              <p className="text-slate-700 text-sm text-center leading-relaxed">
                {config.subtitulo || 'Antes de acessar, você passará por um anúncio rápido. Isso é o que mantém este projeto 100% gratuito e com novas vagas todo dia!'}
              </p>
            </div>

            {/* Passo a passo */}
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-blue-500 inline-block"></span>
              Como funciona
              <span className="w-5 h-0.5 bg-blue-500 inline-block"></span>
            </h2>
            <div className="space-y-3 mb-7">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-[#1D4371] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-snug">{step.icon} {step.text}</p>
                </div>
              ))}
            </div>

            {/* Botão CTA */}
            <button
              onClick={handleClick}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1D4371] to-[#1E6FB6] hover:from-[#0F2744] hover:to-[#0B5394] text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando…
                </>
              ) : (
                <>
                  {config.btn_texto}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Selos de credibilidade */}
            <div className="flex flex-wrap justify-center gap-3 mb-5 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Processo seguro</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Sem cadastro</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-blue-500" /> Você será redirecionado para a vaga</span>
            </div>
          </div>

          {/* CTA Instagram */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-4 text-center">
            <p className="text-white text-sm font-semibold">
              📲 Siga <span className="font-extrabold">@vagasabertaspb</span> e receba vagas todos os dias no Instagram!
            </p>
            <a
              href="https://instagram.com/vagasabertaspb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all"
            >
              <Instagram className="w-3.5 h-3.5" /> Seguir agora
            </a>
          </div>
        </div>

        {/* Aviso anti-fraude */}
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Atenção:</strong> Não solicitamos nenhum pagamento para liberar vagas. Desconfie de qualquer cobrança. Todas as vagas são gratuitas.
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-5">© {new Date().getFullYear()} Vagas Abertas PB · CNPJ 62.874.724/0001-11</p>
      </div>
    </div>
  );
}