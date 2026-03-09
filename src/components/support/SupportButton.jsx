import React from 'react';
import { Headphones } from 'lucide-react';

// SupportButton discreto para o footer - abre o chat de suporte flutuante
export default function SupportButton({ user, inline = false, discrete = false }) {
  const openSupportChat = () => {
    // Dispatch custom event to open the floating support chat
    window.dispatchEvent(new CustomEvent('open_support_chat'));
  };

  if (discrete) {
    return (
      <button
        onClick={openSupportChat}
        className="text-xs text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors flex items-center gap-1"
        title="Falar com o Suporte"
      >
        <Headphones className="w-3 h-3" />
        Suporte
      </button>
    );
  }

  return null;
}