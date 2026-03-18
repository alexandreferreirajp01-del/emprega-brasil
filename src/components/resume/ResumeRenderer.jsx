import React from 'react';

const fmt = (dateStr) => {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return m ? `${months[parseInt(m) - 1]}/${y}` : y;
};

const WatermarkOverlay = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {[...Array(6)].map((_, i) => (
      <div key={i} style={{ position: 'absolute', top: `${15 + i * 15}%`, left: '50%', transform: 'translateX(-50%) rotate(-35deg)', fontSize: '42px', fontWeight: 900, color: 'rgba(180,0,0,0.10)', whiteSpace: 'nowrap', letterSpacing: '2px', userSelect: 'none' }}>VAGAS ABERTAS PB</div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1: TURQUOISE MEDICAL (PDF 1 - Marceline Anderson)
// Sidebar turquesa à esquerda com foto, dados pessoais, educação, idiomas com barras
// Conteúdo principal à direita com checkmarks turquesa
// ══════════════════════════════════════════════════════════════════════════════
const TurquoiseMedical = ({ d, wm }) => {
  const teal = '#4DC8C8';
  const tealDark = '#2BA8A8';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', position: 'relative', background: '#fff' }}>
      {wm && <WatermarkOverlay />}
      {/* SIDEBAR */}
      <div style={{ width: 200, background: teal, color: '#fff', padding: '28px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Foto */}
        {d.photo ? (
          <img src={d.photo} alt="" style={{ width: 140, height: 160, objectFit: 'cover', objectPosition: 'top', display: 'block', margin: '0 auto 20px' }} />
        ) : (
          <div style={{ width: 140, height: 160, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>👤</div>
        )}

        {/* Dados Pessoais */}
        <SideBlock title="PERSONAL DETAILS" titleColor="#fff" borderColor="rgba(255,255,255,0.4)" textColor="rgba(255,255,255,0.9)">
          {d.phone && <SideDetail label="Data de Nascimento" value={d.phone} />}
          {d.location && <SideDetail label="Endereço" value={d.location} />}
          {d.linkedin && <SideDetail label="LinkedIn" value={d.linkedin} />}
        </SideBlock>

        {/* Educação */}
        {d.education?.length > 0 && (
          <SideBlock title="EDUCATION" titleColor="#fff" borderColor="rgba(255,255,255,0.4)" textColor="rgba(255,255,255,0.9)">
            {d.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{e.course}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{e.institution}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>({fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)})</div>
              </div>
            ))}
          </SideBlock>
        )}

        {/* Idiomas com barras */}
        {d.languages?.length > 0 && (
          <SideBlock title="LANGUAGES" titleColor="#fff" borderColor="rgba(255,255,255,0.4)" textColor="rgba(255,255,255,0.9)">
            {d.languages.map((l, i) => {
              const pct = l.level === 'Nativo' ? 100 : l.level === 'Fluente' ? 90 : l.level === 'Avançado' ? 75 : l.level === 'Intermediário' ? 55 : 35;
              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: '#fff', marginBottom: 2 }}>{l.name}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </SideBlock>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '28px 32px' }}>
        {/* Nome e cargo */}
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 2px', color: '#111', textTransform: 'uppercase', lineHeight: 1.1 }}>{d.name || 'SEU NOME'}</h1>
        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{d.title}</p>

        {/* Resumo */}
        {d.summary && <p style={{ fontSize: 12, lineHeight: 1.65, color: '#444', margin: '0 0 18px' }}>{d.summary}</p>}

        {/* Contato */}
        {(d.email || d.phone || d.website) && (
          <div style={{ marginBottom: 18 }}>
            <SectionBar title="CONTACT" color={teal} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: 11, color: '#444' }}>
              {d.phone && <span>📞 {d.phone}</span>}
              {d.email && <span>✉ {d.email}</span>}
              {d.website && <span>🌐 {d.website}</span>}
            </div>
          </div>
        )}

        {/* Experiências */}
        {d.experience?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionBar title="WORK EXPERIENCES" color={teal} />
            {d.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{e.role}{e.company ? ` at ${e.company}` : ''}</div>
                <div style={{ fontSize: 11, color: '#777', marginBottom: 5 }}>{fmt(e.start)}{e.start && '-'}{e.current ? 'Atual' : fmt(e.end)}</div>
                {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                  <div key={li} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#444', lineHeight: 1.6, marginBottom: 3 }}>
                    <span style={{ color: teal, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{line.trim()}</span>
                  </div>
                ))}
                {e.description && !e.description.includes('\n') && (
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                    <span style={{ color: teal, flexShrink: 0 }}>✓</span>
                    <span>{e.description}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Habilidades */}
        {d.skills?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionBar title="SKILLS" color={teal} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
              {d.skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#444', alignItems: 'center' }}>
                  <span style={{ color: teal }}>✓</span> {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificações */}
        {d.certifications?.length > 0 && (
          <div>
            <SectionBar title="CERTIFICAÇÕES" color={teal} />
            {d.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 3 }}>
                <b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SectionBar = ({ title, color }) => (
  <div style={{ background: color, borderRadius: 3, padding: '5px 12px', marginBottom: 10 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
  </div>
);

const SideBlock = ({ title, children, titleColor, borderColor, textColor }) => (
  <div style={{ marginBottom: 16, borderTop: `1px solid ${borderColor}`, paddingTop: 12 }}>
    <h3 style={{ fontSize: 10, fontWeight: 700, color: titleColor, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{title}</h3>
    {children}
  </div>
);

const SideDetail = ({ label, value }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 10, color: '#fff', lineHeight: 1.3 }}>{value}</div>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2: SALES GRAY (PDF 2 - Donna Stroupe)
// Header cinza claro com foto circular + nome grande
// Sidebar esquerda cinza claro: contato, educação, habilidades, idiomas
// Conteúdo principal: About Me, Work Experience, References
// ══════════════════════════════════════════════════════════════════════════════
const SalesGray = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', background: '#fff', position: 'relative', minHeight: '100%' }}>
    {wm && <WatermarkOverlay />}
    {/* HEADER */}
    <div style={{ background: '#D8DEE6', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
      {d.photo ? (
        <img src={d.photo} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#b0b8c4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>👤</div>
      )}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 2px', color: '#1a1a1a', letterSpacing: 1 }}>{(d.name || 'SEU NOME').toUpperCase()}</h1>
        <p style={{ fontSize: 14, margin: 0, color: '#555' }}>{d.title}</p>
      </div>
    </div>

    <div style={{ display: 'flex', flex: 1 }}>
      {/* SIDEBAR */}
      <div style={{ width: 210, background: '#EAECF0', padding: '20px 16px', flexShrink: 0, minHeight: 900 }}>
        {(d.email || d.phone || d.location) && (
          <div style={{ marginBottom: 16 }}>
            <SideTitle2 title="CONTATO" />
            {d.phone && <SideContact2 icon="✆" value={d.phone} />}
            {d.email && <SideContact2 icon="✉" value={d.email} />}
            {d.location && <SideContact2 icon="📍" value={d.location} />}
            {d.linkedin && <SideContact2 icon="🔗" value={d.linkedin} />}
          </div>
        )}
        {d.education?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SideTitle2 title="EDUCATION" />
            {d.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{e.course}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{e.institution}</div>
                <div style={{ fontSize: 10, color: '#777' }}>{fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)}</div>
              </div>
            ))}
          </div>
        )}
        {d.skills?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SideTitle2 title="SKILLS" />
            {d.skills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: '#444', marginBottom: 3 }}>
                <span>•</span> {s}
              </div>
            ))}
          </div>
        )}
        {d.languages?.length > 0 && (
          <div>
            <SideTitle2 title="LANGUAGE" />
            {d.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 4 }}>{l.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {d.summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle2 title="About Me" />
            <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444', textAlign: 'justify' }}>{d.summary}</p>
          </div>
        )}
        {d.experience?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle2 title="WORK EXPERIENCE" />
            {d.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#777' }}>{fmt(e.start)} - {e.current ? 'present' : fmt(e.end)}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{e.company}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: '2px 0 5px' }}>{e.role}</div>
                {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                  <div key={li} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 2 }}>
                    <span style={{ flexShrink: 0 }}>•</span><span>{line.trim()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {d.certifications?.length > 0 && (
          <div>
            <SectionTitle2 title="REFERENCES" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {d.certifications.map((c, i) => (
                <div key={i} style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#222' }}>{c.name}</div>
                  {c.institution && <div style={{ color: '#666', fontSize: 11 }}>{c.institution}</div>}
                  {c.year && <div style={{ color: '#888', fontSize: 11 }}>{c.year}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const SideTitle2 = ({ title }) => (
  <div style={{ borderBottom: '1px solid #b0b8c4', paddingBottom: 4, marginBottom: 8 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, color: '#333', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h3>
  </div>
);

const SideContact2 = ({ icon, value }) => (
  <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#555', marginBottom: 4, alignItems: 'flex-start', wordBreak: 'break-all' }}>
    <span style={{ flexShrink: 0 }}>{icon}</span><span>{value}</span>
  </div>
);

const SectionTitle2 = ({ title }) => (
  <div style={{ borderBottom: '1px solid #ccc', paddingBottom: 6, marginBottom: 12 }}>
    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: 0 }}>{title}</h2>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3: DARK NAVY COVER (PDF 3 - Lorna Alvarado)
// Sidebar dark navy/slate à esquerda: foto circular, contato, destinatário, data
// Conteúdo à direita: Cover Letter com texto formal
// Adaptado para currículo: sidebar com contato, main com experiência/educação
// ══════════════════════════════════════════════════════════════════════════════
const DarkNavyCover = ({ d, wm }) => {
  const navy = '#2D3748';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', position: 'relative', background: '#fff' }}>
      {wm && <WatermarkOverlay />}
      {/* SIDEBAR */}
      <div style={{ width: 210, background: navy, color: '#fff', padding: '32px 20px', flexShrink: 0 }}>
        {/* Foto circular */}
        {d.photo ? (
          <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', margin: '0 auto 20px', display: 'flex' }}>
            <img src={d.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.4)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
        )}

        {/* Contato */}
        <SideNavySection title="Contact">
          {d.phone && <SideNavyItem icon="✆" value={d.phone} />}
          {d.email && <SideNavyItem icon="✉" value={d.email} />}
          {d.location && <SideNavyItem icon="📍" value={d.location} />}
          {d.website && <SideNavyItem icon="🌐" value={d.website} />}
          {d.linkedin && <SideNavyItem icon="🔗" value={d.linkedin} />}
        </SideNavySection>

        {/* Habilidades */}
        {d.skills?.length > 0 && (
          <SideNavySection title="Habilidades">
            {d.skills.slice(0, 6).map((s, i) => (
              <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>• {s}</div>
            ))}
          </SideNavySection>
        )}

        {/* Idiomas */}
        {d.languages?.length > 0 && (
          <SideNavySection title="Idiomas">
            {d.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{l.name} — {l.level}</div>
            ))}
          </SideNavySection>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '32px 36px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, margin: '0 0 4px', color: '#1a1a1a', lineHeight: 1.1 }}>
          {(d.name || 'SEU NOME').split(' ').map((w, i) => (
            <span key={i} style={{ display: 'block' }}>{w.toUpperCase()}</span>
          ))}
        </h1>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 28px', letterSpacing: 1 }}>{d.title}</p>

        {d.summary && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: navy, fontSize: 16 }}>✓</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#222', margin: 0 }}>Resumo Profissional</h2>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.8, color: '#444', margin: 0, textAlign: 'justify' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: navy, fontSize: 16 }}>✓</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#222', margin: 0 }}>Experiência Profissional</h2>
            </div>
            {d.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{e.role}{e.company ? ` — ${e.company}` : ''}</div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)}</div>
                {e.description && <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.65, textAlign: 'justify' }}>{e.description}</p>}
              </div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: navy, fontSize: 16 }}>✓</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#222', margin: 0 }}>Formação Acadêmica</h2>
            </div>
            {d.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{e.course}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{e.institution} — {fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)}</div>
              </div>
            ))}
          </div>
        )}

        {d.certifications?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: navy, fontSize: 16 }}>✓</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#222', margin: 0 }}>Certificações</h2>
            </div>
            {d.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>
                <b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SideNavySection = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 13 }}>👤</span>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const SideNavyItem = ({ icon, value }) => (
  <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.85)', marginBottom: 5, alignItems: 'flex-start', wordBreak: 'break-all' }}>
    <span style={{ flexShrink: 0 }}>{icon}</span><span>{value}</span>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4: MAGENTA MINIMAL (PDF 4 - Helena Pereira)
// Layout uma coluna limpo
// Nome BOLD gigante à esquerda, contato à direita com ícones
// Linha vertical magenta nas seções
// Bullets • para habilidades em grid 3 colunas
// ══════════════════════════════════════════════════════════════════════════════
const MagentaMinimal = ({ d, wm }) => {
  const mag = '#9B2163';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative', padding: '32px 44px 28px' }}>
      {wm && <WatermarkOverlay />}
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 2px', color: '#1a1a1a', lineHeight: 1, textTransform: 'uppercase' }}>
            {(d.name || 'SEU NOME').split(' ')[0]}
          </h1>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 4px', color: '#1a1a1a', lineHeight: 1, textTransform: 'uppercase' }}>
            {(d.name || '').split(' ').slice(1).join(' ')}
          </h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>{d.title}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#444', lineHeight: 2 }}>
          {d.phone && <div>📞 {d.phone}</div>}
          {d.phone && <div>👤 {d.phone}</div>}
          {d.location && <div>📍 {d.location}</div>}
          {d.email && <div>✉ {d.email}</div>}
        </div>
      </div>

      {/* SOBRE MIM */}
      {d.summary && (
        <MagentaSection title="SOBRE MIM" color={mag}>
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444', textAlign: 'justify' }}>{d.summary}</p>
        </MagentaSection>
      )}

      {/* EXPERIÊNCIA */}
      {d.experience?.length > 0 && (
        <MagentaSection title="EXPERIÊNCIA" color={mag}>
          {d.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{e.role}{e.company ? ` - ${e.company}` : ''}</div>
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#777', marginBottom: 4 }}>{fmt(e.start)}-{e.current ? '2022' : fmt(e.end)}</div>
              {e.description && <p style={{ fontSize: 12, color: '#444', margin: 0, lineHeight: 1.65 }}>{e.description}</p>}
            </div>
          ))}
        </MagentaSection>
      )}

      {/* EDUCAÇÃO */}
      {d.education?.length > 0 && (
        <MagentaSection title="EDUCAÇÃO" color={mag}>
          {d.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{e.course}</div>
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#777' }}>{fmt(e.start)} - {e.institution}</div>
            </div>
          ))}
        </MagentaSection>
      )}

      {/* HABILIDADES */}
      {d.skills?.length > 0 && (
        <MagentaSection title="HABILIDADES" color={mag}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px' }}>
            {d.skills.map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444', display: 'flex', gap: 4 }}>
                <span>•</span><span>{s}</span>
              </div>
            ))}
          </div>
        </MagentaSection>
      )}

      {/* IDIOMAS */}
      {d.languages?.length > 0 && (
        <MagentaSection title="IDIOMAS" color={mag}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px' }}>
            {d.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444', display: 'flex', gap: 4 }}>
                <span>•</span><span>{l.name} — {l.level}</span>
              </div>
            ))}
          </div>
        </MagentaSection>
      )}
    </div>
  );
};

const MagentaSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, marginTop: 2 }} />
      <div style={{ width: 2, flex: 1, background: color, marginTop: 2 }} />
    </div>
    <div style={{ flex: 1 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
      {children}
    </div>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 5: GRAY PHOTO CLASSIC (PDF 5 - Olívia Vieira)
// Sidebar cinza claro com foto quadrada, sobre mim, contato pontinhos
// Conteúdo principal com triângulos ► como bullets de seção
// Texto em uppercase espaçado para títulos
// ══════════════════════════════════════════════════════════════════════════════
const GrayPhotoClassic = ({ d, wm }) => (
  <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', display: 'flex', minHeight: '100%', position: 'relative', background: '#fff' }}>
    {wm && <WatermarkOverlay />}
    {/* SIDEBAR */}
    <div style={{ width: 200, background: '#DADADA', padding: '24px 16px', flexShrink: 0 }}>
      {d.photo ? (
        <img src={d.photo} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', objectPosition: 'top', display: 'block', marginBottom: 16 }} />
      ) : (
        <div style={{ width: '100%', height: 180, background: '#b8b8b8', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>
      )}

      {/* SOBRE MIM */}
      <div style={{ marginBottom: 16, borderTop: '1px solid #b8b8b8', paddingTop: 12 }}>
        <h3 style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>SOBRE MIM</h3>
        {d.summary && <p style={{ fontSize: 10, color: '#444', lineHeight: 1.6, margin: 0 }}>{d.summary}</p>}
      </div>

      {/* Pontinhos separadores */}
      <div style={{ textAlign: 'center', color: '#888', letterSpacing: 2, fontSize: 8, margin: '8px 0' }}>• • • • • • • • • • • • • • • •</div>

      {/* CONTATO */}
      {(d.email || d.phone || d.location) && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>CONTACTO</h3>
          {d.phone && <div style={{ display: 'flex', gap: 5, fontSize: 10, color: '#444', marginBottom: 4 }}><span>📞</span><span>{d.phone}</span></div>}
          {d.email && <div style={{ display: 'flex', gap: 5, fontSize: 10, color: '#444', marginBottom: 4, wordBreak: 'break-all' }}><span>✉</span><span>{d.email}</span></div>}
          {d.location && <div style={{ display: 'flex', gap: 5, fontSize: 10, color: '#444', marginBottom: 4 }}><span>📍</span><span>{d.location}</span></div>}
        </div>
      )}
    </div>

    {/* MAIN */}
    <div style={{ flex: 1, background: '#fff', padding: '24px 28px' }}>
      {/* Nome e cargo */}
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 2px', color: '#1a1a1a' }}>{d.name || 'SEU NOME'}</h1>
      <p style={{ fontSize: 13, fontStyle: 'italic', margin: '0 0 20px', color: '#666' }}>{d.title}</p>

      {/* EXPERIÊNCIA */}
      {d.experience?.length > 0 && (
        <GraySection title="EXPERIÊNCIA DE TRABALHO">
          {d.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{e.company}</div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{fmt(e.start)} {e.start && '-'} {e.current ? 'presente' : fmt(e.end)}</div>
              {e.description && <div style={{ fontSize: 11, color: '#555' }}>{e.role}{e.description ? `, ${e.description.slice(0, 80)}` : ''}</div>}
            </div>
          ))}
        </GraySection>
      )}

      {/* ESTUDOS */}
      {d.education?.length > 0 && (
        <GraySection title="ESTUDOS">
          {d.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{e.institution}</div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 1 }}>{fmt(e.start)} - {e.current ? 'presente.' : fmt(e.end)}</div>
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#555' }}>{e.course}</div>
            </div>
          ))}
        </GraySection>
      )}

      {/* IDIOMAS */}
      {d.languages?.length > 0 && (
        <GraySection title="LÍNGUAS">
          {d.languages.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{l.name} {l.level ? `${l.level.toUpperCase()}` : ''}</div>
          ))}
        </GraySection>
      )}

      {/* HABILIDADES */}
      {d.skills?.length > 0 && (
        <GraySection title="FERRAMENTAS E HABILIDADES">
          {d.skills.map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{s}.</div>
          ))}
        </GraySection>
      )}

      {/* CERTIFICAÇÕES */}
      {d.certifications?.length > 0 && (
        <GraySection title="VOLUNTARIADO / CERTIFICAÇÕES">
          {d.certifications.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{c.name}</div>
              {c.institution && <div style={{ fontSize: 11, color: '#666' }}>{c.institution}</div>}
            </div>
          ))}
        </GraySection>
      )}
    </div>
  </div>
);

