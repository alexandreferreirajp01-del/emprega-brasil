import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const steps = [
  { num: 1, icon: '👆', text: 'Clique no botão "Continuar" abaixo' },
  { num: 2, icon: '⏳', text: 'Você será levado para uma página com um breve anúncio — aguarde o contador zerar (geralmente 5 a 15 segundos)' },
  { num: 3, icon: '✅', text: 'Clique em "Pular" ou "Continuar" quando aparecer o botão' },
  { num: 4, icon: '🎉', text: 'Pronto! A vaga será liberada para você acessar' },
];

export default function PreLander() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(getConfig());

  useEffect(() => {
    const handleStorage = () => setConfig(getConfig());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  const s = {
    page: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0A1628 0%, #0D2045 50%, #0A1628 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      zIndex: 99999,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      boxSizing: 'border-box',
      padding: '40px 16px',
    },
    inner: {
      width: '100%',
      maxWidth: '480px',
    },
    logoWrap: {
      textAlign: 'center',
      marginBottom: '24px',
    },
    logoCircle: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      marginBottom: '12px',
    },
    logoImg: {
      width: '56px',
      height: '56px',
      objectFit: 'contain',
    },
    handle: {
      color: '#93C5FD',
      fontSize: '14px',
      fontWeight: '600',
      margin: 0,
    },
    card: {
      background: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    },
    cardTop: {
      background: 'linear-gradient(90deg, #1D4371, #1E6FB6)',
      padding: '16px 24px',
      textAlign: 'center',
    },
    cardTopText: {
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      margin: 0,
    },
    cardBody: {
      padding: '28px 24px',
    },
    headline: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#0F172A',
      textAlign: 'center',
      lineHeight: '1.3',
      marginBottom: '16px',
      marginTop: 0,
    },
    infoBox: {
      background: '#EFF6FF',
      border: '1px solid #BFDBFE',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '24px',
    },
    infoText: {
      color: '#334155',
      fontSize: '14px',
      textAlign: 'center',
      lineHeight: '1.6',
      margin: 0,
    },
    stepsTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      fontWeight: '700',
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '12px',
    },
    stepsTitleLine: {
      flex: 1,
      height: '1px',
      background: '#3B82F6',
    },
    stepsWrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    },
    step: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      background: '#F8FAFC',
      borderRadius: '12px',
      padding: '12px 16px',
    },
    stepNum: {
      minWidth: '28px',
      height: '28px',
      borderRadius: '50%',
      background: '#1D4371',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '2px',
    },
    stepText: {
      color: '#334155',
      fontSize: '13px',
      lineHeight: '1.5',
      margin: 0,
    },
    btn: {
      width: '100%',
      background: loading ? '#94A3B8' : 'linear-gradient(90deg, #1D4371, #1E6FB6)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '16px',
      padding: '18px 24px',
      fontSize: '16px',
      fontWeight: '800',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '20px',
      boxShadow: '0 8px 24px rgba(29,67,113,0.4)',
      transition: 'opacity 0.2s',
      boxSizing: 'border-box',
    },
    badges: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: '#64748B',
    },
    instaBar: {
      background: 'linear-gradient(90deg, #7C3AED, #EC4899, #F97316)',
      padding: '16px 24px',
      textAlign: 'center',
    },
    instaText: {
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      margin: '0 0 8px 0',
    },
    instaBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(255,255,255,0.2)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '20px',
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    warning: {
      marginTop: '20px',
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
    },
    warningText: {
      color: '#92400E',
      fontSize: '12px',
      lineHeight: '1.5',
      margin: 0,
    },
    footer: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.25)',
      fontSize: '11px',
      marginTop: '20px',
    },
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={s.logoCircle}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png"
                alt="Vagas Abertas PB"
                style={s.logoImg}
              />
            </div>
            <p style={s.handle}>@vagasabertaspb</p>
          </div>
        </div>

        {/* Card */}
        <div style={s.card}>
          {/* Topo */}
          <div style={s.cardTop}>
            <p style={s.cardTopText}>Vagas Abertas Paraíba</p>
          </div>

          {/* Corpo */}
          <div style={s.cardBody}>
            <h1 style={s.headline}>{config.titulo}</h1>

            <div style={s.infoBox}>
              <p style={s.infoText}>
                {config.subtitulo || 'Antes de acessar, você passará por um anúncio rápido. Isso é o que mantém este projeto 100% gratuito e com novas vagas todo dia!'}
              </p>
            </div>

            {/* Como funciona */}
            <div style={s.stepsTitle}>
              <span style={s.stepsTitleLine}></span>
              Como funciona
              <span style={s.stepsTitleLine}></span>
            </div>
            <div style={s.stepsWrap}>
              {steps.map((step) => (
                <div key={step.num} style={s.step}>
                  <div style={s.stepNum}>{step.num}</div>
                  <p style={s.stepText}>{step.icon} {step.text}</p>
                </div>
              ))}
            </div>

            {/* Botão CTA */}
            <button onClick={handleClick} disabled={loading} style={s.btn}>
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></span>
                  Carregando…
                </>
              ) : (
                <>
                  {config.btn_texto}
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>

            {/* Selos */}
            <div style={s.badges}>
              <span style={s.badge}>✅ Processo seguro</span>
              <span style={s.badge}>✅ Sem cadastro</span>
              <span style={s.badge}>🛡️ Você será redirecionado para a vaga</span>
            </div>
          </div>

          {/* Barra Instagram */}
          <div style={s.instaBar}>
            <p style={s.instaText}>📲 Siga <strong>@vagasabertaspb</strong> e receba vagas todos os dias!</p>
            <a
              href="https://instagram.com/vagasabertaspb"
              target="_blank"
              rel="noopener noreferrer"
              style={s.instaBtn}
            >
              📸 Seguir agora
            </a>
          </div>
        </div>

        {/* Aviso */}
        <div style={s.warning}>
          <span style={{ fontSize: '16px', marginTop: '1px' }}>⚠️</span>
          <p style={s.warningText}>
            <strong>Atenção:</strong> Não solicitamos nenhum pagamento para liberar vagas. Todas as vagas são gratuitas.
          </p>
        </div>

        <p style={s.footer}>© {new Date().getFullYear()} Vagas Abertas PB · CNPJ 62.874.724/0001-11</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}