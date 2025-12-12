import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Copy, ExternalLink, Check, Play, Pause, RotateCcw, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WHATSAPP_GROUPS = [
  { id: 1, name: "Grupo 01", link: "https://chat.whatsapp.com/Du2d06epAdYDuMesmEqxgO" },
  { id: 2, name: "Grupo 02", link: "https://chat.whatsapp.com/E6XkQpXlzwx4VXu9cdKri9" },
  { id: 3, name: "Grupo 03", link: "https://chat.whatsapp.com/IF8TgMaS9SnFo6BaEnWnaW" },
  { id: 4, name: "Grupo 04", link: "https://chat.whatsapp.com/Lf7D58fdMoO9E9f2fscEq0" },
  { id: 5, name: "Grupo 05", link: "https://chat.whatsapp.com/H4ndslzhK8wH5jFuSiIUIJ" },
  { id: 6, name: "Fórum", link: "https://chat.whatsapp.com/HkXwefeKXubHdwZzneMzay" }
];

export default function BulkWhatsAppSender({ title, message, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [groupStatus, setGroupStatus] = useState({});
  const [delaySeconds, setDelaySeconds] = useState(3);
  const windowRef = useRef(null);
  const timerRef = useRef(null);

  const formattedMessage = `📢 *${title}*\n\n${message}\n\n🔗 Acesse: https://vagasabertasparaiba.info/home`;
  const progress = (Object.values(groupStatus).filter(s => s === 'sent').length / WHATSAPP_GROUPS.length) * 100;

  useEffect(() => {
    const handleFocus = () => {
      if (sending && !paused && windowRef.current) {
        windowRef.current = null;
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [sending, paused]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGroupLink = (group) => {
    const url = `${group.link}?text=${encodeURIComponent(formattedMessage)}`;
    windowRef.current = window.open(url, '_blank');
    setGroupStatus(prev => ({ ...prev, [group.id]: 'sending' }));
  };

  const sendToNextGroup = () => {
    if (currentIndex >= WHATSAPP_GROUPS.length) {
      setSending(false);
      return;
    }

    const group = WHATSAPP_GROUPS[currentIndex];
    openGroupLink(group);

    timerRef.current = setTimeout(() => {
      setGroupStatus(prev => ({ ...prev, [group.id]: 'sent' }));
      setCurrentIndex(prev => prev + 1);
    }, delaySeconds * 1000);
  };

  const handleStartBulkSend = () => {
    setSending(true);
    setPaused(false);
    setCurrentIndex(0);
    setGroupStatus({});
  };

  const handlePause = () => {
    setPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResume = () => {
    setPaused(false);
  };

  const handleReset = () => {
    setSending(false);
    setPaused(false);
    setCurrentIndex(0);
    setGroupStatus({});
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (sending && !paused && currentIndex < WHATSAPP_GROUPS.length) {
      sendToNextGroup();
    }
  }, [sending, paused, currentIndex]);

  const getStatusIcon = (status) => {
    if (status === 'sent') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'sending') return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getStatusColor = (status) => {
    if (status === 'sent') return 'bg-green-50 border-green-200';
    if (status === 'sending') return 'bg-blue-50 border-blue-200';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Envio em Massa - WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mensagem */}
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-slate-700">Mensagem:</Label>
                <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 rounded-lg">
                  {copied ? <><Check className="w-3 h-3 mr-1" />Copiado!</> : <><Copy className="w-3 h-3 mr-1" />Copiar</>}
                </Button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm whitespace-pre-wrap text-slate-800 max-h-32 overflow-y-auto">
                {formattedMessage}
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          {!sending ? (
            <Button onClick={handleStartBulkSend} className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl text-white">
              <Play className="w-5 h-5 mr-2" />
              Enviar para Todos os Grupos ({WHATSAPP_GROUPS.length})
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {paused ? (
                  <Button onClick={handleResume} className="flex-1 h-11 bg-green-600 hover:bg-green-700 rounded-xl">
                    <Play className="w-5 h-5 mr-2" />Retomar
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="outline" className="flex-1 h-11 rounded-xl">
                    <Pause className="w-5 h-5 mr-2" />Pausar
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" className="h-11 px-4 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Progresso</span>
                  <span className="text-slate-800 font-semibold">{Object.values(groupStatus).filter(s => s === 'sent').length}/{WHATSAPP_GROUPS.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}

          {/* Lista de Grupos */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Status dos Grupos:</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {WHATSAPP_GROUPS.map((group) => (
                <div key={group.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${getStatusColor(groupStatus[group.id])}`}>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(groupStatus[group.id])}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        {groupStatus[group.id] === 'sent' ? 'Enviado' : 
                         groupStatus[group.id] === 'sending' ? 'Enviando...' : 'Aguardando'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`${group.link}?text=${encodeURIComponent(formattedMessage)}`, '_blank')}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instruções */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-slate-700 font-medium mb-1">📝 Como funciona:</p>
            <ol className="text-xs text-slate-600 space-y-1 ml-4 list-decimal">
              <li>Clique em "Enviar para Todos"</li>
              <li>O app abrirá cada grupo automaticamente com {delaySeconds}s de intervalo</li>
              <li>A mensagem já estará preenchida - basta colar e enviar</li>
              <li>Use Pausar/Retomar para controlar o envio</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}