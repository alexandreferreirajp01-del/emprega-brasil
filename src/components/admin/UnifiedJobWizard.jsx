import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, ChevronLeft, Crown, Star, Users, Bell, Send, 
  Calendar, Check, Loader2, Eye, Globe, Lock, Clock, Zap
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOTIFICATION_TEMPLATES = [
  { id: 'urgente', emoji: '🚨', title: 'URGENTE: Nova vaga!', msg: 'Vaga urgente! Processo seletivo relâmpago!' },
  { id: 'oportunidade', emoji: '⭐', title: 'OPORTUNIDADE DE OURO!', msg: 'Nova vaga incrível acabou de ser publicada!' },
  { id: 'chance', emoji: '✨', title: 'NOVA CHANCE!', msg: 'Sua próxima oportunidade está aqui!' },
  { id: 'perfeita', emoji: '🎯', title: 'VAGA PERFEITA!', msg: 'Essa vaga combina com você!' },
  { id: 'acabou', emoji: '⚡', title: 'ACABOU DE SAIR!', msg: 'Vaga fresquinha! Seja o primeiro!' },
  { id: 'salario', emoji: '💰', title: 'SALÁRIO ATRATIVO!', msg: 'Vaga com ótima remuneração!' },
];

export default function UnifiedJobWizard({ 
  jobsData = [],
  onPublish,
  onSchedule,
  isLoading = false
}) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Etapa 2 - Visibilidade
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [audienceType, setAudienceType] = useState('all'); // all, registered, premium
  
  // Etapa 3 - Notificações
  const [sendNotification, setSendNotification] = useState(null); // null = não escolheu ainda
  const [selectedTemplate, setSelectedTemplate] = useState('urgente');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationIcon, setNotificationIcon] = useState('💼');
  const [premiumOnlyNotif, setPremiumOnlyNotif] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  
  // Etapa 4 - Agendamento
  const [publishMode, setPublishMode] = useState('now'); // 'now' ou 'schedule'
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
  const jobCount = jobsData.length;

  const getMinDateTime = () => {
    const now = new Date();
    const brasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return {
      date: brasilia.toISOString().split('T')[0],
      time: brasilia.toTimeString().slice(0, 5)
    };
  };

  const canProceedStep = (step) => {
    if (step === 1) return jobsData.length > 0;
    if (step === 2) return true;
    if (step === 3) return sendNotification !== null;
    if (step === 4) {
      if (publishMode === 'now') return true;
      return scheduleDate && scheduleTime;
    }
    return true;
  };

  const handlePublish = () => {
    const notificationData = sendNotification ? {
      title: customTitle || `${template.emoji} ${template.title}`,
      message: customMessage || template.msg,
      icon: notificationIcon,
      premiumOnly: premiumOnlyNotif,
      sendEmail
    } : null;

    const scheduleData = publishMode === 'schedule' ? {
      date: scheduleDate,
      time: scheduleTime,
      timezone: 'America/Sao_Paulo'
    } : null;

    const finalData = {
      jobs: jobsData.map(j => ({
        ...j,
        is_premium: isPremium,
        is_featured: isFeatured
      })),
      notification: notificationData,
      schedule: scheduleData
    };

    if (publishMode === 'schedule') {
      onSchedule?.(finalData);
    } else {
      onPublish?.(finalData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="flex-1 flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${
              currentStep >= step ? 'bg-blue-600' : 'bg-slate-200'
            }`} />
            {step < 4 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ETAPA 1 - Visibilidade */}
      {currentStep === 1 && (
        <Card className="rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Etapa 1: Visibilidade</h3>
                <p className="text-xs text-slate-500">Defina quem pode ver esta vaga</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setAudienceType('all')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  audienceType === 'all' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-800">Público Geral</p>
                    <p className="text-xs text-slate-500">Todos podem visualizar</p>
                  </div>
                  {audienceType === 'all' && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setAudienceType('registered')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  audienceType === 'registered' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-800">Usuários Cadastrados</p>
                    <p className="text-xs text-slate-500">Apenas membros registrados</p>
                  </div>
                  {audienceType === 'registered' && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setAudienceType('premium')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  audienceType === 'premium' ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-slate-800">Apenas Premium</p>
                    <p className="text-xs text-slate-500">Exclusivo para assinantes</p>
                  </div>
                  {audienceType === 'premium' && <Check className="w-5 h-5 text-purple-600 ml-auto" />}
                </div>
              </button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Vaga em Destaque</p>
                    <p className="text-xs text-slate-500">Aparece no topo das listas</p>
                  </div>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep(1)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Configurar Notificações
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2 - Notificações */}
      {currentStep === 2 && (
        <Card className="rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Etapa 2: Notificações</h3>
                <p className="text-xs text-slate-500">Configure os alertas para usuários</p>
              </div>
            </div>

            {/* Escolha Sim/Não */}
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold text-slate-800 mb-3">Enviar notificação para os usuários?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendNotification(false)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === false ? 'border-slate-600 bg-slate-100' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">❌ Não Enviar</p>
                  <p className="text-xs text-slate-500 mt-1">Apenas publicar</p>
                </button>
                <button
                  onClick={() => setSendNotification(true)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === true ? 'border-green-600 bg-green-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">✅ Sim, Enviar</p>
                  <p className="text-xs text-slate-500 mt-1">Notificar todos</p>
                </button>
              </div>
            </div>

            {/* Se escolheu SIM */}
            {sendNotification === true && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-2 block">Template de Notificação</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{t.emoji}</span>
                            <span className="font-medium">{t.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <span className="text-base">✍️</span>
                          <span className="font-medium">Personalizar</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Título</Label>
                      <Input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Digite o título..."
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Mensagem</Label>
                      <Input
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Digite a mensagem..."
                        className="h-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-2 block">Ícone</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['💼', '🚨', '⭐', '✨', '🎯', '💰', '🏢', '🚀'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNotificationIcon(emoji)}
                        className={`w-12 h-12 rounded-lg border-2 text-xl transition-all ${
                          notificationIcon === emoji ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Apenas Premium</span>
                    </div>
                    <Switch checked={premiumOnlyNotif} onCheckedChange={setPremiumOnlyNotif} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Enviar Email</span>
                    </div>
                    <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Preview da Notificação:</p>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notificationIcon}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {customTitle || `${template.emoji} ${template.title}`}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {customMessage || template.msg}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 h-11 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedStep(2)}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3 - Publicação */}
      {currentStep === 3 && (
        <Card className="rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Etapa 3: Publicação</h3>
                <p className="text-xs text-slate-500">Publicar agora ou agendar</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPublishMode('now')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  publishMode === 'now' ? 'border-green-600 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-800">Publicar Agora</p>
                    <p className="text-xs text-slate-500">Vaga fica disponível imediatamente</p>
                  </div>
                  {publishMode === 'now' && <Check className="w-5 h-5 text-green-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setPublishMode('schedule')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  publishMode === 'schedule' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-800">Agendar Publicação</p>
                    <p className="text-xs text-slate-500">Escolher data e hora</p>
                  </div>
                  {publishMode === 'schedule' && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
                </div>
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Data</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={getMinDateTime().date}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Hora (Brasília)</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                {scheduleDate && scheduleTime && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Será publicado em: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1 h-11 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedStep(3)}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Revisar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4 - Revisão Final */}
      {currentStep === 4 && (
        <Card className="rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Etapa 4: Revisar e Publicar</h3>
                <p className="text-xs text-slate-500">Confirme as configurações</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 mb-1">Vagas</p>
                <p className="text-sm text-slate-800">{jobCount} vaga{jobCount > 1 ? 's' : ''} será{jobCount > 1 ? 'ão' : ''} publicada{jobCount > 1 ? 's' : ''}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 mb-1">Visibilidade</p>
                <div className="flex items-center gap-2">
                  {audienceType === 'all' && <><Globe className="w-4 h-4" /><span className="text-sm">Público Geral</span></>}
                  {audienceType === 'registered' && <><Users className="w-4 h-4" /><span className="text-sm">Usuários Cadastrados</span></>}
                  {audienceType === 'premium' && <><Crown className="w-4 h-4 text-purple-600" /><span className="text-sm">Apenas Premium</span></>}
                </div>
                {isFeatured && <Badge className="bg-yellow-100 text-yellow-700 mt-2">⭐ Destaque</Badge>}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 mb-1">Notificações</p>
                <p className="text-sm text-slate-800">
                  {sendNotification 
                    ? `✅ Será enviada: "${customTitle || template.title}"` 
                    : '❌ Não será enviada'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 mb-1">Publicação</p>
                <p className="text-sm text-slate-800">
                  {publishMode === 'now' 
                    ? '⚡ Imediata' 
                    : `🕐 Agendada para ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isLoading || !canProceedStep(4)}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publicando...</>
                ) : publishMode === 'schedule' ? (
                  <><Calendar className="w-5 h-5 mr-2" />AGENDAR</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" />PUBLICAR AGORA</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="text-center text-xs text-slate-400 mt-4">
        Etapa {currentStep} de 4
      </div>
    </div>
  );
}