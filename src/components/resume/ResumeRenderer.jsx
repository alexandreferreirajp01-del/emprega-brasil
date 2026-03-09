import React from 'react';

const fmt = (dateStr) => {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]}/${y}`;
};

const WatermarkOverlay = () => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {[...Array(6)].map((_, i) => (
      <div key={i} style={{
        position: 'absolute',
        top: `${15 + i * 15}%`,
        left: '50%',
        transform: 'translateX(-50%) rotate(-35deg)',
        fontSize: '42px',
        fontWeight: 900,
        color: 'rgba(180,0,0,0.10)',
        whiteSpace: 'nowrap',
        letterSpacing: '2px',
        userSelect: 'none',
      }}>VAGAS ABERTAS PB</div>
    ))}
  </div>
);

// ── TEMPLATE: classic_blue ──────────────────────────────────────────────
const ClassicBlue = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative', width: '100%', minHeight: '100%', padding: 0 }}>
    {wm && <WatermarkOverlay />}
    <div style={{ background: '#1D4371', color: '#fff', padding: '32px 40px 24px' }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', float: 'right', border: '3px solid #fff', marginLeft: 16 }} />}
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 12px' }}>{d.title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 12, opacity: 0.9 }}>
        {d.email && <span>✉ <a href={`mailto:${d.email}`} style={{ color: '#fff' }}>{d.email}</a></span>}
        {d.phone && <span>☎ <a href={`tel:${d.phone}`} style={{ color: '#fff' }}>{d.phone}</a></span>}
        {d.location && <span>📍 {d.location}</span>}
        {d.linkedin && <span>🔗 <a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: '#fff' }}>{d.linkedin}</a></span>}
        {d.github && <span>💻 <a href={d.github.startsWith('http') ? d.github : `https://${d.github}`} style={{ color: '#fff' }}>{d.github}</a></span>}
        {d.website && <span>🌐 <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} style={{ color: '#fff' }}>{d.website}</a></span>}
      </div>
    </div>
    <div style={{ padding: '24px 40px' }}>
      {d.summary && <Section title="Resumo Profissional" color="#1D4371"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência Profissional" color="#1D4371">
        {d.experience.map((e, i) => <ExpItem key={i} {...e} />)}
      </Section>}
      {d.education?.length > 0 && <Section title="Formação Acadêmica" color="#1D4371">
        {d.education.map((e, i) => <EduItem key={i} {...e} />)}
      </Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><SectionTitle title="Habilidades" color="#1D4371" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#e8f0fa', color: '#1D4371', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
        </div>}
        <div>
          {d.languages?.length > 0 && <><SectionTitle title="Idiomas" color="#1D4371" />{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</>}
          {d.certifications?.length > 0 && <><SectionTitle title="Certificações" color="#1D4371" style={{ marginTop: 16 }} />{d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}</div>)}</>}
        </div>
      </div>
    </div>
  </div>
);

