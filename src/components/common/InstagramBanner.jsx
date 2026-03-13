import React from "react";
import { Instagram } from "lucide-react";

export default function InstagramBanner() {
  return (
    <a
      href="https://www.instagram.com/vagasabertaspb?igsh=MTkxNjA0dzFzNmx5Ng=="
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="rounded-2xl overflow-hidden shadow-lg relative cursor-pointer transition-transform hover:scale-[1.02] duration-300"
        style={{
          background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 40%, #fcb045 100%)"
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 p-5 text-center">
          {/* Icon */}
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <Instagram className="w-7 h-7 text-white" />
          </div>

          {/* Text */}
          <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">Siga agora</p>
          <h3 className="text-white font-bold text-lg leading-tight mb-1">@vagasabertaspb</h3>
          <p className="text-white/80 text-xs mb-4">
            Vagas, dicas e novidades direto no seu feed! 🔥
          </p>

          {/* CTA Button */}
          <div className="bg-white rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 group-hover:bg-white/90 transition-colors">
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="text-pink-600 font-bold text-sm">Seguir no Instagram</span>
          </div>

          {/* Sub-label */}
          <p className="text-white/60 text-[10px] mt-2">Junte-se a milhares de seguidores!</p>
        </div>
      </div>
    </a>
  );
}