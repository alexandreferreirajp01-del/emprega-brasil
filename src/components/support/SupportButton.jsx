import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function SupportButton({ user, inline = false, discrete = false }) {
  const whatsappNumber = "5583991971320"; // Seu número do WhatsApp
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  // Versão inline para Home
  if (inline) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Precisa de Ajuda?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Fale diretamente pelo WhatsApp</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Entre em contato conosco pelo WhatsApp e receba suporte personalizado.
          </p>
          <Button 
            onClick={() => window.open(whatsappLink, '_blank')}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Abrir WhatsApp
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Versão discreta para outras páginas
  if (discrete) {
    return (
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        title="Suporte via WhatsApp"
      >
        Suporte
      </a>
    );
  }

  return null;
}