// ── TEMPLATE: modern_dark ───────────────────────────────────────────────
const ModernDark = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', position: 'relative', background: '#fff' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ width: 220, background: '#1a1a2e', color: '#fff', padding: '32px 20px', flexShrink: 0 }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 16px', border: '3px solid #4fc3f7' }} />}
      <h1 style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 11, textAlign: 'center', opacity: 0.7, marginBottom: 20 }}>{d.title}</p>
      <SideSection title="Contato" color="#4fc3f7">
        {d.email && <SideLink href={`mailto:${d.email}`} label={d.email} />}
        {d.phone && <SideLink href={`tel:${d.phone}`} label={d.phone} />}
        {d.location && <p style={{ fontSize: 11, margin: '2px 0', opacity: 0.8 }}>{d.location}</p>}
        {d.linkedin && <SideLink href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} label="LinkedIn" />}
        {d.github && <SideLink href={d.github.startsWith('http') ? d.github : `https://${d.github}`} label="GitHub" />}
        {d.website && <SideLink href={d.website.startsWith('http') ? d.website : `https://${d.website}`} label="Portfólio" />}
      </SideSection>
      {d.skills?.length > 0 && <SideSection title="Habilidades" color="#4fc3f7">
        {d.skills.map((s, i) => <div key={i} style={{ background: 'rgba(79,195,247,0.15)', borderRadius: 4, padding: '2px 8px', fontSize: 11, marginBottom: 4 }}>{s}</div>)}
      </SideSection>}
      {d.languages?.length > 0 && <SideSection title="Idiomas" color="#4fc3f7">
        {d.languages.map((l, i) => <div key={i} style={{ fontSize: 11, marginBottom: 3 }}><b>{l.name}</b> <span style={{ opacity: 0.7 }}>{l.level}</span></div>)}
      </SideSection>}
    </div>
    <div style={{ flex: 1, padding: '28px 32px', overflowX: 'hidden' }}>
      {d.summary && <Section title="Sobre Mim" color="#1a1a2e"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência" color="#1a1a2e">{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
      {d.education?.length > 0 && <Section title="Formação" color="#1a1a2e">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      {d.certifications?.length > 0 && <Section title="Certificações" color="#1a1a2e">
        {d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}</div>)}
      </Section>}
    </div>
  </div>
);