const GraySection = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ color: '#555', fontSize: 9 }}>▶</span>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: '#333', margin: 0, textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</h2>
    </div>
    {children}
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 6: ENGINEERING CREAM BLUE (PDF 6 - Lilian Siqueira)
// Cabeçalho branco com nome cursivo grande + cargo, foto circular à direita
// Linha horizontal separadora
// PERFIL em texto corrido
// 2 colunas: Experiência (esq) | Educação (dir)
// Títulos de seção em azul navy bold
// ══════════════════════════════════════════════════════════════════════════════
const EngineeringCreamBlue = ({ d, wm }) => {
  const blue = '#2B4F9E';
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#222', background: '#fff', position: 'relative', padding: '32px 40px' }}>
      {wm && <WatermarkOverlay />}
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 400, margin: '0 0 2px', color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: -0.5 }}>{d.name || 'Seu Nome'}</h1>
          <p style={{ fontSize: 14, color: '#555', margin: '0 0 10px' }}>{d.title}</p>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.9 }}>
            {d.phone && <div>{d.phone}</div>}
            {d.email && <div>{d.email}</div>}
            {d.location && <div>{d.location}</div>}
            {d.website && <div>{d.website}</div>}
          </div>
        </div>
        {d.photo ? (
          <img src={d.photo} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : null}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '16px 0 18px' }} />

      {/* PERFIL */}
      {d.summary && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>PERFIL</h2>
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444', textAlign: 'justify' }}>{d.summary}</p>
        </div>
      )}

      {/* 2 COLUNAS: Experiência + Educação */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Experiência */}
        {d.experience?.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>EXPERIÊNCIA PROFISSIONAL</h2>
            {d.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: blue }}>{e.role}</div>
                <div style={{ fontSize: 11, color: '#444' }}>{e.company}</div>
                <div style={{ fontSize: 11, color: '#777', marginBottom: 5 }}>{fmt(e.start)} - {e.current ? 'atual' : fmt(e.end)}</div>
                {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                  <div key={li} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#444', lineHeight: 1.6, marginBottom: 2 }}>
                    <span>•</span><span>{line.trim()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Educação */}
        {d.education?.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>EDUCAÇÃO</h2>
            {d.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: blue }}>{e.institution}</div>
                <div style={{ fontSize: 11, color: '#444' }}>{e.course} | {fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)}</div>
              </div>
            ))}

            {/* Habilidades / Skills */}
            {d.skills?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>HABILIDADES</h2>
                {d.skills.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#444', marginBottom: 3 }}>
                    <span>•</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Idiomas */}
            {d.languages?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>IDIOMAS</h2>
                {d.languages.map((l, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 3 }}>{l.name} — {l.level}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificações */}
      {d.certifications?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: blue, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>CERTIFICAÇÕES</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {d.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444' }}>
                <b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 7: INDUSTRIAL GRAY (PDF 7 - Alberto Navarro)
// Sidebar cinza escuro com foto quadrada, contato com ícones, formação, informática, idiomas
// Cabeçalho direito: Nome (grande bold + SOBRENOME uppercase)
// Linha cinza no cargo
// Experiência com barra cinza à esquerda em cada item
// ══════════════════════════════════════════════════════════════════════════════
const IndustrialGray = ({ d, wm }) => {
  const darkGray = '#4B5563';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative', display: 'flex', minHeight: '100%' }}>
      {wm && <WatermarkOverlay />}
      {/* SIDEBAR */}
      <div style={{ width: 195, background: '#F3F4F6', padding: '24px 14px', flexShrink: 0 }}>
        {d.photo ? (
          <img src={d.photo} alt="" style={{ width: '100%', height: 155, objectFit: 'cover', objectPosition: 'top', display: 'block', marginBottom: 16 }} />
        ) : (
          <div style={{ width: '100%', height: 155, background: '#d1d5db', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
        )}

        {/* CONTATO */}
        {(d.email || d.phone || d.location) && (
          <IndustrialSideSection title="CONTACTO">
            {d.phone && <IndustrialSideItem icon="📞" value={d.phone} />}
            {d.email && <IndustrialSideItem icon="✉" value={d.email} />}
            {d.location && <IndustrialSideItem icon="📍" value={d.location} />}
          </IndustrialSideSection>
        )}

        {/* FORMAÇÃO */}
        {d.education?.length > 0 && (
          <IndustrialSideSection title="FORMAÇÃO">
            {d.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>{e.institution}</div>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 700 }}>{fmt(e.start)} - {e.current ? 'Atual' : fmt(e.end)}</div>
                <div style={{ fontSize: 10, color: '#666' }}>{e.course}</div>
              </div>
            ))}
          </IndustrialSideSection>
        )}

        {/* INFORMÁTICA / HABILIDADES */}
        {d.skills?.length > 0 && (
          <IndustrialSideSection title="INFORMÁTICA">
            {d.skills.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, fontSize: 10, color: '#555', marginBottom: 4 }}>
                <span>•</span><span>{s}</span>
              </div>
            ))}
          </IndustrialSideSection>
        )}

        {/* IDIOMAS */}
        {d.languages?.length > 0 && (
          <IndustrialSideSection title="IDIOMAS">
            {d.languages.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginBottom: 3 }}>
                <span>• {l.name}</span><span style={{ color: '#888' }}>{l.level}</span>
              </div>
            ))}
          </IndustrialSideSection>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {/* Cabeçalho: Nome */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 28, fontWeight: 400, color: '#1a1a1a', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontStyle: 'italic' }}>{(d.name || 'Seu Nome').split(' ')[0]}</span>
            <span style={{ fontWeight: 900, letterSpacing: 2 }}> {(d.name || '').split(' ').slice(1).join(' ').toUpperCase()}</span>
          </div>
          <div style={{ background: '#E5E7EB', padding: '4px 12px', marginTop: 6, display: 'inline-block', borderRadius: 2 }}>
            <span style={{ fontSize: 12, color: '#555', letterSpacing: 1 }}>{d.title}</span>
          </div>
        </div>

        {/* Resumo */}
        {d.summary && <p style={{ fontSize: 12, lineHeight: 1.65, color: '#444', margin: '0 0 18px', textAlign: 'justify' }}>{d.summary}</p>}

        {/* EXPERIÊNCIA */}
        {d.experience?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: darkGray, textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid #E5E7EB', paddingBottom: 5, margin: '0 0 12px' }}>EXPERIENCIA</h2>
            {d.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid #9CA3AF' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{e.company}{e.start ? ` (${fmt(e.start)} - ${e.current ? 'Actualidad' : fmt(e.end)})` : ''}</div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 5 }}>{e.role}</div>
                {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                  <div key={li} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 2 }}>
                    <span>•</span><span>{line.trim()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* FORMAÇÃO COMPLEMENTAR */}
        {d.certifications?.length > 0 && (
          <div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: darkGray, textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid #E5E7EB', paddingBottom: 5, margin: '0 0 12px' }}>FORMAÇÃO COMPLEMENTAR</h2>
            {d.certifications.map((c, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{c.name}</div>
                {c.institution && <div style={{ fontSize: 11, color: '#666' }}>{c.institution}{c.year ? ` (${c.year})` : ''}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IndustrialSideSection = ({ title, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ borderBottom: '1px solid #D1D5DB', paddingBottom: 4, marginBottom: 8 }}>
      <h3 style={{ fontSize: 10, fontWeight: 700, color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const IndustrialSideItem = ({ icon, value }) => (
  <div style={{ display: 'flex', gap: 5, fontSize: 10, color: '#555', marginBottom: 4, alignItems: 'flex-start', wordBreak: 'break-all' }}>
    <span style={{ flexShrink: 0 }}>{icon}</span><span>{value}</span>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 8: B&W LABELED (PDF 8 - Sandro Oliveira)
// Layout totalmente branco, uma coluna
// Nome grandão bold uppercase + cargo à direita em uppercase pequeno
// Seções: label negrito à esquerda (CONTATO, EXPERIÊNCIA, EDUCAÇÃO, CERTIFICADOS)
// Cada entry: cargo bold | empresa | bullets
// Linha horizontal entre seções
// ══════════════════════════════════════════════════════════════════════════════
const BWLabeled = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', background: '#F9FAFB', position: 'relative', padding: '32px 40px' }}>
    {wm && <WatermarkOverlay />}
    {/* HEADER */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 2px', color: '#111', textTransform: 'uppercase', letterSpacing: 2 }}>{(d.name || 'SEU NOME').split(' ').slice(0, 2).join(' ')}</h1>
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 2 }}>
        {d.title}
      </div>
    </div>

    <hr style={{ border: 'none', borderTop: '1px solid #D1D5DB', margin: '0 0 16px' }} />

    {/* CONTATO */}
    {(d.email || d.phone || d.location || d.website) && (
      <div style={{ marginBottom: 16 }}>
        <LabeledRow label="CONTATO">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px', fontSize: 11, color: '#444' }}>
            {d.phone && <div><b>Telefone:</b> {d.phone}</div>}
            {d.email && <div><b>E-mail:</b> {d.email}</div>}
            {d.location && <div><b>Endereço:</b> {d.location}</div>}
            {d.website && <div><b>Portfólio:</b> {d.website}</div>}
          </div>
        </LabeledRow>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '10px 0' }} />
      </div>
    )}

    {/* Resumo */}
    {d.summary && (
      <div style={{ marginBottom: 16 }}>
        <LabeledRow label="">
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444', textAlign: 'justify' }}>{d.summary}</p>
        </LabeledRow>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '10px 0' }} />
      </div>
    )}

    {/* EXPERIÊNCIA */}
    {d.experience?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <LabeledRow label="EXPERIÊNCIA PROFISSIONAL">
          {d.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{e.role}{e.start ? ` | ${fmt(e.start)}-${e.current ? 'atual' : fmt(e.end)}` : ''}</div>
              {e.company && <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{e.company}</div>}
              {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                <div key={li} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 2 }}>
                  <span>•</span><span>{line.trim()}</span>
                </div>
              ))}
            </div>
          ))}
        </LabeledRow>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '10px 0' }} />
      </div>
    )}

    {/* EDUCAÇÃO */}
    {d.education?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <LabeledRow label="EDUCAÇÃO">
          {d.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{e.institution}{e.start ? ` | ${fmt(e.start)}-${e.current ? 'Atual' : fmt(e.end)}` : ''}</div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{e.course}</div>
            </div>
          ))}
        </LabeledRow>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '10px 0' }} />
      </div>
    )}

    {/* CERTIFICADOS */}
    {d.certifications?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <LabeledRow label="CERTIFICADOS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {d.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: '#444' }}>
                <div style={{ fontWeight: 700 }}>{c.name}{c.year ? ` | ${c.year}` : ''}</div>
                {c.institution && <div style={{ color: '#666' }}>{c.institution}</div>}
              </div>
            ))}
          </div>
        </LabeledRow>
      </div>
    )}

    {/* Habilidades + Idiomas */}
    {(d.skills?.length > 0 || d.languages?.length > 0) && (
      <div>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0 0 10px' }} />
        <LabeledRow label="HABILIDADES E IDIOMAS">
          <div style={{ display: 'flex', gap: 32 }}>
            {d.skills?.length > 0 && (
              <div>
                {d.skills.map((s, i) => <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>• {s}</div>)}
              </div>
            )}
            {d.languages?.length > 0 && (
              <div>
                {d.languages.map((l, i) => <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>{l.name} — {l.level}</div>)}
              </div>
            )}
          </div>
        </LabeledRow>
      </div>
    )}
  </div>
);

