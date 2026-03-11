import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Timer, Lock, ExternalLink, Check } from "lucide-react";

const PROMO_LINK = 'https://mpago.la/1KXYZE8';

const FEATURES = [
  'Acesso a todas as vagas premium exclusivas',
  'Vagas em primeira mão antes de todos',
  'Filtros avançados de busca',
  'Alertas de vagas personalizados',
  'Suporte prioritário via WhatsApp',
];

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-white/20 text-white font-bold text-lg w-12 py-1 rounded-lg text-center">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/70 text-[10px] mt-1">{label}</span>
    </div>
  );
}

function Countdown({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!timeLeft) return <p className="text-white/80 text-xs mt-2">Promoção encerrada!</p>;

  return (
    <div className="flex gap-2 justify-center mt-2">
      <CountdownUnit value={timeLeft.d} label="dias" />
      <CountdownUnit value={timeLeft.h} label="horas" />
      <CountdownUnit value={timeLeft.m} label="min" />
      <CountdownUnit value={timeLeft.s} label="seg" />
    </div>
  );
}

export default function PromoCard({ config }) {
  const [status, setStatus] = useState('loading'); // loading | upcoming | active | expired

  useEffect(() => {
    const check = () => {
      const now = new Date();
      if (config.start_date && new Date(config.start_date) > now) {
        setStatus('upcoming');
      } else if (config.end_date && new Date(config.end_date) < now) {
        setStatus('expired');
      } else {
        setStatus('active');
      }
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [config]);

  if (status === 'expired') {
    return (
      <Card className="shadow-xl rounded-2xl overflow-hidden border-0 opacity-50">
        <div className="p-4 text-center bg-gradient-to-br from-slate-400 to-slate-600">
          <Lock className="w-10 h-10 text-white mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white">Plano Premium Promocional</h2>
          <p className="text-white/80 text-xs mt-1">Promoção encerrada</p>
        </div>
        <CardContent className="p-4 bg-white dark:bg-slate-800 text-center">
          <Lock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Esta promoção foi encerrada. Confira nossos outros planos!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden border-0 ring-2 ring-orange-400 dark:ring-orange-500">
      <div className="p-4 text-center relative bg-gradient-to-br from-orange-500 to-rose-600">
        <Badge className="absolute top-2 right-2 border-0 text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5">
          ⚡ PROMOÇÃO
        </Badge>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-0.5">Plano Premium Promocional</h2>
        <p className="text-white/80 text-xs">Oferta exclusiva por tempo limitado</p>

        {config.end_date && (
          <div className="mt-3">
            <div className="flex items-center justify-center gap-1 text-white/80 text-xs mb-1">
              <Timer className="w-3 h-3" />
              {status === 'upcoming' ? 'Começa em:' : 'Encerra em:'}
            </div>
            <Countdown endDate={status === 'upcoming' ? config.start_date : config.end_date} />
          </div>
        )}
      </div>

      <CardContent className="p-4 bg-white dark:bg-slate-800">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-xs line-through mb-0.5">R$ 29,90</p>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-0.5">R$ 4,99</div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">pagamento único · oferta limitada</p>
        </div>

        <div className="space-y-2 mb-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-200">{f}</span>
            </div>
          ))}
        </div>

        {status === 'active' ? (
          <a href={PROMO_LINK} target="_blank" rel="noopener noreferrer">
            <button className="w-full h-10 text-white text-sm font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Aproveitar Promoção
            </button>
          </a>
        ) : (
          <button disabled className="w-full h-10 text-white/60 text-sm font-semibold rounded-lg bg-slate-300 dark:bg-slate-700 cursor-not-allowed flex items-center justify-center gap-2">
            <Timer className="w-4 h-4" />
            Disponível em breve
          </button>
        )}
      </CardContent>
    </Card>
  );
}