// ── TEMPLATE: executive ─────────────────────────────────────────────────
const Executive = ({ d, wm }) => (
  <div style={{ fontFamily: 'Georgia, serif', color: '#222', background: '#fff', position: 'relative' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ background: 'linear-gradient(135deg, #2c3e50 0%, #4a6274 100%)', color: '#fff', padding: '36px 48px 28px', display: 'flex', alignItems: 'flex-start', gap: 24 }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 15, opacity: 0.8, margin: '0 0 14px', fontStyle: 'italic' }}>{d.title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12 }}>
          {d.email && <a href={`mailto:${d.email}`} style={{ color: '#c8d6e5' }}>{d.email}</a>}
          {d.phone && <a href={`tel:${d.phone}`} style={{ color: '#c8d6e5' }}>{d.phone}</a>}
          {d.location && <span style={{ opacity: 0.8 }}>{d.location}</span>}
          {d.linkedin && <a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: '#c8d6e5' }}>LinkedIn</a>}
        </div>
      </div>
    </div>
    <div style={{ padding: '28px 48px' }}>
      {d.summary && <Section title="Perfil Executivo" color="#2c3e50"><p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Trajetória Profissional" color="#2c3e50">{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
      {d.education?.length > 0 && <Section title="Educação" color="#2c3e50">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><SectionTitle title="Competências" color="#2c3e50" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#f0f4f8', color: '#2c3e50', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid #cdd7e0' }}>{s}</span>)}</div>
        </div>}
        <div>
          {d.languages?.length > 0 && <><SectionTitle title="Idiomas" color="#2c3e50" />{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</>}
        </div>
      </div>
    </div>
  </div>
);

// ── TEMPLATE: tech_dark ─────────────────────────────────────────────────
const TechDark = ({ d, wm }) => (
  <div style={{ fontFamily: "'Courier New', monospace", color: '#e6edf3', background: '#0d1117', position: 'relative', minHeight: '100%' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ borderBottom: '2px solid #30363d', padding: '28px 40px' }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', float: 'right', border: '2px solid #30363d' }} />}
      <div style={{ display: 'inline-block', background: '#238636', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, marginBottom: 8 }}>● DISPONÍVEL</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: '#58a6ff' }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 12px' }}>// {d.title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 11, color: '#8b949e' }}>
        {d.email && <a href={`mailto:${d.email}`} style={{ color: '#58a6ff' }}>{d.email}</a>}
        {d.phone && <a href={`tel:${d.phone}`} style={{ color: '#58a6ff' }}>{d.phone}</a>}
        {d.location && <span>{d.location}</span>}
        {d.github && <a href={d.github.startsWith('http') ? d.github : `https://${d.github}`} style={{ color: '#58a6ff' }}>github</a>}
        {d.linkedin && <a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: '#58a6ff' }}>linkedin</a>}
        {d.website && <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} style={{ color: '#58a6ff' }}>portfolio</a>}
      </div>
    </div>
    <div style={{ padding: '24px 40px', display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32 }}>
      <div>
        {d.summary && <DarkSection title="about()" color="#58a6ff"><p style={{ fontSize: 12, lineHeight: 1.7, color: '#c9d1d9', margin: 0 }}>{d.summary}</p></DarkSection>}
        {d.experience?.length > 0 && <DarkSection title="experience()" color="#58a6ff">
          {d.experience.map((e, i) => <div key={i} style={{ marginBottom: 16, borderLeft: '3px solid #238636', paddingLeft: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{e.role}</div>
            <div style={{ fontSize: 12, color: '#58a6ff' }}>{e.company}</div>
            <div style={{ fontSize: 11, color: '#8b949e', margin: '2px 0 6px' }}>{fmt(e.start)} — {e.current ? 'Atual' : fmt(e.end)}</div>
            {e.description && <p style={{ fontSize: 12, color: '#c9d1d9', margin: 0, lineHeight: 1.6 }}>{e.description}</p>}
          </div>)}
        </DarkSection>}
        {d.education?.length > 0 && <DarkSection title="education()" color="#58a6ff">
          {d.education.map((e, i) => <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{e.course}</div>
            <div style={{ fontSize: 12, color: '#8b949e' }}>{e.institution} · {fmt(e.start)} — {e.current ? 'Atual' : fmt(e.end)}</div>
          </div>)}
        </DarkSection>}
      </div>
      <div>
        {d.skills?.length > 0 && <DarkSection title="skills[]" color="#58a6ff">
          {d.skills.map((s, i) => <div key={i} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 4, padding: '4px 8px', fontSize: 11, marginBottom: 4, color: '#79c0ff' }}>{s}</div>)}
        </DarkSection>}
        {d.languages?.length > 0 && <DarkSection title="languages[]" color="#58a6ff">
          {d.languages.map((l, i) => <div key={i} style={{ fontSize: 11, color: '#c9d1d9', marginBottom: 4 }}>{l.name}: <span style={{ color: '#56d364' }}>{l.level}</span></div>)}
        </DarkSection>}
        {d.certifications?.length > 0 && <DarkSection title="certs[]" color="#58a6ff">
          {d.certifications.map((c, i) => <div key={i} style={{ fontSize: 11, color: '#c9d1d9', marginBottom: 4 }}>{c.name}{c.year && ` (${c.year})`}</div>)}
        </DarkSection>}
      </div>
    </div>
  </div>
);

// ── TEMPLATE: clean_green ───────────────────────────────────────────────
const CleanGreen = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ borderTop: '6px solid #057642', padding: '32px 40px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #057642', flexShrink: 0 }} />}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: '#0a2e1a' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 14, color: '#057642', margin: '0 0 10px', fontWeight: 600 }}>{d.title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: '#555' }}>
          {d.email && <a href={`mailto:${d.email}`} style={{ color: '#057642' }}>{d.email}</a>}
          {d.phone && <a href={`tel:${d.phone}`} style={{ color: '#057642' }}>{d.phone}</a>}
          {d.location && <span>{d.location}</span>}
          {d.linkedin && <a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: '#057642' }}>LinkedIn</a>}
          {d.website && <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} style={{ color: '#057642' }}>Portfólio</a>}
        </div>
      </div>
    </div>
    <div style={{ padding: '0 40px 28px' }}>
      {d.summary && <Section title="Objetivo Profissional" color="#057642"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência Profissional" color="#057642">{d.experience.map((e, i) => <ExpItem key={i} {...e} color="#057642" />)}</Section>}
      {d.education?.length > 0 && <Section title="Formação Acadêmica" color="#057642">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><SectionTitle title="Habilidades" color="#057642" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#e8f5ee', color: '#057642', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
        </div>}
        <div>
          {d.languages?.length > 0 && <><SectionTitle title="Idiomas" color="#057642" />{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</>}
          {d.certifications?.length > 0 && <><SectionTitle title="Certificações" color="#057642" style={{ marginTop: 16 }} />{d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{c.name}</b>{c.year ? ` (${c.year})` : ''}</div>)}</>}
        </div>
      </div>
    </div>
  </div>
);

