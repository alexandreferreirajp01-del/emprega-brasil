import React, { useState } from 'react';
import { TEMPLATES, CATEGORIES } from '@/components/resume/ResumeTemplates';
import { LayoutTemplate, Check } from 'lucide-react';

const PREVIEW_STYLES = {
  turquoise_medical: { sidebar: '#4DC8C8', accent: '#4DC8C8' },
  sales_gray: { sidebar: '#D8DEE6', accent: '#888' },
  dark_navy_cover: { sidebar: '#2D3748', accent: '#2D3748' },
  magenta_minimal: { sidebar: null, accent: '#9B2163' },
  gray_photo_classic: { sidebar: '#DADADA', accent: '#555' },
  engineering_cream_blue: { sidebar: null, accent: '#2B4F9E' },
  industrial_gray: { sidebar: '#F3F4F6', accent: '#4B5563' },
  bw_labeled: { sidebar: null, accent: '#111' },
  beige_education: { sidebar: null, accent: '#3D5A3E', bg: '#F5F2EB' },
  systems_blue: { sidebar: null, accent: '#4169E1' },
  classic_blue: { sidebar: '#1D4371', accent: '#1D4371' },
  modern_dark: { sidebar: '#1a1a2e', accent: '#4fc3f7' },
  executive: { sidebar: '#2c3e50', accent: '#2c3e50' },
  minimal_gray: { sidebar: null, accent: '#555' },
  clean_green: { sidebar: null, accent: '#057642' },
  tech_dark: { sidebar: '#0d1117', accent: '#58a6ff' },
};

export default function TemplatePicker({ selected, onSelect }) {
  const [filterCat, setFilterCat] = useState('🆕 Novos');

  const filtered = filterCat === 'Todos' ? TEMPLATES
    : filterCat === '🆕 Novos' ? TEMPLATES.filter(t => t.isNew)
    : TEMPLATES.filter(t => t.category === filterCat);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-[#1D4371]" /> Escolher Template
      </h3>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
              filterCat === cat
                ? 'bg-[#1D4371] text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(t => {
          const ps = PREVIEW_STYLES[t.id] || { accent: t.preview_color };
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg text-left ${
                isSelected
                  ? 'border-[#1D4371] shadow-lg ring-2 ring-[#1D4371]/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-[#1D4371]/40'
              }`}
            >
              {/* Mini preview */}
              <div className="h-28 flex overflow-hidden" style={{ background: ps.bg || '#fff' }}>
                {ps.sidebar && (
                  <div style={{ width: '32%', background: ps.sidebar, padding: '5px 4px', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', margin: '0 auto 4px' }} />
                    {[1,2,3,4].map(j => <div key={j} style={{ height: 2.5, background: 'rgba(255,255,255,0.3)', borderRadius: 2, margin: '3px 0' }} />)}
                  </div>
                )}
                <div style={{ flex: 1, padding: '7px 6px' }}>
                  <div style={{ height: 6, width: '85%', background: ps.accent, borderRadius: 2, marginBottom: 3, opacity: 0.85 }} />
                  <div style={{ height: 3.5, width: '55%', background: '#ccc', borderRadius: 2, marginBottom: 7 }} />
                  {[1,2,3,4].map(j => (
                    <div key={j} style={{ height: 2.5, width: `${50 + (j % 3) * 15}%`, background: j % 3 === 0 ? ps.accent : '#e0e0e0', borderRadius: 2, marginBottom: 3.5, opacity: j % 3 === 0 ? 0.65 : 1 }} />
                  ))}
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800">
                <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">{t.name}</p>
                {t.isNew && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">NOVO</span>}
              </div>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#1D4371] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}