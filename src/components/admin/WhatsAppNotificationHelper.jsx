import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Check } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WhatsAppNotificationHelper({ 
  title, 
  message, 
  isOpen, 
  onClose 
}) {
  const [copied, setCopied] = useState(false);

  const whatsappGroups = [
    { name: 'Grupo 1', url: 'https://chat.whatsapp.com/BhIZZ0MD3ZsHLfcM2Iuzey' },
    { name: 'Grupo 2', url: 'https://chat.whatsapp.com/LvdwP9HJiVOCVPyoO7WdgA' }
  ];

  const formattedMessage = `📢 *${title}*\n\n${message}\n\n🔗 Acesse: https://vagasabertasparaiba.info/home`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGroup = (url) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar para Grupos WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Aviso */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-slate-700">
              ⚠️ WhatsApp não permite envio automático para grupos. Copie a mensagem abaixo e envie manualmente.
            </p>
          </div>

          {/* Mensagem Formatada */}
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-slate-700">Mensagem:</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 rounded-lg"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm whitespace-pre-wrap text-slate-800">
                {formattedMessage}
              </div>
            </CardContent>
          </Card>

          {/* Links dos Grupos */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Grupos para enviar:</Label>
            {whatsappGroups.map((group, i) => (
              <button
                key={i}
                onClick={() => openGroup(group.url)}
                className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm font-medium text-green-900">{group.name}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-green-600" />
              </button>
            ))}
          </div>

          {/* Instruções */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-slate-700 font-medium mb-1">📝 Como enviar:</p>
            <ol className="text-xs text-slate-600 space-y-1 ml-4 list-decimal">
              <li>Clique em "Copiar" acima</li>
              <li>Clique em um dos grupos</li>
              <li>Cole a mensagem no grupo</li>
              <li>Envie para o grupo</li>
            </ol>
          </div>

          <Button
            onClick={onClose}
            className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}