// ── TEMPLATE: minimal_gray ──────────────────────────────────────────────
const MinimalGray = ({ d, wm }) => (
  <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#333', background: '#fff', position: 'relative', padding: '40px 48px' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 300, margin: '0 0 4px', letterSpacing: 2, textTransform: 'uppercase' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 13, color: '#777', margin: 0, letterSpacing: 1 }}>{d.title}</p>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#555', lineHeight: 1.8 }}>
        {d.email && <div><a href={`mailto:${d.email}`} style={{ color: '#333' }}>{d.email}</a></div>}
        {d.phone && <div><a href={`tel:${d.phone}`} style={{ color: '#333' }}>{d.phone}</a></div>}
        {d.location && <div>{d.location}</div>}
        {d.linkedin && <div><a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: '#333' }}>LinkedIn</a></div>}
        {d.website && <div><a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} style={{ color: '#333' }}>Portfólio</a></div>}
      </div>
    </div>
    {d.photo && <img src={d.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', float: 'right', marginLeft: 20, marginBottom: 8 }} />}
    {d.summary && <Section title="SOBRE" color="#333" minimal><p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: '#555' }}>{d.summary}</p></Section>}
    {d.experience?.length > 0 && <Section title="EXPERIÊNCIA" color="#333" minimal>{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
    {d.education?.length > 0 && <Section title="FORMAÇÃO" color="#333" minimal>{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      {d.skills?.length > 0 && <div><SectionTitle title="HABILIDADES" color="#333" minimal />
        {d.skills.map((s, i) => <div key={i} style={{ fontSize: 12, borderBottom: '1px solid #eee', padding: '4px 0' }}>{s}</div>)}
      </div>}
      <div>
        {d.languages?.length > 0 && <><SectionTitle title="IDIOMAS" color="#333" minimal />{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, borderBottom: '1px solid #eee', padding: '4px 0' }}>{l.name} — {l.level}</div>)}</>}
      </div>
    </div>
  </div>
);

// ── Remaining templates reuse existing styles with different colors ─────
const mkColorTemplate = (color, accent, bg) => ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ background: color, color: '#fff', padding: '28px 40px 20px' }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', float: 'right', border: '3px solid rgba(255,255,255,0.5)' }} />}
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 12px' }}>{d.title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 11 }}>
        {d.email && <a href={`mailto:${d.email}`} style={{ color: accent || '#fff' }}>{d.email}</a>}
        {d.phone && <a href={`tel:${d.phone}`} style={{ color: accent || '#fff' }}>{d.phone}</a>}
        {d.location && <span style={{ opacity: 0.85 }}>{d.location}</span>}
        {d.linkedin && <a href={d.linkedin.startsWith('http') ? d.linkedin : `https://${d.linkedin}`} style={{ color: accent || '#fff' }}>LinkedIn</a>}
        {d.github && <a href={d.github.startsWith('http') ? d.github : `https://${d.github}`} style={{ color: accent || '#fff' }}>GitHub</a>}
        {d.website && <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} style={{ color: accent || '#fff' }}>Portfólio</a>}
      </div>
    </div>
    <div style={{ padding: '20px 40px 28px' }}>
      {d.summary && <Section title="Sobre" color={color}><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência" color={color}>{d.experience.map((e, i) => <ExpItem key={i} {...e} color={color} />)}</Section>}
      {d.education?.length > 0 && <Section title="Formação" color={color}>{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {d.skills?.length > 0 && <div><SectionTitle title="Habilidades" color={color} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.skills.map((s, i) => <span key={i} style={{ background: bg || '#f0f0f0', color: color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
        </div>}
        <div>
          {d.languages?.length > 0 && <><SectionTitle title="Idiomas" color={color} />{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 3 }}><b>{l.name}</b> — {l.level}</div>)}</>}
          {d.certifications?.length > 0 && <><SectionTitle title="Certificações" color={color} style={{ marginTop: 12 }} />{d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 3 }}>{c.name}{c.year ? ` (${c.year})` : ''}</div>)}</>}
        </div>
      </div>
    </div>
  </div>
);

