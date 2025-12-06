import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, ChevronLeft, Crown, Star, Users, Bell, Send, 
  Calendar, Check, Loader2, Eye, Globe, Clock, Zap, Edit, Mail
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NOTIFICATION_TEMPLATES = [
  { id: 'urgente', emoji: '🚨', title: 'URGENTE: Nova vaga!', msg: 'Vaga urgente! Processo seletivo relâmpago!' },
  { id: 'oportunidade', emoji: '⭐', title: 'OPORTUNIDADE DE OURO!', msg: 'Nova vaga incrível acabou de ser publicada!' },
  { id: 'chance', emoji: '✨', title: 'NOVA CHANCE!', msg: 'Sua próxima oportunidade está aqui!' },
  { id: 'perfeita', emoji: '🎯', title: 'VAGA PERFEITA!', msg: 'Essa vaga combina com você!' },
  { id: 'salario', emoji: '💰', title: 'SALÁRIO ATRATIVO!', msg: 'Vaga com ótima remuneração!' },
  { id: 'empresa', emoji: '🏢', title: 'EMPRESA TOP!', msg: 'Grande empresa está contratando!' },
];

export default function UnifiedPostWizard({ 
  jobsData = [],
  onEditJob,
  onPublish,
  onSchedule,
  isLoading = false,
  toolType = 'job'
}) {
  const [step, setStep] = useState(2); // Começa na etapa 2 (revisão)
  
  // Etapa 2 - Edição (caso necessário)
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Etapa 3 - Visibilidade
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Etapa 4 - Notificações (Dialog)
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [sendNotification, setSendNotification] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('urgente');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationIcon, setNotificationIcon] = useState('💼');
  const [premiumOnlyNotif, setPremiumOnlyNotif] = useState(false);
  const [sendEmailNotif, setSendEmailNotif] = useState(false);
  const [notificationConfigured, setNotificationConfigured] = useState(false);
  
  // Etapa 5 - Publicação
  const [publishMode, setPublishMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
  const jobCount = jobsData.length;

  const getMinDateTime = () => {
    const now = new Date();
    const brasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    brasilia.setMinutes(brasilia.getMinutes() + 5); // Mínimo 5 min no futuro
    return {
      date: brasilia.toISOString().split('T')[0],
      time: brasilia.toTimeString().slice(0, 5)
    };
  };

  const handleSaveNotificationConfig = () => {
    setNotificationConfigured(true);
    setShowNotifDialog(false);
    setStep(4);
  };

  const handlePublish = () => {
    const notificationData = sendNotification && notificationConfigured ? {
      title: customTitle || `${template.emoji} ${template.title}`,
      message: customMessage || template.msg,
      icon: notificationIcon,
      premiumOnly: premiumOnlyNotif,
      sendEmail: sendEmailNotif
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
      {/* Barra de Progresso */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">Progresso</span>
          <span className="text-xs text-slate-500">Etapa {step} de 4</span>
        </div>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map((s, i) => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-all ${
              step >= s ? 'bg-blue-600' : 'bg-slate-200'
            }`} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
          <span>Revisão</span>
          <span>Visibilidade</span>
          <span>Notificação</span>
          <span>Publicar</span>
        </div>
      </div>

      {/* ETAPA 2 - Revisão */}
      {step === 2 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Revisão dos Dados</h3>
                <p className="text-xs text-slate-500">{jobCount} vaga{jobCount > 1 ? 's' : ''} pronta{jobCount > 1 ? 's' : ''} para publicar</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {jobsData.map((job, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-slate-800 flex-1">{job.title || 'Sem título'}</h4>
                    <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    {job.company && <p>🏢 {job.company}</p>}
                    {job.city && <p>📍 {job.city}</p>}
                    {job.salary_range && <p>💰 {job.salary_range}</p>}
                  </div>
                  {editingIndex !== i && onEditJob && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditJob(i)}
                      className="mt-2 h-8 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={jobsData.length === 0}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Configurar Visibilidade
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3 - Visibilidade */}
      {step === 3 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Visibilidade</h3>
                <p className="text-xs text-slate-500">Defina quem pode ver esta vaga</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIsPremium(false)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  !isPremium ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Público</p>
                    <p className="text-xs text-slate-500">Todos podem visualizar</p>
                  </div>
                  {!isPremium && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>

              <button
                onClick={() => setIsPremium(true)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isPremium ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Apenas Premium</p>
                    <p className="text-xs text-slate-500">Exclusivo para assinantes</p>
                  </div>
                  {isPremium && <Check className="w-5 h-5 text-purple-600" />}
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">Vaga em Destaque</p>
                  <p className="text-xs text-slate-500">Aparece no topo</p>
                </div>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setShowNotifDialog(true);
                }}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Notificações
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4 - Publicação */}
      {step === 4 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Publicação</h3>
                <p className="text-xs text-slate-500">Publicar agora ou agendar</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPublishMode('now')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  publishMode === 'now' ? 'border-green-600 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Publicar Imediatamente</p>
                    <p className="text-xs text-slate-500">Vaga fica disponível agora</p>
                  </div>
                  {publishMode === 'now' && <Check className="w-5 h-5 text-green-600" />}
                </div>
              </button>

              <button
                onClick={() => setPublishMode('schedule')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  publishMode === 'schedule' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Agendar Publicação</p>
                    <p className="text-xs text-slate-500">Escolher data e hora</p>
                  </div>
                  {publishMode === 'schedule' && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div className="p-4 bg-blue-50 rounded-xl space-y-3 animate-in fade-in duration-300">
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
                    <span>
                      Publicação: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumo Final */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-700 mb-2">📋 Resumo da Publicação</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>• {jobCount} vaga{jobCount > 1 ? 's' : ''}</p>
                <p>• Visibilidade: {isPremium ? '👑 Premium' : '🌍 Público'}</p>
                {isFeatured && <p>• ⭐ Em destaque</p>}
                <p>• Notificações: {sendNotification && notificationConfigured ? '✅ Configuradas' : '❌ Desativadas'}</p>
                <p>• Modo: {publishMode === 'now' ? '⚡ Imediato' : '🕐 Agendado'}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isLoading || (publishMode === 'schedule' && (!scheduleDate || !scheduleTime))}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publicando...</>
                ) : publishMode === 'schedule' ? (
                  <><Calendar className="w-5 h-5 mr-2" />AGENDAR</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" />PUBLICAR</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DIALOG DE NOTIFICAÇÕES - Etapa 3 */}
      <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Configurar Notificações
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Toggle Sim/Não */}
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold text-slate-800 mb-3">Enviar notificação aos usuários?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSendNotification(false)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === false ? 'border-slate-600 bg-slate-100' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">Não</p>
                  <p className="text-xs text-slate-500 mt-1">Só publicar</p>
                </button>
                <button
                  onClick={() => setSendNotification(true)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === true ? 'border-green-600 bg-green-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">Sim</p>
                  <p className="text-xs text-slate-500 mt-1">Notificar</p>
                </button>
              </div>
            </div>

            {/* Se SIM - mostrar opções */}
            {sendNotification === true && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-2 block">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.emoji} {t.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">✍️ Personalizar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate === 'custom' && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Título</Label>
                      <Input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Ex: 🔥 VAGA IMPERDÍVEL!"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Mensagem</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Ex: Nova oportunidade incrível!"
                        className="min-h-[60px] text-sm"
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
                        className={`w-11 h-11 rounded-lg border-2 text-xl transition-all ${
                          notificationIcon === emoji ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium">Apenas Premium</span>
                    </div>
                    <Switch checked={premiumOnlyNotif} onCheckedChange={setPremiumOnlyNotif} />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium">Enviar Email</span>
                    </div>
                    <Switch checked={sendEmailNotif} onCheckedChange={setSendEmailNotif} />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Preview:</p>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{notificationIcon}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {customTitle || `${template.emoji} ${template.title}`}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {customMessage || template.msg}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNotifDialog(false);
                  setStep(3);
                }}
                className="flex-1 h-11 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNotificationConfig}
                disabled={sendNotification === null}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                <Check className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}