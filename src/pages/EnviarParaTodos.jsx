import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Users, Bell, Mail, Smartphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function EnviarParaTodos() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    redirectPage: 'Home'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.role === 'admin' || user.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setIsAuthorized(true);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    init();
  }, []);

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      alert('Preencha título e mensagem');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendToAllUsers', {
        title: formData.title,
        message: formData.message,
        redirectPage: formData.redirectPage
      });

      if (response.data.success) {
        alert(`✅ Enviado com sucesso!\n\n📱 ${response.data.stats.inApp} notificações in-app\n🔔 ${response.data.stats.push} push notifications\n📧 ${response.data.stats.emails} emails`);
        setFormData({ title: '', message: '', redirectPage: 'Home' });
      } else {
        alert('Erro: ' + response.data.error);
      }
    } catch (err) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">
              ← Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Enviar para Todos</h1>
              <p className="text-white/70 text-sm">Notificação + Push + Email</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Mensagem para Todos os Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Instale o App Emprega Brasil+"
                className="h-11 rounded-lg mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Mensagem *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Ex: Instale nosso aplicativo e receba notificações de novas vagas em tempo real!"
                className="min-h-[120px] rounded-lg mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Redirecionar para</Label>
              <Input
                value={formData.redirectPage}
                onChange={(e) => setFormData(prev => ({ ...prev, redirectPage: e.target.value }))}
                placeholder="Home"
                className="h-11 rounded-lg mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Página para onde o usuário será direcionado ao clicar</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900">📤 Será enviado via:</p>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Bell className="w-4 h-4" />
                <span>Notificação no app</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Smartphone className="w-4 h-4" />
                <span>Push notification (dispositivos)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Mail className="w-4 h-4" />
                <span>Email para todos os usuários</span>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={!formData.title || !formData.message || sending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar para Todos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}