const LabeledRow = ({ label, children }) => (
  <div style={{ display: 'flex', gap: 16 }}>
    {label && <div style={{ width: 130, flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
    </div>}
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 9: BEIGE EDUCATION (PDF 9 - Alex Rodrigues)
// Fundo bege/creme suave (#F5F0E8)
// Nome grande bold + cargo, foto circular à direita
// Seções com borda-esquerda verde escuro, título bold
// Contato em 2 colunas
// Educação em 2 colunas
// Certificações em 2 colunas
// ══════════════════════════════════════════════════════════════════════════════
const BeigeEducation = ({ d, wm }) => {
  const accent = '#3D5A3E';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#F5F2EB', position: 'relative', padding: '32px 40px' }}>
      {wm && <WatermarkOverlay />}
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 4px', color: '#1a1a1a' }}>{d.name || 'Seu Nome'}</h1>
          <p style={{ fontSize: 15, color: '#555', margin: 0 }}>{d.title}</p>
        </div>
        {d.photo ? (
          <img src={d.photo} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #D1C9B8', flexShrink: 0 }} />
        ) : null}
      </div>

      {/* RESUMO */}
      {d.summary && (
        <BeigeSection title="Resumo do perfil" color={accent}>
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444', borderLeft: `3px solid #D1C9B8`, paddingLeft: 10 }}>{d.summary}</p>
        </BeigeSection>
      )}

      {/* CONTATO */}
      {(d.email || d.phone || d.website || d.linkedin) && (
        <BeigeSection title="Contato" color={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px', fontSize: 11, color: '#555' }}>
            {d.phone && <div>Telefone: {d.phone}</div>}
            {d.email && <div>E-mail: {d.email}</div>}
            {d.linkedin && <div>LinkedIn: {d.linkedin}</div>}
            {d.website && <div>LinkedIn/Portfólio: {d.website}</div>}
          </div>
        </BeigeSection>
      )}

      {/* EXPERIÊNCIA */}
      {d.experience?.length > 0 && (
        <BeigeSection title="Experiência profissional" color={accent}>
          {d.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{e.role}{e.start ? ` | ${fmt(e.start)} - ${e.current ? 'atual' : fmt(e.end)}` : ''}</div>
              {e.company && <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{e.company}</div>}
              {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                <div key={li} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 2 }}>
                  <span>•</span><span>{line.trim()}</span>
                </div>
              ))}
            </div>
          ))}
        </BeigeSection>
      )}

      {/* EDUCAÇÃO */}
      {d.education?.length > 0 && (
        <BeigeSection title="Educação" color={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {d.education.map((e, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{e.institution}{e.start ? ` | ${fmt(e.start)} - ${e.current ? 'Atual' : fmt(e.end)}` : ''}</div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{e.course}</div>
              </div>
            ))}
          </div>
        </BeigeSection>
      )}

      {/* CERTIFICAÇÕES */}
      {d.certifications?.length > 0 && (
        <BeigeSection title="Certificações" color={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {d.certifications.map((c, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{c.name}{c.year ? ` | ${c.year}` : ''}</div>
                {c.institution && <div style={{ fontSize: 11, color: '#888' }}>{c.institution}</div>}
              </div>
            ))}
          </div>
        </BeigeSection>
      )}

      {/* HABILIDADES + IDIOMAS */}
      {(d.skills?.length > 0 || d.languages?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 4 }}>
          {d.skills?.length > 0 && (
            <BeigeSection title="Habilidades" color={accent}>
              {d.skills.map((s, i) => <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>• {s}</div>)}
            </BeigeSection>
          )}
          {d.languages?.length > 0 && (
            <BeigeSection title="Idiomas" color={accent}>
              {d.languages.map((l, i) => <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l.name} — {l.level}</div>)}
            </BeigeSection>
          )}
        </div>
      )}
    </div>
  );
};

const BeigeSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ borderBottom: `2px solid #D1C9B8`, paddingBottom: 5, marginBottom: 10 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
    </div>
    {children}
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 10: SYSTEMS BLUE ROYAL (PDF 10 - Matheus Dias)
// Header: Nome bold gigante azul royal + cargo uppercase pequeno
// Linha separadora
// Contato em uma linha
// Corpo: 2 colunas iguais
// Esq: Resumo profissional, Experiência profissional
// Dir: Histórico acadêmico, Prêmios e certificados
// Títulos de seção azul brilhante uppercase
// Links dentro de seções em azul brilhante
// ══════════════════════════════════════════════════════════════════════════════
const SystemsBlue = ({ d, wm }) => {
  const royal = '#4169E1';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative', padding: '28px 36px' }}>
      {wm && <WatermarkOverlay />}
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 2px', color: royal, textTransform: 'uppercase', letterSpacing: 1 }}>{d.name || 'SEU NOME'}</h1>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#555', margin: 0, textTransform: 'uppercase', letterSpacing: 2 }}>{d.title}</p>
        </div>
        {d.photo ? (
          <img src={d.photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', objectPosition: 'top', flexShrink: 0, borderRadius: 4 }} />
        ) : null}
      </div>

      {/* Contato em uma linha */}
      <div style={{ fontSize: 11, color: '#555', margin: '8px 0 12px', display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
        {d.phone && <span>{d.phone}</span>}
        {d.email && <span>| {d.email}</span>}
        {d.location && <span>| {d.location}</span>}
        {d.website && <span>| {d.website}</span>}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0 0 18px' }} />

      {/* 2 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* COLUNA ESQUERDA */}
        <div>
          {d.summary && (
            <div style={{ marginBottom: 18 }}>
              <BlueRoyalTitle title="RESUMO PROFISSIONAL" color={royal} />
              <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, color: '#444' }}>{d.summary}</p>
            </div>
          )}

          {d.experience?.length > 0 && (
            <div>
              <BlueRoyalTitle title="EXPERIÊNCIA PROFISSIONAL" color={royal} />
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: royal }}>{e.role}{e.start ? ` | ${fmt(e.start)}` : ''}{e.start && ` - ${e.current ? 'atual' : fmt(e.end)}`}</div>
                  {e.company && <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{e.company}</div>}
                  {e.description && e.description.split('\n').filter(Boolean).map((line, li) => (
                    <div key={li} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#444', lineHeight: 1.6, marginBottom: 2 }}>
                      <span>•</span><span>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {d.languages?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <BlueRoyalTitle title="IDIOMAS" color={royal} />
              {d.languages.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 3 }}>{l.name} — {l.level}</div>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div>
          {d.education?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <BlueRoyalTitle title="HISTÓRICO ACADÊMICO" color={royal} />
              {d.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: royal }}>{e.institution}{e.start ? ` | ${fmt(e.start)}-${e.current ? 'Atual' : fmt(e.end)}` : ''}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{e.course}</div>
                </div>
              ))}
            </div>
          )}

          {d.certifications?.length > 0 && (
            <div>
              <BlueRoyalTitle title="PRÊMIOS E CERTIFICADOS" color={royal} />
              {d.certifications.map((c, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: royal }}>{c.name}{c.year ? ` | ${c.year}` : ''}</div>
                  {c.institution && <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{c.institution}</div>}
                </div>
              ))}
            </div>
          )}

          {d.skills?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <BlueRoyalTitle title="HABILIDADES" color={royal} />
              {d.skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#444', marginBottom: 3 }}>
                  <span>•</span><span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BlueRoyalTitle = ({ title, color }) => (
  <div style={{ marginBottom: 10 }}>
    <h2 style={{ fontSize: 12, fontWeight: 700, color, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
    <div style={{ height: 1, background: '#E5E7EB', marginTop: 4 }} />
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATES CLÁSSICOS MANTIDOS
// ══════════════════════════════════════════════════════════════════════════════
const fmt2 = fmt;

const Section = ({ title, color, children, minimal }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ borderBottom: minimal ? `1px solid #ccc` : `2px solid ${color}`, paddingBottom: 4, marginBottom: 10 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: minimal ? '#333' : color, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
    </div>
    {children}
  </div>
);

const ExpItem = ({ company, role, start, end, current, description, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{role}</span>
        {company && <span style={{ fontSize: 12, color: color || '#1D4371', fontWeight: 600 }}> · {company}</span>}
      </div>
      <span style={{ fontSize: 11, color: '#777', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt2(start)}{(start || end) && ' — '}{current ? 'Atual' : fmt2(end)}</span>
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
      <span style={{ fontSize: 11, color: '#777', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt2(start)}{(start || end) && ' — '}{current ? 'Atual' : fmt2(end)}</span>
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

const ClassicBlue = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative', width: '100%', minHeight: '100%', padding: 0 }}>
    {wm && <WatermarkOverlay />}
    <div style={{ background: '#1D4371', color: '#fff', padding: '32px 40px 24px' }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', float: 'right', border: '3px solid #fff', marginLeft: 16 }} />}
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 12px' }}>{d.title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 12, opacity: 0.9 }}>
        {d.email && <span>✉ {d.email}</span>}
        {d.phone && <span>☎ {d.phone}</span>}
        {d.location && <span>📍 {d.location}</span>}
        {d.linkedin && <span>🔗 {d.linkedin}</span>}
      </div>
    </div>
    <div style={{ padding: '24px 40px' }}>
      {d.summary && <Section title="Resumo Profissional" color="#1D4371"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência Profissional" color="#1D4371">{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
      {d.education?.length > 0 && <Section title="Formação Acadêmica" color="#1D4371">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><Section title="Habilidades" color="#1D4371">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#e8f0fa', color: '#1D4371', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
        </Section></div>}
        <div>
          {d.languages?.length > 0 && <Section title="Idiomas" color="#1D4371">{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</Section>}
          {d.certifications?.length > 0 && <Section title="Certificações" color="#1D4371">{d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{c.name}</b>{c.institution ? ` — ${c.institution}` : ''}{c.year ? ` (${c.year})` : ''}</div>)}</Section>}
        </div>
      </div>
    </div>
  </div>
);

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
    </div>
  </div>
);

const Executive = ({ d, wm }) => (
  <div style={{ fontFamily: 'Georgia, serif', color: '#222', background: '#fff', position: 'relative' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ background: 'linear-gradient(135deg, #2c3e50 0%, #4a6274 100%)', color: '#fff', padding: '36px 48px 28px', display: 'flex', alignItems: 'flex-start', gap: 24 }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 15, opacity: 0.8, margin: '0 0 14px', fontStyle: 'italic' }}>{d.title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12 }}>
          {d.email && <span style={{ color: '#c8d6e5' }}>{d.email}</span>}
          {d.phone && <span style={{ color: '#c8d6e5' }}>{d.phone}</span>}
          {d.location && <span style={{ opacity: 0.8 }}>{d.location}</span>}
        </div>
      </div>
    </div>
    <div style={{ padding: '28px 48px' }}>
      {d.summary && <Section title="Perfil Executivo" color="#2c3e50"><p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Trajetória Profissional" color="#2c3e50">{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
      {d.education?.length > 0 && <Section title="Educação" color="#2c3e50">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><Section title="Competências" color="#2c3e50">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#f0f4f8', color: '#2c3e50', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid #cdd7e0' }}>{s}</span>)}</div>
        </Section></div>}
        <div>
          {d.languages?.length > 0 && <Section title="Idiomas" color="#2c3e50">{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</Section>}
          {d.certifications?.length > 0 && <Section title="Certificações" color="#2c3e50">{d.certifications.map((c, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>{c.name}{c.year ? ` (${c.year})` : ''}</div>)}</Section>}
        </div>
      </div>
    </div>
  </div>
);

const MinimalGray = ({ d, wm }) => (
  <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#333', background: '#fff', position: 'relative', padding: '40px 48px' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 300, margin: '0 0 4px', letterSpacing: 2, textTransform: 'uppercase' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 13, color: '#777', margin: 0, letterSpacing: 1 }}>{d.title}</p>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#555', lineHeight: 1.8 }}>
        {d.email && <div>{d.email}</div>}
        {d.phone && <div>{d.phone}</div>}
        {d.location && <div>{d.location}</div>}
      </div>
    </div>
    {d.photo && <img src={d.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', float: 'right', marginLeft: 20, marginBottom: 8 }} />}
    {d.summary && <Section title="SOBRE" color="#333" minimal><p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: '#555' }}>{d.summary}</p></Section>}
    {d.experience?.length > 0 && <Section title="EXPERIÊNCIA" color="#333" minimal>{d.experience.map((e, i) => <ExpItem key={i} {...e} />)}</Section>}
    {d.education?.length > 0 && <Section title="FORMAÇÃO" color="#333" minimal>{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      {d.skills?.length > 0 && <div><Section title="HABILIDADES" color="#333" minimal>
        {d.skills.map((s, i) => <div key={i} style={{ fontSize: 12, borderBottom: '1px solid #eee', padding: '4px 0' }}>{s}</div>)}
      </Section></div>}
      <div>
        {d.languages?.length > 0 && <Section title="IDIOMAS" color="#333" minimal>{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, borderBottom: '1px solid #eee', padding: '4px 0' }}>{l.name} — {l.level}</div>)}</Section>}
      </div>
    </div>
  </div>
);

const CleanGreen = ({ d, wm }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', position: 'relative' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ borderTop: '6px solid #057642', padding: '32px 40px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #057642', flexShrink: 0 }} />}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: '#0a2e1a' }}>{d.name || 'Seu Nome'}</h1>
        <p style={{ fontSize: 14, color: '#057642', margin: '0 0 10px', fontWeight: 600 }}>{d.title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: '#555' }}>
          {d.email && <span style={{ color: '#057642' }}>{d.email}</span>}
          {d.phone && <span style={{ color: '#057642' }}>{d.phone}</span>}
          {d.location && <span>{d.location}</span>}
        </div>
      </div>
    </div>
    <div style={{ padding: '0 40px 28px' }}>
      {d.summary && <Section title="Objetivo Profissional" color="#057642"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{d.summary}</p></Section>}
      {d.experience?.length > 0 && <Section title="Experiência Profissional" color="#057642">{d.experience.map((e, i) => <ExpItem key={i} {...e} color="#057642" />)}</Section>}
      {d.education?.length > 0 && <Section title="Formação Acadêmica" color="#057642">{d.education.map((e, i) => <EduItem key={i} {...e} />)}</Section>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {d.skills?.length > 0 && <div><Section title="Habilidades" color="#057642">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ background: '#e8f5ee', color: '#057642', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
        </Section></div>}
        <div>
          {d.languages?.length > 0 && <Section title="Idiomas" color="#057642">{d.languages.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4 }}><b>{l.name}</b> — {l.level}</div>)}</Section>}
        </div>
      </div>
    </div>
  </div>
);

const TechDark = ({ d, wm }) => (
  <div style={{ fontFamily: "'Courier New', monospace", color: '#e6edf3', background: '#0d1117', position: 'relative', minHeight: '100%' }}>
    {wm && <WatermarkOverlay />}
    <div style={{ borderBottom: '2px solid #30363d', padding: '28px 40px' }}>
      {d.photo && <img src={d.photo} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', float: 'right', border: '2px solid #30363d' }} />}
      <div style={{ display: 'inline-block', background: '#238636', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, marginBottom: 8 }}>● DISPONÍVEL</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: '#58a6ff' }}>{d.name || 'Seu Nome'}</h1>
      <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 12px' }}>// {d.title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 11, color: '#8b949e' }}>
        {d.email && <span style={{ color: '#58a6ff' }}>{d.email}</span>}
        {d.phone && <span style={{ color: '#58a6ff' }}>{d.phone}</span>}
        {d.location && <span>{d.location}</span>}
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

// ── Map all templates ──────────────────────────────────────────────────────
const TEMPLATE_MAP = {
  // Novos templates baseados nos PDFs
  turquoise_medical: TurquoiseMedical,
  sales_gray: SalesGray,
  dark_navy_cover: DarkNavyCover,
  magenta_minimal: MagentaMinimal,
  gray_photo_classic: GrayPhotoClassic,
  engineering_cream_blue: EngineeringCreamBlue,
  industrial_gray: IndustrialGray,
  bw_labeled: BWLabeled,
  beige_education: BeigeEducation,
  systems_blue: SystemsBlue,
  // Templates clássicos
  classic_blue: ClassicBlue,
  modern_dark: ModernDark,
  clean_green: CleanGreen,
  executive: Executive,
  minimal_gray: MinimalGray,
  tech_dark: TechDark,
  // Retrocompatibilidade com IDs antigos
  creative_purple: (props) => ClassicBlue({ ...props, d: { ...props.d } }),
  elegant_red: (props) => ClassicBlue({ ...props }),
  teal_modern: (props) => CleanGreen({ ...props }),
  orange_accent: (props) => ClassicBlue({ ...props }),
  navy_professional: (props) => Executive({ ...props }),
  fresh_light: (props) => MinimalGray({ ...props }),
  bold_black: (props) => MinimalGray({ ...props }),
  pink_creative: (props) => MagentaMinimal({ ...props }),
  golden_executive: (props) => Executive({ ...props }),
  bw_infographic: (props) => BWLabeled({ ...props }),
  beige_brown: (props) => BeigeEducation({ ...props }),
  blue_gray_pro: (props) => EngineeringCreamBlue({ ...props }),
  blue_photo_sidebar: (props) => TurquoiseMedical({ ...props }),
  beige_soft_photo: (props) => BeigeEducation({ ...props }),
  dark_sidebar_cv: (props) => DarkNavyCover({ ...props }),
};

export default function ResumeRenderer({ data, templateId, watermark = false }) {
  const Component = TEMPLATE_MAP[templateId] || ClassicBlue;
  return <Component d={data} wm={watermark} />;
}