// ── Shared sub-components ───────────────────────────────────────────────
const Section = ({ title, color, children, minimal }) => (
  <div style={{ marginBottom: 20 }}>
    <SectionTitle title={title} color={color} minimal={minimal} />
    {children}
  </div>
);

const SectionTitle = ({ title, color, minimal }) => (
  <div style={{ borderBottom: minimal ? `1px solid #ccc` : `2px solid ${color}`, paddingBottom: 4, marginBottom: 10 }}>
    <h2 style={{ fontSize: 13, fontWeight: 700, color: minimal ? '#333' : color, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
  </div>
);

const ExpItem = ({ company, role, start, end, current, description, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{role}</span>
        {company && <span style={{ fontSize: 12, color: color || '#1D4371', fontWeight: 600 }}> · {company}</span>}
      </div>
      <span style={{ fontSize: 11, color: '#777', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt(start)}{(start || end) && ' — '}{current ? 'Atual' : fmt(end)}</span>
    </div>
    {description && <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0', lineHeight: 1.6 }}>{description}</p>}
  </div>
);

const EduItem = ({ institution, course, start, end, current }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{course}</span>
        {institution && <span style={{ fontSize: 12, color: '#555' }}> · {institution}</span>}
      </div>
      <span style={{ fontSize: 11, color: '#777', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt(start)}{(start || end) && ' — '}{current ? 'Atual' : fmt(end)}</span>
    </div>
  </div>
);

const SideSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const SideLink = ({ href, label }) => (
  <a href={href} style={{ display: 'block', fontSize: 11, color: '#4fc3f7', margin: '2px 0', wordBreak: 'break-all' }}>{label}</a>
);

const DarkSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{title}</span>
      <span style={{ color: '#30363d' }}> {'{}'}</span>
    </div>
    {children}
  </div>
);

// ── Map all templates ───────────────────────────────────────────────────
const TEMPLATE_MAP = {
  classic_blue: ClassicBlue,
  modern_dark: ModernDark,
  clean_green: CleanGreen,
  executive: Executive,
  creative_purple: mkColorTemplate('#6c3483', '#e8d5f5', '#f5e6ff'),
  tech_dark: TechDark,
  elegant_red: mkColorTemplate('#c0392b', '#fdecea', '#fdecea'),
  minimal_gray: MinimalGray,
  teal_modern: mkColorTemplate('#0d7377', '#d4f5f7', '#e0fafb'),
  orange_accent: mkColorTemplate('#e67e22', '#fdebd0', '#fef3e2'),
  navy_professional: mkColorTemplate('#003153', '#d6e8f7', '#e8f2fb'),
  fresh_light: mkColorTemplate('#3498db', '#d6eaf8', '#eaf4fd'),
  bold_black: mkColorTemplate('#222222', '#f5f5f5', '#f5f5f5'),
  pink_creative: mkColorTemplate('#ad1457', '#fce4ec', '#fce4ec'),
  golden_executive: mkColorTemplate('#7d6608', '#fef9e7', '#fef9e7'),
};

export default function ResumeRenderer({ data, templateId, watermark = false }) {
  const Component = TEMPLATE_MAP[templateId] || ClassicBlue;
  return <Component d={data} wm={watermark} />;
}