import React, { useState, useEffect } from 'react';
import { Clock } from "lucide-react";

function getTimeLeft(endDate) {
  const total = new Date(endDate) - new Date();
  if (total <= 0) return null;
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

export default function PromoCountdown({ endDate, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(endDate);
      setTimeLeft(t);
      if (!t) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  const units = [
    { label: 'Dias', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Seg', value: timeLeft.seconds },
  ];

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 mb-3">
      <div className="flex items-center justify-center gap-1 mb-2">
        <Clock className="w-3 h-3 text-white" />
        <p className="text-white text-xs font-bold">Oferta encerra em:</p>
      </div>
      <div className="flex items-center justify-center gap-2">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-white/30 rounded-lg w-11 h-11 flex items-center justify-center">
              <span className="text-white font-bold text-sm tabular-nums">{String(value).padStart(2, '0')}</span>
            </div>
            <span className="text-white/90 text-[10px] mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}